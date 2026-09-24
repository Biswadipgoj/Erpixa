import { useCallback, useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '../store';
import { supabase } from '../lib/supabase';
import type { OrgRole } from '../types';
import Icon from '../components/ui/Icon';
import { EmptyState, PageHeader, SearchInput } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { initialsOf } from '../lib/format';
import { stagger } from '../lib/motion';

interface Member {
  userId: string;
  role: OrgRole;
  fullName: string;
  email: string;
  status: 'active' | 'suspended';
}

const ASSIGNABLE_ROLES: OrgRole[] = ['admin', 'manager', 'member'];

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.user);
  const organization = useAuthStore((s) => s.organization);
  const orgRole = useAuthStore((s) => s.orgRole);
  const addToast = useUIStore((s) => s.addToast);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isAdmin = orgRole === 'owner' || orgRole === 'admin';

  const fetchMembers = useCallback(async () => {
    if (!organization) return;
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', organization.id);
    if (error || !rows) { setMembers([]); setLoading(false); return; }

    const ids = rows.map((r) => r.user_id as string);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, status')
      .in('id', ids);
    const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));

    setMembers(rows.map((r) => {
      const p = byId.get(r.user_id as string);
      return {
        userId: r.user_id as string,
        role: r.role as OrgRole,
        fullName: (p?.full_name as string) || '—',
        email: (p?.email as string) || '',
        status: (p?.status as 'active' | 'suspended') || 'active',
      };
    }));
    setLoading(false);
  }, [organization]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty">
            <div className="all-clear-mark" style={{ background: 'var(--sunk)', color: 'var(--ink-3)' }}><Icon name="lock" size={24} /></div>
            <div className="empty-title" style={{ marginTop: 8 }}>Access restricted</div>
            <p className="empty-msg">Team &amp; access is available to workspace owners and admins. Ask an owner to change your role.</p>
          </div>
        </div>
      </div>
    );
  }

  const changeRole = async (m: Member, role: OrgRole) => {
    if (!organization) return;
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('organization_id', organization.id)
      .eq('user_id', m.userId);
    if (error) { addToast({ message: error.message, type: 'danger' }); return; }
    setMembers((prev) => prev.map((x) => (x.userId === m.userId ? { ...x, role } : x)));
    addToast({ message: `${m.fullName} is now ${role}.`, type: 'success' });
  };

  const toggleStatus = async (m: Member) => {
    const next = m.status === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('profiles').update({ status: next }).eq('id', m.userId);
    if (error) { addToast({ message: error.message, type: 'danger' }); return; }
    setMembers((prev) => prev.map((x) => (x.userId === m.userId ? { ...x, status: next } : x)));
    addToast({ message: `${m.fullName} ${next === 'suspended' ? 'suspended' : 'reactivated'}.`, type: 'success' });
  };

  const filtered = members.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));

  const suspended = members.filter((m) => m.status === 'suspended').length;
  const admins = members.filter((m) => m.role === 'owner' || m.role === 'admin').length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Workspace"
        icon="admin"
        title="Team & access"
        subtitle={<>The people in {organization?.name ?? 'your workspace'} and what they can do.</>}
      />

      <Stats cols={3}>
        <Stat index={0} label="Members" value={members.length} caption="With access to this workspace" tone="accent" icon="hr" />
        <Stat index={1} label="Owners & admins" value={admins} caption="Can manage roles and settings" tone="info" icon="admin" />
        <Stat index={2} label="Suspended" value={suspended} caption="Signed out and blocked" tone={suspended > 0 ? 'danger' : 'neutral'} icon="lock" />
      </Stats>

      <section className="card section" aria-labelledby="members-title">
        <div className="toolbar">
          <h2 id="members-title" className="card-title" style={{ marginRight: 8 }}>Members <span className="count">{members.length}</span></h2>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
        </div>

        {loading ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true" aria-label="Loading members">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : members.length === 0 ? (
          <EmptyState icon="hr" title="No members found" message="People who join this workspace will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Member</th><th>Email</th><th>Role</th><th>Status</th><th className="actions"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const isSelf = m.userId === currentUser?.id;
                  const isOwner = m.role === 'owner';
                  return (
                    <tr key={m.userId} style={stagger(i)}>
                      <td>
                        <div className="cell-person">
                          <span className="avatar avatar-md filled" style={{ background: isOwner ? 'var(--accent)' : 'var(--ink-2)', color: isOwner ? 'var(--on-accent)' : 'var(--paper)' }} aria-hidden="true">{initialsOf(m.fullName, m.email)}</span>
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-main truncate">{m.fullName}</div>
                            {isSelf && <div className="cell-sub">That’s you</div>}
                          </div>
                        </div>
                      </td>
                      <td className="muted">{m.email}</td>
                      <td>
                        {isOwner ? (
                          <span className="badge badge-accent no-dot"><Icon name="admin" size={12} /> Owner</span>
                        ) : (
                          <select
                            className="tinput select"
                            style={{ width: 136, height: 34 }}
                            value={m.role}
                            disabled={isSelf}
                            aria-label={`Role for ${m.fullName}`}
                            onChange={(e) => changeRole(m, e.target.value as OrgRole)}
                          >
                            {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {m.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="actions">
                        {!isSelf && !isOwner && (
                          <button type="button" className={`btn btn-sm ${m.status === 'active' ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggleStatus(m)}>
                            {m.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr className="empty-row"><td colSpan={5}>No members match “{search}”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="section" style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-3)', maxWidth: '72ch', display: 'flex', gap: 8 }}>
        <Icon name="info" size={15} style={{ flexShrink: 0, marginTop: 3 }} />
        <span>Roles are enforced by row-level security in the database, not only here. Owners can’t be changed from this screen. Email invitations are coming soon and will run through a secure server function.</span>
      </p>
    </div>
  );
}
