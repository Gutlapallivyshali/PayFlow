import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ExternalLink, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--status-success)',
          padding: '0.25rem 0.65rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
          SANDBOX SIMULATOR
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <ShieldCheck size={14} color="var(--brand-cyan)" />
          Idempotency Engine Active
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <a
          href="http://localhost:8080/swagger-ui.html"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
        >
          <span>OpenAPI Docs</span>
          <ExternalLink size={14} />
        </a>

        <Link to="/payments/create" className="btn btn-primary btn-sm">
          <PlusCircle size={15} />
          <span>New Payment</span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
