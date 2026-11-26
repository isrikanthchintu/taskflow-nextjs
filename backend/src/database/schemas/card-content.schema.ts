import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class Checklist {
  @Prop({ type: Types.ObjectId, ref: "Card", required: true, index: true })
  cardId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 512 })
  title: string;

  @Prop({ required: true })
  position: string;
}
export type ChecklistDocument = HydratedDocument<Checklist>;
export const ChecklistSchema = SchemaFactory.createForClass(Checklist);

@Schema({ timestamps: true })
export class ChecklistItem {
  @Prop({ type: Types.ObjectId, ref: "Checklist", required: true, index: true })
  checklistId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 1024 })
  text: string;

  @Prop({ default: false })
  isChecked: boolean;

  @Prop({ required: true })
  position: string;
}
export type ChecklistItemDocument = HydratedDocument<ChecklistItem>;
export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Attachment {
  @Prop({ type: Types.ObjectId, ref: "Card", required: true })
  cardId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 255 })
  name: string;

  @Prop({ required: true })
  storageKey: string;

  @Prop({ type: String, default: null })
  thumbnailKey: string | null;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  uploadedBy: Types.ObjectId;
}
export type AttachmentDocument = HydratedDocument<Attachment>;
export const AttachmentSchema = SchemaFactory.createForClass(Attachment);
AttachmentSchema.index({ cardId: 1, createdAt: 1 });

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: "Card", required: true })
  cardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, maxlength: 16384 })
  body: string;

  @Prop({ type: Types.ObjectId, ref: "Comment", default: null })
  parentId: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  editedAt: Date | null;
}
export type CommentDocument = HydratedDocument<Comment>;
export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ cardId: 1, createdAt: 1 });

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Reaction {
  @Prop({ type: Types.ObjectId, ref: "Comment", required: true })
  commentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 32 })
  emoji: string;
}
export type ReactionDocument = HydratedDocument<Reaction>;
export const ReactionSchema = SchemaFactory.createForClass(Reaction);
ReactionSchema.index({ commentId: 1, userId: 1, emoji: 1 }, { unique: true });
