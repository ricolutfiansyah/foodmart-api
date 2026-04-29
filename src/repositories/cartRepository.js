import prisma from '../config/prisma.js';

export const findCartByUserId = async (userId) => {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      cartItems: {
        include: {
          food: {
            include: {
              category: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });
};

export const createCart = async (userId) => {
  return prisma.cart.create({
    data: { userId },
    include: {
      cartItems: {
        include: {
          food: {
            include: {
              category: true
            }
          }
        }
      }
    }
  });
};

export const findCartItemById = async (itemId) => {
  return prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true
    }
  });
};

export const findCartItem = async (cartId, foodId) => {
  return prisma.cartItem.findUnique({
    where: {
      cartId_foodId: {
        cartId,
        foodId
      }
    }
  });
};

export const addCartItem = async (cartId, foodId, quantity) => {
  return prisma.cartItem.create({
    data: {
      cartId,
      foodId,
      quantity
    }
  });
};

export const updateCartItemQuantity = async (itemId, quantity) => {
  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity }
  });
};

export const deleteCartItem = async (itemId) => {
  return prisma.cartItem.delete({
    where: { id: itemId }
  });
};

export const clearCart = async (cartId) => {
  return prisma.cartItem.deleteMany({
    where: { cartId }
  });
};
