import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore, generateDocNumber } from '../store/dataStore';
import type { Invoice } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput, StatusBadge } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { INVOICE_FIELDS } from '../lib/recordFields';
import { moduleById } from '../lib/modules';
import { shortDate } from '../lib/format';
import { stagger } from '../lib/motion';
import { useMoney } from '../lib/useMoney';

export default function AccountingPage() {
  const formatMoney = useMoney();
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

  const q = search.toLowerCase();
  const filtered = invoices.filter((inv) => {
    const matchesSearch = inv.customer.toLowerCase().includes(q) || inv.number.toLowerCase().includes(q);
    return matchesSearch && (payment === 'all' || inv.payment === payment);
  });

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthName = new Date().toLocaleDateString(undefined, { month: 'long' });
  const unpaidInvoices = invoices.filter((i) => i.payment !== 'Paid');
  const overdueInvoices = invoices.filter((i) => i.payment === 'Overdue');
  const outstanding = unpaidInvoices.reduce((a, i) => a + i.amount, 0);
  const overdue = overdueInvoices.reduce((a, i) => a + i.amount, 0);
  const paidThisMonth = invoices
    .filter((i) => i.payment === 'Paid' && i.date.slice(0, 7) === thisMonth)
    .reduce((a, i) => a + i.amount, 0);
  const filteredTotal = filtered.reduce((a, i) => a + i.amount, 0);

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
    <div className="page">
      <PageHeader
        eyebrow={moduleById('accounting').group}
        icon="accounting"
        title="Accounting"
        subtitle={moduleById('accounting').blurb}
        actionLabel="New invoice"
        onAction={openCreate}
      />

      <Stats cols={3}>
        <Stat index={0} label="Outstanding" value={outstanding} format={(v) => formatMoney(v)} caption={<><strong>{unpaidInvoices.length}</strong> unpaid invoice{unpaidInvoices.length === 1 ? '' : 's'}</>} tone="warning" icon="hourglass" />
        <Stat index={1} label={`Collected in ${monthName}`} value={paidThisMonth} format={(v) => formatMoney(v)} caption="Invoices marked paid this month" tone="success" icon="check" />
        <Stat index={2} label="Overdue" value={overdue} format={(v) => formatMoney(v)} caption={<><strong>{overdueInvoices.length}</strong> past their due date</>} tone={overdue > 0 ? 'danger' : 'neutral'} icon="alert" />
      </Stats>

      <section className="card section" aria-label="Invoices">
        {invoices.length > 0 && (
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or invoice number…" />
            <select className="tinput select" value={payment} onChange={(e) => setPayment(e.target.value)} aria-label="Filter by payment">
              <option value="all">All payments</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <span className="toolbar-meta">{filtered.length} of {invoices.length} · {formatMoney(filteredTotal)}</span>
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
                  <th>Invoice</th><th>Customer</th><th>Issued</th><th>Due</th><th className="num">Amount</th><th>Status</th><th>Payment</th>
                  <th className="actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv.id} style={stagger(i)}>
                    <td><span className="docno">{inv.number || '—'}</span></td>
                    <td className="cell-main">{inv.customer}</td>
                    <td className="muted">{shortDate(inv.date)}</td>
                    <td className={inv.payment === 'Overdue' ? '' : 'muted'} style={inv.payment === 'Overdue' ? { color: 'var(--danger)', fontWeight: 500 } : undefined}>{shortDate(inv.due)}</td>
                    <td className="num money">{formatMoney(inv.amount)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      {/* Payment reads like a rubber stamp on the ledger line. */}
                      <span className={`stamp ${inv.payment.toLowerCase()}`} style={stagger(i)}>{inv.payment}</span>
                    </td>
                    <td className="actions"><RowActions label={inv.number || inv.customer} onEdit={() => openEdit(inv)} onDelete={() => setDeleting(inv)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="empty-row"><td colSpan={8}>No invoices match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
          title="Delete this invoice?"
          message={`Invoice “${deleting.number || deleting.customer}” will be removed from your accounts. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
