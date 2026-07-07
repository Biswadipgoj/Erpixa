export default function FactoryPage() {
  return (
    <div className="fade-in" style={{ padding: 'var(--space-6)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-hero" style={{ '--hero-grad': 'var(--gradient-ai)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Factory Layout</h1>
          <div className="page-hero-sub">Manage factory floors and workcenters.</div>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }} aria-hidden="true">🏗️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
            No Factory Layout data yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
            Your workspace is empty. Create your first record to start using the Factory Layout module.
          </p>
          <button className="btn btn-primary">
            + Create First Record
          </button>
        </div>
      </div>
    </div>
  );
}
