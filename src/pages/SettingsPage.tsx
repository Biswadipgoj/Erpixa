import { useMemo, useState } from 'react';
import { useAuthStore, useUIStore } from '../store';
import { listTimezones } from '../lib/businessTypes';

export default function SettingsPage() {
  const { user, organization, orgRole, updateOrganization, updateProfile, resetPassword } = useAuthStore();
  const { theme, setTheme, addToast } = useUIStore();
  const timezones = useMemo(listTimezones, []);

  const [companyName, setCompanyName] = useState(organization?.name ?? '');
  const [timezone, setTimezone] = useState(organization?.timezone ?? 'UTC');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const canEditOrg = orgRole === 'owner' || orgRole === 'admin';

  const saveOrg = async () => {
    if (!companyName.trim()) { addToast({ message: 'Company name can’t be empty.', type: 'warning' }); return; }
    setSavingOrg(true);
    const { error } = await updateOrganization({ name: companyName.trim(), timezone });
    setSavingOrg(false);
    addToast(error ? { message: error, type: 'danger' } : { message: 'Workspace settings saved.', type: 'success' });
  };

  const saveProfile = async () => {
    if (!fullName.trim()) { addToast({ message: 'Your name can’t be empty.', type: 'warning' }); return; }
    setSavingProfile(true);
    const { error } = await updateProfile({ full_name: fullName.trim() });
    setSavingProfile(false);
    addToast(error ? { message: error, type: 'danger' } : { message: 'Profile updated.', type: 'success' });
  };

  const sendReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error, message } = await resetPassword(user.email);
    setSendingReset(false);
    addToast(error ? { message: error, type: 'danger' } : { message: message ?? 'Password reset link sent.', type: 'success' });
  };

  const themes: { id: 'aurora' | 'midnight'; label: string }[] = [
    { id: 'aurora', label: 'Light' },
    { id: 'midnight', label: 'Dark' },
  ];

  return (
    <div className="fade-in">
      <div className="page-hero">
        <div>
          <h1 className="page-hero-title">Settings</h1>
          <div className="page-hero-sub">Manage your workspace and personal preferences.</div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header"><h3 className="card-title">Workspace</h3></div>
          <div className="card-body">
            <div className="grid-2 mb-4">
              <div className="input-wrap">
                <label className="input-label">Company name</label>
                <input className="tinput" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={!canEditOrg} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Timezone</label>
                <select className="tinput select" value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={!canEditOrg}>
                  {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="input-label">Appearance</label>
              <div className="flex gap-2 mt-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn ${theme === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTheme(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {canEditOrg ? (
              <>
                <div className="divider" />
                <div className="flex justify-end">
                  <button className="btn btn-primary" onClick={saveOrg} disabled={savingOrg}>
                    {savingOrg ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted">Only workspace owners and admins can change these settings.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Your profile</h3></div>
          <div className="card-body flex-col items-center">
            <div className="avatar" style={{ background: 'var(--accent)', color: '#fff', width: 72, height: 72, fontSize: '1.6rem', marginBottom: 12 }}>
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="input-wrap w-full mb-4">
              <label className="input-label">Full name</label>
              <input className="tinput" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="text-xs text-muted mb-4" style={{ wordBreak: 'break-all', textAlign: 'center' }}>{user?.email}</div>
            <button className="btn btn-primary w-full mb-2" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
            <button className="btn btn-secondary w-full" onClick={sendReset} disabled={sendingReset}>
              {sendingReset ? 'Sending…' : 'Send password reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
