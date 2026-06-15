import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, CheckCircle, Clock } from 'lucide-react';
import api from '../../utils/api';

const DriverPaymentsView = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/me');
      setPayments(res.data.data);
    } catch (err) {
      setError('Failed to fetch payments.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      <h2 style={{ marginBottom: '24px' }}>My Payments</h2>
      
      {payments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You have no payments yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {payments.map(payment => (
            <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} /> {payment.facility_name || 'Parking Facility'}
                </h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                  <span><strong>Amount:</strong> {payment.amount} {payment.currency}</span>
                  <span><strong>Method:</strong> {payment.payment_method === 'mtn_momo' ? 'MTN Mobile Money' : payment.payment_method}</span>
                  <span><strong>Ref:</strong> {payment.makypay_reference || 'N/A'}</span>
                  <span><strong>Date:</strong> {new Date(payment.initiated_at).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {payment.status === 'completed' || payment.status === 'successful' ? (
                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                    <CheckCircle size={16} /> Paid
                  </span>
                ) : (
                  <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                    <Clock size={16} /> {payment.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverPaymentsView;
