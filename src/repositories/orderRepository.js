import prisma from '../config/prisma.js';

export const create = async (data, tx = prisma) => {
  return tx.order.create({
    data: {
      orderNumber: data.orderNumber,
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
      },
      user: {
        select: { name: true }
      }
    }
  });
};

export const findAll = async ({ skip, take, search, status, startDate, endDate }) => {
  const where = {};

  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  return prisma.order.findMany({
    where,
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

export const countAll = async ({ search, status, startDate, endDate } = {}) => {
  const where = {};

  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  return prisma.order.count({ where });
};
