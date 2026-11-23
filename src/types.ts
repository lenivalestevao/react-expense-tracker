export type TxType = 'income' | 'expense';

export const CATEGORIES = ['Salary', 'Freelance', 'Housing', 'Food', 'Transport', 'Health', 'Fun', 'Shopping'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Tx {
  id: string;
  title: string;
  /** Always positive; the sign comes from the type. */
  amount: number;
  type: TxType;
  category: Category;
  /** ISO date (YYYY-MM-DD). */
  date: string;
}

export interface Filters {
  /** Month key (YYYY-MM) or "all". */
  month: string;
  type: TxType | 'all';
  query: string;
}
