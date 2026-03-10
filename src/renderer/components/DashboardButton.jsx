import { UnstyledButton, Text, Box } from '@mantine/core';
import PropTypes from 'prop-types';
import { memo } from 'react';

/**
 * DashboardButton Component
 * Responsive navigation button for the dashboard with proper text scaling.
 * Uses horizontal layout for longer labels and flexible sizing.
 *
 * @param {string} label - Button text label
 * @param {React.ReactNode} icon - Optional icon element
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} variant - Button color variant
 */
function DashboardButton({ label, icon, onClick, disabled = false, variant = 'default' }) {
  // Color mapping for different button categories
  const colorSchemes = {
    administration: {
      bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      hoverBg: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      text: '#ffffff',
      iconBg: 'rgba(255,255,255,0.2)',
    },
    transaction: {
      bg: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      hoverBg: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
      text: '#ffffff',
      iconBg: 'rgba(255,255,255,0.2)',
    },
    user: {
      bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      hoverBg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
      text: '#ffffff',
      iconBg: 'rgba(255,255,255,0.2)',
    },
    report: {
      bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      hoverBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      text: '#ffffff',
      iconBg: 'rgba(255,255,255,0.2)',
    },
    default: {
      bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      hoverBg: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
      text: '#ffffff',
      iconBg: 'rgba(255,255,255,0.2)',
    },
  };

  const scheme = colorSchemes[variant] || colorSchemes.default;

  return (
    <UnstyledButton
      onClick={onClick}
      disabled={disabled}
      style={{
        background: scheme.bg,
        borderRadius: '8px',
        padding: '10px 16px',
        width: '100%',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
      }}
      className="hover:shadow-md active:scale-[0.98]"
    >
      {/* Icon */}
      {icon && (
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: scheme.text,
            opacity: 0.9,
          }}
        >
          {icon}
        </Box>
      )}

      {/* Label */}
      <Text
        fw={500}
        size="sm"
        style={{
          color: scheme.text,
          lineHeight: 1.3,
          flex: 1,
        }}
      >
        {label}
      </Text>
    </UnstyledButton>
  );
}

DashboardButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.node,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['administration', 'transaction', 'user', 'report', 'default']),
};

export default memo(DashboardButton);
