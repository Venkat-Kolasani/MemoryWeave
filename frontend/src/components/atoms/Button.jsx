/**
 * Button.jsx
 *
 * Primary interactive element. Supports 5 variants and 4 sizes with optional leading icon.
 *
 * Used by: all pages and layout components
 * Depends on: Icon
 */

import { useState } from 'react'
import Icon from './Icon.jsx'

const ICON_SIZE_BY_BUTTON = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
}

const SIZE_STYLES = {
  sm: { fontSize: 13, padding: '6px 12px' },
  md: { fontSize: 14, padding: '9px 18px' },
  lg: { fontSize: 15, padding: '12px 24px' },
  xl: { fontSize: 16, padding: '14px 28px' },
}

/**
 * Returns variant-specific styles based on hover state.
 * @param {string} variant
 * @param {boolean} isHovered
 */
function getVariantStyles(variant, isHovered) {
  switch (variant) {
    case 'primary':
      return {
        background: isHovered ? 'oklch(0% 0 0)' : 'var(--text-primary)',
        color: 'oklch(100% 0 0)',
        borderRadius: 8,
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
      }
    case 'secondary':
      return {
        background: isHovered ? 'var(--bg-tertiary)' : 'var(--surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: isHovered ? 'none' : 'var(--shadow-xs)',
      }
    case 'ghost':
      return {
        background: isHovered ? 'var(--bg-secondary)' : 'transparent',
        color: 'var(--text-secondary)',
        borderRadius: 8,
      }
    case 'accent':
      return {
        background: isHovered ? 'oklch(45% 0.14 240)' : 'var(--accent)',
        color: 'oklch(100% 0 0)',
        borderRadius: 8,
        boxShadow: isHovered ? '0 4px 12px oklch(50% 0.12 240 / 0.3)' : 'none',
      }
    case 'link':
      return {
        background: 'transparent',
        color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        padding: '0',
        borderRadius: 4,
        textDecoration: 'none',
      }
    default:
      return {}
  }
}

/**
 * Interactive button with design-system variants and optional icon.
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'link',
 *   size?: 'sm' | 'md' | 'lg' | 'xl',
 *   onClick?: () => void,
 *   style?: React.CSSProperties,
 *   icon?: string,
 *   disabled?: boolean,
 * }} props
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  style,
  icon,
  disabled = false,
}) {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    border: 'none',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
    opacity: disabled ? 0.5 : 1,
  }

  const sizeStyle = variant === 'link' ? {} : SIZE_STYLES[size]

  return (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex items-center"
      style={{
        ...baseStyle,
        ...getVariantStyles(variant, isHovered && !disabled),
        ...sizeStyle,
        ...style,
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon && (
        <Icon name={icon} size={ICON_SIZE_BY_BUTTON[size]} color="currentColor" />
      )}
      {children}
    </button>
  )
}
