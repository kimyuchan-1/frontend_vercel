// Setup file for vitest
// This runs before each test file
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Store original environment variables
const originalEnv = { ...process.env };

// Cleanup after each test
afterEach(() => {
  // Cleanup React Testing Library
  cleanup();
  
  // Restore original environment
  process.env = { ...originalEnv };
});
