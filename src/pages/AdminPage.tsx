import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { supabase, type UserProfile } from '../lib/supabase';

const ROLE_COLORS: Record<string, string> = {
  admin: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
  manager: 'linear-gradient(135deg,#059669,#06B6D4)',
  user: 'linear-gradient(135deg,#D97706,#EA580C)',
};

const ROLE_ICONS: Record<string, string> = { admin: '👑', manager: '🎯', user: '👤' };

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'invite' | 'settings'>('users');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'user'>('user');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [search, setSearch] = useState('');

  const isConfigured = !!(import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder'));

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    if (!isConfigured) {
      // Demo data
      setUsers([
        { id: '1', email: 'admin@erpixa.com', full_name: 'Demo Admin', role: 'admin', company: 'Erpixa Corp', status: 'active', created_at: new Date().toISOString() },
        { id: '2', email: 'manager@erpixa.com', full_name: 'Sara Miles', role: 'manager', company: 'Erpixa Corp', status: 'active', created_at: new Date().toISOString() },
        { id: '3', email: 'user@erpixa.com', full_name: 'Paul Kim', role: 'user', company: 'Erpixa Corp', status: 'active', created_at: new Date().toISOString() },
      ]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as UserProfile[]);
    setLoading(false);
  }

  async function changeRole(userId: string, role: string) {
    if (!isConfigured) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as 'admin' | 'manager' | 'user' } : u));
      return;
    }
    await supabase.from('profiles').update({ role }).eq('id', userId);
    fetchUsers();
  }

  async function toggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!isConfigured) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as 'active' | 'suspended' } : u));
      return;
    }
    await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    fetchUsers();
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteMsg('');
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 1000));
      setInviteMsg(`✅ Demo: Invitation would be sent to ${inviteEmail} as ${inviteRole}.`);
      setInviteEmail('');
      setInviting(false);
      return;
    }
    // Use Supabase admin inviteUserByEmail
    const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
      data: { role: inviteRole },
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      setInviteMsg(`❌ ${error.message}`);
    } else {
      setInviteMsg(`✅ Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    }
    setInviting(false);
  }

  // Only admins can access
  if (currentUser?.role !== 'admin') {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <div style={{ fontSize: '4rem' }}>🚫</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>The Admin Panel is restricted to administrators only.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    active: users.filter(u => u.status === 'active').length,
  };

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="page-hero" style={{ '--hero-grad': 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)' } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: '2.5rem' }}>🛡️</div>
          <div>
            <h1 className="page-hero-title">Admin Control Panel</h1>
            <div className="page-hero-sub">Manage users, roles, and platform access</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, zIndex: 1 }}>
          {isConfigured ? (
            <span style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '4px 14px', color: '#6EE7B7', fontSize: '0.8rem', fontWeight: 700 }}>
              🟢 Supabase Connected
            </span>
          ) : (
            <span style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 20, padding: '4px 14px', color: '#FCD34D', fontSize: '0.8rem', fontWeight: 700 }}>
              🟡 Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Users', value: stats.total, color: 'kpi-violet', icon: '👥' },
          { label: 'Active Users', value: stats.active, color: 'kpi-emerald', icon: '✅' },
          { label: 'Admins', value: stats.admins, color: 'kpi-blue', icon: '👑' },
          { label: 'Managers', value: stats.managers, color: 'kpi-teal', icon: '🎯' },
        ].map((s, i) => (
          <div key={i} className={`card kpi-card ${s.color}`} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-value">{s.value}</div>
            <div className="kpi-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['users', 'invite', 'settings'] as const).map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'users' && '👥 Users'}
            {tab === 'invite' && '✉️ Invite User'}
            {tab === 'settings' && '⚙️ Auth Settings'}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Platform Users</h3>
            <input
              className="tinput" style={{ width: 240 }}
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ '--th-grad': 'linear-gradient(135deg,#7C3AED,#4F46E5)' } as React.CSSProperties}>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading users…</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-md" style={{ background: ROLE_COLORS[u.role], color: '#fff', fontSize: '0.8rem' }}>
                          {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{u.full_name}</div>
                          {u.id === currentUser?.id && <div style={{ fontSize: '0.7rem', color: 'var(--violet-600)', fontWeight: 700 }}>You</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u.email}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1rem' }}>{ROLE_ICONS[u.role]}</span>
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          disabled={u.id === currentUser?.id}
                          style={{
                            background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
                            borderRadius: 8, padding: '4px 8px', fontSize: '0.8rem', fontWeight: 700,
                            cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                            color: u.role === 'admin' ? 'var(--violet-600)' : u.role === 'manager' ? 'var(--emerald-600)' : 'var(--amber-600)',
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="user">User</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status === 'active' ? '● Active' : '○ Suspended'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {u.id !== currentUser?.id && (
                        <button
                          className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleStatus(u.id, u.status)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Tab */}
      {activeTab === 'invite' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Invite a User</h3></div>
            <div className="card-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.875rem', lineHeight: 1.6 }}>
                Invite someone to join your platform. They will receive an email with a secure sign-up link. <strong>Public sign-up is disabled</strong> — only invited users can join.
              </p>
              <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-wrap">
                  <span className="input-label">Email Address</span>
                  <input type="email" className="tinput" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                </div>
                <div className="input-wrap">
                  <span className="input-label">Assign Role</span>
                  <select className="tinput select" value={inviteRole} onChange={e => setInviteRole(e.target.value as 'admin' | 'manager' | 'user')}>
                    <option value="user">👤 User — Standard access</option>
                    <option value="manager">🎯 Manager — Team management</option>
                    <option value="admin">👑 Admin — Full access</option>
                  </select>
                </div>
                {inviteMsg && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, fontSize: '0.875rem',
                    background: inviteMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${inviteMsg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: inviteMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {inviteMsg}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={inviting}>
                  {inviting ? 'Sending…' : '✉️ Send Invitation'}
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Role Permissions</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { role: 'admin', icon: '👑', color: 'var(--violet-600)', perms: ['Full platform access', 'User management', 'Invite & suspend users', 'Change roles', 'View admin panel', 'All module access'] },
                { role: 'manager', icon: '🎯', color: 'var(--emerald-600)', perms: ['All module access', 'Create & edit records', 'View team data', 'Cannot manage users'] },
                { role: 'user', icon: '👤', color: 'var(--amber-600)', perms: ['Read access to assigned modules', 'Create own records', 'Cannot delete', 'Cannot manage users'] },
              ].map(({ role, icon, color, perms }) => (
                <div key={role} style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'capitalize', color }}>
                    <span>{icon}</span> {role}
                  </div>
                  {perms.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color }}>✓</span> {p}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Auth Configuration</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Email/Password Login', enabled: true, icon: '📧' },
                { label: 'Google OAuth', enabled: isConfigured, icon: '🔵' },
                { label: 'Public Sign-Up', enabled: false, icon: '🚫' },
                { label: 'Email Invitations', enabled: true, icon: '✉️' },
                { label: 'Session Persistence', enabled: true, icon: '🔐' },
              ].map(({ label, enabled, icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</span>
                  </div>
                  <span className={`badge ${enabled ? 'badge-success' : 'badge-danger'}`}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
              {!isConfigured && (
                <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--amber-600)', lineHeight: 1.6 }}>
                  🔧 Follow the <strong>SETUP_GUIDE.md</strong> to connect Supabase and enable all auth features.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Supabase Connection</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: isConfigured ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', borderRadius: 12, border: `1.5px solid ${isConfigured ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConfigured ? 'var(--success)' : 'var(--warning)', boxShadow: `0 0 8px ${isConfigured ? 'var(--success)' : 'var(--warning)'}` }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isConfigured ? 'var(--success)' : 'var(--warning)' }}>
                    {isConfigured ? 'Connected to Supabase' : 'Demo Mode — Not Connected'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {isConfigured ? import.meta.env.VITE_SUPABASE_URL : 'Configure .env to connect'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 12, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Quick Setup Checklist</strong><br/>
                <span style={{ color: isConfigured ? 'var(--success)' : 'var(--text-disabled)' }}>
                  {isConfigured ? '✅' : '□'} Set VITE_SUPABASE_URL in .env
                </span><br/>
                <span style={{ color: isConfigured ? 'var(--success)' : 'var(--text-disabled)' }}>
                  {isConfigured ? '✅' : '□'} Set VITE_SUPABASE_ANON_KEY in .env
                </span><br/>
                □ Run schema.sql in Supabase SQL Editor<br/>
                □ Enable Google OAuth in Supabase Dashboard<br/>
                □ Deploy to Vercel with env vars
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
