import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase to avoid requiring env variables in tests
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  messaging: {},
  default: {},
}));
