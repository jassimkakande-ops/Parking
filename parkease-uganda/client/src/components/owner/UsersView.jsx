import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const UsersView = ({ facility }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!facility) return;

    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/facility/${facility.id}/drivers`);
        setDrivers(res.data.data);
      } catch (err) {
        setError('Failed to load users (drivers).');
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [facility]);

  if (!facility) return <div>Please select a facility</div>;
  if (loading) return <div>Loading users...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', minHeight: '400px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Drivers Details</h2>
      
      {drivers.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No drivers have booked this facility yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Driver Name</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Phone Number</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Bookings</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Last Booking Date</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-color)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{driver.full_name}</td>
                  <td style={{ padding: '12px 16px' }}>{driver.email}</td>
                  <td style={{ padding: '12px 16px' }}>{driver.phone_number}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-success">{driver.total_bookings}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {driver.last_booking_date ? new Date(driver.last_booking_date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersView;
