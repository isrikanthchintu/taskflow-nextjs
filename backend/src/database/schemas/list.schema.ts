import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class BoardList {
  @Prop({ type: Types.ObjectId, ref: "Board", required: true })
  boardId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true })
  position: string;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: Object, default: {} })
  extra: Record<string, unknown>;
}
export type BoardListDocument = HydratedDocument<BoardList>;
export const BoardListSchema = SchemaFactory.createForClass(BoardList);
BoardListSchema.index({ boardId: 1, position: 1 });
