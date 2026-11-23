import { useEffect, useMemo, useState } from 'react';
import { Donut, MonthBars } from './components/charts';
import { TxDialog } from './components/TxDialog';
import { CATEGORY_COLORS, Icon } from './components/ui';
import { seedTxs } from './data/seed';
import { addMonths, applyFilters, byCategory, money, monthKey, monthLabel, monthlySeries, newId, toCsv, totals } from './lib/ledger';
import { loadTxs, saveTxs } from './lib/storage';
import { useTheme } from './lib/theme';
import type { Filters, Tx } from './types';

const todayIso = () => new Date().toISOString().slice(0, 10);

function downloadCsv(txs: Tx[]) {
  const url = URL.createObjectURL(new Blob([toCsv(txs)], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const today = useMemo(todayIso, []);
  const thisMonth = monthKey(today);
  const [txs, setTxs] = useState<Tx[]>(() => loadTxs() ?? seedTxs(today));
  const [theme, toggleTheme] = useTheme();
  const [filters, setFilters] = useState<Filters>({ month: thisMonth, type: 'all', query: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => saveTxs(txs), [txs]);

  const monthOptions = useMemo(() => Array.from({ length: 6 }, (_, i) => addMonths(thisMonth, -i)), [thisMonth]);
  const inMonth = useMemo(() => txs.filter((t) => filters.month === 'all' || monthKey(t.date) === filters.month), [txs, filters.month]);
  const sum = totals(inMonth);
  const categories = byCategory(inMonth);
  const series = monthlySeries(txs, thisMonth, 6);
  const list = applyFilters(txs, filters);
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            <Icon name="wallet" size={18} />
          </span>
          <div>
            <h1>Ledger</h1>
            <p>Personal expense tracker</p>
          </div>
        </div>
        <select className="select" aria-label="Month" value={filters.month} onChange={(e) => set({ month: e.target.value })}>
          <option value="all">All time</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)} {m.slice(0, 4)}
            </option>
          ))}
        </select>
        <button type="button" className="icon-btn" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" /> Add
        </button>
      </header>

      <main className="content">
        <section className="stats" aria-label="Summary">
          <div className="stat">
            <span className="stat-label">Balance</span>
            <strong className={sum.balance < 0 ? 'neg' : ''}>{money(sum.balance)}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">
              <Icon name="up" size={14} /> Income
            </span>
            <strong className="pos">{money(sum.income)}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">
              <Icon name="down" size={14} /> Expenses
            </span>
            <strong className="neg">{money(sum.expense)}</strong>
          </div>
        </section>

        <section className="panel">
          <h2>Spending by category</h2>
          {categories.length === 0 ? (
            <p className="empty">No expenses in this period.</p>
          ) : (
            <div className="donut-wrap">
              <Donut data={categories} />
              <ul className="legend">
                {categories.map((c) => (
                  <li key={c.category}>
                    <span className="dot" style={{ background: CATEGORY_COLORS[c.category] }} />
                    {c.category}
                    <b>{money(c.value)}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Last 6 months</h2>
          <MonthBars data={series} />
          <p className="key">
            <span className="dot" style={{ background: 'var(--income)' }} /> Income <span className="dot" style={{ background: 'var(--expense)' }} /> Expenses
          </p>
        </section>

        <section className="panel wide">
          <div className="list-head">
            <h2>Transactions</h2>
            <div className="controls">
              <label className="search">
                <Icon name="search" />
                <input type="search" placeholder="Search" aria-label="Search transactions" value={filters.query} onChange={(e) => set({ query: e.target.value })} />
              </label>
              <div className="segmented" role="group" aria-label="Filter by type">
                {(['all', 'income', 'expense'] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={filters.type === t} onClick={() => set({ type: t })}>
                    {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expenses'}
                  </button>
                ))}
              </div>
              <button type="button" className="btn" onClick={() => downloadCsv(list)} disabled={list.length === 0}>
                <Icon name="download" /> CSV
              </button>
            </div>
          </div>
          {list.length === 0 ? (
            <p className="empty">No transactions match.</p>
          ) : (
            <ul className="txs">
              {list.map((t) => (
                <li key={t.id}>
                  <span className="dot big" style={{ background: CATEGORY_COLORS[t.category] }} aria-hidden="true" />
                  <div className="tx-main">
                    <span className="tx-title">{t.title}</span>
                    <span className="tx-sub">
                      {t.category} · {new Date(`${t.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </span>
                  </div>
                  <span className={t.type === 'income' ? 'pos' : 'neg'}>{money(t.type === 'income' ? t.amount : -t.amount, true)}</span>
                  <button type="button" className="icon-btn" aria-label={`Delete ${t.title}`} onClick={() => setTxs((all) => all.filter((x) => x.id !== t.id))}>
                    <Icon name="trash" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <TxDialog
        open={adding}
        today={today}
        onClose={() => setAdding(false)}
        onSave={(values) => {
          setTxs((all) => [{ id: newId(), ...values }, ...all]);
          setAdding(false);
        }}
      />
    </div>
  );
}
