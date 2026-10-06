import { z } from "zod";

export const createReservationSchema = z.object({
  roomId: z.cuid({ error: "Sala inválida." }),
  date: z.iso.date({ error: "Informe uma data válida." }),
  startTime: z.iso.time({
    precision: -1,
    error: "Informe o horário de início.",
  }),
  endTime: z.iso.time({
    precision: -1,
    error: "Informe o horário de término.",
  }),
  title: z
    .string()
    .trim()
    .max(100, { error: "O título pode ter no máximo 100 caracteres." })
    .transform((title) => title || undefined)
    .optional(),
});
