export interface CurrentUser {
  name: string;
  initials: string;
  imageUrl?: string;
}

export const CURRENT_USER: CurrentUser = {
  name: "Srikanth P",
  initials: "SP"
};
