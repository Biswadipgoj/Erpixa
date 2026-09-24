import { useMemo, useState } from 'react';
import { useAuthStore, useUIStore, useCurrencyStore, type ThemePref } from '../store';
import { listTimezones } from '../lib/businessTypes';
import { initialsOf, shortDate } from '../lib/format';
import { MODULES } from '../lib/modules';
import { PageHeader } from '../components/ui/crud';
import Icon from '../components/ui/Icon';

const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'Match system' },
];

export default function SettingsPage() {
  const { user, organization, orgRole, updateOrganization, updateProfile, resetPassword } = useAuthStore();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const addToast = useUIStore((s) => s.addToast);
  const currency = useCurrencyStore((s) => s.currency);
  const timezones = useMemo(listTimezones, []);

  const [companyName, setCompanyName] = useState(organization?.name ?? '');
  const [timezone, setTimezone] = useState(organization?.timezone ?? 'UTC');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const canEditOrg = orgRole === 'owner' || orgRole === 'admin';
  const orgDirty = companyName.trim() !== (organization?.name ?? '') || timezone !== (organization?.timezone ?? 'UTC');
  const profileDirty = fullName.trim() !== (user?.full_name ?? '');

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

  const enabledModules = MODULES.filter((m) => m.id !== 'dashboard' && organization?.enabled_modules.includes(m.id));

  return (
    <div className="page">
      <PageHeader eyebrow="Workspace" icon="settings" title="Settings" subtitle="Your workspace, how it looks, and your own profile." />

      <div className="settings">
        <div className="settings-col">
          <section className="card" aria-labelledby="ws-title">
            <div className="card-head">
              <div>
                <h2 id="ws-title" className="card-title">Workspace</h2>
                <div className="card-sub">{canEditOrg ? 'Visible to everyone in this workspace.' : 'Only owners and admins can change these.'}</div>
              </div>
              {!canEditOrg && <span className="badge no-dot"><Icon name="lock" size={12} /> Read only</span>}
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="grid-2">
                <div className="field">
                  <label className="field-label" htmlFor="set-company">Company name</label>
                  <input id="set-company" className="tinput" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={!canEditOrg} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="set-tz">Timezone</label>
                  <select id="set-tz" className="tinput select" value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={!canEditOrg}>
                    {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              {organization && (
                <dl className="definition">
                  <dt>Business type</dt><dd style={{ textTransform: 'capitalize' }}>{organization.business_type.replace(/_/g, ' ') || '—'}</dd>
                  <dt>Currency</dt><dd>{organization.currency} <span className="muted">· showing {currency.code}</span></dd>
                  <dt>Created</dt><dd>{shortDate(organization.created_at)}</dd>
                  <dt>Modules</dt>
                  <dd className="badge-row">{enabledModules.map((m) => <span key={m.id} className="badge no-dot"><Icon name={m.icon} size={12} /> {m.label}</span>)}</dd>
                </dl>
              )}
            </div>
            {canEditOrg && (
              <div className="card-foot">
                <button type="button" className="btn btn-ghost" disabled={!orgDirty || savingOrg} onClick={() => { setCompanyName(organization?.name ?? ''); setTimezone(organization?.timezone ?? 'UTC'); }}>
                  Discard
                </button>
                <button type="button" className="btn btn-primary" onClick={saveOrg} disabled={savingOrg || !orgDirty}>
                  {savingOrg ? <><Icon name="spark" size={15} className="spin" /> Saving…</> : 'Save changes'}
                </button>
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="look-title">
            <div className="card-head">
              <div>
                <h2 id="look-title" className="card-title">Appearance</h2>
                <div className="card-sub">Saved on this device. Press the sun/moon in the top bar to flip quickly.</div>
              </div>
            </div>
            <div className="card-body">
              <div className="theme-options" role="radiogroup" aria-labelledby="look-title">
                {THEMES.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} className="theme-option" onClick={() => setTheme(t.id)}>
                    <span className={`theme-preview ${t.id}`} aria-hidden="true">
                      <span className="tp-side" />
                      <span className="tp-main"><i /><i /><i /></span>
                    </span>
                    <span className="theme-option-label">
                      {t.label}
                      <span className="tick" aria-hidden="true">{theme === t.id && <Icon name="check" size={11} strokeWidth={3} />}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="card" aria-labelledby="profile-title">
          <div className="profile-card">
            <span className="avatar avatar-xl filled" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }} aria-hidden="true">
              {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initialsOf(user?.full_name ?? '', user?.email ?? '')}
            </span>
            <h2 id="profile-title" style={{ fontSize: 'var(--t-xl)' }}>{user?.full_name}</h2>
            <div className="muted" style={{ fontSize: 'var(--t-sm)', wordBreak: 'break-all' }}>{user?.email}</div>
            {orgRole && <span className="badge badge-accent no-dot" style={{ marginTop: 8, textTransform: 'capitalize' }}>{orgRole}</span>}
          </div>
          <div className="card-body" style={{ borderTop: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label className="field-label" htmlFor="set-name">Full name</label>
              <input id="set-name" className="tinput" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={saveProfile} disabled={savingProfile || !profileDirty}>
              {savingProfile ? <><Icon name="spark" size={15} className="spin" /> Saving…</> : 'Save profile'}
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={sendReset} disabled={sendingReset}>
              <Icon name="mail" size={15} /> {sendingReset ? 'Sending…' : 'Email me a password reset link'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
