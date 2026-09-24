import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Campaign } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput, StatusBadge } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { CAMPAIGN_FIELDS } from '../lib/recordFields';
import { moduleById } from '../lib/modules';
import { stagger } from '../lib/motion';
import { useMoney } from '../lib/useMoney';

const STATUSES = ['Active', 'Paused', 'Completed', 'Draft'];

export default function MarketingPage() {
  const formatMoney = useMoney();
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

  const q = search.toLowerCase();
  const filtered = campaigns.filter((c) =>
    (c.name.toLowerCase().includes(q) || c.channel.toLowerCase().includes(q)) && (status === 'all' || c.status === status));

  const activeCount = campaigns.filter((c) => c.status === 'Active').length;
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsGenerated, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : null;

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
    <div className="page">
      <PageHeader
        eyebrow={moduleById('marketing').group}
        icon="marketing"
        title="Marketing"
        subtitle={moduleById('marketing').blurb}
        actionLabel="New campaign"
        onAction={openCreate}
      />

      <Stats cols={3}>
        <Stat index={0} label="Active campaigns" value={activeCount} caption={<><strong>{campaigns.length}</strong> in total</>} tone="accent" icon="megaphone" />
        <Stat index={1} label="Leads generated" value={totalLeads} caption={costPerLead === null ? 'Across all campaigns' : <><strong>{formatMoney(costPerLead)}</strong> per lead</>} tone="success" icon="crm" />
        <Stat index={2} label="Spend to date" value={totalSpend} format={(v) => formatMoney(v)} caption={<>of <strong>{formatMoney(campaigns.reduce((s, c) => s + c.budget, 0))}</strong> budgeted</>} tone="info" icon="receipt" />
      </Stats>

      <section className="card section" aria-label="Campaigns">
        {campaigns.length > 0 && (
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by campaign or channel…" />
            <select className="tinput select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="toolbar-meta">{filtered.length} of {campaigns.length}</span>
          </div>
        )}

        {campaigns.length === 0 ? (
          <EmptyState
            icon="megaphone"
            title="No campaigns yet"
            message="Create your first campaign to track spend against the leads it brings in."
            actionLabel="New campaign"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th><th>Status</th><th>Budget used</th><th className="num">Spent / budget</th><th className="num">Leads</th>
                  <th className="actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const used = c.budget > 0 ? c.spent / c.budget : 0;
                  return (
                    <tr key={c.id} style={stagger(i)}>
                      <td>
                        <div className="cell-main">{c.name}</div>
                        <div className="cell-sub">{c.channel || 'No channel'}</div>
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td style={{ minWidth: 190 }}>
                        <div className="meter-row" title={`${formatMoney(c.spent)} of ${formatMoney(c.budget)}`}>
                          <div className="meter">
                            <i style={{ '--v': Math.min(1, used), background: used > 1 ? 'var(--danger)' : undefined } as React.CSSProperties} />
                          </div>
                          <span className="num">{c.budget > 0 ? `${Math.round(used * 100)}%` : '—'}</span>
                        </div>
                      </td>
                      <td className="num">
                        <div className="money">{formatMoney(c.spent)}</div>
                        <div className="cell-sub">of {formatMoney(c.budget)}</div>
                      </td>
                      <td className="num">{c.leadsGenerated.toLocaleString()}</td>
                      <td className="actions"><RowActions label={c.name} onEdit={() => openEdit(c)} onDelete={() => setDeleting(c)} /></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr className="empty-row"><td colSpan={6}>No campaigns match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
          title="Delete this campaign?"
          message={`“${deleting.name}” will be removed from your marketing records. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
