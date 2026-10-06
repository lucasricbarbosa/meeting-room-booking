import { DomainError } from "./errors";

export type Role = "USER" | "ADMIN";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export function assertAdmin(user: UserSummary): void {
  if (user.role !== "ADMIN") {
    throw new DomainError(
      "FORBIDDEN",
      "Apenas administradores podem gerenciar salas.",
    );
  }
}
