import { AppError } from '../../src/utils/AppError.js';
import { getPaginationOptions } from '../../src/utils/pagination.js';
import { hashToken, fingerprintRequest } from '../../src/utils/jwt.js';

describe('Utils Unit Tests', () => {
  describe('AppError', () => {
    it('should be an instance of Error', () => {
      const err = new AppError('test error', 400);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it('should have message according to what was passed', () => {
      const err = new AppError('Custom Message', 404);
      expect(err.message).toBe('Custom Message');
    });

    it('should have statusCode according to what was passed', () => {
      const err = new AppError('Custom Message', 404);
      expect(err.statusCode).toBe(404);
    });

    it('should have isOperational property set to true', () => {
      const err = new AppError('Custom Message', 400);
      expect(err.isOperational).toBe(true);
    });
  });

  describe('pagination - getPaginationOptions', () => {
    it('should return { skip: 0, take: 10 } for page: 1, limit: 10', () => {
      const result = getPaginationOptions(1, 10);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(10);
    });

    it('should return { skip: 5, take: 5 } for page: 2, limit: 5', () => {
      const result = getPaginationOptions(2, 5);
      expect(result.skip).toBe(5);
      expect(result.take).toBe(5);
    });

    it('should return default values when no argument is passed', () => {
      const result = getPaginationOptions();
      expect(result.skip).toBe(0);
      expect(result.take).toBe(10);
    });
  });

  describe('jwt', () => {
    describe('hashToken', () => {
      it('should return a string type', () => {
        const result = hashToken('my-token');
        expect(typeof result).toBe('string');
      });

      it('should always return the same hash for the same input', () => {
        const token = 'consistent-token';
        const hash1 = hashToken(token);
        const hash2 = hashToken(token);
        expect(hash1).toBe(hash2);
      });

      it('should return different hashes for different inputs', () => {
        const hash1 = hashToken('token1');
        const hash2 = hashToken('token2');
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('fingerprintRequest', () => {
      it('should return a string type', () => {
        const req = { headers: { 'user-agent': 'Chrome' } };
        const result = fingerprintRequest(req);
        expect(typeof result).toBe('string');
      });

      it('should return different results for different user-agents', () => {
        const req1 = { headers: { 'user-agent': 'Mozilla' } };
        const req2 = { headers: { 'user-agent': 'Safari' } };

        const fp1 = fingerprintRequest(req1);
        const fp2 = fingerprintRequest(req2);

        expect(fp1).not.toBe(fp2);
      });
    });
  });
});
