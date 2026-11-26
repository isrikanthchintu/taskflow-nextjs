import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: Types.ObjectId, ref: "Organisation", required: true })
  organisationId: Types.ObjectId;
}
export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ timestamps: true })
export class Organisation {
  @Prop({ required: true, trim: true })
  name: string;
}
export type OrganisationDocument = HydratedDocument<Organisation>;
export const OrganisationSchema = SchemaFactory.createForClass(Organisation);
