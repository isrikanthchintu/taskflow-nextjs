export type Priority = "low" | "medium" | "high";
export type ThemeMode = "light" | "dark" | "system";
export type Density = "compact" | "comfortable";
export type Corners = "xs" | "sm" | "md" | "xl";

export interface Settings {
  mode: ThemeMode;
  accentId: string;
  density: Density;
  corners: Corners;
  customAccentColor?: string;
  customBackgroundStart?: string;
  customBackgroundEnd?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface List {
  id: string;
  name: string;
  done: boolean;
  limit: number | null;
  archived: boolean;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  labelIds: string[];
  checklists: Checklist[];
  archived: boolean;
  createdAt: string;
}

export interface CardTemplate {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  labelIds: string[];
  checklists: Checklist[];
}

export type RuleTrigger =
  { kind: "card-enters-list"; listId: string } | { kind: "checklist-complete" };

export type RuleAction =
  | { kind: "move-to-list"; listId: string }
  | { kind: "add-label"; labelId: string }
  | { kind: "set-priority"; priority: Priority };

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: RuleTrigger;
  action: RuleAction;
}

export interface Board {
  id: string;
  name: string;
  backgroundId: string;
  lists: List[];
  cards: Card[];
  labels: Label[];
  templates: CardTemplate[];
  rules: Rule[];
  archived: boolean;
  createdAt: string;
}

export interface AppData {
  version: number;
  activeBoardId: string;
  boards: Board[];
  settings: Settings;
}
