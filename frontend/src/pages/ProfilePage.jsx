import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Key, CheckCircle, Info } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operator Profile</h1>
          <p className="page-subtitle">Authenticated operator identity and authorization credentials</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        {/* User Info Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#fff',
            }}>
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user?.username || 'Operator'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span className="badge badge-success">ACTIVE SESSION</span>
                <span className="badge badge-created">{user?.role || 'CUSTOMER'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={16} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Email</div>
                <div style={{ fontWeight: 600 }}>{user?.email || 'N/A'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={16} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security Role</div>
                <div style={{ fontWeight: 600 }}>ROLE_{user?.role || 'CUSTOMER'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Key size={16} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Token Type</div>
                <div style={{ fontWeight: 600 }}>JSON Web Token (HMAC-SHA256)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Architecture Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--brand-cyan)' }}>
            <Info size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Security Architecture</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle size={16} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Password Hashing:</strong> Credentials are encrypted using BCrypt with secure salting before storage in PostgreSQL.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle size={16} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Stateless JWT:</strong> HTTP requests authenticate via signed bearer tokens in <code>Authorization: Bearer &lt;token&gt;</code> without server session storage.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle size={16} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Role-Based Access Control:</strong> Spring Method Security verifies role claims on protected endpoints.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
