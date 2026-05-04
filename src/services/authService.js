import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as authRepo from '../repositories/authRepository.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, hashToken, verifyToken, fingerprintRequest } from '../utils/jwt.js';

const getRefreshTokenExpiry = () => {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};

export const register = async (data) => {
  const existingUser = await authRepo.findUserByEmail(data.email);
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await authRepo.createUser({
    ...data,
    password: hashedPassword,
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async (data, req) => {
  const user = await authRepo.findUserByEmail(data.email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const familyId = randomUUID();
  const fingerprint = fingerprintRequest(req);

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  const hashedRefreshToken = hashToken(refreshToken);

  const expiresAt = getRefreshTokenExpiry();

  await authRepo.createRefreshToken({
    token: hashedRefreshToken,
    userId: user.id,
    familyId,
    fingerprint,
    expiresAt,
  });

  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export const refresh = async (token, req) => {
  let payload;
  try {
    payload = verifyToken(token, true);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const hashedIncomingToken = hashToken(token);
  const storedToken = await authRepo.findRefreshToken(hashedIncomingToken);

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (storedToken.isUsed) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  const currentFingerprint = fingerprintRequest(req);
  if (storedToken.fingerprint !== currentFingerprint) {
    await authRepo.revokeTokenFamily(storedToken.familyId);
    console.warn(`[AUTH] Fingerprint mismatch! Revoking family: ${storedToken.familyId}`);
    throw new AppError('Session compromised, please login again', 401);
  }

  const accessToken = signAccessToken({ id: storedToken.user.id, role: storedToken.user.role });

  return { accessToken };
};

export const logout = async (token) => {
  const hashedToken = hashToken(token);
  const storedToken = await authRepo.findRefreshToken(hashedToken);

  if (storedToken) {
    await authRepo.markTokenAsUsed(storedToken.id);
  }
};

export const getMe = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
