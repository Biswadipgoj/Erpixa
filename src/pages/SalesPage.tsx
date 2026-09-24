import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore, generateDocNumber } from '../store/dataStore';
import type { SalesOrder } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput, StatusBadge } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { SALES_ORDER_FIELDS } from '../lib/recordFields';
import { moduleById } from '../lib/modules';
import { shortDate } from '../lib/format';
import { stagger } from '../lib/motion';
import { useMoney } from '../lib/useMoney';

const STATUSES = ['Draft', 'Confirmed', 'Invoiced', 'Done', 'Cancelled'];

export default function SalesPage() {
  const formatMoney = useMoney();
  const salesOrders = useDataStore((s) => s.salesOrders);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalesOrder | null>(null);
  const [deleting, setDeleting] = useState<SalesOrder | null>(null);
  const [busy, setBusy] = useState(false);

  const q = search.toLowerCase();
  const filtered = salesOrders.filter((so) => {
    const matchesSearch =
      so.customer.toLowerCase().includes(q) ||
      (so.number || so.id).toLowerCase().includes(q) ||
      so.salesperson.toLowerCase().includes(q);
    return matchesSearch && (status === 'all' || so.status === status);
  });

  const confirmed = salesOrders.filter((so) => ['Confirmed', 'Invoiced', 'Done'].includes(so.status));
  const confirmedRev = confirmed.reduce((a, b) => a + Number(b.total), 0);
  const drafts = salesOrders.filter((so) => so.status === 'Draft');
  const openQuotes = drafts.reduce((a, b) => a + Number(b.total), 0);
  const ordersToInvoice = salesOrders.filter((so) => so.status === 'Confirmed').length;
  const filteredTotal = filtered.reduce((a, b) => a + Number(b.total), 0);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (so: SalesOrder) => { setEditing(so); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('sales_orders', editing.id, values);
      addToast({ message: 'Order updated.', type: 'success' });
    } else {
      await addRecord('sales_orders', { ...values, number: generateDocNumber('SO') });
      addToast({ message: 'Order added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('sales_orders', deleting.id);
      addToast({ message: 'Order deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the order.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    customer: editing.customer,
    date: editing.date,
    total: editing.total,
    salesperson: editing.salesperson,
    status: editing.status,
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow={moduleById('sales').group}
        icon="sales"
        title="Sales orders"
        subtitle={moduleById('sales').blurb}
        actionLabel="New order"
        onAction={openCreate}
      />

      <Stats cols={3}>
        <Stat index={0} label="Confirmed revenue" value={confirmedRev} format={(v) => formatMoney(v)} caption={<><strong>{confirmed.length}</strong> confirmed, invoiced or done</>} tone="success" icon="trend-up" />
        <Stat index={1} label="Open quotations" value={openQuotes} format={(v) => formatMoney(v)} caption={<><strong>{drafts.length}</strong> draft order{drafts.length === 1 ? '' : 's'}</>} tone="info" icon="edit" />
        <Stat index={2} label="Ready to invoice" value={ordersToInvoice} caption="Confirmed, not yet invoiced" tone="warning" icon="receipt" />
      </Stats>

      <section className="card section" aria-label="Sales orders">
        {salesOrders.length > 0 && (
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by customer, order or salesperson…" />
            <select className="tinput select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="toolbar-meta">{filtered.length} of {salesOrders.length} · {formatMoney(filteredTotal)}</span>
          </div>
        )}

        {salesOrders.length === 0 ? (
          <EmptyState
            icon="sales"
            title="No sales orders yet"
            message="Create your first order to start tracking quotations and confirmed revenue."
            actionLabel="New order"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th><th>Customer</th><th>Date</th><th>Salesperson</th><th className="num">Total</th><th>Status</th>
                  <th className="actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((so, i) => (
                  <tr key={so.id} style={stagger(i)}>
                    <td><span className="docno">{so.number || so.id.slice(0, 8)}</span></td>
                    <td className="cell-main">{so.customer}</td>
                    <td className="muted">{shortDate(so.date)}</td>
                    <td>{so.salesperson || <span className="muted">—</span>}</td>
                    <td className="num money">{formatMoney(so.total)}</td>
                    <td><StatusBadge status={so.status} /></td>
                    <td className="actions"><RowActions label={so.number || so.customer} onEdit={() => openEdit(so)} onDelete={() => setDeleting(so)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="empty-row"><td colSpan={7}>No orders match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit order' : 'New order'}
          submitLabel={editing ? 'Save changes' : 'Add order'}
          fields={SALES_ORDER_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this order?"
          message={`“${deleting.number || deleting.id}” will be removed from your sales orders. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
