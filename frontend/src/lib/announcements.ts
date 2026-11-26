export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
}

export const ANNOUNCEMENTS_VERSION = "2026-11-backup-and-reset";
export const HELP_VERSION = "2026-11-shortcuts";

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "backup-reset",
    title: "Back up and reset your saved data",
    body: "Download a copy of everything stored in this browser, or start fresh from the data banner.",
    date: "2026-11"
  },
  {
    id: "customization",
    title: "Themes, boards and rules",
    body: "Pick an accent and background, keep several boards, and automate cards with board rules.",
    date: "2026-10"
  }
];

export const HELP_CENTRE_URL = process.env.NEXT_PUBLIC_HELP_CENTRE_URL ?? "";
