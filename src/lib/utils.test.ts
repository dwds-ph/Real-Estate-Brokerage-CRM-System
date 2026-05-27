import { describe, it, expect } from 'vitest';
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  getLeadStatusColor,
  getScoreColor,
  getListingStatusColor,
} from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });
});

describe('formatCurrency', () => {
  it('formats PHP currency', () => {
    const result = formatCurrency(1500000);
    expect(result).toContain('1,500,000');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0');
  });

  it('handles decimals', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234.56');
  });
});

describe('formatDate', () => {
  it('formats a timestamp', () => {
    const date = new Date(2025, 0, 15).getTime();
    const result = formatDate(date);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });
});

describe('formatDateTime', () => {
  it('includes time in output', () => {
    const date = new Date(2025, 5, 15, 14, 30).getTime();
    const result = formatDateTime(date);
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });
});

describe('timeAgo', () => {
  it('returns "just now" for recent timestamps', () => {
    expect(timeAgo(Date.now())).toBe('just now');
  });

  it('returns minutes for recent times', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(timeAgo(fiveMinAgo)).toMatch(/\d+m/);
  });

  it('returns hours for older times', () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    expect(timeAgo(twoHoursAgo)).toMatch(/\d+h/);
  });
});

describe('getLeadStatusColor', () => {
  it('returns correct color for each status', () => {
    expect(getLeadStatusColor('new')).toContain('blue');
    expect(getLeadStatusColor('contacted')).toContain('yellow');
    expect(getLeadStatusColor('viewed')).toContain('purple');
    expect(getLeadStatusColor('negotiating')).toContain('orange');
    expect(getLeadStatusColor('closed')).toContain('green');
    expect(getLeadStatusColor('lost')).toContain('red');
  });
});

describe('getScoreColor', () => {
  it('returns correct color for each score', () => {
    expect(getScoreColor('hot')).toContain('red');
    expect(getScoreColor('warm')).toContain('yellow');
    expect(getScoreColor('cold')).toContain('blue');
  });
});

describe('getListingStatusColor', () => {
  it('returns correct color for each status', () => {
    expect(getListingStatusColor('available')).toContain('green');
    expect(getListingStatusColor('under-option')).toContain('yellow');
    expect(getListingStatusColor('sold')).toContain('gray');
    expect(getListingStatusColor('rented')).toContain('blue');
    expect(getListingStatusColor('off-market')).toContain('red');
  });
});
