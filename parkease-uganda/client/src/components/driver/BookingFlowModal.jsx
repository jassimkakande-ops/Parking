import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, Car, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import ParkingTicket from './ParkingTicket';

// Custom Aerial Car SVG
const AerialCar = ({ occupied, selected }) => (
  <svg width="32" height="64" viewBox="0 0 32 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: occupied ? 1 : 0.2 }}>
    <rect x="2" y="4" width="28" height="56" rx="8" fill={occupied ? (selected ? "var(--primary)" : "var(--danger)") : "var(--border-color)"} />
    <rect x="4" y="14" width="24" height="12" rx="2" fill="rgba(255,255,255,0.3)" />
    <rect x="4" y="38" width="24" height="12" rx="2" fill="rgba(255,255,255,0.3)" />
    <rect x="0" y="10" width="4" height="12" rx="1" fill="#333" />
    <rect x="28" y="10" width="4" height="12" rx="1" fill="#333" />
    <rect x="0" y="42" width="4" height="12" rx="1" fill="#333" />
    <rect x="28" y="42" width="4" height="12" rx="1" fill="#333" />
  </svg>
);

const BookingFlowModal = ({ isOpen, onClose, facility, preSelectedSlot }) => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: Slot Select, 2: Details, 3: Payment, 4: Success/Ticket
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Form State
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [plate, setPlate] = useState('');
  const [duration, setDuration] = useState(1);
  const [arrivalTime, setArrivalTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mtn_momo');
  
  // Bank details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // Flow State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    if (isOpen && facility) {
      setStep(1);
      // If a slot was pre-selected from the map, remember it
      setSelectedSlot(preSelectedSlot || null);
      setError('');
      const nextHour = new Date(Date.now() + 60 * 60 * 1000);
      nextHour.setMinutes(0, 0, 0);
      setArrivalTime(nextHour.toISOString().slice(0, 16));
      setSlots([]); // clear slots
      
      const socket = io(SOCKET_URL);
      socket.emit('join_facility', facility.id);
      socket.on('slot_updated', (data) => {
        // Only update current occupancy if we are looking at 'now', but safe to just update.
        setSlots(prev => prev.map(s => s.id === data.id ? { ...s, is_occupied: data.is_occupied } : s));
      });
      return () => socket.disconnect();
    }
  }, [isOpen, facility, preSelectedSlot]);

  const fetchAvailableSlots = async () => {
    if (!arrivalTime || duration < 1) return setError('Please specify arrival time and duration');
    const start = new Date(arrivalTime);
    if (Number.isNaN(start.getTime())) return setError('Invalid arrival time');
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

    try {
      setLoading(true);
      const res = await api.get(`/facilities/${facility.id}/availability?start=${start.toISOString()}&end=${end.toISOString()}`);
      const dbSlots = res.data.data || [];
      const grid = Array.from({ length: facility.total_slots }).map((_, idx) => {
        const slotNumStr = (idx + 1).toString();
        const existing = dbSlots.find(s => s.slot_number === slotNumStr);
        return existing || { id: `temp-${idx}`, slot_number: slotNumStr, is_occupied: false };
      });
      setSlots(grid);

      // If a slot was pre-selected from the map, keep it selected if it's still free
      if (preSelectedSlot) {
        const matchInGrid = grid.find(s => s.id === preSelectedSlot.id || s.slot_number === preSelectedSlot.slot_number);
        if (matchInGrid && !matchInGrid.is_occupied) {
          setSelectedSlot(matchInGrid);
        } else if (matchInGrid && matchInGrid.is_occupied) {
          setSelectedSlot(null);
          setError(`Slot ${preSelectedSlot.slot_number} is already taken at this time. Please pick another slot or change the time.`);
        }
      }

      setError(prev => prev.includes('Slot') ? prev : '');
      setStep(2);
    } catch (err) {
      setError('Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const estimatedCost = duration * Number(facility?.hourly_rate || 0);

  const handleProceedToDetails = () => {
    if (!name || !phone || !plate || !arrivalTime || duration < 1) return setError('Please fill all required fields');
    const arrival = new Date(arrivalTime);
    if (Number.isNaN(arrival.getTime())) return setError('Please enter a valid arrival date and time');
    setError('');
    fetchAvailableSlots();
  };

  const handleProceedToPayment = () => {
    if (!selectedSlot) return setError('Please select an available slot');
    setError('');
    setStep(3);
  };

  const handlePayAndBook = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create Booking
      const startTime = new Date(arrivalTime);
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      
      const bookingRes = await api.post('/bookings', {
        facility_id: facility.id,
        slot_id: selectedSlot.id.startsWith('temp') ? undefined : selectedSlot.id,
        intended_arrival_time: startTime.toISOString(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        vehicle_plate: plate
      });

      const booking = bookingRes.data.data; // Fixed bug here

      // 2. Initiate Payment
      const paymentRes = await api.post('/payments/initiate', {
        booking_id: booking.id,
        payment_method: paymentMethod,
        phone_number: phone,
        card_number: cardNumber,
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
        bank_account: bankAccount
      });

      if (paymentRes.data.data.redirectUrl) {
        window.location.href = paymentRes.data.data.redirectUrl;
      } else {
        // Poll for payment status
        setLoading(true);
        setError('Waiting for payment confirmation...');
        
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds max
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await api.get(`/payments/booking/${booking.id}`);
            const paymentInfo = statusRes.data.data;
            if (paymentInfo.status === 'completed') {
              clearInterval(pollInterval);
              setLoading(false);
              setBookingData({ ...booking, paid: estimatedCost, reference: paymentInfo.makypay_reference });
              setStep(4);
            } else if (paymentInfo.status === 'failed' || paymentInfo.status === 'cancelled') {
              clearInterval(pollInterval);
              setLoading(false);
              setError('Payment failed or was cancelled. Please try again.');
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setLoading(false);
              setError('Payment verification timed out. If you paid, it will update shortly.');
            }
          } catch (pollErr) {
            // keep polling
          }
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !facility) return null;

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '32px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'var(--danger)', fontSize: '18px', fontWeight: 'bold', zIndex: 10 }}>
          ✕
        </button>

        <h2 style={{ marginBottom: '8px' }}>{facility.name}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{facility.address}</p>

        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

        {step === 1 && (
          <div>
            <h3>Step 1: Booking Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <div>
                <label>Full Name</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label>Phone Number (e.g. 256700000000)</label>
                <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label>Vehicle Number Plate</label>
                <input type="text" className="input-field" value={plate} onChange={e => setPlate(e.target.value)} placeholder="e.g. UAA 123A" />
              </div>
              <div>
                <label>Arrival Date & Time</label>
                <input type="datetime-local" className="input-field" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
              </div>
              <div>
                <label>Estimated Duration (Hours)</label>
                <input type="number" min="1" className="input-field" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleProceedToDetails} disabled={loading}>
                {loading ? 'Checking Availability...' : 'Find Available Slots'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3>Step 2: Select a Parking Slot</h3>
            {preSelectedSlot && selectedSlot && (
              <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '10px 14px', marginTop: '16px', fontSize: '0.9rem' }}>
                ✅ <strong>{selectedSlot.slot_number}</strong> pre-selected from slot map. You can change it below.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px', marginTop: '24px' }}>
              {slots.map(slot => (
                <div 
                  key={slot.id}
                  onClick={() => !slot.is_occupied && setSelectedSlot(slot)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: selectedSlot?.id === slot.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: slot.is_occupied ? 'var(--danger-bg)' : (selectedSlot?.id === slot.id ? 'var(--primary-glow)' : 'transparent'),
                    cursor: slot.is_occupied ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    opacity: slot.is_occupied ? 0.6 : 1
                  }}
                >
                  <AerialCar occupied={slot.is_occupied || selectedSlot?.id === slot.id} selected={selectedSlot?.id === slot.id} />
                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{slot.slot_number}</span>
                  {slot.is_occupied && <span style={{ fontSize: '0.65rem', color: 'var(--danger)' }}>Taken</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleProceedToPayment} disabled={!selectedSlot}>Proceed to Payment</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3>Step 3: Payment</h3>
            <div style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '12px', marginTop: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Rate</span>
                <span>{facility.hourly_rate} UGX / hr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Arrival</span>
                <span>{arrivalTime ? new Date(arrivalTime).toLocaleString() : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Duration</span>
                <span>{duration} hr(s)</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                <span>Estimated Total</span>
                <span style={{ color: 'var(--primary)' }}>{estimatedCost.toLocaleString()} UGX</span>
              </div>
            </div>

            <h4>Select Payment Method</h4>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button 
                className={paymentMethod === 'mtn_momo' ? 'btn-primary' : 'btn-secondary'} 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setPaymentMethod('mtn_momo')}
              >
                <Smartphone size={20} /> Mobile Money
              </button>
              <button 
                className={paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'} 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={20} /> Card Payment
              </button>
            </div>

            {paymentMethod === 'mtn_momo' && (
              <div style={{ marginTop: '24px' }}>
                <label>Mobile Money Phone Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="256700000000"
                />
                <small style={{ color: 'var(--text-muted)' }}>Enter phone number to receive prompt</small>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label>Card Number / Bank Account Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={cardNumber} 
                    onChange={e => setCardNumber(e.target.value)} 
                    placeholder="xxxx-xxxx-xxxx-xxxx"
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Expiry</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={cardExpiry} 
                      onChange={e => setCardExpiry(e.target.value)} 
                      placeholder="MM/YY"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>CVV</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={cardCvv} 
                      onChange={e => setCardCvv(e.target.value)} 
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handlePayAndBook} disabled={loading}>
                {loading ? 'Processing...' : `Pay ${estimatedCost.toLocaleString()} UGX`}
              </button>
            </div>
          </div>
        )}

        {step === 4 && bookingData && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 24px' }} />
            <h3>Booking Confirmed!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Your payment has been initiated successfully.</p>
            
            <ParkingTicket booking={bookingData} facility={facility} />

            <button className="btn-primary" style={{ width: '100%', marginTop: '32px' }} onClick={onClose}>
              Close & View Dashboard
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default BookingFlowModal;
