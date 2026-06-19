import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { getMyFacilities } from '../api/parkingApi';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Grip, Users, CreditCard, FileText, Settings, Plus, MapPin, Loader2, Moon, Sun } from 'lucide-react';
import AllotmentView from '../components/owner/AllotmentView';
import PaymentsView from '../components/owner/PaymentsView';
import BookingsView from '../components/owner/BookingsView';
import UsersView from '../components/owner/UsersView';
import AddFacilityModal from '../components/owner/AddFacilityModal';

const OwnerDashboard = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);

  const { user, theme, toggleTheme } = useContext(AuthContext);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const data = await getMyFacilities();
      setFacilities(data);
      if (data.length > 0 && !selectedFacilityId) {
        setSelectedFacilityId(data[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch facilities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (selectedFacilityId && activeTab === 'dashboard') {
        try {
          const res = await api.get(`/facilities/${selectedFacilityId}/analytics`);
          setAnalytics(res.data.data);
        } catch (err) {
          console.error("Failed to fetch analytics", err);
        }
      }
    };
    fetchAnalytics();
  }, [selectedFacilityId, activeTab]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      );
    }

    if (facilities.length === 0) {
      return (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', marginTop: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Welcome to ParkEase Owner Portal</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You have no facilities yet. Click "Add Facility" to create your first parking lot.</p>
          <button className="btn-primary" onClick={() => setIsAddFacilityOpen(true)}>
            <Plus size={18} style={{ marginRight: '8px' }} />
            Add Facility
          </button>
        </div>
      );
    }

    if (!selectedFacility) return <div>Please select a facility from the dropdown.</div>;

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Dashboard Overview</h2>
            
            {/* General Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div style={{ padding: '24px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Total Slots</p>
                <h3 style={{ fontSize: '2rem' }}>{selectedFacility.total_slots}</h3>
              </div>
              <div style={{ padding: '24px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Available Slots</p>
                <h3 style={{ fontSize: '2rem', color: selectedFacility.available_slots > 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {selectedFacility.available_slots}
                </h3>
              </div>
              <div style={{ padding: '24px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Hourly Rate</p>
                <h3 style={{ fontSize: '2rem' }}>{selectedFacility.hourly_rate} UGX</h3>
              </div>
            </div>

            {/* Live Analytics */}
            <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', color: 'var(--text-main)' }}>Live Facility Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              <div style={{ padding: '24px', background: 'var(--primary-glow)', borderRadius: '12px', border: '1px solid rgba(0, 102, 255, 0.2)' }}>
                <p style={{ color: 'var(--primary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>Cars in Parking (Occupied)</p>
                <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{analytics?.occupied_slots || 0}</h3>
              </div>
              <div style={{ padding: '24px', background: 'var(--success-bg)', borderRadius: '12px', border: '1px solid rgba(0, 200, 83, 0.2)' }}>
                <p style={{ color: 'var(--success)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>Free Slots Right Now</p>
                <h3 style={{ fontSize: '2rem', color: 'var(--success)' }}>{analytics?.free_slots || 0}</h3>
              </div>
              <div style={{ padding: '24px', background: 'var(--warning-bg)', borderRadius: '12px', border: '1px solid rgba(255, 184, 0, 0.2)' }}>
                <p style={{ color: 'var(--warning)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>Upcoming Digital Bookings</p>
                <h3 style={{ fontSize: '2rem', color: 'var(--warning)' }}>{analytics?.booked_slots || 0}</h3>
              </div>
              <div style={{ padding: '24px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>Cars Checked Out Today</p>
                <h3 style={{ fontSize: '2rem', color: 'var(--text-main)' }}>{analytics?.checked_out_today || 0}</h3>
              </div>
            </div>
          </div>
        );
      case 'allotment':
        return <AllotmentView facility={selectedFacility} />;
      case 'payments':
        return <PaymentsView facility={selectedFacility} />;
      case 'report':
        return <BookingsView facility={selectedFacility} />;
      case 'users':
        return <UsersView facility={selectedFacility} />;
      case 'settings':
        return (
          <div className="animate-fade-in" style={{ padding: '48px', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--text-muted)' }}>This section is under construction.</h2>
          </div>
        );
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'allotment', label: 'Arrangement', icon: <Grip size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { id: 'report', label: 'Report', icon: <FileText size={20} /> },
  ];

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
            P
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>ParkEase</span>
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
              onMouseEnter={(e) => {
                if (activeTab !== item.id) e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Settings at bottom */}
        <div style={{ padding: '0 16px', marginTop: 'auto' }}>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '12px 16px',
              background: activeTab === 'settings' ? 'var(--primary-glow)' : 'transparent',
              color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'settings' ? '600' : '500',
              width: '100%',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
          >
            <Settings size={20} />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          height: '80px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          flexShrink: 0
        }}>
          {/* Left: Facility Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <MapPin size={20} color="var(--primary)" />
            {facilities.length > 0 ? (
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                style={{
                  padding: '8px 32px 8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  minWidth: '200px'
                }}
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.address})</option>
                ))}
              </select>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No facility selected</span>
            )}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => setIsAddFacilityOpen(true)}
            >
              <Plus size={18} /> Add Facility
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {renderContent()}
        </main>
      </div>

      {/* Slide-out Panel Modal for Adding Facility */}
      <AddFacilityModal
        isOpen={isAddFacilityOpen}
        onClose={() => setIsAddFacilityOpen(false)}
        onFacilityCreated={fetchFacilities}
      />
    </div>
  );
};

export default OwnerDashboard;
