import prisma from '../config/prisma.js';

export const create = async (data, tx = prisma) => {
  return tx.order.create({
    data: {
      userId: data.userId,
      totalPrice: data.totalPrice,
      note: data.note,
      orderItems: {
        create: data.orderItems
      }
    },
    include: {
      orderItems: true
    }
  });
};

export const findAllByUserId = async (userId, { skip, take }) => {
  return prisma.order.findMany({
    where: { userId },
    skip,
    take,
    include: {
      orderItems: {
        include: { food: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const findById = async (id) => {
  return prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: { food: true }
      }
    }
  });
};

export const findAll = async ({ skip, take }) => {
  return prisma.order.findMany({
    skip,
    take,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      orderItems: {
        include: { food: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateStatus = async (id, status) => {
  return prisma.order.update({
    where: { id },
    data: { status }
  });
};

export const countByUserId = async (userId) => {
  return prisma.order.count({ where: { userId } });
};

export const countAll = async () => {
  return prisma.order.count();
};
