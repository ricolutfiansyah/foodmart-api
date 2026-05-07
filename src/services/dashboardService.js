import * as dashboardRepository from '../repositories/dashboardRepository.js';

export const getStats = async () => {
  const [
    totalOrders,
    totalRevenue,
    pendingOrders,
    processingOrders,
    completedOrders,
    cancelledOrders,
    totalFoods,
    totalCategories,
    totalCustomers
  ] = await Promise.all([
    dashboardRepository.countOrders(),
    dashboardRepository.sumRevenue(),
    dashboardRepository.countOrdersByStatus('PENDING'),
    dashboardRepository.countOrdersByStatus('PROCESSING'),
    dashboardRepository.countOrdersByStatus('COMPLETED'),
    dashboardRepository.countOrdersByStatus('CANCELLED'),
    dashboardRepository.countFoods(),
    dashboardRepository.countCategories(),
    dashboardRepository.countCustomers()
  ]);

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    processingOrders,
    completedOrders,
    cancelledOrders,
    totalFoods,
    totalCategories,
    totalCustomers
  };
};
