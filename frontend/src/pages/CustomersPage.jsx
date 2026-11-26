import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Power,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetStatusChange, setTargetStatusChange] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ fullName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await customerService.getAll(params);
      setCustomers(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchCustomers();
  };

  const handleOpenAddModal = () => {
    setFormData({ fullName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (e, customer) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      email: customer.email,
      phoneNumber: customer.phoneNumber || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenStatusConfirm = (e, customer) => {
    e.stopPropagation();
    const nextStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTargetStatusChange({ customer, nextStatus });
    setIsConfirmOpen(true);
  };

  const handleStatusChangeConfirm = async () => {
    if (!targetStatusChange) return;
    setSubmitting(true);
    try {
      await customerService.updateStatus(targetStatusChange.customer.id, targetStatusChange.nextStatus);
      success(`Customer marked as ${targetStatusChange.nextStatus}`);
      setIsConfirmOpen(false);
      fetchCustomers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update customer status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await customerService.create(formData);
      success('Customer registered successfully');
      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await customerService.update(selectedCustomer.id, formData);
      success('Customer profile updated');
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Customer ID',
      key: 'id',
      width: '120px',
      render: (row) => <span className="mono">#{row.id}</span>,
    },
    {
      header: 'Full Name',
      key: 'fullName',
      render: (row) => (
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {row.fullName}
        </div>
      ),
    },
    {
      header: 'Email Address',
      key: 'email',
      render: (row) => <span style={{ color: 'var(--text-secondary)' }}>{row.email}</span>,
    },
    {
      header: 'Phone',
      key: 'phoneNumber',
      render: (row) => <span>{row.phoneNumber || '—'}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      width: '120px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Created Date',
      key: 'createdAt',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      width: '160px',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => handleOpenEditModal(e, row)}
            title="Edit customer"
          >
            <Edit2 size={13} />
          </button>
          <button
            className={`btn btn-sm ${row.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={(e) => handleOpenStatusConfirm(e, row)}
            title={row.status === 'ACTIVE' ? 'Deactivate customer' : 'Activate customer'}
          >
            <Power size={13} />
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/customers/${row.id}`)}
            title="View details"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Accounts</h1>
          <p className="page-subtitle">Manage customer profiles, eligibility status, and associated payment records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchCustomers} title="Refresh list">
            <RefreshCw size={15} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
            <UserPlus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by customer name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ width: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Customers Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="No customer accounts found matching criteria."
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} title="Register New Customer" onClose={() => setIsAddModalOpen(false)}>
        {formError && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--status-failed)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateCustomer}>
          <div className="form-group">
            <label className="form-label" htmlFor="add-name">Full Name *</label>
            <input
              id="add-name"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Rachel Adams"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-email">Email Address *</label>
            <input
              id="add-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="rachel.adams@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-phone">Phone Number (Optional)</label>
            <input
              id="add-phone"
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+1-555-0199"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-status">Initial Status</label>
            <select
              id="add-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE (Can initiate payments)</option>
              <option value="INACTIVE">INACTIVE (Blocked from payments)</option>
            </select>
          </div>
          <div className="modal-footer" style={{ marginInline: '-1.5rem', marginBottom: '-1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} title="Edit Customer Profile" onClose={() => setIsEditModalOpen(false)}>
        {formError && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--status-failed)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {formError}
          </div>
        )}
        <form onSubmit={handleUpdateCustomer}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-name">Full Name *</label>
            <input
              id="edit-name"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-email">Email Address *</label>
            <input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-phone">Phone Number</label>
            <input
              id="edit-phone"
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>
          <div className="modal-footer" style={{ marginInline: '-1.5rem', marginBottom: '-1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Change Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={targetStatusChange?.nextStatus === 'INACTIVE' ? 'Deactivate Customer Account?' : 'Activate Customer Account?'}
        message={
          targetStatusChange?.nextStatus === 'INACTIVE'
            ? `Customer "${targetStatusChange?.customer?.fullName}" will no longer be allowed to initiate new payment transactions until reactivated.`
            : `Customer "${targetStatusChange?.customer?.fullName}" will be granted permission to initiate payment transactions.`
        }
        confirmText={targetStatusChange?.nextStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'}
        confirmVariant={targetStatusChange?.nextStatus === 'INACTIVE' ? 'btn-danger' : 'btn-primary'}
        isLoading={submitting}
        onConfirm={handleStatusChangeConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

export default CustomersPage;
