import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, createDoc, deleteDocById } from '@/hooks/useFirestore';
import { Expense, ExpenseCategory } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'meals', label: 'Meals', icon: '🍽️' },
  { value: 'ads', label: 'Ads & Marketing', icon: '📢' },
  { value: 'misc', label: 'Miscellaneous', icon: '📦' },
];

export default function ExpensesPage() {
  const { userProfile } = useAuth();
  const { data: expenses, loading } = useCollection<Expense>('expenses', []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: 'transportation' as ExpenseCategory,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const totalByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses
      .filter((e) => (e as Expense).category === cat.value)
      .reduce((sum, e) => sum + (e as Expense).amount, 0),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    await createDoc('expenses', {
      ...form,
      amount: Number(form.amount),
      date: new Date(form.date).getTime(),
      agentId: userProfile.id,
      brokerId: userProfile.brokerId || userProfile.id,
    });
    setForm({ category: 'transportation', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await deleteDocById('expenses', id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Total: {formatCurrency(expenses.reduce((sum, e) => sum + (e as Expense).amount, 0))}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {showForm ? 'Cancel' : '+ New Expense'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {totalByCategory.map((cat) => (
          <div key={cat.value} className="rounded-lg border bg-card p-4">
            <p className="text-lg">{cat.icon}</p>
            <p className="text-xs text-muted-foreground mt-1">{cat.label}</p>
            <p className="text-lg font-semibold">{formatCurrency(cat.total)}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4 max-w-md">
          <h3 className="font-semibold">New Expense</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₱)</label>
              <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} />
          </div>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add Expense</button>
        </form>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : expenses.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">No expenses recorded</div>
      ) : (
        <div className="space-y-2">
          {[...expenses].sort((a, b) => (b as Expense).date - (a as Expense).date).map((e) => {
            const expense = e as Expense;
            const cat = CATEGORIES.find((c) => c.value === expense.category);
            return (
              <div key={expense.id} className="rounded-lg border bg-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat?.icon || '📦'}</span>
                  <div>
                    <p className="text-sm font-medium">{cat?.label || expense.category}</p>
                    {expense.note && <p className="text-xs text-muted-foreground">{expense.note}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                  <button onClick={() => handleDelete(expense.id)} className="text-xs text-red-500 hover:text-red-700">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
