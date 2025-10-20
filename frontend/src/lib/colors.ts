/**
 * Centralized Color System
 * 
 * This file contains all color definitions used throughout the application
 * to ensure consistency across all pages and components.
 */

// Main brand colors - System Primary Colors
export const COLORS = {
  // Primary Brand Color (Green) - Main actions, success states
  primary: {
    DEFAULT: '#4CAF50',
    light: '#81C784',
    lighter: '#C8E6C9',
    lightest: '#E8F5E9',
    dark: '#388E3C',
    darker: '#2E7D32',
  },
  
  // Secondary Brand Color (Blue) - Information, links
  secondary: {
    DEFAULT: '#4A90E2',
    light: '#64B5F6',
    lighter: '#BBDEFB',
    lightest: '#E3F2FD',
    dark: '#1976D2',
    darker: '#0D47A1',
  },
  
  // Accent Color (Orange/Amber) - Highlights, warnings
  accent: {
    DEFAULT: '#FDA811',
    light: '#FFB74D',
    lighter: '#FFE082',
    lightest: '#FFF8E1',
    dark: '#F57C00',
    darker: '#E65100',
  },
  
  // Purple - Special features, premium content
  purple: {
    DEFAULT: '#9C27B0',
    light: '#BA68C8',
    lighter: '#E1BEE7',
    lightest: '#F3E5F5',
    dark: '#7B1FA2',
    darker: '#4A148C',
  },
  
  // Neutral colors
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // System colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#FBFBFB',
}

// Status colors for application workflows
export const STATUS_COLORS = {
  // Positive/Success states
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    badge: 'bg-green-500',
    hex: '#4CAF50',
  },
  
  // Informational states
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badge: 'bg-blue-500',
    hex: '#4A90E2',
  },
  
  // Warning states
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    badge: 'bg-yellow-500',
    hex: '#FDD835',
  },
  
  // Attention/Pending states
  attention: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    badge: 'bg-orange-500',
    hex: '#FDA811',
  },
  
  // Error/Danger states
  danger: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    badge: 'bg-red-500',
    hex: '#F44336',
  },
  
  // Processing states
  processing: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    badge: 'bg-purple-500',
    hex: '#9C27B0',
  },
  
  // Neutral/Inactive states
  neutral: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    badge: 'bg-gray-500',
    hex: '#9E9E9E',
  },
}

// Application status mapping
export const APPLICATION_STATUS = {
  // Initial states
  DRAFT: STATUS_COLORS.neutral,
  SUBMITTED: STATUS_COLORS.warning,
  
  // Verification states
  PENDING_VERIFICATION: STATUS_COLORS.warning,
  VERIFIED: STATUS_COLORS.info,
  
  // Payment states
  FOR_PAYMENT: STATUS_COLORS.attention,
  PAID: STATUS_COLORS.processing,
  
  // Processing states
  PROCESSING: STATUS_COLORS.info,
  REGISTERED: STATUS_COLORS.processing,
  ISSUED: STATUS_COLORS.success,
  
  // Completion states
  FOR_PICKUP: STATUS_COLORS.success,
  CLAIMED: STATUS_COLORS.neutral,
  COMPLETED: STATUS_COLORS.success,
  
  // Negative states
  RETURNED: STATUS_COLORS.warning,
  REJECTED: STATUS_COLORS.danger,
  CANCELLED: STATUS_COLORS.danger,
}

// Service/Module colors for different microservices
export const SERVICE_COLORS = {
  cemetery: {
    primary: COLORS.primary.DEFAULT,
    gradient: 'from-green-600 to-green-700',
    light: COLORS.primary.lightest,
    icon: COLORS.primary.dark,
  },
  
  waterDrainage: {
    primary: COLORS.secondary.DEFAULT,
    gradient: 'from-blue-600 to-blue-700',
    light: COLORS.secondary.lightest,
    icon: COLORS.secondary.dark,
  },
  
  assetInventory: {
    primary: COLORS.accent.DEFAULT,
    gradient: 'from-orange-500 to-amber-600',
    light: COLORS.accent.lightest,
    icon: COLORS.accent.dark,
  },
  
  facilities: {
    primary: COLORS.purple.DEFAULT,
    gradient: 'from-purple-600 to-purple-700',
    light: COLORS.purple.lightest,
    icon: COLORS.purple.dark,
  },
  
  parks: {
    primary: '#43A047',
    gradient: 'from-green-500 to-emerald-600',
    light: '#E8F5E9',
    icon: '#2E7D32',
  },
}

// Dashboard gradient combinations
export const DASHBOARD_GRADIENTS = {
  primary: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
  secondary: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
  accent: 'linear-gradient(135deg, #FDA811 0%, #F57C00 100%)',
  purple: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
  
  // Multi-color gradients
  rainbow: 'linear-gradient(90deg, #4CAF50 0%, #4A90E2 35%, #FDA811 70%, #9C27B0 100%)',
  hero: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 100%)',
  heroAlt: 'linear-gradient(135deg, #4A90E2 0%, #9C27B0 100%)',
}

// Card/Component styling presets
export const CARD_STYLES = {
  default: 'bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300',
  elevated: 'bg-white rounded-3xl shadow-xl border-2 border-gray-100',
  flat: 'bg-white rounded-xl border border-gray-200',
  primary: 'bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200',
  secondary: 'bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200',
}

// Button styling presets
export const BUTTON_STYLES = {
  primary: 'bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg',
  secondary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg',
  accent: 'bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg',
  outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold py-2 px-6 rounded-lg transition-all duration-200',
  ghost: 'text-gray-700 hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg transition-all duration-200',
}

// Helper function to get status color
export const getStatusColor = (status: string) => {
  const upperStatus = status.toUpperCase().replace(/\s+/g, '_')
  return APPLICATION_STATUS[upperStatus as keyof typeof APPLICATION_STATUS] || STATUS_COLORS.neutral
}

// Helper function to get service color
export const getServiceColor = (service: keyof typeof SERVICE_COLORS) => {
  return SERVICE_COLORS[service] || SERVICE_COLORS.cemetery
}
