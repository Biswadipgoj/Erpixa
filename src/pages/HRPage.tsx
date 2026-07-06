import { useState } from 'react';
import { useDataStore } from '../store/dataStore';

export default function HRPage() {
  const employees = useDataStore((s) => s.employees);
  const [search, setSearch] = useState('');

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.role.toLowerCase().includes(search.toLowerCase()) ||
    e.dept.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-hr)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Human Resources</h1>
          <div className="page-hero-sub">Manage your team, track performance, and handle requests.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--pink-600)' }}>+ Add Employee</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-pink stagger-1">
          <div className="kpi-label">Total Headcount</div>
          <div className="kpi-value">{employees.length}</div>
          <div className="kpi-change">+2 this month</div>
          <div className="kpi-icon">👥</div>
        </div>
        <div className="card kpi-card kpi-purple stagger-2">
          <div className="kpi-label">Open Positions</div>
          <div className="kpi-value">4</div>
          <div className="kpi-change">Active recruitments</div>
          <div className="kpi-icon">🎯</div>
        </div>
        <div className="card kpi-card kpi-blue stagger-3">
          <div className="kpi-label">Time Off Requests</div>
          <div className="kpi-value">2</div>
          <div className="kpi-change">Pending approval</div>
          <div className="kpi-icon">🏖️</div>
        </div>
      </div>

      <div className="card card-hover">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <input 
              className="tinput" 
              placeholder="Search employees..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 300 }}
            />
            <select className="tinput select" style={{ maxWidth: 150 }}>
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Sales</option>
              <option>Marketing</option>
              <option>HR</option>
            </select>
          </div>
        </div>
        
        <div className="card-body">
          <div className="grid-auto">
            {filteredEmployees.map(e => (
              <div key={e.id} className="card card-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <span className={`badge ${e.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                    {e.status}
                  </span>
                </div>
                
                <div 
                  className="avatar avatar-xl mb-3" 
                  style={{ background: `linear-gradient(135deg, ${e.color} 0%, rgba(255,255,255,0.2) 100%)`, color: '#fff' }}
                >
                  {e.initials}
                </div>
                
                <h3 className="font-bold mb-1">{e.name}</h3>
                <div className="text-sm font-semibold text-primary-color mb-3">{e.role}</div>
                
                <div className="text-xs text-muted mb-4" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>📧 {e.email}</div>
                  <div>📱 {e.phone}</div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button className="btn btn-sm btn-ghost w-full" style={{ justifyContent: 'center' }}>Profile</button>
                  <button className="btn btn-sm btn-ghost w-full" style={{ justifyContent: 'center' }}>Message</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
