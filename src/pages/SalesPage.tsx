import { useState } from 'react';
import { useCurrencyStore, useUIStore } from '../store';
import { useDataStore, generateDocNumber } from '../store/dataStore';
import type { SalesOrder } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { SALES_ORDER_FIELDS } from '../lib/recordFields';

export default function SalesPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
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

  const filtered = salesOrders.filter((so) => {
    const q = search.toLowerCase();
    const matchesSearch =
      so.customer.toLowerCase().includes(q) ||
      (so.number || so.id).toLowerCase().includes(q) ||
      so.salesperson.toLowerCase().includes(q);
    const matchesStatus = status === 'all' || so.status === status;
    return matchesSearch && matchesStatus;
  });

  const confirmedRev = salesOrders
    .filter((so) => ['Confirmed', 'Invoiced', 'Done'].includes(so.status))
    .reduce((a, b) => a + Number(b.total), 0);
  const openQuotes = salesOrders
    .filter((so) => so.status === 'Draft')
    .reduce((a, b) => a + Number(b.total), 0);
  const ordersToInvoice = salesOrders.filter((so) => so.status === 'Confirmed').length;

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
    <div className="fade-in">
      <PageHeader
        title="Sales Orders"
        subtitle="Track and manage customer orders and quotations."
        actionLabel="New order"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-emerald stagger-1">
          <div className="kpi-label">Confirmed Revenue</div>
          <div className="kpi-value">{formatMoney(confirmedRev)}</div>
          <div className="kpi-change">Confirmed/Invoiced/Done</div>
        </div>
        <div className="card kpi-card kpi-cyan stagger-2">
          <div className="kpi-label">Open Quotations</div>
          <div className="kpi-value">{formatMoney(openQuotes)}</div>
          <div className="kpi-change">Draft orders</div>
        </div>
        <div className="card kpi-card kpi-blue stagger-3">
          <div className="kpi-label">Orders to Invoice</div>
          <div className="kpi-value">{ordersToInvoice}</div>
          <div className="kpi-change">Awaiting invoice</div>
        </div>
      </div>

      <div className="card">
        {salesOrders.length > 0 && (
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <input className="tinput" placeholder="Search orders…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
              <select className="tinput select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
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
                  <th>Order #</th><th>Date</th><th>Customer</th><th>Salesperson</th><th>Total</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((so) => (
                  <tr key={so.id}>
                    <td className="font-semibold">{so.number || so.id}</td>
                    <td>{so.date || '—'}</td>
                    <td className="font-semibold">{so.customer}</td>
                    <td>{so.salesperson || '—'}</td>
                    <td className="font-semibold">{formatMoney(so.total)}</td>
                    <td>
                      <span className={`badge ${
                        so.status === 'Confirmed' ? 'badge-success' :
                        so.status === 'Invoiced' || so.status === 'Done' ? 'badge-info' :
                        so.status === 'Cancelled' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {so.status}
                      </span>
                    </td>
                    <td><RowActions onEdit={() => openEdit(so)} onDelete={() => setDeleting(so)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }} className="text-muted">No orders match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          title="Delete order?"
          message={`“${deleting.number || deleting.id}” will be removed from your sales orders. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
