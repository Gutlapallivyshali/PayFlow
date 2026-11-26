import React, { useState, useEffect } from 'react';
import { gatewayService } from '../services/gatewayService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Settings, Sliders, Server, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const SettingsPage = () => {
  const [gatewayConfig, setGatewayConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const { success, error } = useToast();

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await gatewayService.getConfig();
      setGatewayConfig(data);
    } catch (err) {
      console.warn('Could not load gateway config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggleFailure = async () => {
    setToggling(true);
    try {
      const result = await gatewayService.toggleFailure();
      setGatewayConfig((prev) => ({ ...prev, forceFailure: result.forceFailure }));
      if (result.forceFailure) {
        success('Gateway Failure Simulation: ENABLED (All new payments will be declined)');
      } else {
        success('Gateway Failure Simulation: DISABLED (Normal settlement restored)');
      }
    } catch (err) {
      error('Failed to toggle gateway mode');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading system configuration..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform &amp; Gateway Settings</h1>
          <p className="page-subtitle">Configure Mock Payment Gateway behavior, test failure scenarios, and view runtime telemetry</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem' }}>
        {/* Gateway Simulation Controls */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Sliders size={20} color="var(--brand-cyan)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Gateway Engine Controls</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>Simulated Gateway Decline Mode</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Force mock payment gateway to simulate upstream network decline for all incoming transactions
                </div>
              </div>

              <button
                type="button"
                className={`btn btn-sm ${gatewayConfig?.forceFailure ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleToggleFailure}
                disabled={toggling}
              >
                {gatewayConfig?.forceFailure ? 'Decline Mode ON' : 'Normal Settlement'}
              </button>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Gateway Provider</div>
                <div className="mono" style={{ fontWeight: 600, marginTop: '0.2rem' }}>
                  {gatewayConfig?.providerName || 'MOCK_GATEWAY_V1'}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)' }}>Simulated Latency</div>
                <div className="mono" style={{ fontWeight: 600, marginTop: '0.2rem' }}>
                  {gatewayConfig?.defaultLatencyMs || 100} ms
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Environment */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Server size={20} color="var(--brand-blue)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Runtime Environment</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Backend Framework:</span>
              <span style={{ fontWeight: 600 }}>Spring Boot 3.2.5 (Java 17 LTS)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Database Layer:</span>
              <span style={{ fontWeight: 600 }}>PostgreSQL / Flyway Schema Migrations</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Frontend Stack:</span>
              <span style={{ fontWeight: 600 }}>React 18 + Vite 5</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>API Documentation:</span>
              <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
                SpringDoc OpenAPI 3.0
              </a>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Concurrency Control:</span>
              <span style={{ fontWeight: 600 }}>Optimistic Versioning (@Version)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Idempotency Guard:</span>
              <span style={{ fontWeight: 600 }}>Database Unique Key Constraint</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
