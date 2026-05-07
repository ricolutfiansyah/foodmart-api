import * as dashboardService from '../services/dashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats();
  return sendResponse(res, 200, 'Dashboard stats retrieved successfully', stats);
});
