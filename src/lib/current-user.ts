export interface CurrentUser {
  name: string;
  initials: string;
  email?: string;
  imageUrl?: string;
}

export const CURRENT_USER: CurrentUser = {
  name: "Srikanth P",
  initials: "SP",
  email: "srikanth.p@example.com"
};
