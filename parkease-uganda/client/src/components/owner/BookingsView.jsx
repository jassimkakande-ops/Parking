import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const BookingsView = ({ facility }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings/facility/${facility.id}`);
      setBookings(res.data.data);
    } catch (err) {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facility) fetchBookings();
  }, [facility]);

  const handleCheckIn = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      const res = await api.post(`/bookings/${bookingId}/checkin`);
      alert(res.data.message || 'Driver checked in successfully.');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check in driver.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckout = async (bookingId, forceCash = false) => {
    try {
      setProcessingId(bookingId);
      const res = await api.post(`/bookings/${bookingId}/checkout`, { force_cash: forceCash });

      if (res.data.data.totalFeeDue > 0 && !forceCash) {
        const confirmCash = window.confirm(`This booking has an outstanding fee of ${res.data.data.totalFeeDue} UGX (Holding/Overstay).\n\nDid you collect this payment in cash? Click OK to force checkout.`);
        if (confirmCash) {
          return handleCheckout(bookingId, true);
        }
      } else {
        alert(res.data.message || 'Checkout successful!');
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to checkout booking.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!facility) return <div>Please select a facility</div>;
  if (loading) return <div>Loading bookings...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', minHeight: '400px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Arrangement Report (Bookings)</h2>

      {bookings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No bookings found for this facility.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Driver</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Slot</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Arrival</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Check In</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Expected Departure</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Actual Departure</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Actual Duration</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Holding Fee</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Overstay</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => {
                const isOngoing = booking.status === 'active' || booking.status === 'confirmed';

                // Calculate overstay
                let overstayText = 'None';
                const endTime = new Date(booking.end_time);
                const compareTime = booking.actual_departure_time ? new Date(booking.actual_departure_time) : (isOngoing ? new Date() : null);
                let actualDuration = '-';
                if (booking.checked_in_at && booking.actual_departure_time) {
                  const durationMs = new Date(booking.actual_departure_time).getTime() - new Date(booking.checked_in_at).getTime();
                  const hours = Math.floor(durationMs / (1000 * 60 * 60));
                  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                  actualDuration = `${hours}h ${minutes}m`;
                }

                if (compareTime && compareTime > endTime) {
                  const overstayMs = compareTime.getTime() - endTime.getTime();
                  const hours = Math.floor(overstayMs / (1000 * 60 * 60));
                  const minutes = Math.floor((overstayMs % (1000 * 60 * 60)) / (1000 * 60));
                  overstayText = `${hours}h ${minutes}m`;
                }

                return (
                  <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>{booking.driver_name} <br /><small style={{ color: 'var(--text-muted)' }}>{booking.phone_number}</small></td>
                    <td style={{ padding: '12px 16px' }}>{booking.slot_number || 'Auto'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {new Date(booking.intended_arrival_time || booking.start_time).toLocaleDateString()} <br />
                      {new Date(booking.intended_arrival_time || booking.start_time).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {booking.checked_in_at ? (
                        <>
                          {new Date(booking.checked_in_at).toLocaleDateString()} <br />
                          {new Date(booking.checked_in_at).toLocaleTimeString()}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {booking.end_time ? (
                        <>
                          {new Date(booking.end_time).toLocaleDateString()} <br />
                          {new Date(booking.end_time).toLocaleTimeString()}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {booking.actual_departure_time ? (
                        <>
                          {new Date(booking.actual_departure_time).toLocaleDateString()} <br />
                          {new Date(booking.actual_departure_time).toLocaleTimeString()}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {actualDuration}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {Number(booking.holding_fee_amount || 0) > 0 ? `${booking.holding_fee_amount} UGX` : '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: overstayText !== 'None' ? 'var(--danger)' : 'inherit' }}>
                        {overstayText}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${isOngoing ? 'badge-success' : booking.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {booking.status === 'confirmed' && (
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: '8px' }}
                          onClick={() => handleCheckIn(booking.id)}
                          disabled={processingId === booking.id}
                        >
                          {processingId === booking.id ? 'Processing...' : 'Check In'}
                        </button>
                      )}
                      {booking.status === 'active' && (
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleCheckout(booking.id)}
                          disabled={processingId === booking.id}
                        >
                          {processingId === booking.id ? 'Processing...' : 'Check Out'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingsView;
