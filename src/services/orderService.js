import * as orderRepository from '../repositories/orderRepository.js';
import * as cartRepository from '../repositories/cartRepository.js';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { getPaginationOptions, formatPaginationMeta } from '../utils/pagination.js';

export const checkout = async (userId, data) => {
  const { note } = data;

  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart || cart.cartItems.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  let totalPrice = 0;
  const orderItemsData = [];

  for (const item of cart.cartItems) {
    const food = item.food;
    
    if (!food) {
      throw new AppError(`Food item not found in cart`, 404);
    }
    
    if (!food.isAvailable) {
      throw new AppError(`Food ${food.name} is not available`, 400);
    }
    
    if (food.stock < item.quantity) {
      throw new AppError(`Not enough stock for ${food.name}`, 400);
    }

    const price = Number(food.price);
    totalPrice += price * item.quantity;
    
    orderItemsData.push({
      foodId: food.id,
      quantity: item.quantity,
      priceAtOrder: price
    });
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await orderRepository.create({
      userId,
      totalPrice,
      note,
      orderItems: orderItemsData
    }, tx);

    for (const item of orderItemsData) {
      await tx.food.update({
        where: { id: item.foodId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return newOrder;
  });

  return order;
};

export const getMyOrders = async (userId, query) => {
  const { page, limit } = query;
  const { skip, take, page: parsedPage, limit: parsedLimit } = getPaginationOptions(page, limit);

  const [data, total] = await Promise.all([
    orderRepository.findAllByUserId(userId, { skip, take }),
    orderRepository.countByUserId(userId)
  ]);

  const meta = formatPaginationMeta(parsedPage, parsedLimit, total);
  return { data, meta };
};

export const getOrderById = async (userId, id) => {
  const order = await orderRepository.findById(id);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (order.userId !== userId) {
    throw new AppError('You do not have permission to access this order', 403);
  }

  return order;
};

export const updateOrderStatus = async (id, status) => {
  const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid order status', 400);
  }

  const order = await orderRepository.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return orderRepository.updateStatus(id, status);
};

export const getAllOrders = async (query) => {
  const { page, limit } = query;
  const { skip, take, page: parsedPage, limit: parsedLimit } = getPaginationOptions(page, limit);

  const [data, total] = await Promise.all([
    orderRepository.findAll({ skip, take }),
    orderRepository.countAll()
  ]);

  const meta = formatPaginationMeta(parsedPage, parsedLimit, total);
  return { data, meta };
};
