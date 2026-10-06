import { z } from "zod";

// Exported so the form can mirror them in maxLength/min before the server validates.
export const ROOM_NAME_MAX = 60;
export const ROOM_LOCATION_MAX = 60;
export const ROOM_DESCRIPTION_MAX = 500;
export const ROOM_CAPACITY_MIN = 1;

// A blank optional field is stored as null, not as an empty string.
function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, { error: message })
    .transform((value) => value || null);
}

export const roomSchema = z.object({
  name: z
    .string({ error: "Informe o nome da sala." })
    .trim()
    .min(1, { error: "Informe o nome da sala." })
    .max(ROOM_NAME_MAX, {
      error: `O nome pode ter no máximo ${ROOM_NAME_MAX} caracteres.`,
    }),
  // Checked as text first: Number("") is 0, which would be reported as "too small" instead of missing.
  capacity: z
    .string({ error: "Informe a capacidade." })
    .trim()
    .min(1, { error: "Informe a capacidade." })
    .transform(Number)
    .pipe(
      z
        .number({ error: "Informe um número inteiro." })
        .int({ error: "Informe um número inteiro." })
        .min(ROOM_CAPACITY_MIN, {
          error: `A capacidade mínima é ${ROOM_CAPACITY_MIN} pessoa.`,
        }),
    ),
  location: optionalText(
    ROOM_LOCATION_MAX,
    `O local pode ter no máximo ${ROOM_LOCATION_MAX} caracteres.`,
  ),
  description: optionalText(
    ROOM_DESCRIPTION_MAX,
    `A descrição pode ter no máximo ${ROOM_DESCRIPTION_MAX} caracteres.`,
  ),
  features: z.array(z.string()),
  isActive: z.boolean(),
});

export type RoomInput = z.output<typeof roomSchema>;

export const roomIdSchema = z.cuid({ error: "Sala inválida." });
