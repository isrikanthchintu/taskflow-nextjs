import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class Card {
  @Prop({ type: Types.ObjectId, ref: "Board", required: true })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "BoardList", required: true })
  listId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 512 })
  title: string;

  @Prop({ default: "", maxlength: 16384 })
  description: string;

  @Prop({ required: true })
  position: string;

  @Prop({ default: false })
  isComplete: boolean;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: null })
  startAt: Date | null;

  @Prop({ type: Date, default: null })
  dueAt: Date | null;

  @Prop({ default: false })
  dueComplete: boolean;

  @Prop({ type: Types.ObjectId, ref: "Attachment", default: null })
  coverAttachmentId: Types.ObjectId | null;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  lastActivityAt: Date;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ type: Object, default: {} })
  extra: Record<string, unknown>;
}
export type CardDocument = HydratedDocument<Card>;
export const CardSchema = SchemaFactory.createForClass(Card);
CardSchema.index({ listId: 1, position: 1 });
CardSchema.index({ boardId: 1, isArchived: 1 });
CardSchema.index({ title: "text" });

@Schema({ timestamps: { createdAt: "assignedAt", updatedAt: false } })
export class CardMember {
  @Prop({ type: Types.ObjectId, ref: "Card", required: true })
  cardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;
}
export type CardMemberDocument = HydratedDocument<CardMember>;
export const CardMemberSchema = SchemaFactory.createForClass(CardMember);
CardMemberSchema.index({ cardId: 1, userId: 1 }, { unique: true });

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CardWatcher {
  @Prop({ type: Types.ObjectId, ref: "Card", required: true })
  cardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;
}
export type CardWatcherDocument = HydratedDocument<CardWatcher>;
export const CardWatcherSchema = SchemaFactory.createForClass(CardWatcher);
CardWatcherSchema.index({ cardId: 1, userId: 1 }, { unique: true });

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CardLabel {
  @Prop({ type: Types.ObjectId, ref: "Card", required: true })
  cardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Label", required: true })
  labelId: Types.ObjectId;
}
export type CardLabelDocument = HydratedDocument<CardLabel>;
export const CardLabelSchema = SchemaFactory.createForClass(CardLabel);
CardLabelSchema.index({ cardId: 1, labelId: 1 }, { unique: true });
CardLabelSchema.index({ labelId: 1 });
