import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Car, Clock, DollarSign, CalendarCheck, Loader2, LogOut, CheckCircle, AlertTriangle, MapPin, Grip } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AllotmentView from '../components/owner/AllotmentView';

const TenantDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendants/dashboard');
      setAnalytics(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckIn = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/checkin`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      const res = await api.post(`/bookings/${bookingId}/checkout`);
      if (res.data.data?.totalFeeDue > 0) {
        alert(`Payment required! Holding/Overstay fee: ${res.data.data.totalFeeDue} UGX`);
        // Normally you'd pop a modal to collect cash. For now we force it or alert.
      }
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  if (error) {
    if (error === 'You are not assigned to any facility.') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)', padding: '24px', textAlign: 'center' }}>
          <div className="animate-fade-in" style={{ background: 'var(--surface-color)', padding: '48px', borderRadius: '24px', border: '1px solid var(--border-color)', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#FFB800', width: '80px', height: '80px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1C23', fontWeight: '900', fontSize: '3rem', margin: '0 auto 24px auto', boxShadow: '0 4px 14px rgba(255, 184, 0, 0.4)' }}>
              P
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--text-main)' }}>Welcome to ParkEase!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '32px' }}>
              Your attendant account is ready, but you haven't been assigned to a parking facility yet. Please ask the facility owner to add you via their dashboard.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/search')} style={{ padding: '12px 24px' }}>
                Book Parking
              </button>
              <button className="btn-secondary" onClick={() => { logout(); navigate('/login'); }} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogOut size={18} /> Log Out
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-color)', minHeight: '100vh' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Error</h2>
        <p style={{ color: 'var(--text-main)' }}>{error}</p>
        <button className="btn-secondary" onClick={() => { logout(); navigate('/login'); }} style={{ marginTop: '24px' }}>Log Out</button>
      </div>
    );
  }

  const { facility, total_checked_in, total_checked_out, overstayed_cars, booked_slots, holding_fee_slots } = analytics || {};

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', padding: '24px', color: 'var(--text-main)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Attendant Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Managing {facility?.name || 'Facility'}</p>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Car size={24} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Checked In Today</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{total_checked_in}</p>
        </div>

        <div style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <CheckCircle size={24} color="var(--success)" />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Checked Out Today</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{total_checked_out}</p>
        </div>

        <div style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertTriangle size={24} color="var(--danger)" />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Overstayed Cars</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{overstayed_cars?.length || 0}</p>
        </div>

        <div style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <CalendarCheck size={24} color="var(--warning)" />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Booked Slots</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{booked_slots?.length || 0}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Booked Slots (Waiting for Check-in) */}
        <section style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarCheck size={20} color="var(--warning)"/> Upcoming / Pending Arrivals</h2>
          {booked_slots?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No pending arrivals.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px' }}>Slot</th>
                    <th style={{ padding: '12px' }}>Plate</th>
                    <th style={{ padding: '12px' }}>Arrival Time</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {booked_slots.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>{b.slot_number}</td>
                      <td style={{ padding: '12px' }}>{b.vehicle_plate}</td>
                      <td style={{ padding: '12px' }}>{new Date(b.intended_arrival_time).toLocaleTimeString()}</td>
                      <td style={{ padding: '12px' }}>{b.status}</td>
                      <td style={{ padding: '12px' }}>
                        {b.status === 'confirmed' && (
                          <button onClick={() => handleCheckIn(b.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Check In</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Overstayed / Holding Fee Slots */}
        <section style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20} color="var(--danger)"/> Overstayed / Holding Fee Slots</h2>
          {(!overstayed_cars?.length && !holding_fee_slots?.length) ? (
            <p style={{ color: 'var(--text-muted)' }}>No cars are overstaying or have holding fees.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px' }}>Slot</th>
                    <th style={{ padding: '12px' }}>Plate</th>
                    <th style={{ padding: '12px' }}>Condition</th>
                    <th style={{ padding: '12px' }}>Duration</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Overstayed */}
                  {overstayed_cars?.map(b => (
                    <tr key={`os-${b.id}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>{b.slot_number}</td>
                      <td style={{ padding: '12px' }}>{b.vehicle_plate}</td>
                      <td style={{ padding: '12px', color: 'var(--danger)' }}>Overstayed</td>
                      <td style={{ padding: '12px' }}>{Math.floor(b.overstay_minutes)} mins</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleCheckOut(b.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Check Out</button>
                      </td>
                    </tr>
                  ))}
                  {/* Holding Fee */}
                  {holding_fee_slots?.map(b => (
                    <tr key={`hf-${b.id}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>{b.slot_number}</td>
                      <td style={{ padding: '12px' }}>{b.vehicle_plate}</td>
                      <td style={{ padding: '12px', color: 'var(--warning)' }}>Holding Fee Accruing</td>
                      <td style={{ padding: '12px' }}>{b.status === 'confirmed' ? 'Late Arrival' : 'Check-in Delay'}</td>
                      <td style={{ padding: '12px' }}>
                        {b.status === 'confirmed' ? (
                          <button onClick={() => handleCheckIn(b.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Check In</button>
                        ) : (
                          <button onClick={() => handleCheckOut(b.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Check Out</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Facility Arrangement Map */}
        <section style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Grip size={20} color="var(--primary)"/> Facility Arrangement (Manual Controls)</h2>
          <AllotmentView facility={facility} />
        </section>
      </div>
    </div>
  );
};

export default TenantDashboard;
