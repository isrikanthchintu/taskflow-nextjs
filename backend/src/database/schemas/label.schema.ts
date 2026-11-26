import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class Label {
  @Prop({ type: Types.ObjectId, ref: "Board", required: true, index: true })
  boardId: Types.ObjectId;

  @Prop({ default: "", maxlength: 100 })
  name: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  position: string;
}
export type LabelDocument = HydratedDocument<Label>;
export const LabelSchema = SchemaFactory.createForClass(Label);
