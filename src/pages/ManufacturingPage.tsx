import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { ManufacturingOrder } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { MFG_ORDER_FIELDS } from '../lib/recordFields';

export default function ManufacturingPage() {
  const manufacturingOrders = useDataStore((s) => s.manufacturingOrders);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManufacturingOrder | null>(null);
  const [deleting, setDeleting] = useState<ManufacturingOrder | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = manufacturingOrders.filter((mo) => {
    const q = search.toLowerCase();
    const matchesSearch = mo.product.toLowerCase().includes(q) || mo.id.toLowerCase().includes(q) || mo.workcenter.toLowerCase().includes(q);
    const matchesStatus = status === 'all' || mo.status === status;
    return matchesSearch && matchesStatus;
  });

  const activeCount = manufacturingOrders.filter((m) => m.status === 'In Progress').length;
  const unitsProduced = manufacturingOrders.filter((m) => m.status === 'Done').reduce((a, m) => a + m.qty, 0);
  const plannedCount = manufacturingOrders.filter((m) => m.status === 'Planned').length;

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (mo: ManufacturingOrder) => { setEditing(mo); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('manufacturing_orders', editing.id, values);
      addToast({ message: 'Manufacturing order updated.', type: 'success' });
    } else {
      await addRecord('manufacturing_orders', values);
      addToast({ message: 'Manufacturing order added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('manufacturing_orders', deleting.id);
      addToast({ message: 'Manufacturing order deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the manufacturing order.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    product: editing.product, qty: editing.qty, bom: editing.bom,
    workcenter: editing.workcenter, scheduled: editing.scheduled, status: editing.status,
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Manufacturing"
        subtitle="Plan, execute, and track production orders."
        actionLabel="New order"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-amber stagger-1">
          <div className="kpi-label">Active Orders</div>
          <div className="kpi-value">{activeCount}</div>
          <div className="kpi-change">Currently producing</div>
        </div>
        <div className="card kpi-card kpi-teal stagger-2">
          <div className="kpi-label">Units Produced</div>
          <div className="kpi-value">{unitsProduced}</div>
          <div className="kpi-change">From completed orders</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-3">
          <div className="kpi-label">Planned Orders</div>
          <div className="kpi-value">{plannedCount}</div>
          <div className="kpi-change">Awaiting production</div>
        </div>
      </div>

      <div className="card">
        {manufacturingOrders.length > 0 && (
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <input className="tinput" placeholder="Search orders…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
              <select className="tinput select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}

        {manufacturingOrders.length === 0 ? (
          <EmptyState
            icon="manufacturing"
            title="No manufacturing orders yet"
            message="Create your first production order to plan, execute, and track manufacturing."
            actionLabel="New order"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th><th>Product</th><th>Quantity</th><th>Scheduled</th><th>Workcenter</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((mo) => (
                  <tr key={mo.id}>
                    <td className="font-semibold text-muted">{mo.id}</td>
                    <td className="font-semibold">{mo.product}</td>
                    <td className="font-semibold">{mo.qty}</td>
                    <td>{mo.scheduled || '—'}</td>
                    <td>{mo.workcenter || '—'}</td>
                    <td>
                      <span className={`badge ${
                        mo.status === 'Done' ? 'badge-success' :
                        mo.status === 'In Progress' ? 'badge-primary' :
                        mo.status === 'Cancelled' ? 'badge-danger' :
                        'badge-neutral'
                      }`}>
                        {mo.status}
                      </span>
                    </td>
                    <td><RowActions onEdit={() => openEdit(mo)} onDelete={() => setDeleting(mo)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }} className="text-muted">No manufacturing orders match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit manufacturing order' : 'New manufacturing order'}
          submitLabel={editing ? 'Save changes' : 'Add order'}
          fields={MFG_ORDER_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete manufacturing order?"
          message={`The order for “${deleting.product}” will be removed. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
