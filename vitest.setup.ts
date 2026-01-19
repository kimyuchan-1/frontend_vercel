// Setup file for vitest
// This runs before each test file
import { afterEach } from 'vitest';

// Store original environment variables
const originalEnv = { ...process.env };

// Reset environment variables after each test
afterEach(() => {
  // Restore original environment
  process.env = { ...originalEnv };
});
