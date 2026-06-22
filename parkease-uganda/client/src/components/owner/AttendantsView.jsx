import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Loader2, Trash2, Plus } from 'lucide-react';

const AttendantsView = ({ facility }) => {
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAttendants = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/facilities/${facility.id}/attendants`);
      setAttendants(res.data.data);
    } catch (err) {
      setError('Failed to fetch attendants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facility) {
      fetchAttendants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facility]);

  const handleAddAttendant = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post(`/facilities/${facility.id}/attendants`, { email });
      setSuccess('Attendant added successfully');
      setEmail('');
      fetchAttendants();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add attendant');
    }
  };

  const handleRemove = async (attendantId) => {
    if (!window.confirm('Are you sure you want to remove this attendant?')) return;
    try {
      await api.delete(`/facilities/${facility.id}/attendants/${attendantId}`);
      fetchAttendants();
    } catch (err) {
      setError('Failed to remove attendant');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      <h2 style={{ marginBottom: '24px' }}>Manage Attendants for {facility.name}</h2>
      
      {error && <div style={{ padding: '12px', background: 'var(--danger)', color: '#fff', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '12px', background: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

      <form onSubmit={handleAddAttendant} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <input 
          type="email" 
          placeholder="Attendant's Email Address" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)'
          }}
        />
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add Attendant
        </button>
      </form>

      {attendants.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No attendants assigned to this facility.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>Name</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>Email</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>Phone</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>Assigned</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendants.map(att => (
                <tr key={att.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>{att.full_name}</td>
                  <td style={{ padding: '16px' }}>{att.email}</td>
                  <td style={{ padding: '16px' }}>{att.phone_number || '-'}</td>
                  <td style={{ padding: '16px' }}>{new Date(att.assigned_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => handleRemove(att.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                      title="Remove Attendant"
                    >
                      <Trash2 size={18} />
                    </button>
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

export default AttendantsView;
