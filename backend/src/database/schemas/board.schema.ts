import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export const BOARD_ROLES = ["admin", "member", "observer"] as const;
export type BoardRole = (typeof BOARD_ROLES)[number];

export const BOARD_VISIBILITIES = ["private", "workspace", "public"] as const;
export type BoardVisibility = (typeof BOARD_VISIBILITIES)[number];

@Schema({ timestamps: true })
export class Board {
  @Prop({ type: Types.ObjectId, ref: "Workspace", required: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ default: "#0079bf" })
  background: string;

  @Prop({ required: true, enum: BOARD_VISIBILITIES, default: "workspace" })
  visibility: BoardVisibility;

  @Prop({ default: false })
  isClosed: boolean;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
}
export type BoardDocument = HydratedDocument<Board>;
export const BoardSchema = SchemaFactory.createForClass(Board);
BoardSchema.index({ workspaceId: 1, isClosed: 1 });

@Schema({ timestamps: { createdAt: "joinedAt", updatedAt: false } })
export class BoardMember {
  @Prop({ type: Types.ObjectId, ref: "Board", required: true })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: BOARD_ROLES, default: "member" })
  role: BoardRole;
}
export type BoardMemberDocument = HydratedDocument<BoardMember>;
export const BoardMemberSchema = SchemaFactory.createForClass(BoardMember);
BoardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });
BoardMemberSchema.index({ userId: 1 });

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class BoardStar {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Board", required: true })
  boardId: Types.ObjectId;
}
export type BoardStarDocument = HydratedDocument<BoardStar>;
export const BoardStarSchema = SchemaFactory.createForClass(BoardStar);
BoardStarSchema.index({ userId: 1, boardId: 1 }, { unique: true });

@Schema({ timestamps: false })
export class BoardView {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Board", required: true })
  boardId: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  viewedAt: Date;
}
export type BoardViewDocument = HydratedDocument<BoardView>;
export const BoardViewSchema = SchemaFactory.createForClass(BoardView);
BoardViewSchema.index({ userId: 1, boardId: 1 }, { unique: true });
BoardViewSchema.index({ userId: 1, viewedAt: -1 });
