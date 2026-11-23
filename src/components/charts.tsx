import { money } from '../lib/ledger';
import type { Category } from '../types';
import { CATEGORY_COLORS } from './ui';

interface Slice {
  category: Category;
  value: number;
}

/** Donut chart of spending by category, with the total in the middle. */
export function Donut({ data, size = 180 }: { data: Slice[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Spending by category, total ${money(total)}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={22} />
      {total > 0 &&
        data.map((d) => {
          const len = (d.value / total) * c;
          const el = (
            <circle
              key={d.category}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={CATEGORY_COLORS[d.category]}
              strokeWidth={22}
              strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${d.category}: ${money(d.value)}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      <text x="50%" y={size / 2 - 2} textAnchor="middle" fontSize="12" fill="var(--muted)">
        Spent
      </text>
      <text x="50%" y={size / 2 + 20} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text)">
        {money(total)}
      </text>
    </svg>
  );
}

interface Month {
  key: string;
  label: string;
  income: number;
  expense: number;
}

/** Grouped bars: income and expense for each month. */
export function MonthBars({ data, height = 180 }: { data: Month[]; height?: number }) {
  const width = 420;
  const pad = { t: 10, b: 26, l: 8, r: 8 };
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const innerH = height - pad.t - pad.b;
  const step = (width - pad.l - pad.r) / data.length;
  const bw = Math.min(26, step / 3);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Income and expenses per month">
      <line x1={pad.l} x2={width - pad.r} y1={pad.t + innerH} y2={pad.t + innerH} stroke="var(--line)" />
      {data.map((d, i) => {
        const cx = pad.l + step * i + step / 2;
        return (
          <g key={d.key}>
            <rect x={cx - bw - 2} y={y(d.income)} width={bw} height={pad.t + innerH - y(d.income)} rx={4} fill="var(--income)">
              <title>{`${d.label} income: ${money(d.income)}`}</title>
            </rect>
            <rect x={cx + 2} y={y(d.expense)} width={bw} height={pad.t + innerH - y(d.expense)} rx={4} fill="var(--expense)">
              <title>{`${d.label} expenses: ${money(d.expense)}`}</title>
            </rect>
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="12" fill="var(--muted)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
