import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import request from "supertest";
import { AppModule } from "@/app.module";
import { createApp } from "@/bootstrap";
import { loadEnv } from "@/config/env";

type Api = ReturnType<typeof request>;

describe("Board platform API", () => {
  let app: INestApplication;
  let api: Api;
  let connection: Connection;

  const register = async (email: string, name: string) => {
    const res = await api.post("/api/v1/auth/register").send({ email, name, password: "password123" }).expect(201);
    return { token: res.body.accessToken as string, id: res.body.user.id as string };
  };

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    createApp(app, loadEnv());
    await app.init();
    api = request(app.getHttpServer());
    connection = app.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    if (app) {
      await connection.dropDatabase().catch(() => undefined);
      await app.close();
    }
  });

  it("rejects unauthenticated access with a structured 401", async () => {
    const res = await api.get("/api/v1/workspaces").expect(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns field level validation errors", async () => {
    const res = await api.post("/api/v1/auth/register").send({ email: "nope", name: "", password: "x" }).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields.map((f: { field: string }) => f.field).sort()).toEqual(["email", "name", "password"]);
  });

  it("runs the full workspace, board, list and card flow", async () => {
    const owner = await register("owner@example.com", "Owner");
    const outsider = await register("outsider@example.com", "Outsider");
    const observer = await register("observer@example.com", "Observer");

    const ws = await api.post("/api/v1/workspaces").set(auth(owner.token)).send({ name: "Team" }).expect(201);
    await api.get(`/api/v1/workspaces/${ws.body.id}`).set(auth(outsider.token)).expect(404);

    await api
      .post(`/api/v1/workspaces/${ws.body.id}/members`)
      .set(auth(owner.token))
      .send({ userId: observer.id })
      .expect(201);

    const board = await api
      .post("/api/v1/boards")
      .set(auth(owner.token))
      .send({ workspaceId: ws.body.id, name: "Roadmap", visibility: "private" })
      .expect(201);
    const boardId = board.body.id as string;

    await api.get(`/api/v1/boards/${boardId}`).set(auth(outsider.token)).expect(404);
    await api.get(`/api/v1/boards/${boardId}`).set(auth(observer.token)).expect(404);

    await api
      .post(`/api/v1/boards/${boardId}/members`)
      .set(auth(owner.token))
      .send({ userId: observer.id, role: "observer" })
      .expect(201);

    const todo = await api.post(`/api/v1/boards/${boardId}/lists`).set(auth(owner.token)).send({ name: "To Do" }).expect(201);
    const doing = await api
      .post(`/api/v1/boards/${boardId}/lists`)
      .set(auth(owner.token))
      .send({ name: "Doing" })
      .expect(201);
    expect(doing.body.position > todo.body.position).toBe(true);

    await api
      .post(`/api/v1/boards/${boardId}/lists`)
      .set(auth(observer.token))
      .send({ name: "Nope" })
      .expect(403);

    const card = await api
      .post(`/api/v1/boards/${boardId}/cards`)
      .set(auth(owner.token))
      .send({ listId: todo.body.id, title: "Ship it", description: '<p>ok</p><script>x()</script>' })
      .expect(201);
    expect(card.body.description).toBe("<p>ok</p>");
    expect(card.body.version).toBe(1);

    await api.post(`/api/v1/cards/${card.body.id}/watchers`).set(auth(observer.token)).send({ userId: observer.id }).expect(201);

    const moved = await api
      .post(`/api/v1/cards/${card.body.id}/move`)
      .set(auth(owner.token))
      .send({ listId: doing.body.id, position: "V", expectedVersion: 1 })
      .expect(200);
    expect(moved.body.listId).toBe(doing.body.id);
    expect(moved.body.version).toBe(2);

    const stale = await api
      .post(`/api/v1/cards/${card.body.id}/move`)
      .set(auth(owner.token))
      .send({ listId: todo.body.id, position: "V", expectedVersion: 1 })
      .expect(409);
    expect(stale.body.error.code).toBe("VERSION_CONFLICT");

    const activity = await api.get(`/api/v1/cards/${card.body.id}/activity`).set(auth(owner.token)).expect(200);
    const moves = activity.body.items.filter((a: { type: string }) => a.type === "card_moved");
    expect(moves).toHaveLength(1);
    expect(moves[0].payload.fromList.name).toBe("To Do");
    expect(moves[0].payload.toList.name).toBe("Doing");

    const notifications = await connection.collection("notifications").countDocuments({
      userId: new Types.ObjectId(observer.id)
    });
    expect(notifications).toBeGreaterThanOrEqual(1);

    const full = await api.get(`/api/v1/boards/${boardId}`).set(auth(observer.token)).expect(200);
    expect(full.body.permissions.edit).toBe(false);
    const doingList = full.body.lists.find((l: { name: string }) => l.name === "Doing");
    expect(doingList.cards.map((c: { id: string }) => c.id)).toEqual([card.body.id]);

    await api.post(`/api/v1/cards/${card.body.id}/archive`).set(auth(owner.token)).expect(200);
    const afterArchive = await api.get(`/api/v1/boards/${boardId}`).set(auth(owner.token)).expect(200);
    expect(afterArchive.body.lists.flatMap((l: { cards: unknown[] }) => l.cards)).toHaveLength(0);

    await api.delete(`/api/v1/boards/${boardId}`).set(auth(observer.token)).expect(403);
    await api.delete(`/api/v1/boards/${boardId}`).set(auth(owner.token)).expect(204);
    await api.get(`/api/v1/boards/${boardId}`).set(auth(owner.token)).expect(404);
  });

  it("rolls back the mutation when activity persistence fails", async () => {
    const user = await register("rollback@example.com", "Rollback");
    const ws = await api.post("/api/v1/workspaces").set(auth(user.token)).send({ name: "RB" }).expect(201);
    const board = await api.post("/api/v1/boards").set(auth(user.token)).send({ workspaceId: ws.body.id, name: "B" }).expect(201);
    const list = await api.post(`/api/v1/boards/${board.body.id}/lists`).set(auth(user.token)).send({ name: "L" }).expect(201);

    const activityModel = app.get<Model<unknown>>(getModelToken("Activity"));
    const createSpy = jest.spyOn(activityModel, "create").mockRejectedValue(new Error("boom"));
    await api
      .post(`/api/v1/boards/${board.body.id}/cards`)
      .set(auth(user.token))
      .send({ listId: list.body.id, title: "Ghost" })
      .expect(500);
    createSpy.mockRestore();

    const full = await api.get(`/api/v1/boards/${board.body.id}`).set(auth(user.token)).expect(200);
    expect(full.body.lists[0].cards).toHaveLength(0);
  });
});
