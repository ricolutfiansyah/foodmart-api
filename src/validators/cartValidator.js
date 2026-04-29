import { z } from 'zod';

export const addToCartSchema = z.object({
  foodId: z.string().uuid('Invalid food ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1')
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0, 'Quantity must be at least 0')
});
