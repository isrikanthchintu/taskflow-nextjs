import { ModelDefinition } from "@nestjs/mongoose";
import {
  Activity,
  ActivitySchema,
  Notification,
  NotificationPreference,
  NotificationPreferenceSchema,
  NotificationSchema,
  OutboxEvent,
  OutboxEventSchema
} from "@/database/schemas/activity.schema";
import {
  Board,
  BoardMember,
  BoardMemberSchema,
  BoardSchema,
  BoardStar,
  BoardStarSchema,
  BoardView,
  BoardViewSchema
} from "@/database/schemas/board.schema";
import {
  Attachment,
  AttachmentSchema,
  Checklist,
  ChecklistItem,
  ChecklistItemSchema,
  ChecklistSchema,
  Comment,
  CommentSchema,
  Reaction,
  ReactionSchema
} from "@/database/schemas/card-content.schema";
import {
  Card,
  CardLabel,
  CardLabelSchema,
  CardMember,
  CardMemberSchema,
  CardSchema,
  CardWatcher,
  CardWatcherSchema
} from "@/database/schemas/card.schema";
import { Organisation, OrganisationSchema, User, UserSchema } from "@/database/schemas/identity.schema";
import { Label, LabelSchema } from "@/database/schemas/label.schema";
import { BoardList, BoardListSchema } from "@/database/schemas/list.schema";
import {
  Workspace,
  WorkspaceMember,
  WorkspaceMemberSchema,
  WorkspaceSchema
} from "@/database/schemas/workspace.schema";

export const MODELS: ModelDefinition[] = [
  { name: User.name, schema: UserSchema },
  { name: Organisation.name, schema: OrganisationSchema },
  { name: Workspace.name, schema: WorkspaceSchema },
  { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
  { name: Board.name, schema: BoardSchema },
  { name: BoardMember.name, schema: BoardMemberSchema },
  { name: BoardStar.name, schema: BoardStarSchema },
  { name: BoardView.name, schema: BoardViewSchema },
  { name: BoardList.name, schema: BoardListSchema },
  { name: Card.name, schema: CardSchema },
  { name: CardMember.name, schema: CardMemberSchema },
  { name: CardWatcher.name, schema: CardWatcherSchema },
  { name: CardLabel.name, schema: CardLabelSchema },
  { name: Label.name, schema: LabelSchema },
  { name: Checklist.name, schema: ChecklistSchema },
  { name: ChecklistItem.name, schema: ChecklistItemSchema },
  { name: Attachment.name, schema: AttachmentSchema },
  { name: Comment.name, schema: CommentSchema },
  { name: Reaction.name, schema: ReactionSchema },
  { name: Activity.name, schema: ActivitySchema },
  { name: Notification.name, schema: NotificationSchema },
  { name: NotificationPreference.name, schema: NotificationPreferenceSchema },
  { name: OutboxEvent.name, schema: OutboxEventSchema }
];
