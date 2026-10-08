import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'blue' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]',
    success: 'bg-[#e8f7f0] text-[#138a5b] border border-[#c2ebd7]',
    warning: 'bg-[#fff5df] text-[#b86b00] border border-[#fae2b4]',
    danger: 'bg-[#fff0f1] text-[#c83d4b] border border-[#fad1d5]',
    purple: 'bg-[#f0ebff] text-[#7653c9] border border-[#e0d6ff]',
    blue: 'bg-[#eef4f8] text-[#2C3E50] border border-[#BDC3C7]',
    neutral: 'bg-[#ECF0F1] text-[#7F8C8D] border border-[#BDC3C7]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium tracking-tight',
    md: 'text-xs px-2.5 py-0.5 rounded-full font-medium tracking-normal',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

export function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return <Badge variant="danger">Critical</Badge>;
    case 'HIGH':
      return <Badge variant="warning">High Priority</Badge>;
    case 'MEDIUM':
      return <Badge variant="blue">Medium Priority</Badge>;
    default:
      return <Badge variant="neutral">Low Priority</Badge>;
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
    case 'APPROVED_AFTER_RECONSIDERATION':
    case 'APPROVED_AFTER_ESCALATION':
    case 'RESOLVED':
    case 'CLOSED':
      return <Badge variant="success">{status.replace(/_/g, ' ')}</Badge>;
    case 'ESCALATED':
    case 'HIGHER_REVIEW_REQUESTED':
    case 'PENDING_HIGHER_REVIEW':
      return <Badge variant="purple">{status.replace(/_/g, ' ')}</Badge>;
    case 'REJECTED':
    case 'REJECTED_AFTER_RECONSIDERATION':
    case 'FINALLY_REJECTED':
      return <Badge variant="danger">{status.replace(/_/g, ' ')}</Badge>;
    case 'PENDING_MANAGER_RECONSIDERATION':
    case 'RECONSIDERATION_REQUESTED':
      return <Badge variant="warning">Reconsideration In Review</Badge>;
    case 'IN_PROGRESS':
    case 'PENDING_MANAGER_REVIEW':
      return <Badge variant="blue">In Review</Badge>;
    default:
      return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  }
}
