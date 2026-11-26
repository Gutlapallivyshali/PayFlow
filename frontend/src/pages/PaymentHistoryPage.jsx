import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { History, Search, ArrowRight, ShieldCheck, Clock, ExternalLink } from 'lucide-react';

const PaymentHistoryPage = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [paymentIdInput, setPaymentIdInput] = useState(initialId || '1');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState(initialId || '1');
  const [recentPayments, setRecentPayments] = useState([]);

  const { error } = useToast();

  const fetchHistory = async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    try {
      const data = await paymentService.getHistory(idToFetch);
      setAuditLogs(data || []);
      setActivePaymentId(idToFetch);
    } catch (err) {
      error(`Failed to fetch audit history for Payment #${idToFetch}`);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load some recent payments for quick navigation
    const loadRecent = async () => {
      try {
        const list = await paymentService.getAll({ page: 0, size: 5 });
        setRecentPayments(list.content || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadRecent();

    if (paymentIdInput) {
      fetchHistory(paymentIdInput);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (paymentIdInput.trim()) {
      fetchHistory(paymentIdInput.trim());
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction Audit Trail</h1>
          <p className="page-subtitle">Inspect immutable event-driven state transitions, actor signatures, and gateway logs</p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="form-label" htmlFor="payment-id">Payment ID to Inspect</label>
            <div style={{ position: 'relative' }}>
              <input
                id="payment-id"
                type="number"
                min="1"
                placeholder="e.g. 1"
                value={paymentIdInput}
                onChange={(e) => setPaymentIdInput(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <span>Retrieve Audit Trail</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Quick select pills */}
        {recentPayments.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick Select:</span>
            {recentPayments.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn btn-sm ${activePaymentId === String(p.id) ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                onClick={() => {
                  setPaymentIdInput(String(p.id));
                  fetchHistory(p.id);
                }}
              >
                Payment #{p.id} ({p.status})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Display */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="var(--brand-cyan)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Audit History for Transaction #{activePaymentId}
            </h2>
          </div>
          <Link to={`/payments/${activePaymentId}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>View Full Payment</span>
            <ExternalLink size={13} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Retrieving event logs..." />
        ) : auditLogs.length > 0 ? (
          <div className="timeline" style={{ paddingLeft: '2.5rem' }}>
            {auditLogs.map((log) => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-cyan)', fontSize: '0.85rem' }}>
                        {log.eventType}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {log.previousStatus && (
                          <>
                            <StatusBadge status={log.previousStatus} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                          </>
                        )}
                        <StatusBadge status={log.newStatus} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    {log.eventDescription}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Audit Record ID: <span className="mono">#{log.id}</span></span>
                    <span>Triggered By: <span className="mono">{log.createdBy || 'SYSTEM'}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No audit logs found for Payment #{activePaymentId}.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
