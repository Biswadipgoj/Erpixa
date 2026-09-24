// Canonical CRM pipeline stages — the single source of truth shared by the
// CRM board, the assistant panel, and the database CHECK constraint
// (see supabase/schema.sql). Lead rows store `stage` as one of these ids.
// `color` is a CSS value: open stages step along one ordinal ramp (they are
// ordered), while won/lost are outcomes and use the status colours.
export interface CrmStage {
  id: string;
  name: string;
  color: string;
  probability: number;
}

export const CRM_STAGES: CrmStage[] = [
  { id: 'new',         name: 'New',         color: 'var(--stage-1)', probability: 10 },
  { id: 'qualified',   name: 'Qualified',   color: 'var(--stage-2)', probability: 30 },
  { id: 'proposal',    name: 'Proposal',    color: 'var(--stage-3)', probability: 60 },
  { id: 'negotiation', name: 'Negotiation', color: 'var(--stage-4)', probability: 80 },
  { id: 'won',         name: 'Won',         color: 'var(--success)', probability: 100 },
  { id: 'lost',        name: 'Lost',        color: 'var(--danger)',  probability: 0 },
];

export const CRM_STAGE_IDS = CRM_STAGES.map((s) => s.id);

export const stageById = (id: string): CrmStage | undefined =>
  CRM_STAGES.find((s) => s.id === id);
