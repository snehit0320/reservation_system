import { z } from "zod";

export const reservationSchema = z.object({
  inventoryId: z.uuid(),
  quantity: z.number().int().positive(),
});