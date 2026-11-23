import { CATEGORIES, type Tx } from '../types';

const KEY = 'ledger-transactions-v1';

function isTx(v: unknown): v is Tx {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Tx;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.amount === 'number' &&
    (t.type === 'income' || t.type === 'expense') &&
    (CATEGORIES as readonly string[]).includes(t.category) &&
    /^\d{4}-\d{2}-\d{2}$/.test(t.date)
  );
}

export function loadTxs(): Tx[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every(isTx) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveTxs(txs: Tx[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(txs));
  } catch {
    /* storage full or unavailable: data stays in memory */
  }
}
