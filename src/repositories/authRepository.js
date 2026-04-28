import prisma from '../config/prisma.js';

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

export const createUser = async (data) => {
  return prisma.user.create({ data });
};

export const createRefreshToken = async (data) => {
  return prisma.refreshToken.create({ data });
};

export const findRefreshToken = async (hashedToken) => {
  return prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true }
  });
};

export const markTokenAsUsed = async (id) => {
  return prisma.refreshToken.update({
    where: { id },
    data: { isUsed: true },
  });
};

export const revokeTokenFamily = async (familyId) => {
  return prisma.refreshToken.updateMany({
    where: { familyId },
    data: { isUsed: true },
  });
};

export const deleteRefreshToken = async (hashedToken) => {
  return prisma.refreshToken.deleteMany({
    where: { token: hashedToken }
  });
};
