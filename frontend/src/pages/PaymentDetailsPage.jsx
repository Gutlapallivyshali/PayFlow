import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  ArrowLeft,
  RotateCcw,
  Ban,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  History,
  FileText,
  Copy,
} from 'lucide-react';

const PaymentDetailsPage = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [isRetryConfirmOpen, setIsRetryConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const { success, error } = useToast();

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getDetail(id);
      setDetail(data);
    } catch (err) {
      error('Failed to load payment transaction details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleRetryConfirm = async () => {
    setActionLoading(true);
    try {
      const updated = await paymentService.retry(id);
      success(`Retry executed. Status: ${updated.status}`);
      setIsRetryConfirmOpen(false);
      fetchDetail();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to retry payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    setActionLoading(true);
    try {
      const updated = await paymentService.cancel(id);
      success('Payment transaction was cancelled');
      setIsCancelConfirmOpen(false);
      fetchDetail();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to cancel payment');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    success('Copied to clipboard');
  };

  if (loading) {
    return <LoadingSpinner message="Fetching payment and audit trail..." size="large" />;
  }

  if (!detail || !detail.payment) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Transaction Not Found</h2>
        <Link to="/payments" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Payments
        </Link>
      </div>
    );
  }

  const { payment, attempts = [], history = [] } = detail;
  const canRetry = payment.status === 'FAILED';
  const canCancel = payment.status === 'PENDING' || payment.status === 'CREATED';

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/payments" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={14} />
          <span>Back to Payments</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Payment #{payment.id}</span>
              <StatusBadge status={payment.status} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Idempotency Key: <span className="mono">{payment.idempotencyKey}</span>
              <button
                onClick={() => copyToClipboard(payment.idempotencyKey)}
                style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', verticalAlign: 'middle' }}
                title="Copy Key"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {canRetry && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsRetryConfirmOpen(true)}
                disabled={actionLoading}
              >
                <RotateCcw size={14} />
                <span>Retry Failed Payment</span>
              </button>
            )}

            {canCancel && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setIsCancelConfirmOpen(true)}
                disabled={actionLoading}
              >
                <Ban size={14} />
                <span>Cancel Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Amount Hero */}
        <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Charged Amount
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ${Number(payment.amount).toFixed(2)}{' '}
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{payment.currency}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment Rail</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-cyan)' }} className="mono">
              {payment.paymentMethod}
            </div>
          </div>
        </div>

        {/* Transaction Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Customer Profile</div>
            <Link to={`/customers/${payment.customerId}`} style={{ fontWeight: 600, color: 'var(--brand-cyan)' }}>
              {payment.customerName}
            </Link>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{payment.customerEmail}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Gateway Transaction Reference</div>
            <div className="mono" style={{ fontWeight: 600 }}>{payment.gatewayReference || 'None generated'}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Lock Version (Concurrency)</div>
            <div className="mono">v{payment.version} (Optimistic Locking)</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Initial Creation Timestamp</div>
            <div>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '—'}</div>
          </div>
        </div>

        {/* Decline Reason Banner if FAILED */}
        {payment.failureReason && (
          <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--status-failed)', fontSize: '0.85rem' }}>
            <strong>Gateway Decline Reason:</strong> {payment.failureReason}
          </div>
        )}
      </div>

      {/* Two Column Layout: Processing Attempts and Audit Log Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Processing Attempts Table */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RotateCcw size={16} />
            <span>Gateway Execution Attempts ({attempts.length})</span>
          </h3>

          {attempts.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attempt #</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>Gateway Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((att) => (
                    <tr key={att.id}>
                      <td style={{ fontWeight: 700 }}>Attempt #{att.attemptNumber}</td>
                      <td><StatusBadge status={att.status} /></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{att.latencyMs ? `${att.latencyMs}ms` : '—'}</td>
                      <td><span className="mono" style={{ fontSize: '0.75rem' }}>{att.gatewayReference || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No gateway attempts logged.
            </div>
          )}
        </div>

        {/* Chronological Audit Trail Timeline */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={16} />
            <span>State Machine Audit History ({history.length})</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Immutable trace of state transitions from creation to terminal resolution
          </p>

          <div className="timeline">
            {history.map((logItem) => (
              <div key={logItem.id} className="timeline-item">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-cyan)' }} className="mono">
                      {logItem.eventType}
                    </span>
                    <span className="timeline-time">
                      {new Date(logItem.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    {logItem.previousStatus && (
                      <>
                        <StatusBadge status={logItem.previousStatus} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                      </>
                    )}
                    <StatusBadge status={logItem.newStatus} />
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {logItem.eventDescription}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Actor: <span className="mono">{logItem.createdBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Retry Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRetryConfirmOpen}
        title="Retry Failed Transaction?"
        message="This will transition the payment state back to PENDING and re-dispatch it to the payment gateway engine with an incremented attempt counter."
        confirmText="Execute Retry"
        confirmVariant="btn-primary"
        isLoading={actionLoading}
        onConfirm={handleRetryConfirm}
        onCancel={() => setIsRetryConfirmOpen(false)}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        title="Cancel Pending Transaction?"
        message="Are you sure you want to cancel this pending payment? The payment state will be permanently marked as CANCELLED."
        confirmText="Cancel Payment"
        confirmVariant="btn-danger"
        isLoading={actionLoading}
        onConfirm={handleCancelConfirm}
        onCancel={() => setIsCancelConfirmOpen(false)}
      />
    </div>
  );
};

export default PaymentDetailsPage;
