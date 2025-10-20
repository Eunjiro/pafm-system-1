import React from 'react'
import { IconType } from 'react-icons'
import { COLORS } from '@/lib/colors'

interface StatCardProps {
  title: string
  value: string | number
  icon: IconType
  color: 'primary' | 'secondary' | 'accent' | 'purple'
  subtitle?: string
  badge?: string
  loading?: boolean
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  badge,
  loading = false,
  onClick
}) => {
  const colorMap = {
    primary: {
      bg: 'bg-green-50',
      icon: COLORS.primary.DEFAULT,
      badge: 'bg-green-500',
    },
    secondary: {
      bg: 'bg-blue-50',
      icon: COLORS.secondary.DEFAULT,
      badge: 'bg-blue-500',
    },
    accent: {
      bg: 'bg-orange-50',
      icon: COLORS.accent.DEFAULT,
      badge: 'bg-orange-500',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: COLORS.purple.DEFAULT,
      badge: 'bg-purple-500',
    }
  }

  const colors = colorMap[color]

  return (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center`}>
          <Icon className="w-7 h-7" style={{ color: colors.icon }} />
        </div>
        {badge && (
          <div className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full text-white ${colors.badge}`}>
            <span>{badge}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {loading ? (
            <span className="inline-block animate-pulse bg-gray-200 h-9 w-20 rounded"></span>
          ) : (
            value
          )}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

interface ServiceCardProps {
  name: string
  description: string
  icon: IconType
  color: string
  status: string
  uptime?: string
  activeRequests?: number
  totalRecords?: number
  route?: string
  stats?: {
    pending: number
    processed: number
    today: number
  }
  onClick?: () => void
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  name,
  description,
  icon: Icon,
  color,
  status,
  uptime,
  activeRequests,
  totalRecords,
  stats,
  onClick
}) => {
  return (
    <div 
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-100 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="text-2xl" style={{ color }} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-gray-700">{name}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {status === 'healthy' ? '● Online' : '● Offline'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 font-medium">Uptime</p>
          <p className="text-lg font-bold text-gray-900">{uptime}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Active</p>
          <p className="text-lg font-bold text-gray-900">{activeRequests}</p>
        </div>
      </div>

      {stats && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Processed</p>
              <p className="text-lg font-bold text-green-600">{stats.processed}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Today</p>
              <p className="text-lg font-bold text-blue-600">{stats.today}</p>
            </div>
          </div>
        </div>
      )}

      {totalRecords && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Total Records: <span className="font-semibold text-gray-700">{totalRecords.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  icon: IconType
  color: 'primary' | 'secondary' | 'accent' | 'purple'
  href?: string
  onClick?: () => void
  badge?: string
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  icon: Icon,
  color,
  href,
  onClick,
  badge
}) => {
  const colorMap = {
    primary: {
      bg: 'bg-green-50 hover:bg-green-100',
      icon: COLORS.primary.DEFAULT,
      text: 'text-green-700',
    },
    secondary: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      icon: COLORS.secondary.DEFAULT,
      text: 'text-blue-700',
    },
    accent: {
      bg: 'bg-orange-50 hover:bg-orange-100',
      icon: COLORS.accent.DEFAULT,
      text: 'text-orange-700',
    },
    purple: {
      bg: 'bg-purple-50 hover:bg-purple-100',
      icon: COLORS.purple.DEFAULT,
      text: 'text-purple-700',
    }
  }

  const colors = colorMap[color]

  return (
    <div 
      className={`${colors.bg} rounded-xl p-6 transition-all duration-200 hover:shadow-lg cursor-pointer group relative`}
      onClick={onClick}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {badge}
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow">
          <Icon className="text-2xl" style={{ color: colors.icon }} />
        </div>
        <h3 className={`font-semibold ${colors.text}`}>{title}</h3>
      </div>
    </div>
  )
}
