import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  PlusCircle,
  Power,
  Trash2,
  ExternalLink,
} from 'lucide-react';

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const [customerData, paymentsData] = await Promise.all([
        customerService.getById(id),
        customerService.getPayments(id, { page: 0, size: 20 }),
      ]);
      setCustomer(customerData);
      setPayments(paymentsData.content || []);
    } catch (err) {
      error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    const nextStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setSubmitting(true);
    try {
      const updated = await customerService.updateStatus(id, nextStatus);
      setCustomer(updated);
      success(`Customer status changed to ${nextStatus}`);
      setIsStatusConfirmOpen(false);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await customerService.deleteCustomer(id);
      success('Customer deleted successfully');
      navigate('/customers');
    } catch (err) {
      error(err.response?.data?.message || 'Could not delete customer with associated payment history');
      setIsDeleteConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading customer account profile..." size="large" />;
  }

  if (!customer) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Customer Not Found</h2>
        <Link to="/customers" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/customers" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={14} />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--brand-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
            }}>
              {customer.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{customer.fullName}</h1>
                <StatusBadge status={customer.status} />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Customer Account ID: <span className="mono">#{customer.id}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to={`/payments/create?customerId=${customer.id}`}
              className="btn btn-primary btn-sm"
              style={{ pointerEvents: customer.status === 'ACTIVE' ? 'auto' : 'none', opacity: customer.status === 'ACTIVE' ? 1 : 0.5 }}
            >
              <PlusCircle size={15} />
              <span>Initiate Payment</span>
            </Link>
            <button
              className={`btn btn-sm ${customer.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setIsStatusConfirmOpen(true)}
            >
              <Power size={14} />
              <span>{customer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsDeleteConfirmOpen(true)}
              title="Delete customer if no transactions exist"
            >
              <Trash2 size={14} color="var(--status-failed)" />
            </button>
          </div>
        </div>

        {/* Contact info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Mail size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{customer.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Phone size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{customer.phoneNumber || 'Not provided'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Since</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CreditCard size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment History</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{payments.length} transactions recorded</div>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Payments Section */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          Transaction History ({payments.length})
        </h3>

        {payments.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Gateway Ref</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td><span className="mono">#{p.id}</span></td>
                    <td style={{ fontWeight: 700 }}>${Number(p.amount).toFixed(2)} {p.currency}</td>
                    <td><span className="mono">{p.paymentMethod}</span></td>
                    <td><StatusBadge status={p.status} /></td>
                    <td><span className="mono" style={{ fontSize: '0.75rem' }}>{p.gatewayReference || '—'}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      <Link to={`/payments/${p.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            No payments have been recorded for this customer account yet.
          </div>
        )}
      </div>

      {/* Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={isStatusConfirmOpen}
        title={customer.status === 'ACTIVE' ? 'Deactivate Customer?' : 'Activate Customer?'}
        message={
          customer.status === 'ACTIVE'
            ? 'Deactivating this customer will immediately prevent any new payments from being processed for this account.'
            : 'Activating this customer will allow new payment transactions to be processed.'
        }
        confirmText={customer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        confirmVariant={customer.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}
        isLoading={submitting}
        onConfirm={handleToggleStatus}
        onCancel={() => setIsStatusConfirmOpen(false)}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Customer Account?"
        message="Notice: Deletion is strictly restricted if any payment transaction records exist for this customer, in accordance with financial audit compliance."
        confirmText="Attempt Delete"
        confirmVariant="btn-danger"
        isLoading={submitting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default CustomerDetailsPage;
