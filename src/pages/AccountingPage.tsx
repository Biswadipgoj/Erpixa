import { useState } from 'react';
import { useCurrencyStore, useUIStore } from '../store';
import { useDataStore, generateDocNumber } from '../store/dataStore';
import type { Invoice } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { INVOICE_FIELDS } from '../lib/recordFields';

export default function AccountingPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const invoices = useDataStore((s) => s.invoices);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch = inv.customer.toLowerCase().includes(q) || inv.number.toLowerCase().includes(q);
    const matchesPayment = payment === 'all' || inv.payment === payment;
    return matchesSearch && matchesPayment;
  });

  const thisMonth = new Date().toISOString().slice(0, 7);
  const unpaidInvoices = invoices.filter((i) => i.payment !== 'Paid');
  const overdueInvoices = invoices.filter((i) => i.payment === 'Overdue');
  const outstanding = unpaidInvoices.reduce((a, i) => a + i.amount, 0);
  const overdue = overdueInvoices.reduce((a, i) => a + i.amount, 0);
  const paidThisMonth = invoices
    .filter((i) => i.payment === 'Paid' && i.date.slice(0, 7) === thisMonth)
    .reduce((a, i) => a + i.amount, 0);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (inv: Invoice) => { setEditing(inv); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('invoices', editing.id, values);
      addToast({ message: 'Invoice updated.', type: 'success' });
    } else {
      await addRecord('invoices', { ...values, number: generateDocNumber('INV') });
      addToast({ message: 'Invoice added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('invoices', deleting.id);
      addToast({ message: 'Invoice deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the invoice.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    customer: editing.customer, date: editing.date, due: editing.due,
    amount: editing.amount, status: editing.status, payment: editing.payment,
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Accounting"
        subtitle="Manage invoices, bills, and track your financial health."
        actionLabel="New invoice"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-blue stagger-1">
          <div className="kpi-label">Total Outstanding</div>
          <div className="kpi-value">{formatMoney(outstanding)}</div>
          <div className="kpi-change">Across {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length === 1 ? '' : 's'}</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-2">
          <div className="kpi-label">Paid This Month</div>
          <div className="kpi-value">{formatMoney(paidThisMonth)}</div>
          <div className="kpi-change">Collected in {thisMonth}</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-3">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value">{formatMoney(overdue)}</div>
          <div className="kpi-change">{overdueInvoices.length} invoice{overdueInvoices.length === 1 ? '' : 's'} past due</div>
        </div>
      </div>

      <div className="card">
        {invoices.length > 0 && (
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <input className="tinput" placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
              <select className="tinput select" style={{ maxWidth: 150 }} value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option value="all">All payments</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        )}

        {invoices.length === 0 ? (
          <EmptyState
            icon="accounting"
            title="No invoices yet"
            message="Create your first invoice to start tracking receivables and payments."
            actionLabel="New invoice"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th><th>Date</th><th>Customer</th><th>Due date</th><th>Amount</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-semibold">{inv.number || '—'}</td>
                    <td>{inv.date || '—'}</td>
                    <td className="font-semibold">{inv.customer}</td>
                    <td>{inv.due || '—'}</td>
                    <td className="font-semibold">{formatMoney(inv.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`badge ${inv.status === 'Posted' ? 'badge-soft-primary' : inv.status === 'Cancelled' ? 'badge-danger' : 'badge-neutral'}`}>
                          {inv.status}
                        </span>
                        {inv.payment === 'Paid' && <span className="badge badge-success">Paid</span>}
                        {inv.payment === 'Overdue' && <span className="badge badge-danger">Overdue</span>}
                        {inv.payment === 'Unpaid' && <span className="badge badge-warning">Unpaid</span>}
                      </div>
                    </td>
                    <td><RowActions onEdit={() => openEdit(inv)} onDelete={() => setDeleting(inv)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }} className="text-muted">No invoices match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit invoice' : 'New invoice'}
          submitLabel={editing ? 'Save changes' : 'Add invoice'}
          fields={INVOICE_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete invoice?"
          message={`Invoice “${deleting.number || deleting.customer}” will be removed from your accounts. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
