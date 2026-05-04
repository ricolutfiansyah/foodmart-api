import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';
import { sendResponse, sendError } from '../utils/response.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { AppError } from '../utils/AppError.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req, res) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 400, 'Validation Error', validation.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    })));
  }

  const user = await authService.register(validation.data);
  return sendResponse(res, 201, 'User registered successfully', user);
});

export const login = asyncHandler(async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 400, 'Validation Error', validation.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    })));
  }

  const { user, accessToken, refreshToken } = await authService.login(validation.data, req);

  res.cookie('refreshToken', refreshToken, cookieOptions);
  return sendResponse(res, 200, 'Login successful', { user, accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    throw new AppError('Refresh token not found', 401);
  }

  const { accessToken } = await authService.refresh(token, req);

  return sendResponse(res, 200, 'Token refreshed successfully', { accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await authService.logout(token);
  }

  res.clearCookie('refreshToken', cookieOptions);
  return sendResponse(res, 200, 'Logout successful');
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendResponse(res, 200, 'User profile retrieved', user);
});
