import { useEffect, useRef, useState, type FormEvent } from 'react';
import { parseAmount } from '../lib/ledger';
import { CATEGORIES, type Category, type Tx, type TxType } from '../types';
import { Icon } from './ui';

interface Props {
  open: boolean;
  today: string;
  onSave: (values: Omit<Tx, 'id'>) => void;
  onClose: () => void;
}

export function TxDialog({ open, today, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<TxType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(today);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setType('expense');
      setTitle('');
      setAmount('');
      setCategory('Food');
      setDate(today);
      setErrors({});
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, today]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amount);
    const next = {
      title: title.trim() ? undefined : 'Add a description.',
      amount: value === null ? 'Enter an amount above zero.' : undefined,
    };
    setErrors(next);
    if (next.title || next.amount || value === null) return;
    onSave({ title: title.trim(), amount: value, type, category, date: date || today });
  };

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <form onSubmit={submit} noValidate>
        <header className="dialog-head">
          <h2>New transaction</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="segmented" role="group" aria-label="Type">
          {(['expense', 'income'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}>
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
        <label>
          Description
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} autoFocus />
          {errors.title && <span className="error">{errors.title}</span>}
        </label>
        <div className="row">
          <label>
            Amount
            <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!errors.amount} />
            {errors.amount && <span className="error">{errors.amount}</span>}
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <footer className="dialog-foot">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </footer>
      </form>
    </dialog>
  );
}
