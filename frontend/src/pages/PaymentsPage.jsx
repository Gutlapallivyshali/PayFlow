import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import {
  Search,
  PlusCircle,
  Filter,
  RefreshCw,
  ChevronRight,
  Calendar,
  X,
} from 'lucide-react';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const { error } = useToast();
  const navigate = useNavigate();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await paymentService.getAll(params);
      setPayments(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      error('Failed to load payments list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchPayments();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const columns = [
    {
      header: 'Payment ID',
      key: 'id',
      width: '110px',
      render: (row) => <span className="mono">#{row.id}</span>,
    },
    {
      header: 'Customer',
      key: 'customerName',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.customerName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.customerEmail}</div>
        </div>
      ),
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (row) => (
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
          ${Number(row.amount).toFixed(2)}{' '}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{row.currency}</span>
        </div>
      ),
    },
    {
      header: 'Method',
      key: 'paymentMethod',
      render: (row) => <span className="mono" style={{ fontSize: '0.8rem' }}>{row.paymentMethod}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Gateway Reference',
      key: 'gatewayReference',
      render: (row) => (
        <span className="mono" style={{ fontSize: '0.75rem' }} title={row.gatewayReference}>
          {row.gatewayReference ? row.gatewayReference.substring(0, 18) + '...' : '—'}
        </span>
      ),
    },
    {
      header: 'Created At',
      key: 'createdAt',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      header: '',
      key: 'action',
      width: '60px',
      align: 'right',
      render: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(`/payments/${row.id}`)}
          title="View transaction details"
        >
          <ChevronRight size={14} />
        </button>
      ),
    },
  ];

  const hasActiveFilters = Boolean(search || statusFilter || startDate || endDate);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Transactions</h1>
          <p className="page-subtitle">Inspect transaction state machines, settlement references, and gateway outcomes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchPayments} title="Refresh records">
            <RefreshCw size={15} />
          </button>
          <Link to="/payments/create" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Process Payment</span>
          </Link>
        </div>
      </div>

      {/* Filter and Query Control Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <label className="form-label">Search Query</label>
              <input
                type="text"
                placeholder="ID, customer, gateway ref, or key..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '2.25rem', color: 'var(--text-muted)' }} />
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="CREATED">Created</option>
              </select>
            </div>

            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            {hasActiveFilters && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
                <X size={14} />
                <span>Clear Filters</span>
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm">
              <Filter size={14} />
              <span>Apply Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage="No payment transactions match the active search filters."
        onRowClick={(row) => navigate(`/payments/${row.id}`)}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
};

export default PaymentsPage;
