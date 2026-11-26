import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export const WORKSPACE_ROLES = ["admin", "member"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

@Schema({ timestamps: true })
export class Workspace {
  @Prop({ type: Types.ObjectId, ref: "Organisation", required: true, index: true })
  organisationId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ default: "", maxlength: 2000 })
  description: string;

  @Prop({ default: "general" })
  type: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
}
export type WorkspaceDocument = HydratedDocument<Workspace>;
export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

@Schema({ timestamps: { createdAt: "joinedAt", updatedAt: false } })
export class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: "Workspace", required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: WORKSPACE_ROLES, default: "member" })
  role: WorkspaceRole;
}
export type WorkspaceMemberDocument = HydratedDocument<WorkspaceMember>;
export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
WorkspaceMemberSchema.index({ userId: 1 });
