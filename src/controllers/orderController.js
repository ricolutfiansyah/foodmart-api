import * as orderService from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import { checkoutSchema, updateOrderStatusSchema } from '../validators/orderValidator.js';

export const checkout = asyncHandler(async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }

  const order = await orderService.checkout(req.user.id, parsed.data);
  sendResponse(res, 201, 'Order created successfully', order);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { data, meta } = await orderService.getMyOrders(req.user.id, req.query);
  sendResponse(res, 200, 'Orders retrieved successfully', data, meta);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.id);
  sendResponse(res, 200, 'Order retrieved successfully', order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }

  const order = await orderService.updateOrderStatus(req.params.id, parsed.data.status);
  sendResponse(res, 200, 'Order status updated successfully', order);
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { data, meta } = await orderService.getAllOrders(req.query);
  sendResponse(res, 200, 'All orders retrieved successfully', data, meta);
});
