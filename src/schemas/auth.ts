import { z } from "zod";

export const signInSchema = z.object({
  userId: z.cuid(),
});
