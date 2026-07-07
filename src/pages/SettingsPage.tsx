import { useAuthStore } from '../store';

export default function SettingsPage() {
  const { user, organization } = useAuthStore();

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Platform Settings</h1>
          <div className="page-hero-sub">Configure your workspace, preferences, and integrations.</div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card card-hover" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title">General Settings</h3>
          </div>
          <div className="card-body">
            <div className="grid-2 mb-4">
              <div className="input-wrap">
                <span className="input-label">Company Name</span>
                <input className="tinput" defaultValue={organization?.name || ''} />
              </div>
              <div className="input-wrap">
                <span className="input-label">Timezone</span>
                <select className="tinput select" defaultValue={organization?.timezone || 'UTC'}>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="EST">EST (Eastern Standard Time)</option>
                  <option value="PST">PST (Pacific Standard Time)</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <span className="input-label">Platform Theme</span>
              <div className="flex gap-3 mt-2">
                <button className="btn btn-primary" style={{ border: '2px solid var(--border-focus)' }}>
                  Aurora (Vivid)
                </button>
                <button className="btn btn-ghost" style={{ border: '2px solid transparent' }}>
                  Midnight (Dark)
                </button>
                <button className="btn btn-ghost" style={{ border: '2px solid transparent' }}>
                  Enterprise (Light)
                </button>
              </div>
            </div>

            <div className="divider"></div>
            <div className="flex justify-end">
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="card-header">
            <h3 className="card-title">My Profile</h3>
          </div>
          <div className="card-body flex-col items-center">
            <div className="avatar avatar-xl mb-3" style={{ background: 'var(--grad-ai)', color: '#fff', width: 80, height: 80, fontSize: '2rem' }}>
              {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
            </div>
            <h3 className="font-bold text-lg">{user?.full_name || 'User'}</h3>
            <div className="text-muted mb-4">{user?.email}</div>
            
            <button className="btn btn-secondary w-full mb-2">Edit Profile</button>
            <button className="btn btn-ghost w-full">Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
