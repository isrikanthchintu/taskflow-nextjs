import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model, Types } from "mongoose";
import { forbidden, notFound } from "@/common/errors";
import { Board, BoardDocument, BoardMember, BoardRole } from "@/database/schemas/board.schema";
import { Workspace, WorkspaceMember, WorkspaceRole } from "@/database/schemas/workspace.schema";

export type Permission = "read" | "comment" | "edit" | "manage" | "admin";

const MATRIX: Record<BoardRole, Permission[]> = {
  admin: ["read", "comment", "edit", "manage", "admin"],
  member: ["read", "comment", "edit"],
  observer: ["read", "comment"]
};

export function roleAllows(role: BoardRole, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export interface BoardAccess {
  board: BoardDocument;
  role: BoardRole;
}

@Injectable()
export class AccessService {
  constructor(
    @InjectModel(Board.name) private readonly boards: Model<Board>,
    @InjectModel(BoardMember.name) private readonly boardMembers: Model<BoardMember>,
    @InjectModel(Workspace.name) private readonly workspaces: Model<Workspace>,
    @InjectModel(WorkspaceMember.name) private readonly workspaceMembers: Model<WorkspaceMember>
  ) {}

  async workspaceRole(
    userId: Types.ObjectId,
    workspaceId: Types.ObjectId,
    session?: ClientSession
  ): Promise<WorkspaceRole | null> {
    const membership = await this.workspaceMembers.findOne({ userId, workspaceId }, null, { session });
    return membership ? membership.role : null;
  }

  async requireWorkspaceRole(
    userId: Types.ObjectId,
    workspaceId: Types.ObjectId,
    admin = false,
    session?: ClientSession
  ): Promise<WorkspaceRole> {
    const role = await this.workspaceRole(userId, workspaceId, session);
    if (!role || !(await this.workspaces.exists({ _id: workspaceId }).session(session ?? null))) {
      throw notFound();
    }
    if (admin && role !== "admin") {
      throw forbidden();
    }
    return role;
  }

  async boardRole(
    userId: Types.ObjectId,
    board: BoardDocument,
    session?: ClientSession
  ): Promise<BoardRole | null> {
    const direct = await this.boardMembers.findOne({ boardId: board._id, userId }, null, { session });
    if (direct) {
      return direct.role;
    }
    const workspaceRole = await this.workspaceRole(userId, board.workspaceId, session);
    if (workspaceRole && board.visibility !== "private") {
      return workspaceRole === "admin" ? "admin" : "member";
    }
    if (board.visibility === "public") {
      return "observer";
    }
    return null;
  }

  async requireBoard(
    userId: Types.ObjectId,
    boardId: Types.ObjectId,
    permission: Permission,
    session?: ClientSession
  ): Promise<BoardAccess> {
    const board = await this.boards.findById(boardId, null, { session });
    if (!board) {
      throw notFound();
    }
    const role = await this.boardRole(userId, board, session);
    if (!role) {
      throw notFound();
    }
    if (!roleAllows(role, permission)) {
      throw forbidden();
    }
    return { board, role };
  }

  async canRead(userId: Types.ObjectId, boardId: Types.ObjectId, session?: ClientSession): Promise<boolean> {
    const board = await this.boards.findById(boardId, null, { session });
    if (!board) {
      return false;
    }
    return (await this.boardRole(userId, board, session)) !== null;
  }
}
