import React, { useState, useEffect, useContext } from 'react';
import api, { SOCKET_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Car, LayoutDashboard, FileText, CreditCard, User, LogOut, Grid, X, Menu } from 'lucide-react';
import { io } from 'socket.io-client';
import LocationActions from '../components/LocationActions';
import BookingFlowModal from '../components/driver/BookingFlowModal';
import DriverBookingsView from '../components/driver/DriverBookingsView';
import DriverPaymentsView from '../components/driver/DriverPaymentsView';
import ProfileView from '../components/driver/ProfileView';
import AllotmentView from '../components/owner/AllotmentView';

const DriverDashboard = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFacilityForBooking, setSelectedFacilityForBooking] = useState(null);
  const [slotMapFacility, setSlotMapFacility] = useState(null); // facility whose slot map is open
  const [preSelectedSlot, setPreSelectedSlot] = useState(null); // slot chosen from map popup
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchFacilities();
    
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Connected to real-time server');
    });

    socket.on('facility_updated', (data) => {
      setFacilities(prev => prev.map(f => {
        if (f.id === data.facilityId) {
          return { ...f, available_slots: Number(f.available_slots) + Number(data.modifier) };
        }
        return f;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/facilities?available=true');
      setFacilities(res.data.data);
      
      const socket = io(SOCKET_URL);
      res.data.data.forEach(f => {
        socket.emit('join_facility', f.id);
      });
      
    } catch (err) {
      setError('Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Find Parking', icon: <LayoutDashboard size={20} /> },
    { id: 'bookings', label: 'My Bookings', icon: <FileText size={20} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  const renderContent = () => {
    if (activeTab === 'bookings') return <DriverBookingsView />;
    if (activeTab === 'payments') return <DriverPaymentsView />;
    if (activeTab === 'profile') return <ProfileView />;

    // Default to Dashboard / Find Parking
    if (loading) return <div style={{ padding: '32px' }}>Loading facilities...</div>;

    return (
      <div className="animate-fade-in" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Find Parking</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time availability across the city.</p>
        </div>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error}</div>}

        <div className="grid-cards">
          {facilities.map(facility => (
            <div key={facility.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{facility.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <MapPin size={16} />
                    {facility.address}
                  </div>
                </div>
                <div className={`badge ${facility.available_slots > 0 ? 'badge-success' : 'badge-danger'}`}>
                  {facility.available_slots} / {facility.total_slots} Slots
                </div>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  onClick={() => setSelectedFacilityForBooking(facility)}
                  disabled={facility.available_slots <= 0}
                >
                  <Car size={18} />
                  Book Now
                </button>
                <button
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
                  onClick={() => setSlotMapFacility(facility)}
                  title="View slot map"
                >
                  <Grid size={16} /> View Slots
                </button>
                <LocationActions lat={facility.latitude} lng={facility.longitude} name={facility.name} compact />
              </div>
            </div>
          ))}
          {facilities.length === 0 && !error && (
            <div style={{ color: 'var(--text-muted)' }}>No parking facilities currently available.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
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

        {/* Settings/Logout at bottom */}
        <div style={{ padding: '0 16px', marginTop: 'auto' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '12px 16px',
              background: 'transparent',
              color: 'var(--danger)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              width: '100%',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <div className="mobile-header">
          <button className="mobile-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Driver Portal</h2>
        </div>
        <main className="dashboard-content-area" style={{ padding: 0 }}>
          {renderContent()}
        </main>
      </div>

      {/* Slot Map Modal */}
      {slotMapFacility && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 9997,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto',
          padding: '40px 16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '800px',
            background: 'var(--surface-color)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>{slotMapFacility.name} — Slot Map</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Click a slot to see its booking schedule
                </p>
              </div>
              <button
                onClick={() => setSlotMapFacility(null)}
                style={{
                  background: 'var(--danger-bg)', border: '1px solid var(--danger)',
                  borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--danger)'
                }}
              >
                <X size={16} />
              </button>
            </div>
            {/* AllotmentView with booking callback */}
            <div style={{ padding: '0' }}>
              <AllotmentView
                facility={slotMapFacility}
                onBookSlot={(slot) => {
                  setPreSelectedSlot(slot);
                  setSelectedFacilityForBooking(slotMapFacility);
                  setSlotMapFacility(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Booking Flow Modal */}
      {selectedFacilityForBooking && (
        <BookingFlowModal 
          isOpen={true} 
          onClose={() => { setSelectedFacilityForBooking(null); setPreSelectedSlot(null); }} 
          facility={selectedFacilityForBooking}
          preSelectedSlot={preSelectedSlot}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
