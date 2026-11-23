import type { Category, Filters, Tx } from '../types';

export const monthKey = (iso: string): string => iso.slice(0, 7);

/** Shifts a YYYY-MM key by a number of months (negative goes back). */
export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
}

export function money(value: number, signed = false): string {
  const abs = Math.abs(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  if (!signed) return value < 0 ? `-${abs}` : abs;
  return value < 0 ? `-${abs}` : `+${abs}`;
}

export interface Totals {
  income: number;
  expense: number;
  balance: number;
}

export function totals(txs: Tx[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

/** Expense per category, largest first. Income is ignored. */
export function byCategory(txs: Tx[]): { category: Category; value: number }[] {
  const map = new Map<Category, number>();
  for (const t of txs) if (t.type === 'expense') map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  return [...map].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
}

/** Income and expense for the `count` months ending at `endKey`, oldest first. */
export function monthlySeries(txs: Tx[], endKey: string, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const key = addMonths(endKey, i - (count - 1));
    const t = totals(txs.filter((x) => monthKey(x.date) === key));
    return { key, label: monthLabel(key), income: t.income, expense: t.expense };
  });
}

export function applyFilters(txs: Tx[], f: Filters): Tx[] {
  const q = f.query.trim().toLowerCase();
  return txs
    .filter((t) => (f.month === 'all' || monthKey(t.date) === f.month) && (f.type === 'all' || t.type === f.type))
    .filter((t) => !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(txs: Tx[]): string {
  const rows = txs.map((t) => [t.date, t.title, t.category, t.type, t.amount.toFixed(2)].map(csvCell).join(','));
  return ['date,title,category,type,amount', ...rows].join('\n');
}

export const newId = (): string => `t_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Parses a user-typed amount like "1,234.50". Returns null when invalid or not positive. */
export function parseAmount(text: string): number | null {
  const n = Number(text.replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
