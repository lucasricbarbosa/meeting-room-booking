export type Role = "USER" | "ADMIN";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
