import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../utils/api';

const PaymentsView = ({ facility }) => {
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('mobile_money');
  const [mobilePhone, setMobilePhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  
  // Verification State
  const [verificationStep, setVerificationStep] = useState(false);
  const [withdrawalId, setWithdrawalId] = useState(null);
  const [otp, setOtp] = useState('');
  const [last4, setLast4] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    if (!facility) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [paymentsRes, withdrawalsRes] = await Promise.all([
          api.get(`/payments/facility/${facility.id}`),
          api.get(`/withdrawals`)
        ]);
        setPayments(paymentsRes.data.data);
        setWithdrawals(withdrawalsRes.data.data);
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [facility]);

  const handleInitiateWithdrawal = async () => {
    setWithdrawError('');
    setWithdrawLoading(true);
    try {
      const payload = {
        amount: parseFloat(withdrawAmount),
        withdrawal_method: withdrawMethod,
        mobile_phone: mobilePhone,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName
      };
      const res = await api.post('/withdrawals/initiate', payload);
      setWithdrawalId(res.data.data.withdrawal.id);
      setVerificationStep(true);
    } catch (err) {
      setWithdrawError(err.response?.data?.message || err.response?.data?.error || 'Failed to initiate withdrawal');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleVerifyWithdrawal = async () => {
    setWithdrawError('');
    setWithdrawLoading(true);
    try {
      const payload = {
        otp: withdrawMethod === 'mobile_money' ? otp : undefined,
        last4: withdrawMethod === 'bank' ? last4 : undefined
      };
      await api.post(`/withdrawals/${withdrawalId}/verify`, payload);
      alert('Withdrawal verified and processing initiated.');
      setShowWithdrawModal(false);
      setVerificationStep(false);
      // Refresh data
      const withdrawalsRes = await api.get(`/withdrawals`);
      setWithdrawals(withdrawalsRes.data.data);
    } catch (err) {
      setWithdrawError(err.response?.data?.message || err.response?.data?.error || 'Failed to verify withdrawal');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (!facility) return <div>Please select a facility</div>;
  if (loading) return <div>Loading payments...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', minHeight: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Payments History</h2>
        <button className="btn-primary" onClick={() => setShowWithdrawModal(true)}>
          Withdraw Funds
        </button>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Withdrawals</h3>
        {withdrawals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No withdrawals yet.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Method</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>{new Date(w.initiated_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{w.withdrawal_method.replace('_', ' ')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{w.amount} {w.currency}</td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <span className={`badge ${w.status === 'completed' ? 'badge-success' : w.status === 'pending' ? 'badge-warning' : w.status === 'timedout' ? 'badge-info' : 'badge-danger'}`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Payments</h3>
      {payments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No payments found for this facility.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Driver</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Slot</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-color)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '12px 16px' }}>{new Date(payment.initiated_at).toLocaleDateString()} {new Date(payment.initiated_at).toLocaleTimeString()}</td>
                  <td style={{ padding: '12px 16px' }}>{payment.driver_name} <br/><small style={{ color: 'var(--text-muted)' }}>{payment.phone_number}</small></td>
                  <td style={{ padding: '12px 16px' }}>{payment.slot_number || 'Auto'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{payment.amount} {payment.currency}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <span className={`badge ${payment.status === 'completed' ? 'badge-success' : payment.status === 'pending' ? 'badge-warning' : payment.status === 'timedout' ? 'badge-info' : 'badge-danger'}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', position: 'relative', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => { setShowWithdrawModal(false); setVerificationStep(false); }} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'var(--danger)', fontSize: '18px', fontWeight: 'bold', zIndex: 10 }}>
              ✕
            </button>
            
            <h3 style={{ marginBottom: '24px', paddingRight: '24px' }}>Withdraw Funds</h3>

            {withdrawError && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{withdrawError}</div>}

            {!verificationStep ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label>Amount (UGX)</label>
                  <input type="number" className="input-field" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="e.g. 50000" />
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <button className={withdrawMethod === 'mobile_money' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1 }} onClick={() => setWithdrawMethod('mobile_money')}>
                    Mobile Money
                  </button>
                  <button className={withdrawMethod === 'bank' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1 }} onClick={() => setWithdrawMethod('bank')}>
                    Bank Account
                  </button>
                </div>

                {withdrawMethod === 'mobile_money' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label>Mobile Money Phone Number</label>
                    <input type="text" className="input-field" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} placeholder="256700000000" />
                  </div>
                )}

                {withdrawMethod === 'bank' && (
                  <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label>Bank Name</label>
                      <input type="text" className="input-field" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Stanbic Bank" />
                    </div>
                    <div>
                      <label>Account Number</label>
                      <input type="text" className="input-field" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} placeholder="xxxx-xxxx-xxxx" />
                    </div>
                    <div>
                      <label>Account Name</label>
                      <input type="text" className="input-field" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="John Doe" />
                    </div>
                  </div>
                )}

                <button className="btn-primary" style={{ width: '100%' }} onClick={handleInitiateWithdrawal} disabled={withdrawLoading || !withdrawAmount}>
                  {withdrawLoading ? 'Processing...' : 'Initiate Withdrawal'}
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '24px' }}>
                  {withdrawMethod === 'mobile_money' ? (
                    <>
                      <label>Enter OTP sent to {mobilePhone} (Hint: use 1234)</label>
                      <input type="text" className="input-field" value={otp} onChange={e => setOtp(e.target.value)} placeholder="1234" />
                    </>
                  ) : (
                    <>
                      <label>Verify Bank: Enter last 4 digits of your linked card</label>
                      <input type="text" className="input-field" value={last4} onChange={e => setLast4(e.target.value)} placeholder="e.g. 4242" />
                    </>
                  )}
                </div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={handleVerifyWithdrawal} disabled={withdrawLoading}>
                  {withdrawLoading ? 'Verifying...' : 'Verify & Withdraw'}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PaymentsView;
