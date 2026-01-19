/**
 * End-to-End Tests for Dashboard KPI Error Fix
 * 
 * Tests the complete flow of error handling, fallback data, and retry mechanisms
 * for the dashboard KPI data fetching system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock Next.js cookies function - must be before imports
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock axios
vi.mock('axios');

import { getKPIData, validateBackendUrl, normalizeKpiPayload, getFallbackKPIData } from './kpi-utils';
import { cookies } from 'next/headers';

const mockedAxios = axios as any;
const mockCookies = cookies as any;

describe('Dashboard KPI Error Fix - End-to-End Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Setup default environment
    process.env.NEXT_PUBLIC_BACKEND_URL = 'https://api.example.com';
    
    // Mock console methods to verify logging
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default cookie mock
    mockCookies.mockResolvedValue({
      getAll: () => [
        { name: 'session', value: 'abc123' },
        { name: 'auth', value: 'xyz789' },
      ],
    });
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Test 1: Backend Unavailable (Network Error)', () => {
    it('should return fallback data and log network error when backend is unavailable', async () => {
      // Setup: Mock network error
      const networkError = new Error('connect ECONNREFUSED 127.0.0.1:8000');
      (networkError as any).code = 'ECONNREFUSED';
      (networkError as any).isAxiosError = true;
      
      const mockCreate = vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(networkError),
      });
      mockedAxios.create = mockCreate;
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      // Execute
      const result = await getKPIData();

      // Verify: Returns fallback data
      expect(result).toEqual({
        totalCrosswalks: 0,
        signalInstallationRate: 0,
        riskIndex: 0,
        safetyIndex: 0,
      });

      // Verify: Logs network error with details
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Dashboard KPI] Network error: ECONNREFUSED')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('URL: https://api.example.com/api/dashboard/kpi')
      );
    });
  });

  describe('Test 2: Backend Returns 401 (Authentication Error)', () => {
    it('should return fallback data and log HTTP 401 error', async () => {
      // Setup: Mock 401 response
      const authError = new Error('Request failed with status code 401');
      (authError as any).isAxiosError = true;
      (authError as any).response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { message: 'Authentication required' },
      };
      
      const mockCreate = vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(authError),
      });
      mockedAxios.create = mockCreate;
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      // Execute
      const result = await getKPIData();

      // Verify: Returns fallback data
      expect(result).toEqual({
        totalCrosswalks: 0,
        signalInstallationRate: 0,
        riskIndex: 0,
        safetyIndex: 0,
      });

      // Verify: Logs HTTP error with status code
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Dashboard KPI] HTTP error: 401')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Status: 401')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Message: Authentication required')
      );
    });
  });

  describe('Test 3: Backend Returns 500 (Server Error)', () => {
    it('should return fallback data and log HTTP 500 error', async () => {
      // Setup: Mock 500 response
      const serverError = new Error('Request failed with status code 500');
      (serverError as any).isAxiosError = true;
      (serverError as any).response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Database connection failed' },
      };
      
      const mockCreate = vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(serverError),
      });
      mockedAxios.create = mockCreate;
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      // Execute
      const result = await getKPIData();

      // Verify: Returns fallback data
      expect(result).toEqual({
        totalCrosswalks: 0,
        signalInstallationRate: 0,
        riskIndex: 0,
        safetyIndex: 0,
      });

      // Verify: Logs HTTP error with status code
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Dashboard KPI] HTTP error: 500')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Status: 500')
      );
    });
  });

  describe('Test 4: Backend Returns Invalid JSON', () => {
    it('should normalize invalid data and return fallback values for invalid fields', async () => {
      // Setup: Mock successful response but with invalid data
      const mockCreate = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          data: 'not valid json object',
        }),
      });
      mockedAxios.create = mockCreate;
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

      // Execute
      const result = await getKPIData();

      // Verify: Returns fallback data (normalization will handle invalid data)
      expect(result).toBeDefined();
      expect(result.totalCrosswalks).toBe(0);
      expect(result.signalInstallationRate).toBe(0);
    });
  });

  describe('Test 5: Missing NEXT_PUBLIC_BACKEND_URL', () => {
    it('should return fallback data and log configuration error when env var is missing', async () => {
      // Setup: Remove environment variable
      delete process.env.NEXT_PUBLIC_BACKEND_URL;

      // Execute
      const result = await getKPIData();

      // Verify: Returns fallback data
      expect(result).toEqual({
        totalCrosswalks: 0,
        signalInstallationRate: 0,
        riskIndex: 0,
        safetyIndex: 0,
      });

      // Verify: Logs configuration error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Dashboard KPI] Configuration error: NEXT_PUBLIC_BACKEND_URL is not set')
      );
    });

    it('should return fallback data when env var is empty string', async () => {
      // Setup: Set empty environment variable
      process.env.NEXT_PUBLIC_BACKEND_URL = '';

      // Execute
      const result = await getKPIData();

      // Verify: Returns fallback data
      expect(result).toEqual({
        totalCrosswalks: 0,
        signalInstallationRate: 0,
        riskIndex: 0,
        safetyIndex: 0,
      });

      // Verify: Logs configuration error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Dashboard KPI] Configuration error: NEXT_PUBLIC_BACKEND_URL is empty')
      );
    });

    it('should return fallback data when env var is invalid URL', async () => {
      // Setup: Set invalid URL
      process.env.NEXT_PUBLIC_BACKEND_URL = 'not-a-valid-url';

      // Execute
      const result = await getKPIData();

      // Verify: Returns fallback data
      expect(result).toEqual({
        totalCrosswalks: 0,
        signalInstallationRate: 0,
        riskIndex: 0,
        safetyIndex: 0,
      });

      // Verify: Logs configuration error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Dashboard KPI] Configuration error: NEXT_PUBLIC_BACKEND_URL is not a valid URL')
      );
    });
  });

  describe('Test 6: Successful Data Fetch', () => {
    it('should return normalized KPI data when backend responds successfully', async () => {
      // Setup: Mock successful response
      const mockData = {
        totalCrosswalks: 1500,
        signalInstallationRate: 75.5,
        riskIndex: 42.3,
        safetyIndex: 85.2,
      };
      
      const mockCreate = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          data: mockData,
        }),
      });
      mockedAxios.create = mockCreate;

      // Execute
      const result = await getKPIData();

      // Verify: Returns actual data
      expect(result).toEqual(mockData);

      // Verify: No errors logged
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should normalize data with missing fields', async () => {
      // Setup: Mock response with missing fields
      const mockData = {
        totalCrosswalks: 1500,
        // Missing other fields
      };
      
      const mockCreate = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          data: mockData,
        }),
      });
      mockedAxios.create = mockCreate;

      // Execute
      const result = await getKPIData();

      // Verify: Missing fields default to 0
      expect(result.totalCrosswalks).toBe(1500);
      expect(result.signalInstallationRate).toBe(0);
      expect(result.riskIndex).toBe(0);
      expect(result.safetyIndex).toBe(0);

      // Verify: Warnings logged for missing fields
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Field normalization: "signalInstallationRate" is missing')
      );
    });
  });

  describe('Test 7: Cookie Forwarding', () => {
    it('should forward cookies from Next.js to backend request', async () => {
      // Setup: Mock successful response
      const mockData = {
        totalCrosswalks: 1500,
        signalInstallationRate: 75.5,
        riskIndex: 42.3,
        safetyIndex: 85.2,
      };
      
      const mockGet = vi.fn().mockResolvedValue({ data: mockData });
      const mockCreate = vi.fn().mockReturnValue({ get: mockGet });
      mockedAxios.create = mockCreate;

      // Setup cookies
      mockCookies.mockResolvedValue({
        getAll: () => [
          { name: 'session', value: 'abc123' },
          { name: 'auth', value: 'xyz789' },
        ],
      });

      // Execute
      await getKPIData();

      // Verify: axios.create was called with cookie header
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Cookie: 'session=abc123; auth=xyz789',
          }),
        })
      );
    });
  });

  describe('Test 8: Timeout Error', () => {
    it('should return fallback data and log timeout error', async () => {
      // Setup: Mock timeout error
      const timeoutError = new Error('timeout of 15000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      (timeoutError as any).isAxiosError = true;
      
      const mockCreate = vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(timeoutError),
      });
      mockedAxios.create = mockCreate;
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      // Execute
      const result = await getKPIData();

      // Verify: Returns fallback data
      expect(result).toEqual({
        totalCrosswalks: 0,
        signalInstallationRate: 0,
        riskIndex: 0,
        safetyIndex: 0,
      });

      // Verify: Logs timeout error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Dashboard KPI] Timeout error')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Request timed out after 15000ms')
      );
    });
  });

  describe('Test 9: URL Validation', () => {
    it('should accept valid URL', () => {
      const result = validateBackendUrl('https://api.example.com');
      expect(result).toBe('https://api.example.com');
    });

    it('should reject undefined URL', () => {
      const result = validateBackendUrl(undefined);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('NEXT_PUBLIC_BACKEND_URL is not set')
      );
    });

    it('should reject empty string URL', () => {
      const result = validateBackendUrl('');
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('NEXT_PUBLIC_BACKEND_URL is empty')
      );
    });

    it('should reject invalid URL format', () => {
      const result = validateBackendUrl('not-a-url');
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('NEXT_PUBLIC_BACKEND_URL is not a valid URL')
      );
    });
  });

  describe('Test 10: Data Normalization', () => {
    it('should pass through valid data unchanged', () => {
      const validData = {
        totalCrosswalks: 1500,
        signalInstallationRate: 75.5,
        riskIndex: 42.3,
        safetyIndex: 85.2,
      };

      const result = normalizeKpiPayload(validData);
      expect(result).toEqual(validData);
    });

    it('should default missing fields to 0', () => {
      const partialData = {
        totalCrosswalks: 1500,
      };

      const result = normalizeKpiPayload(partialData);
      expect(result.totalCrosswalks).toBe(1500);
      expect(result.signalInstallationRate).toBe(0);
      expect(result.riskIndex).toBe(0);
      expect(result.safetyIndex).toBe(0);
    });

    it('should replace NaN with 0', () => {
      const invalidData = {
        totalCrosswalks: NaN,
        signalInstallationRate: 75.5,
        riskIndex: 42.3,
        safetyIndex: 85.2,
      };

      const result = normalizeKpiPayload(invalidData);
      expect(result.totalCrosswalks).toBe(0);
    });

    it('should replace Infinity with 0', () => {
      const invalidData = {
        totalCrosswalks: Infinity,
        signalInstallationRate: 75.5,
        riskIndex: 42.3,
        safetyIndex: 85.2,
      };

      const result = normalizeKpiPayload(invalidData);
      expect(result.totalCrosswalks).toBe(0);
    });

    it('should convert string numbers to numbers', () => {
      const stringData = {
        totalCrosswalks: '1500' as any,
        signalInstallationRate: '75.5' as any,
        riskIndex: '42.3' as any,
        safetyIndex: '85.2' as any,
      };

      const result = normalizeKpiPayload(stringData);
      expect(result.totalCrosswalks).toBe(1500);
      expect(result.signalInstallationRate).toBe(75.5);
    });
  });
});
