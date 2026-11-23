import { describe, expect, it } from 'vitest';
import { seedTxs } from '../data/seed';
import { addMonths, applyFilters, byCategory, money, monthlySeries, parseAmount, toCsv, totals } from './ledger';
import type { Tx } from '../types';

const today = '2026-11-23';
const txs = seedTxs(today);

describe('months', () => {
  it('shifts across year boundaries', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2025-12', 1)).toBe('2026-01');
    expect(addMonths('2026-11', -11)).toBe('2025-12');
  });
});

describe('totals and grouping', () => {
  const sample: Tx[] = [
    { id: 'a', title: 'Pay', amount: 1000, type: 'income', category: 'Salary', date: '2026-11-01' },
    { id: 'b', title: 'Rent', amount: 400, type: 'expense', category: 'Housing', date: '2026-11-02' },
    { id: 'c', title: 'Food', amount: 100, type: 'expense', category: 'Food', date: '2026-11-03' },
    { id: 'd', title: 'Food', amount: 50, type: 'expense', category: 'Food', date: '2026-10-03' },
  ];
  it('sums income, expense and balance', () => {
    expect(totals(sample)).toEqual({ income: 1000, expense: 550, balance: 450 });
  });
  it('groups expenses by category, largest first, ignoring income', () => {
    expect(byCategory(sample)).toEqual([
      { category: 'Housing', value: 400 },
      { category: 'Food', value: 150 },
    ]);
  });
  it('builds a monthly series, oldest first, with empty months as zero', () => {
    const s = monthlySeries(sample, '2026-11', 3);
    expect(s.map((m) => m.key)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(s[0]).toMatchObject({ income: 0, expense: 0 });
    expect(s[2]).toMatchObject({ income: 1000, expense: 500 });
  });
});

describe('filters, csv and input', () => {
  it('filters by month, type and text, newest first', () => {
    const list = applyFilters(txs, { month: '2026-11', type: 'expense', query: 'groc' });
    expect(list.length).toBe(2);
    expect(list.every((t) => t.type === 'expense' && t.date.startsWith('2026-11'))).toBe(true);
    expect(list[0]!.date > list[1]!.date).toBe(true);
  });
  it('never creates future transactions in the seed', () => {
    expect(txs.every((t) => t.date <= today)).toBe(true);
  });
  it('escapes csv cells', () => {
    const csv = toCsv([{ id: 'x', title: 'Dinner, "late"', amount: 12.5, type: 'expense', category: 'Food', date: '2026-11-01' }]);
    expect(csv.split('\n')[1]).toBe('2026-11-01,"Dinner, ""late""",Food,expense,12.50');
  });
  it('parses amounts', () => {
    expect(parseAmount('1,234.567')).toBe(1234.57);
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
  });
  it('formats money', () => {
    expect(money(1234.5)).toBe('$1,234.50');
    expect(money(-20, true)).toBe('-$20.00');
    expect(money(20, true)).toBe('+$20.00');
  });
});
