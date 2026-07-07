import { useMemo, useState } from 'react';
import { useCurrencyStore, useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Product } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { PRODUCT_FIELDS } from '../lib/recordFields';

export default function InventoryPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const products = useDataStore((s) => s.products);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products],
  );

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchesCat = category === 'all' || p.category === category;
    return matchesSearch && matchesCat;
  });

  const totalValue = products.reduce((sum, p) => sum + p.qty * p.cost, 0);
  const lowStock = products.filter((p) => p.status !== 'In Stock').length;

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('products', editing.id, values);
      addToast({ message: 'Product updated.', type: 'success' });
    } else {
      await addRecord('products', values);
      addToast({ message: 'Product added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('products', deleting.id);
      addToast({ message: 'Product deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the product.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    name: editing.name, category: editing.category, sku: editing.sku,
    qty: editing.qty, reorder_level: editing.reorderLevel, price: editing.price, cost: editing.cost,
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels, valuations, and reorder points."
        actionLabel="New product"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-amber stagger-1">
          <div className="kpi-label">Total Products</div>
          <div className="kpi-value">{products.length}</div>
          <div className="kpi-change">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-2">
          <div className="kpi-label">Low / Out of Stock</div>
          <div className="kpi-value">{lowStock}</div>
          <div className="kpi-change">Needs reordering</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-3">
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-value">{formatMoney(totalValue)}</div>
          <div className="kpi-change">At unit cost</div>
        </div>
      </div>

      <div className="card">
        {products.length > 0 && (
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <input className="tinput" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
              <select className="tinput select" style={{ maxWidth: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <EmptyState
            icon="inventory"
            title="No products yet"
            message="Add your first product to start tracking stock levels and valuations."
            actionLabel="New product"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>SKU</th><th>On hand</th><th>Price</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td>{p.category || '—'}</td>
                    <td className="text-muted">{p.sku || '—'}</td>
                    <td className="font-semibold">{p.qty}</td>
                    <td className="font-semibold">{formatMoney(p.price)}</td>
                    <td>
                      <span className={`badge ${p.status === 'In Stock' ? 'badge-success' : p.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td><RowActions onEdit={() => openEdit(p)} onDelete={() => setDeleting(p)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }} className="text-muted">No products match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit product' : 'New product'}
          submitLabel={editing ? 'Save changes' : 'Add product'}
          fields={PRODUCT_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete product?"
          message={`“${deleting.name}” will be removed from your inventory. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
