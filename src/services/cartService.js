import * as cartRepository from '../repositories/cartRepository.js';
import * as foodRepository from '../repositories/foodRepository.js';
import { AppError } from '../utils/AppError.js';

export const getCart = async (userId) => {
  const cart = await cartRepository.findCartByUserId(userId);

  if (!cart) {
    return {
      userId,
      cartItems: []
    };
  }

  return cart;
};

export const addToCart = async (userId, data) => {
  const { foodId, quantity } = data;

  let cart = await cartRepository.findCartByUserId(userId);
  if (!cart) {
    cart = await cartRepository.createCart(userId);
  }

  const food = await foodRepository.findById(foodId);
  if (!food) {
    throw new AppError('Food not found', 404);
  }

  if (!food.isAvailable) {
    throw new AppError('Food is currently not available', 400);
  }

  const existingItem = await cartRepository.findCartItem(cart.id, foodId);

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (food.stock < newQuantity) {
      throw new AppError('Not enough stock available', 400);
    }
    await cartRepository.updateCartItemQuantity(existingItem.id, newQuantity);
  } else {
    if (food.stock < quantity) {
      throw new AppError('Not enough stock available', 400);
    }
    await cartRepository.addCartItem(cart.id, foodId, quantity);
  }

  return cartRepository.findCartByUserId(userId);
};

export const updateCartItem = async (userId, itemId, data) => {
  const { quantity } = data;

  if (quantity === 0) {
    return removeCartItem(userId, itemId);
  }

  const cartItem = await cartRepository.findCartItemById(itemId);
  if (!cartItem) {
    throw new AppError('Cart item not found', 404);
  }

  if (cartItem.cart.userId !== userId) {
    throw new AppError('You do not have permission to modify this cart item', 403);
  }

  const food = await foodRepository.findById(cartItem.foodId);
  if (food.stock < quantity) {
    throw new AppError('Not enough stock available', 400);
  }

  await cartRepository.updateCartItemQuantity(itemId, quantity);

  return cartRepository.findCartByUserId(userId);
};

export const removeCartItem = async (userId, itemId) => {
  const cartItem = await cartRepository.findCartItemById(itemId);
  if (!cartItem) {
    throw new AppError('Cart item not found', 404);
  }

  if (cartItem.cart.userId !== userId) {
    throw new AppError('You do not have permission to modify this cart item', 403);
  }

  await cartRepository.deleteCartItem(itemId);

  return cartRepository.findCartByUserId(userId);
};

export const clearCart = async (userId) => {
  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart) {
    return {
      userId,
      cartItems: []
    };
  }

  await cartRepository.clearCart(cart.id);

  return cartRepository.findCartByUserId(userId);
};
