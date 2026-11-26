import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toUpperCase();
  let badgeClass = 'badge-created';

  switch (normalized) {
    case 'SUCCESS':
      badgeClass = 'badge-success';
      break;
    case 'FAILED':
      badgeClass = 'badge-failed';
      break;
    case 'PENDING':
      badgeClass = 'badge-pending';
      break;
    case 'CANCELLED':
      badgeClass = 'badge-cancelled';
      break;
    case 'ACTIVE':
      badgeClass = 'badge-active';
      break;
    case 'INACTIVE':
      badgeClass = 'badge-inactive';
      break;
    case 'CREATED':
    default:
      badgeClass = 'badge-created';
      break;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      {normalized}
    </span>
  );
};

export default StatusBadge;
