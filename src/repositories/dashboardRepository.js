import prisma from '../config/prisma.js';

export const countOrders = async () => {
  return prisma.order.count();
};

export const countOrdersByStatus = async (status) => {
  return prisma.order.count({ where: { status } });
};

export const sumRevenue = async () => {
  const result = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { status: 'COMPLETED' }
  });
  return result._sum.totalPrice || 0;
};

export const countFoods = async () => {
  return prisma.food.count();
};

export const countCategories = async () => {
  return prisma.category.count();
};

export const countCustomers = async () => {
  return prisma.user.count({ where: { role: 'USER' } });
};
