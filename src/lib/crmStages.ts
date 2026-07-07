// Canonical CRM pipeline stages — the single source of truth shared by the
// CRM board, the assistant panel, and the database CHECK constraint
// (see supabase/schema.sql). Lead rows store `stage` as one of these ids.
export interface CrmStage {
  id: string;
  name: string;
  color: string;
  probability: number;
}

export const CRM_STAGES: CrmStage[] = [
  { id: 'new',         name: 'New',         color: '#6366F1', probability: 10 },
  { id: 'qualified',   name: 'Qualified',   color: '#0891B2', probability: 30 },
  { id: 'proposal',    name: 'Proposal',    color: '#B45309', probability: 60 },
  { id: 'negotiation', name: 'Negotiation', color: '#BE185D', probability: 80 },
  { id: 'won',         name: 'Won',         color: '#059669', probability: 100 },
  { id: 'lost',        name: 'Lost',        color: '#DC2626', probability: 0 },
];

export const CRM_STAGE_IDS = CRM_STAGES.map((s) => s.id);

export const stageById = (id: string): CrmStage | undefined =>
  CRM_STAGES.find((s) => s.id === id);
