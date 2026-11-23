import { addMonths } from '../lib/ledger';
import type { Category, Tx, TxType } from '../types';

type Row = [day: number, title: string, amount: number, type: TxType, category: Category];

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Demo data for the 4 months ending at the month of `today` (YYYY-MM-DD). */
export function seedTxs(today: string): Tx[] {
  const end = today.slice(0, 7);
  const out: Tx[] = [];
  for (let back = 3; back >= 0; back--) {
    const month = addMonths(end, -back);
    const w = back * 37; // small deterministic variation per month
    const rows: Row[] = [
      [1, 'Salary', 4200, 'income', 'Salary'],
      [9, 'Design project', 650 + w, 'income', 'Freelance'],
      [2, 'Rent', 1350, 'expense', 'Housing'],
      [4, 'Groceries', r2(142.3 + w / 3), 'expense', 'Food'],
      [11, 'Groceries', r2(118.75 + w / 4), 'expense', 'Food'],
      [6, 'Metro pass', 64, 'expense', 'Transport'],
      [13, 'Pharmacy', r2(38.2 + w / 5), 'expense', 'Health'],
      [15, 'Cinema and dinner', r2(72.5 + w / 2), 'expense', 'Fun'],
      [18, 'Running shoes', r2(96 + w / 3), 'expense', 'Shopping'],
    ];
    for (const [day, title, amount, type, category] of rows) {
      const date = `${month}-${String(day).padStart(2, '0')}`;
      if (date > today) continue; // nothing in the future
      out.push({ id: `seed_${out.length + 1}`, title, amount, type, category, date });
    }
  }
  return out;
}
