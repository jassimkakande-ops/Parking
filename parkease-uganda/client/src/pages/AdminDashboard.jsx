import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { LayoutDashboard, Users, Activity, FileText, Lock, MapPin, Download, Eye, EyeOff, Loader2, DollarSign, Settings } from 'lucide-react';
import AllotmentView from '../components/owner/AllotmentView';

const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const AdminDashboard = () => {
  const [occupancy, setOccupancy] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [occRes, revRes, usersRes, actRes, facRes] = await Promise.all([
        api.get('/admin/reports/occupancy'),
        api.get('/admin/reports/revenue'),
        api.get('/admin/users'),
        api.get('/admin/activity'),
        api.get('/facilities')
      ]);
      setOccupancy(occRes.data.data);
      setRevenue(revRes.data.data);
      setUsers(usersRes.data.data);
      setActivity(actRes.data.data);
      
      const facData = facRes.data.data;
      setFacilities(facData);
      if (facData && facData.length > 0) {
        setSelectedFacility(facData[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      fetchData(); // Refresh list
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const visibleUsers = showInactiveUsers ? users : users.filter(u => u.is_active);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Users Management', icon: <Users size={20} /> },
    { id: 'activity', label: 'System Activity', icon: <Activity size={20} /> },
    { id: 'report', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'map', label: 'Parking Map', icon: <MapPin size={20} /> },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Platform Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div style={{ padding: '24px', background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '12px' }}>
                <p style={{ marginBottom: '8px', fontSize: '0.9rem', opacity: 0.8 }}>Total Revenue</p>
                <h3 style={{ fontSize: '2rem' }}>UGX {Number(revenue?.summary?.total_revenue_all_time || 0).toLocaleString()}</h3>
              </div>
              <div style={{ padding: '24px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '12px' }}>
                <p style={{ marginBottom: '8px', fontSize: '0.9rem', opacity: 0.8 }}>Global Occupancy</p>
                <h3 style={{ fontSize: '2rem' }}>{occupancy?.occupancy_rate_percent || 0}%</h3>
              </div>
              <div style={{ padding: '24px', background: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: '12px' }}>
                <p style={{ marginBottom: '8px', fontSize: '0.9rem', opacity: 0.8 }}>Total Users</p>
                <h3 style={{ fontSize: '2rem' }}>{users.length}</h3>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Users Management</h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => setShowInactiveUsers(!showInactiveUsers)}
                  className="btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {showInactiveUsers ? <EyeOff size={18}/> : <Eye size={18}/>}
                  {showInactiveUsers ? 'Hide Inactive' : 'Show Inactive'}
                </button>
                <button 
                  onClick={() => exportToCSV('users.csv', users)}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={18} /> Export CSV
                </button>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <tr>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Name</th>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Role</th>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map(u => (
                    <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>{u.full_name}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textTransform: 'capitalize' }}>{u.role}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          style={{ background: 'transparent', color: u.is_active ? 'var(--danger)' : 'var(--success)', cursor: 'pointer', border: 'none' }}
                          title={u.is_active ? 'Deactivate User' : 'Activate User'}
                        >
                          <Lock size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>System Activity</h2>
              <button 
                onClick={() => exportToCSV('activity.csv', activity)}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} /> Export CSV
              </button>
            </div>
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <tr>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Time</th>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Type</th>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Description</th>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map(a => (
                    <tr key={`${a.type}-${a.id}`}>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        {new Date(a.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textTransform: 'capitalize' }}>
                        <span className="badge" style={{ background: 'var(--bg-color)' }}>{a.type}</span>
                      </td>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>{a.description}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                        <span className={`badge ${a.status === 'success' || a.status === 'completed' || a.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'report':
        return (
          <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Reports</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ padding: '24px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '16px' }}>Revenue Breakdown</h3>
                <p><strong>Today:</strong> UGX {revenue?.summary?.revenue_today || 0}</p>
                <p><strong>This Month:</strong> UGX {revenue?.summary?.revenue_this_month || 0}</p>
                <p><strong>This Year:</strong> UGX {revenue?.summary?.revenue_this_year || 0}</p>
                <br/>
                <button className="btn-secondary" onClick={() => exportToCSV('revenue.csv', revenue?.records || [])} style={{ display: 'flex', alignItems: 'center' }}>
                  <Download size={16} style={{ marginRight: '8px' }}/> Export Payment Records
                </button>
              </div>
              <div style={{ padding: '24px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '16px' }}>Occupancy Statistics</h3>
                <p><strong>Total Facilities:</strong> {occupancy?.total_facilities || 0}</p>
                <p><strong>Total Slots:</strong> {occupancy?.total_slots_overall || 0}</p>
                <p><strong>Occupied:</strong> {occupancy?.total_occupied_slots || 0}</p>
                <p><strong>Available:</strong> {occupancy?.total_available_slots || 0}</p>
              </div>
            </div>
          </div>
        );
      case 'map':
        return (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Parking Map Visualization</h2>
              <select 
                value={selectedFacility?.id || ''} 
                onChange={(e) => setSelectedFacility(facilities.find(f => f.id === e.target.value))}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-color)'
                }}
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            {selectedFacility ? <AllotmentView facility={selectedFacility} /> : <div>No facilities available.</div>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 74px)', width: '100vw', overflow: 'hidden', background: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '260px', 
        background: 'var(--surface-color)', 
        color: 'var(--text-main)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex', 
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
        zIndex: 10
      }}>
        {/* Logo/Brand */}
        <div style={{ padding: '0 24px', marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#FFB800', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1C23', fontWeight: '900', fontSize: '1.5rem' }}>
            A
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>Admin Portal</span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 16px',
                background: activeTab === item.id ? 'var(--primary-glow)' : 'transparent',
                color: activeTab === item.id ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === item.id ? '600' : '500',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
