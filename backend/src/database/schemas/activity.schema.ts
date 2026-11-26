import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export const ACTIVITY_TYPES = [
  "card_created",
  "card_moved",
  "card_completed",
  "card_uncompleted",
  "member_joined",
  "member_added",
  "member_removed",
  "label_added",
  "label_removed",
  "attachment_added",
  "comment_added",
  "due_changed",
  "card_archived",
  "card_restored",
  "card_updated",
  "card_deleted",
  "list_created",
  "list_updated",
  "list_archived",
  "list_restored",
  "list_moved",
  "board_created",
  "board_updated",
  "board_closed",
  "board_reopened"
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Activity {
  @Prop({ type: Types.ObjectId, ref: "Board", required: true })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Card", default: null })
  cardId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  actorId: Types.ObjectId | null;

  @Prop({ required: true, enum: ACTIVITY_TYPES })
  type: ActivityType;

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;
}
export type ActivityDocument = HydratedDocument<Activity>;
export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ cardId: 1, createdAt: -1 });
ActivitySchema.index({ boardId: 1, createdAt: -1 });

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Activity", required: true })
  activityId: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}
export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, activityId: 1 }, { unique: true });

@Schema({ timestamps: true })
export class NotificationPreference {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: "instant", enum: ["instant", "periodic", "never"] })
  emailFrequency: string;

  @Prop({ default: true })
  desktopEnabled: boolean;
}
export type NotificationPreferenceDocument = HydratedDocument<NotificationPreference>;
export const NotificationPreferenceSchema = SchemaFactory.createForClass(NotificationPreference);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class OutboxEvent {
  @Prop({ type: Types.ObjectId, ref: "Board", required: true })
  boardId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;
}
export type OutboxEventDocument = HydratedDocument<OutboxEvent>;
export const OutboxEventSchema = SchemaFactory.createForClass(OutboxEvent);
OutboxEventSchema.index({ publishedAt: 1, createdAt: 1 });
OutboxEventSchema.index({ boardId: 1, _id: 1 });
