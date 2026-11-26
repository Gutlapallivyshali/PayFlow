import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CreditCard,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  ArrowRight,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(7);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumData, trendsData, recentData] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getTrends(trendDays),
        dashboardService.getRecent(),
      ]);
      setSummary(sumData);
      setTrends(trendsData);
      setRecentPayments(recentData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [trendDays]);

  if (loading && !summary) {
    return <LoadingSpinner message="Calculating real-time transaction metrics..." size="large" />;
  }

  // Calculate maximum volume for trend chart scaling
  const maxVolume = Math.max(...(trends.map((t) => Number(t.volume) || 0)), 100);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Real-time settlement telemetry, liquidity volume, and payment state distribution</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData} title="Refresh metrics">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <Link to="/payments/create" className="btn btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>New Payment</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <DashboardCard
          title="Total Volume (Settled)"
          value={`$${Number(summary?.totalVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Cumulative successful transactions"
          icon={DollarSign}
          gradientBorder={true}
        />
        <DashboardCard
          title="Success Rate"
          value={`${summary?.successRate || 0}%`}
          subtext={`${summary?.successfulPayments || 0} of ${summary?.totalPayments || 0} succeeded`}
          icon={TrendingUp}
          badgeText={summary?.successRate >= 80 ? 'Optimal' : 'Investigate'}
          badgeType={summary?.successRate >= 80 ? 'success' : 'failed'}
        />
        <DashboardCard
          title="Total Transactions"
          value={summary?.totalPayments || 0}
          subtext={`Avg: $${Number(summary?.averageAmount || 0).toFixed(2)}`}
          icon={CreditCard}
        />
        <DashboardCard
          title="Active Customers"
          value={summary?.totalCustomers || 0}
          subtext="Verified account profiles"
          icon={Users}
        />
      </div>

      {/* Status Breakdown Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Transaction Status Distribution
        </h3>
        <div style={{ display: 'flex', height: '14px', borderRadius: 'var(--radius-full)', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: '1rem' }}>
          {summary?.totalPayments > 0 ? (
            <>
              <div
                style={{
                  width: `${(summary.successfulPayments / summary.totalPayments) * 100}%`,
                  backgroundColor: 'var(--status-success)',
                  transition: 'width 0.4s ease'
                }}
                title={`Success: ${summary.successfulPayments}`}
              />
              <div
                style={{
                  width: `${(summary.failedPayments / summary.totalPayments) * 100}%`,
                  backgroundColor: 'var(--status-failed)',
                  transition: 'width 0.4s ease'
                }}
                title={`Failed: ${summary.failedPayments}`}
              />
              <div
                style={{
                  width: `${(summary.pendingPayments / summary.totalPayments) * 100}%`,
                  backgroundColor: 'var(--status-pending)',
                  transition: 'width 0.4s ease'
                }}
                title={`Pending: ${summary.pendingPayments}`}
              />
              <div
                style={{
                  width: `${(summary.cancelledPayments / summary.totalPayments) * 100}%`,
                  backgroundColor: 'var(--status-cancelled)',
                  transition: 'width 0.4s ease'
                }}
                title={`Cancelled: ${summary.cancelledPayments}`}
              />
            </>
          ) : (
            <div style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-success)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Success:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{summary?.successfulPayments || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-failed)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Failed:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{summary?.failedPayments || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-pending)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Pending:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{summary?.pendingPayments || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-cancelled)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Cancelled:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{summary?.cancelledPayments || 0}</span>
          </div>
        </div>
      </div>

      {/* Trends Chart & Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>Settlement Volume Trends</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily settled liquidity volume in USD</p>
            </div>
            <select
              value={trendDays}
              onChange={(e) => setTrendDays(Number(e.target.value))}
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '190px', paddingTop: '1.5rem' }}>
            {trends.map((item, index) => {
              const heightPercent = maxVolume > 0 ? (Number(item.volume) / maxVolume) * 100 : 0;
              return (
                <div key={item.date || index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brand-cyan)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {Number(item.volume) > 0 ? `$${Math.round(item.volume)}` : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '32px',
                      height: `${Math.max(4, heightPercent)}%`,
                      backgroundColor: 'var(--brand-blue)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      background: 'linear-gradient(to top, rgba(59, 130, 246, 0.4), var(--brand-blue))',
                    }}
                    title={`${item.date}: $${item.volume} (${item.successCount} success / ${item.totalCount} total)`}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', whiteSpace: 'nowrap' }}>
                    {item.date ? item.date.substring(5) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Gateway Status & Engine Highlights */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Payment Engine Architecture
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Core resilience patterns active in this runtime
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Idempotency Protection</span>
                <span className="badge badge-success">ACTIVE</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Unique constraints enforce safe retries and block double-charging.
              </p>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Optimistic Lock Concurrency</span>
                <span className="badge badge-success">VERSIONED</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Atomic version counters prevent race conditions during state transitions.
              </p>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Audit Trail &amp; Attempt Logging</span>
                <span className="badge badge-success">IMMUTABLE</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Every transition event is written to dedicated audit history logs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Transactions</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Latest transactions across all customer accounts</p>
          </div>
          <Link to="/payments" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Gateway Ref</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length > 0 ? (
                recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/payments/${p.id}`} style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
                        #{p.id}
                      </Link>
                    </td>
                    <td>
                      <div>{p.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.customerEmail}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      ${Number(p.amount).toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.currency}</span>
                    </td>
                    <td>
                      <span className="mono">{p.paymentMethod}</span>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '0.75rem' }}>
                        {p.gatewayReference || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
