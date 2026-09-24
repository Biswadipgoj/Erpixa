import { useMemo, useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Product } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput, StatusBadge } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { PRODUCT_FIELDS } from '../lib/recordFields';
import { moduleById } from '../lib/modules';
import { stagger } from '../lib/motion';
import { useMoney } from '../lib/useMoney';

export default function InventoryPage() {
  const formatMoney = useMoney();
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

  const q = search.toLowerCase();
  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchesSearch && (category === 'all' || p.category === category);
  });

  const totalValue = products.reduce((sum, p) => sum + p.qty * p.cost, 0);
  const lowStock = products.filter((p) => p.status !== 'In Stock').length;
  const outOfStock = products.filter((p) => p.status === 'Out of Stock').length;

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
    <div className="page">
      <PageHeader
        eyebrow={moduleById('inventory').group}
        icon="inventory"
        title="Inventory"
        subtitle={moduleById('inventory').blurb}
        actionLabel="New product"
        onAction={openCreate}
      />

      <Stats cols={3}>
        <Stat index={0} label="Products" value={products.length} caption={<><strong>{categories.length}</strong> categor{categories.length === 1 ? 'y' : 'ies'}</>} tone="accent" icon="box" />
        <Stat index={1} label="Low or out of stock" value={lowStock} caption={<><strong>{outOfStock}</strong> completely out</>} tone={lowStock > 0 ? 'warning' : 'neutral'} icon="alert" />
        <Stat index={2} label="Stock value" value={totalValue} format={(v) => formatMoney(v)} caption="On hand, at unit cost" tone="success" icon="warehouse" />
      </Stats>

      <section className="card section" aria-label="Products">
        {products.length > 0 && (
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, category or SKU…" />
            <select className="tinput select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="toolbar-meta">{filtered.length} of {products.length}</span>
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
                  <th>Product</th><th>SKU</th><th>Stock level</th><th className="num">On hand</th><th className="num">Price</th><th>Status</th>
                  <th className="actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  // Fill the meter against twice the reorder level so "healthy" reads as roughly half full.
                  const ceiling = Math.max(1, p.reorderLevel * 2);
                  const level = Math.min(1, p.qty / ceiling);
                  return (
                    <tr key={p.id} style={stagger(i)}>
                      <td>
                        <div className="cell-main">{p.name}</div>
                        <div className="cell-sub">{p.category || 'Uncategorised'}</div>
                      </td>
                      <td><span className="docno">{p.sku || '—'}</span></td>
                      <td>
                        <div className="meter" style={{ width: 120, ...stagger(i) }} title={`Reorder at ${p.reorderLevel}`}>
                          <i style={{ '--v': level, background: p.status === 'In Stock' ? undefined : p.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)' } as React.CSSProperties} />
                        </div>
                      </td>
                      <td className="num money">{p.qty.toLocaleString()}</td>
                      <td className="num">{formatMoney(p.price)}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="actions"><RowActions label={p.name} onEdit={() => openEdit(p)} onDelete={() => setDeleting(p)} /></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr className="empty-row"><td colSpan={7}>No products match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
          title="Delete this product?"
          message={`“${deleting.name}” will be removed from your inventory. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
