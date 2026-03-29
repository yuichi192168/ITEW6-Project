import React from 'react';
import { AlertCircle, CheckCircle, Info, Loader, XCircle } from 'lucide-react';

/**
 * Loading Spinner Component
 */
export const LoadingSpinner: React.FC<{ text?: string; fullScreen?: boolean }> = ({ text = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <Loader className="animate-spin text-primary" size={40} />
      <p className="text-gray-700 font-medium">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{content}</div>;
};

/**
 * Error Message Component
 */
interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onDismiss,
  variant = 'error'
}) => {
  const variantConfig = {
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: XCircle },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: AlertCircle },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Info },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`mb-6 p-4 ${config.bg} border ${config.border} rounded-lg flex gap-3`}>
      <Icon className={`${config.text} flex-shrink-0`} size={20} />
      <p className={`${config.text} text-sm flex-1`}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className={`${config.text} font-bold`}>
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * Success Message Component
 */
export const SuccessMessage: React.FC<{ message: string; onDismiss?: () => void }> = ({ message, onDismiss }) => {
  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
      <CheckCircle className="text-green-700 flex-shrink-0" size={20} />
      <p className="text-green-700 text-sm flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-green-700 font-bold">
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = <XCircle size={48} className="text-gray-400" />,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/**
 * Pagination Component
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (count: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange
}) => {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-t border-gray-200">
      <div className="flex items-center gap-4">
        {onItemsPerPageChange && (
          <div>
            <label className="text-sm text-gray-600 mr-2">Rows per page:</label>
            <select
              value={itemsPerPage || 10}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        )}
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

/**
 * Badge Component
 */
interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', size = 'sm' }) => {
  const variantClass = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`${variantClass[variant]} ${sizeClass[size]} rounded-full font-medium inline-block`}>
      {label}
    </span>
  );
};

/**
 * Card Component
 */
interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {title && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * Form Input Component
 */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      {helperText && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
    </div>
  );
};

/**
 * Section Header Component
 */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
