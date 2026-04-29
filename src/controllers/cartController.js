import * as cartService from '../services/cartService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import { addToCartSchema, updateCartItemSchema } from '../validators/cartValidator.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  sendResponse(res, 200, 'Cart retrieved successfully', cart);
});

export const addToCart = asyncHandler(async (req, res) => {
  const parsed = addToCartSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }

  const cart = await cartService.addToCart(req.user.id, parsed.data);
  sendResponse(res, 201, 'Item added to cart successfully', cart);
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const parsed = updateCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }

  const cart = await cartService.updateCartItem(req.user.id, req.params.itemId, parsed.data);
  sendResponse(res, 200, 'Cart item updated successfully', cart);
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItem(req.user.id, req.params.itemId);
  sendResponse(res, 200, 'Cart item removed successfully', cart);
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  sendResponse(res, 200, 'Cart cleared successfully', cart);
});
