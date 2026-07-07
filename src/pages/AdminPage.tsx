import { useCallback, useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '../store';
import { supabase } from '../lib/supabase';
import type { OrgRole } from '../types';
import Icon from '../components/ui/Icon';
import { EmptyState } from '../components/ui/crud';

interface Member {
  userId: string;
  role: OrgRole;
  fullName: string;
  email: string;
  status: 'active' | 'suspended';
}

const ASSIGNABLE_ROLES: OrgRole[] = ['admin', 'manager', 'member'];

const initials = (name: string, email: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || email.slice(0, 2).toUpperCase();

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
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <div style={{ color: 'var(--text-disabled)' }}><Icon name="admin" size={40} /></div>
        <h2>Access restricted</h2>
        <p className="text-muted">The admin panel is available to workspace owners and admins only.</p>
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

  return (
    <div className="fade-in">
      <div className="page-hero">
        <div>
          <h1 className="page-hero-title">Team &amp; access</h1>
          <div className="page-hero-sub">Manage the people in {organization?.name ?? 'your workspace'} and their roles.</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Members {members.length > 0 && <span className="text-muted font-medium">· {members.length}</span>}</h3>
          <input className="tinput" style={{ width: 240 }} placeholder="Search members…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading members…</div>
        ) : members.length === 0 ? (
          <EmptyState icon="hr" title="No members found" message="Members who join this workspace will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Member</th><th>Email</th><th>Role</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isSelf = m.userId === currentUser?.id;
                  const isOwner = m.role === 'owner';
                  return (
                    <tr key={m.userId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-md" style={{ background: 'var(--accent)', color: '#fff' }}>{initials(m.fullName, m.email)}</div>
                          <div>
                            <div className="font-semibold">{m.fullName}</div>
                            {isSelf && <div className="text-xs" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>You</div>}
                          </div>
                        </div>
                      </td>
                      <td className="text-muted">{m.email}</td>
                      <td>
                        {isOwner ? (
                          <span className="badge badge-primary">Owner</span>
                        ) : (
                          <select
                            className="tinput select"
                            style={{ width: 130, height: 32 }}
                            value={m.role}
                            disabled={isSelf}
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
                      <td style={{ textAlign: 'right' }}>
                        {!isSelf && !isOwner && (
                          <button className={`btn btn-sm ${m.status === 'active' ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggleStatus(m)}>
                            {m.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted mt-4" style={{ maxWidth: 640 }}>
        Roles and access are enforced by row-level security in the database, not just here. Owners can’t be modified from this
        screen. Inviting new teammates by email is coming soon and will run through a secure server function.
      </p>
    </div>
  );
}
