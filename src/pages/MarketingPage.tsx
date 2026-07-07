import { useState } from 'react';
import { useCurrencyStore, useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Campaign } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { CAMPAIGN_FIELDS } from '../lib/recordFields';

const STATUS_BADGE: Record<string, string> = {
  Active: 'badge-success',
  Paused: 'badge-warning',
  Completed: 'badge-neutral',
  Draft: 'badge-soft-primary',
};

export default function MarketingPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const campaigns = useDataStore((s) => s.campaigns);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = campaigns.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || c.channel.toLowerCase().includes(q);
    const matchesStatus = status === 'all' || c.status === status;
    return matchesSearch && matchesStatus;
  });

  const activeCount = campaigns.filter((c) => c.status === 'Active').length;
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsGenerated, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Campaign) => { setEditing(c); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('campaigns', editing.id, values);
      addToast({ message: 'Campaign updated.', type: 'success' });
    } else {
      await addRecord('campaigns', values);
      addToast({ message: 'Campaign added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('campaigns', deleting.id);
      addToast({ message: 'Campaign deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the campaign.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    name: editing.name, channel: editing.channel, status: editing.status,
    budget: editing.budget, spent: editing.spent, leads_generated: editing.leadsGenerated,
    start_date: editing.startDate, end_date: editing.endDate,
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Marketing"
        subtitle="Plan campaigns, track spend, and measure lead generation."
        actionLabel="New campaign"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-pink stagger-1">
          <div className="kpi-label">Active Campaigns</div>
          <div className="kpi-value">{activeCount}</div>
          <div className="kpi-change">{campaigns.length} total</div>
        </div>
        <div className="card kpi-card kpi-purple stagger-2">
          <div className="kpi-label">Leads Generated</div>
          <div className="kpi-value">{totalLeads}</div>
          <div className="kpi-change">Across all campaigns</div>
        </div>
        <div className="card kpi-card kpi-blue stagger-3">
          <div className="kpi-label">Total Spend</div>
          <div className="kpi-value">{formatMoney(totalSpend)}</div>
          <div className="kpi-change">Campaign budget used</div>
        </div>
      </div>

      <div className="card">
        {campaigns.length > 0 && (
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <input className="tinput" placeholder="Search campaigns…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
              <select className="tinput select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
        )}

        {campaigns.length === 0 ? (
          <EmptyState
            icon="megaphone"
            title="No campaigns yet"
            message="Create your first campaign to track spend and lead generation."
            actionLabel="New campaign"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th><th>Channel</th><th>Status</th><th>Budget</th><th>Spent</th><th>Leads</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.name}</td>
                    <td>{c.channel || '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[c.status] ?? 'badge-neutral'}`}>{c.status}</span>
                    </td>
                    <td className="font-semibold">{formatMoney(c.budget)}</td>
                    <td className="font-semibold">{formatMoney(c.spent)}</td>
                    <td className="font-semibold">{c.leadsGenerated}</td>
                    <td><RowActions onEdit={() => openEdit(c)} onDelete={() => setDeleting(c)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }} className="text-muted">No campaigns match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit campaign' : 'New campaign'}
          submitLabel={editing ? 'Save changes' : 'Add campaign'}
          fields={CAMPAIGN_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete campaign?"
          message={`“${deleting.name}” will be removed from your marketing records. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
