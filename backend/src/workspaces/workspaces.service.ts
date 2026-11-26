import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AccessService } from "@/access/access.service";
import { AuthUser } from "@/auth/auth.guard";
import { AppError, conflict, notFound } from "@/common/errors";
import { oid } from "@/common/object-id";
import { Board } from "@/database/schemas/board.schema";
import { User } from "@/database/schemas/identity.schema";
import {
  Workspace,
  WorkspaceDocument,
  WorkspaceMember,
  WorkspaceRole
} from "@/database/schemas/workspace.schema";
import { TransactionService } from "@/database/transaction.service";
import { AddWorkspaceMemberDto, CreateWorkspaceDto, UpdateWorkspaceDto } from "@/workspaces/workspaces.dto";

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaces: Model<Workspace>,
    @InjectModel(WorkspaceMember.name) private readonly members: Model<WorkspaceMember>,
    @InjectModel(Board.name) private readonly boards: Model<Board>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly access: AccessService,
    private readonly transactions: TransactionService
  ) {}

  private view(workspace: WorkspaceDocument, role: WorkspaceRole) {
    return {
      id: String(workspace._id),
      organisationId: String(workspace.organisationId),
      name: workspace.name,
      description: workspace.description,
      type: workspace.type,
      createdBy: String(workspace.createdBy),
      role,
      createdAt: (workspace as unknown as { createdAt: Date }).createdAt.toISOString(),
      updatedAt: (workspace as unknown as { updatedAt: Date }).updatedAt.toISOString()
    };
  }

  async create(user: AuthUser, dto: CreateWorkspaceDto) {
    const userId = oid(user.id);
    const workspace = await this.transactions.run(async (session) => {
      const [created] = await this.workspaces.create(
        [
          {
            organisationId: oid(user.organisationId),
            name: dto.name,
            description: dto.description ?? "",
            type: dto.type ?? "general",
            createdBy: userId
          }
        ],
        { session }
      );
      await this.members.create([{ workspaceId: created._id, userId, role: "admin" }], { session });
      return created;
    });
    return this.view(workspace, "admin");
  }

  async list(user: AuthUser) {
    const memberships = await this.members.find({ userId: oid(user.id) });
    const roles = new Map(memberships.map((m) => [String(m.workspaceId), m.role]));
    const workspaces = await this.workspaces
      .find({ _id: { $in: memberships.map((m) => m.workspaceId) } })
      .sort({ name: 1 });
    return workspaces.map((w) => this.view(w, roles.get(String(w._id)) as WorkspaceRole));
  }

  async get(user: AuthUser, id: string) {
    const workspaceId = oid(id);
    const role = await this.access.requireWorkspaceRole(oid(user.id), workspaceId);
    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw notFound();
    }
    return this.view(workspace, role);
  }

  async update(user: AuthUser, id: string, dto: UpdateWorkspaceDto) {
    const workspaceId = oid(id);
    await this.access.requireWorkspaceRole(oid(user.id), workspaceId, true);
    const workspace = await this.workspaces.findByIdAndUpdate(workspaceId, { $set: dto }, { new: true });
    if (!workspace) {
      throw notFound();
    }
    return this.view(workspace, "admin");
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const workspaceId = oid(id);
    await this.access.requireWorkspaceRole(oid(user.id), workspaceId, true);
    if (await this.boards.exists({ workspaceId })) {
      throw conflict("WORKSPACE_NOT_EMPTY", "Delete or move the workspace's boards before deleting it.");
    }
    await this.transactions.run(async (session) => {
      await this.members.deleteMany({ workspaceId }, { session });
      await this.workspaces.deleteOne({ _id: workspaceId }, { session });
    });
  }

  async listMembers(user: AuthUser, id: string) {
    const workspaceId = oid(id);
    await this.access.requireWorkspaceRole(oid(user.id), workspaceId);
    const memberships = await this.members.find({ workspaceId }).sort({ _id: 1 });
    const users = await this.users.find({ _id: { $in: memberships.map((m) => m.userId) } });
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return memberships.map((m) => ({
      userId: String(m.userId),
      name: byId.get(String(m.userId))?.name ?? null,
      email: byId.get(String(m.userId))?.email ?? null,
      role: m.role,
      joinedAt: (m as unknown as { joinedAt: Date }).joinedAt.toISOString()
    }));
  }

  async addMember(user: AuthUser, id: string, dto: AddWorkspaceMemberDto) {
    const workspaceId = oid(id);
    await this.access.requireWorkspaceRole(oid(user.id), workspaceId, true);
    const target = await this.users.findById(oid(dto.userId));
    if (!target) {
      throw new AppError(400, "VALIDATION_ERROR", "The submitted data is invalid.", [
        { field: "userId", code: "NOT_FOUND", message: "User does not exist." }
      ]);
    }
    if (await this.members.exists({ workspaceId, userId: target._id })) {
      throw conflict("ALREADY_MEMBER", "User is already a member of this workspace.");
    }
    const member = await this.members.create({ workspaceId, userId: target._id, role: dto.role ?? "member" });
    return { userId: String(member.userId), role: member.role };
  }

  private async assertNotLastAdmin(workspaceId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const admins = await this.members.countDocuments({ workspaceId, role: "admin" });
    const target = await this.members.findOne({ workspaceId, userId });
    if (target?.role === "admin" && admins <= 1) {
      throw conflict("LAST_ADMIN", "A workspace must keep at least one admin.");
    }
  }

  async updateMember(user: AuthUser, id: string, userIdParam: string, role: WorkspaceRole) {
    const workspaceId = oid(id);
    const userId = oid(userIdParam);
    await this.access.requireWorkspaceRole(oid(user.id), workspaceId, true);
    if (role !== "admin") {
      await this.assertNotLastAdmin(workspaceId, userId);
    }
    const member = await this.members.findOneAndUpdate({ workspaceId, userId }, { $set: { role } }, { new: true });
    if (!member) {
      throw notFound();
    }
    return { userId: String(member.userId), role: member.role };
  }

  async removeMember(user: AuthUser, id: string, userIdParam: string): Promise<void> {
    const workspaceId = oid(id);
    const userId = oid(userIdParam);
    const self = String(userId) === user.id;
    await this.access.requireWorkspaceRole(oid(user.id), workspaceId, !self);
    await this.assertNotLastAdmin(workspaceId, userId);
    const result = await this.members.deleteOne({ workspaceId, userId });
    if (result.deletedCount === 0) {
      throw notFound();
    }
  }
}
