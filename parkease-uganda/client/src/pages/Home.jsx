import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { SOCKET_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Car, Grid, Search, Calendar, Map } from 'lucide-react';
import { io } from 'socket.io-client';
import LocationActions from '../components/LocationActions';
import BookingFlowModal from '../components/driver/BookingFlowModal';
import AllotmentView from '../components/owner/AllotmentView';

const Home = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedFacilityForBooking, setSelectedFacilityForBooking] = useState(null);
  const [slotMapFacility, setSlotMapFacility] = useState(null);
  const [preSelectedSlot, setPreSelectedSlot] = useState(null);

  useEffect(() => {
    fetchFacilities();
    
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Connected to real-time server (Home)');
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
      setError('Failed to fetch parking facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (facility) => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    // If authenticated, open booking flow
    setSelectedFacilityForBooking(facility);
  };

  return (
    <div className="home-container">
      {/* Hero Section (SpotHero style) */}
      <div style={{
        padding: '80px 32px',
        background: 'linear-gradient(135deg, var(--surface-color) 0%, var(--bg-color) 100%)',
        textAlign: 'center',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)' }}>
          Parking made easy, wherever you go
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '40px' }}>
          Find, book, and pay for parking in seconds.
        </p>

        {/* Search Bar Wrapper */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'var(--surface-color)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          border: '1px solid var(--border-color)'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '8px', padding: '4px' }}>
            <button style={{ flex: 1, padding: '12px', background: 'var(--surface-color)', borderRadius: '6px', border: 'none', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>Hourly/Daily</button>
            <button style={{ flex: 1, padding: '12px', background: 'transparent', borderRadius: '6px', border: 'none', color: 'var(--text-muted)' }}>Monthly</button>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
            <Search size={20} color="var(--primary)" style={{ marginRight: '12px' }} />
            <input 
              type="text" 
              placeholder="Where are you going?" 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1.1rem', color: 'var(--text-main)' }} 
            />
          </div>

          {/* Time Pickers (Mocked for visual similarity) */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
              <Calendar size={20} color="var(--text-muted)" style={{ marginRight: '12px' }} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start time</div>
                <div style={{ fontWeight: '500' }}>Today, 11:30 AM</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>End time</div>
                <div style={{ fontWeight: '500' }}>Today, 2:30 PM</div>
              </div>
            </div>
          </div>

          <button className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}>
            Find Parking Spots
          </button>
        </div>
      </div>

      {/* Facilities Section */}
      <div style={{ padding: '48px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '24px', textAlign: 'center' }}>Available Parking Locations</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading facilities...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)' }}>{error}</div>
        ) : (
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
                    onClick={() => handleBookNow(facility)}
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
            {facilities.length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>No parking facilities currently available.</div>
            )}
          </div>
        )}
      </div>

      {/* Modals from Driver Dashboard replicated here */}
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
                  background: 'var(--danger-bg)', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--danger)'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '0' }}>
              <AllotmentView
                facility={slotMapFacility}
                onBookSlot={(slot) => {
                  setPreSelectedSlot(slot);
                  handleBookNow(slotMapFacility);
                  setSlotMapFacility(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

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

export default Home;
