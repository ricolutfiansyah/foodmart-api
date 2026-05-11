import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as authRepo from '../repositories/authRepository.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, hashToken, verifyToken, fingerprintRequest } from '../utils/jwt.js';
import { redis } from '../config/redis.js';

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
  const currentFingerprint = fingerprintRequest(req);
  const graceKey = `refresh_grace:${currentFingerprint}:${hashedIncomingToken}`;

  const cachedResponse = await redis.get(graceKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const lockKey = `refresh_lock:${hashedIncomingToken}`;
  const lockAcquired = await redis.set(lockKey, 'locked', { nx: true, ex: 15 });

  if (!lockAcquired) {
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = await redis.get(graceKey);
      if (result) return result;
    }
    throw new AppError('Token refresh in progress, please retry', 409);
  }

  try {
    const storedToken = await authRepo.findRefreshToken(hashedIncomingToken);

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (storedToken.isUsed) {
      await authRepo.revokeTokenFamily(storedToken.familyId);
      console.warn(`[AUTH] Token reuse detected! Revoking family: ${storedToken.familyId}`);
      throw new AppError('Session compromised, please login again', 401);
    }

    if (storedToken.fingerprint !== currentFingerprint) {
      await authRepo.revokeTokenFamily(storedToken.familyId);
      console.warn(`[AUTH] Fingerprint mismatch! Revoking family: ${storedToken.familyId}`);
      throw new AppError('Session compromised, please login again', 401);
    }

    await authRepo.markTokenAsUsed(storedToken.id);

    const accessToken = signAccessToken({ id: storedToken.user.id, role: storedToken.user.role });
    const newRefreshToken = signRefreshToken({ id: storedToken.user.id });

    await authRepo.createRefreshToken({
      token: hashToken(newRefreshToken),
      userId: storedToken.user.id,
      familyId: storedToken.familyId,
      fingerprint: currentFingerprint,
      expiresAt: getRefreshTokenExpiry(),
    });

    const responseData = { accessToken, refreshToken: newRefreshToken };

    await redis.set(graceKey, responseData, { ex: 15 });

    return responseData;
  } catch (error) {
    await redis.del(lockKey);
    throw error;
  }
};

export const logout = async (token) => {
  const hashedToken = hashToken(token);
  const storedToken = await authRepo.findRefreshToken(hashedToken);

  if (!storedToken) return;

  if (storedToken.isUsed) {
    await authRepo.revokeTokenFamily(storedToken.familyId);
    console.warn(`[AUTH] Logout attempted with used token! Revoking family: ${storedToken.familyId}`);
    return;
  }

  await authRepo.markTokenAsUsed(storedToken.id);
};

export const getMe = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};