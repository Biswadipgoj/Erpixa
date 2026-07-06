import { useState } from 'react';
import { useCurrencyStore } from '../store';
import { useDataStore } from '../store/dataStore';

const CRM_STAGES = [
  { id: 'new',        name: 'New',         color: '#6366F1', probability: 10 },
  { id: 'qualified',  name: 'Qualified',   color: '#06B6D4', probability: 30 },
  { id: 'proposal',   name: 'Proposal',    color: '#F59E0B', probability: 60 },
  { id: 'negotiation',name: 'Negotiation', color: '#EC4899', probability: 80 },
  { id: 'won',        name: 'Won',         color: '#10B981', probability: 100 },
  { id: 'lost',       name: 'Lost',        color: '#EF4444', probability: 0 },
];

export default function CRMPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const crmStages = CRM_STAGES;
  const crmLeads = useDataStore((s) => s.leads);
  const [search, setSearch] = useState('');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Aurora Page Hero */}
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-crm)', marginBottom: 'var(--s4)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">CRM Pipeline</h1>
          <div className="page-hero-sub">Manage your active leads and opportunities.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--violet-600)' }}>+ New Lead</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input 
          className="tinput" 
          placeholder="Search leads..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <select className="tinput select" style={{ maxWidth: 150 }}>
          <option>All Pipelines</option>
          <option>Direct Sales</option>
          <option>Partners</option>
        </select>
      </div>

      <div className="kanban-board" style={{ flex: 1 }}>
        {crmStages.map(stage => {
          const stageLeads = crmLeads.filter(l => l.stage === stage.id && l.name.toLowerCase().includes(search.toLowerCase()));
          const stageTotal = stageLeads.reduce((acc, l) => acc + l.revenue, 0);

          return (
            <div key={stage.id} className="kanban-column stagger-1">
              <div className="kanban-col-header">
                <div>
                  <div className="kanban-col-title" style={{ color: stage.color }}>{stage.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatMoney(stageTotal)} · {stage.probability}% prob
                  </div>
                </div>
                <div className="kanban-col-count">{stageLeads.length}</div>
              </div>

              <div className="kanban-cards">
                {stageLeads.map(lead => (
                  <div key={lead.id} className="kanban-card">
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>
                      {lead.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      {lead.partner}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatMoney(lead.revenue)}
                      </span>
                      <div className="avatar avatar-sm" style={{ background: 'var(--grad-aurora)', color: '#fff' }}>
                        {lead.user}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                      <span className={`badge ${lead.tag === 'Hot' ? 'badge-danger' : lead.tag === 'Warm' ? 'badge-warning' : 'badge-soft-primary'}`}>
                        {lead.tag}
                      </span>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: '0.8125rem', border: '1.5px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
                    No leads here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
