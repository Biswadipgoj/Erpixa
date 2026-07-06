import { useState } from 'react';
import { useDataStore } from '../store/dataStore';

export default function ProjectsPage() {
  const projects = useDataStore((s) => s.projects);
  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-projects)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Projects</h1>
          <div className="page-hero-sub">Track team progress, deadlines, and deliverables.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--violet-600)' }}>+ New Project</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-violet stagger-1">
          <div className="kpi-label">Active Projects</div>
          <div className="kpi-value">{projects.filter(p => p.status === 'In Progress').length}</div>
          <div className="kpi-change">Across all teams</div>
          <div className="kpi-icon">🚀</div>
        </div>
        <div className="card kpi-card kpi-blue stagger-2">
          <div className="kpi-label">Tasks Completed</div>
          <div className="kpi-value">
            {projects.reduce((acc, p) => acc + p.done, 0)} / {projects.reduce((acc, p) => acc + p.tasks, 0)}
          </div>
          <div className="kpi-change">This month</div>
          <div className="kpi-icon">✅</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-3">
          <div className="kpi-label">On Track</div>
          <div className="kpi-value">100%</div>
          <div className="kpi-change">No projects delayed</div>
          <div className="kpi-icon">📈</div>
        </div>
      </div>

      <div className="card card-hover">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <input 
              className="tinput" 
              placeholder="Search projects..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 300 }}
            />
          </div>
        </div>
        
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ '--th-grad': 'var(--grad-projects)' } as React.CSSProperties}>Project Name</th>
                <th style={{ '--th-grad': 'var(--grad-projects)' } as React.CSSProperties}>Client</th>
                <th style={{ '--th-grad': 'var(--grad-projects)' } as React.CSSProperties}>Progress</th>
                <th style={{ '--th-grad': 'var(--grad-projects)' } as React.CSSProperties}>Due Date</th>
                <th style={{ '--th-grad': 'var(--grad-projects)' } as React.CSSProperties}>Team</th>
                <th style={{ '--th-grad': 'var(--grad-projects)' } as React.CSSProperties}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => (
                <tr key={p.id}>
                  <td className="font-bold text-primary-color">{p.name}</td>
                  <td>{p.client}</td>
                  <td style={{ minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="progress" style={{ flex: 1 }}>
                        <div className="progress-bar" style={{ width: `${p.progress}%`, background: p.progress === 100 ? 'var(--emerald-500)' : 'var(--violet-500)' }} />
                      </div>
                      <span className="text-xs font-bold">{p.progress}%</span>
                    </div>
                  </td>
                  <td>{p.dueDate}</td>
                  <td>
                    <div style={{ display: 'flex' }}>
                      {p.team.map((member: string, i: number) => (
                        <div 
                          key={i} 
                          className="avatar avatar-sm" 
                          style={{ 
                            marginLeft: i > 0 ? -8 : 0, 
                            background: 'var(--grad-ai)',
                            color: '#fff',
                            border: '2px solid #fff' 
                          }}
                          title={member}
                        >
                          {member}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      p.status === 'Completed' ? 'badge-success' : 
                      p.status === 'In Progress' ? 'badge-primary' : 
                      'badge-neutral'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
