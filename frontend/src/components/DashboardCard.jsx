import React from 'react';

const DashboardCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeType = 'success',
  gradientBorder = false,
}) => {
  return (
    <div
      className="metric-card"
      style={{
        borderTop: gradientBorder ? '3px solid var(--brand-blue)' : undefined,
      }}
    >
      <div className="metric-header">
        <span>{title}</span>
        {Icon && (
          <div className="metric-icon-wrap">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="metric-value">{value}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
        {subtext && <div className="metric-sub">{subtext}</div>}
        {badgeText && (
          <span className={`badge badge-${badgeType}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
