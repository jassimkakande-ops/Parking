import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Car, Download, XCircle } from 'lucide-react';
import api from '../../utils/api';
import ParkingTicket from './ParkingTicket';

const DriverBookingsView = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);
  
  // Modal for Viewing Ticket
  const [ticketBooking, setTicketBooking] = useState(null);

  // Modal for Overstay / Pending Payment
  const [paymentModal, setPaymentModal] = useState({ open: false, type: '', booking: null, fee: 0 });
  const [paymentMethod, setPaymentMethod] = useState('mtn_momo');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data.data);
    } catch (err) {
      setError('Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm('Funds paid for this booking will not be refunded. Do you still want to cancel?');
    if (!confirmed) return;

    try {
      setCancelling(bookingId);
      await api.patch(`/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Cancellation failed');
    } finally {
      setCancelling(null);
    }
  };

  const handlePayNow = (booking) => {
    setPaymentModal({
      open: true,
      type: 'initial',
      booking: booking,
      fee: booking.total_amount
    });
  };

  const handleProcessPayment = async () => {
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const endpoint = paymentModal.type === 'overstay' ? '/payments/initiate-overstay' : '/payments/initiate';
      const payload = {
        booking_id: paymentModal.booking.id,
        payment_method: paymentMethod,
        phone_number: phone,
        card_number: cardNumber,
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
        bank_account: bankAccount
      };

      const res = await api.post(endpoint, payload);
      
      if (res.data.data.redirectUrl) {
        window.location.href = res.data.data.redirectUrl;
      } else {
        alert('Payment processing initiated. Please check your phone for the prompt.');
        setPaymentModal({ open: false, type: '', booking: null, fee: 0 });
        fetchBookings();
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || err.response?.data?.error || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      <h2 style={{ marginBottom: '24px' }}>My Bookings</h2>
      
      {bookings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You have no bookings yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map(booking => (
            <div key={booking.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={18} /> {booking.facility_name} (Slot: {booking.slot_number || booking.slot_id})
                </h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <span><strong>Arrival:</strong> {new Date(booking.intended_arrival_time || booking.start_time).toLocaleString()}</span>
                  <span><strong>Paid Until:</strong> {new Date(booking.end_time).toLocaleString()}</span>
                  <span><strong>Checked In:</strong> {booking.checked_in_at ? new Date(booking.checked_in_at).toLocaleString() : '-'}</span>
                  <span><strong>Checked Out:</strong> {booking.actual_departure_time ? new Date(booking.actual_departure_time).toLocaleString() : '-'}</span>
                  <span><strong>Status:</strong> <span style={{ color: booking.status === 'active' ? 'var(--primary)' : 'inherit', textTransform: 'uppercase', fontWeight: 'bold' }}>{booking.status}</span></span>
                  <span><strong>Amount:</strong> {booking.total_amount} UGX</span>
                  {Number(booking.holding_fee_amount) > 0 && <span><strong>Holding Fee:</strong> {booking.holding_fee_amount} UGX</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '6px 12px' }}
                  onClick={() => setTicketBooking(booking)}
                >
                  <Download size={14} /> View Ticket
                </button>
                {booking.status === 'pending' && (
                  <button 
                    className="btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '6px 12px' }}
                    onClick={() => handlePayNow(booking)}
                  >
                    Pay Now
                  </button>
                )}
                {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'timedout') && (
                  <button 
                    className="btn-secondary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '6px 12px' }}
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancelling === booking.id}
                  >
                    {cancelling === booking.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} 
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Modal */}
      {ticketBooking && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setTicketBooking(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'var(--danger)', fontSize: '18px', fontWeight: 'bold', zIndex: 10 }}>
              ✕
            </button>
            <ParkingTicket booking={ticketBooking} facility={{ name: ticketBooking.facility_name, address: ticketBooking.address }} />
          </div>
        </div>,
        document.body
      )}

      {/* Payment Modal */}
      {paymentModal.open && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', position: 'relative', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setPaymentModal({ open: false, type: '', booking: null, fee: 0 })} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'var(--danger)', fontSize: '18px', fontWeight: 'bold', zIndex: 10 }}>
              ✕
            </button>
            
            <h3 style={{ marginBottom: '16px', paddingRight: '24px' }}>
              {paymentModal.type === 'overstay' ? 'Pay Overstay Fee' : 'Complete Booking Payment'}
            </h3>
            
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Amount Due: <span style={{ color: 'var(--primary)' }}>{paymentModal.fee} UGX</span></p>
              {paymentModal.type === 'overstay' && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>This fee is required before you can complete checkout.</p>}
            </div>

            {paymentError && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{paymentError}</div>}

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <button className={paymentMethod === 'mtn_momo' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1 }} onClick={() => setPaymentMethod('mtn_momo')}>
                Mobile Money
              </button>
              <button className={paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1 }} onClick={() => setPaymentMethod('card')}>
                Card Payment
              </button>
            </div>

            {paymentMethod === 'mtn_momo' && (
              <div style={{ marginBottom: '24px' }}>
                <label>Phone Number</label>
                <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="256700000000" />
              </div>
            )}

            {paymentMethod === 'card' && (
              <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label>Card Number / Bank Account Number</label>
                  <input type="text" className="input-field" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Expiry</label>
                    <input type="text" className="input-field" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>CVV</label>
                    <input type="text" className="input-field" value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="123" />
                  </div>
                </div>
              </div>
            )}

            <button className="btn-primary" style={{ width: '100%' }} onClick={handleProcessPayment} disabled={paymentLoading}>
              {paymentLoading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DriverBookingsView;
