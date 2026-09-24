import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { ManufacturingOrder } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput, StatusBadge } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { MFG_ORDER_FIELDS } from '../lib/recordFields';
import { moduleById } from '../lib/modules';
import { shortDate } from '../lib/format';
import { stagger } from '../lib/motion';

const STATUSES = ['Planned', 'In Progress', 'Done', 'Cancelled'];

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

  const q = search.toLowerCase();
  const filtered = manufacturingOrders.filter((mo) => {
    const matchesSearch = mo.product.toLowerCase().includes(q) || mo.id.toLowerCase().includes(q) || mo.workcenter.toLowerCase().includes(q);
    return matchesSearch && (status === 'all' || mo.status === status);
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
    <div className="page">
      <PageHeader
        eyebrow={moduleById('manufacturing').group}
        icon="manufacturing"
        title="Manufacturing"
        subtitle={moduleById('manufacturing').blurb}
        actionLabel="New order"
        onAction={openCreate}
      />

      <Stats cols={3}>
        <Stat index={0} label="In production" value={activeCount} caption="Orders running now" tone="accent" icon="factory" />
        <Stat index={1} label="Units produced" value={unitsProduced} caption="From completed orders" tone="success" icon="box" />
        <Stat index={2} label="Planned" value={plannedCount} caption="Waiting for the floor" tone="info" icon="calendar" />
      </Stats>

      <section className="card section" aria-label="Manufacturing orders">
        {manufacturingOrders.length > 0 && (
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by product, reference or workcenter…" />
            <select className="tinput select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="toolbar-meta">{filtered.length} of {manufacturingOrders.length}</span>
          </div>
        )}

        {manufacturingOrders.length === 0 ? (
          <EmptyState
            icon="manufacturing"
            title="No manufacturing orders yet"
            message="Create your first production order to plan, run and track manufacturing."
            actionLabel="New order"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th><th>Product</th><th className="num">Quantity</th><th>Scheduled</th><th>Workcenter</th><th>Status</th>
                  <th className="actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((mo, i) => (
                  <tr key={mo.id} style={stagger(i)}>
                    <td><span className="docno" title={mo.id}>MO-{mo.id.slice(0, 6).toUpperCase()}</span></td>
                    <td>
                      <div className="cell-main">{mo.product}</div>
                      {mo.bom && <div className="cell-sub">BOM {mo.bom}</div>}
                    </td>
                    <td className="num money">{mo.qty.toLocaleString()}</td>
                    <td className="muted">{shortDate(mo.scheduled)}</td>
                    <td>{mo.workcenter || <span className="muted">—</span>}</td>
                    <td><StatusBadge status={mo.status} /></td>
                    <td className="actions"><RowActions label={mo.product} onEdit={() => openEdit(mo)} onDelete={() => setDeleting(mo)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="empty-row"><td colSpan={7}>No manufacturing orders match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
          title="Delete this order?"
          message={`The order for “${deleting.product}” will be removed. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
