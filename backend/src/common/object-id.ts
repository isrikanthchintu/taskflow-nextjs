import { Types } from "mongoose";
import { notFound } from "@/common/errors";

export function oid(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value) || String(new Types.ObjectId(value)) !== value) {
    throw notFound();
  }
  return new Types.ObjectId(value);
}
