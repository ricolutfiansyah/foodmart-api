import * as authRepo from '../repositories/authRepository.js';

const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000;

export const startTokenCleanupJob = () => {
  const cleanup = async () => {
    try {
      const result = await authRepo.deleteExpiredTokens();
      console.log(`Deleted ${result.count} expired/used refresh tokens`);
    } catch (error) {
      console.error('Failed to clean up tokens:', error.message);
    }
  };

  cleanup();

  setInterval(cleanup, CLEANUP_INTERVAL);
};
