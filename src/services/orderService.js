import * as orderRepository from '../repositories/orderRepository.js';
import * as cartRepository from '../repositories/cartRepository.js';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { getPaginationOptions, formatPaginationMeta } from '../utils/pagination.js';
import crypto from 'crypto';

export const checkout = async (userId, data) => {
  const { note, cartItemIds } = data;

  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart || cart.cartItems.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  const selectedItems = cartItemIds
    ? cart.cartItems.filter(item => cartItemIds.includes(item.id))
    : cart.cartItems;

  if (selectedItems.length === 0) {
    throw new AppError('Item yang dipilih tidak ditemukan di keranjang', 400);
  }

  let totalPrice = 0;
  const orderItemsData = [];

  for (const item of selectedItems) {
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

  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(2).toString('hex').toUpperCase();
  const orderNumber = `FMD-${dateStr}-${randomStr}`;

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await orderRepository.create({
      orderNumber,
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

    const selectedItemIds = selectedItems.map(item => item.id);
    await tx.cartItem.deleteMany({
      where: { id: { in: selectedItemIds } }
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

export const getOrderById = async (user, id) => {
  const order = await orderRepository.findById(id);

  if (!order) {
    throw new AppError('Order tidak ditemukan', 404);
  }

  if (user.role !== 'ADMIN' && order.userId !== user.id) {
    throw new AppError('Anda tidak memiliki akses untuk melihat order ini', 403);
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

  const allowedTransitions = {
    PENDING: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: []
  };

  if (!allowedTransitions[order.status].includes(status)) {
    throw new AppError(`Cannot change order status from ${order.status} to ${status}`, 400);
  }

  return prisma.$transaction(async (tx) => {
    if (status === 'CANCELLED') {
      for (const item of order.orderItems) {
        await tx.food.update({
          where: { id: item.foodId },
          data: { stock: { increment: item.quantity } }
        });
      }
    }

    return tx.order.update({
      where: { id },
      data: { status }
    });
  });
};

export const cancelMyOrder = async (userId, id) => {
  const order = await orderRepository.findById(id);

  if (!order) {
    throw new AppError('Order tidak ditemukan', 404);
  }

  if (order.userId !== userId) {
    throw new AppError('Anda tidak memiliki akses untuk membatalkan order ini', 403);
  }

  if (order.status !== 'PENDING') {
    throw new AppError('Hanya pesanan yang masih PENDING yang dapat dibatalkan', 400);
  }

  return prisma.$transaction(async (tx) => {
    for (const item of order.orderItems) {
      await tx.food.update({
        where: { id: item.foodId },
        data: { stock: { increment: item.quantity } }
      });
    }

    return tx.order.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  });
};

export const getAllOrders = async (query) => {
  const { page, limit, search, status, startDate, endDate } = query;
  const { skip, take, page: parsedPage, limit: parsedLimit } = getPaginationOptions(page, limit);

  const [data, total] = await Promise.all([
    orderRepository.findAll({ skip, take, search, status, startDate, endDate }),
    orderRepository.countAll({ search, status, startDate, endDate })
  ]);

  const meta = formatPaginationMeta(parsedPage, parsedLimit, total);
  return { data, meta };
};
