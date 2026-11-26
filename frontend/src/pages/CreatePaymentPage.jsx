import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { customerService } from '../services/customerService';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import {
  CreditCard,
  RefreshCw,
  Zap,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

const CreatePaymentPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Form fields
  const [customerId, setCustomerId] = useState(preselectedCustomerId || '');
  const [amount, setAmount] = useState('149.50');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('Cloud Infrastructure Usage Billing');
  const [paymentMethod, setPaymentMethod] = useState('MOCK_CARD');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { success, error } = useToast();
  const navigate = useNavigate();

  const generateNewKey = () => {
    const newKey = 'idem_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    setIdempotencyKey(newKey);
    setResult(null);
  };

  useEffect(() => {
    generateNewKey();

    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const data = await customerService.getAll({ page: 0, size: 50 });
        setCustomers(data.content || []);
        if (preselectedCustomerId) {
          setCustomerId(preselectedCustomerId);
        } else if (data.content && data.content.length > 0) {
          setCustomerId(String(data.content[0].id));
        }
      } catch (err) {
        console.error('Failed to load customers for payment selector:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [preselectedCustomerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResult(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Payment amount must be greater than zero ($0.01)');
      return;
    }

    if (!customerId) {
      setErrorMsg('Please select a customer');
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        customerId: Number(customerId),
        amount: parsedAmount.toFixed(2),
        currency,
        description,
        paymentMethod,
        idempotencyKey,
      };

      const response = await paymentService.create(payload, idempotencyKey);
      setResult(response);

      if (response.status === 'SUCCESS') {
        success(`Payment #${response.id} settled successfully!`);
      } else if (response.status === 'FAILED') {
        error(`Payment #${response.id} declined by gateway: ${response.failureReason || 'Declined'}`);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || 'Payment processing failed';
      setErrorMsg(serverMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCustomerObj = customers.find((c) => String(c.id) === String(customerId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Process New Payment</h1>
          <p className="page-subtitle">Submit transaction to MockPaymentGateway with idempotency validation</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem' }}>
        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Customer selector */}
            <div className="form-group">
              <label className="form-label" htmlFor="customer">Customer Profile *</label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={isProcessing || loadingCustomers}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.email}) — Status: {c.status}
                  </option>
                ))}
              </select>
              {selectedCustomerObj && selectedCustomerObj.status !== 'ACTIVE' && (
                <div className="form-error">
                  Warning: Customer account is {selectedCustomerObj.status}. Payments will be rejected by the backend.
                </div>
              )}
            </div>

            {/* Amount and Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="amount">Amount *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={isProcessing}
                    required
                    style={{ paddingLeft: '2rem', fontWeight: 600, fontSize: '1.1rem' }}
                  />
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                </div>
                <div className="form-hint">Tip: Amounts ≥ $10,000 simulate velocity decline limits.</div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="currency">Currency *</label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="desc">Description</label>
              <input
                id="desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Transaction purpose"
                disabled={isProcessing}
              />
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label className="form-label">Payment Rail / Method *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {['MOCK_CARD', 'MOCK_UPI', 'MOCK_WALLET'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className="card"
                    style={{
                      padding: '0.85rem 0.5rem',
                      textAlign: 'center',
                      borderColor: paymentMethod === method ? 'var(--brand-blue)' : 'var(--border-color)',
                      backgroundColor: paymentMethod === method ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: paymentMethod === method ? '#fff' : 'var(--text-secondary)' }}>
                      {method.replace('MOCK_', '')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Idempotency Key Section */}
            <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={16} color="var(--brand-cyan)" />
                  <span>Idempotency-Key Header</span>
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={generateNewKey}
                  disabled={isProcessing}
                  title="Generate a fresh unique idempotency key"
                >
                  <RefreshCw size={13} />
                  <span>New Key</span>
                </button>
              </div>

              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                placeholder="Unique key for request deduplication"
                disabled={isProcessing}
                className="mono"
                style={{ fontSize: '0.82rem' }}
                required
              />
              <div className="form-hint" style={{ marginTop: '0.5rem' }}>
                Submitting the exact same key again tests <strong>idempotent replay</strong> without creating duplicate payments.
              </div>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--status-failed)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Payment Processing Error:</div>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isProcessing}
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={18} style={{ animation: 'pf-spin 1s linear infinite' }} />
                  <span>Executing Gateway Settlement Simulation...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Charge ${Number(amount || 0).toFixed(2)} {currency}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Result or Educational Card */}
        <div>
          {result ? (
            <div className="card" style={{ borderLeft: `4px solid ${result.status === 'SUCCESS' ? 'var(--status-success)' : 'var(--status-failed)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {result.status === 'SUCCESS' ? (
                  <CheckCircle size={24} color="var(--status-success)" />
                ) : (
                  <AlertCircle size={24} color="var(--status-failed)" />
                )}
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {result.status === 'SUCCESS' ? 'Payment Settled Successfully' : 'Payment Declined'}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payment ID:</span>
                  <span className="mono" style={{ fontWeight: 700 }}>#{result.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Final Status:</span>
                  <StatusBadge status={result.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount Charged:</span>
                  <span style={{ fontWeight: 700 }}>${Number(result.amount).toFixed(2)} {result.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                  <span>{result.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Gateway Reference:</span>
                  <span className="mono" style={{ fontSize: '0.78rem' }}>{result.gatewayReference || '—'}</span>
                </div>
                {result.failureReason && (
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--status-failed)' }}>
                    <strong>Decline Reason:</strong> {result.failureReason}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Idempotency Key:</span>
                  <span className="mono" style={{ fontSize: '0.75rem' }}>{result.idempotencyKey}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <Link to={`/payments/${result.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  <span>Inspect Audit Trail</span>
                  <ArrowRight size={14} />
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  title="Resubmit with exactly same idempotency key"
                >
                  Test Idempotent Replay
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--brand-cyan)' }}>
                <Info size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Payment Engine Simulator</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
                When you click <strong>Charge</strong>, PayFlow runs an atomic 10-step payment pipeline:
              </p>
              <ol style={{ paddingLeft: '1.25rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                <li>Client transmits idempotency key and payment payload.</li>
                <li>Backend executes validation on amount, currency, and fields.</li>
                <li>Customer status is checked (must be <strong>ACTIVE</strong>).</li>
                <li>Database checks unique <code>idempotency_key</code> index.</li>
                <li>Payment record created in <code>CREATED</code> state.</li>
                <li>Audit log written: <code>PAYMENT_CREATED</code>.</li>
                <li>Payment transitioned to <code>PENDING</code>.</li>
                <li>Dispatched to <code>MockPaymentGateway</code>.</li>
                <li>Gateway settles or declines and returns reference.</li>
                <li>Atomic update to <code>SUCCESS</code> or <code>FAILED</code> and audit recorded.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePaymentPage;
