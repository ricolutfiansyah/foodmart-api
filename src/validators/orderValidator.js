import { z } from 'zod';

export const checkoutSchema = z.object({
  note: z.string().optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid status' })
  })
});
