import React from 'react'
import { COLORS, DASHBOARD_GRADIENTS } from '@/lib/colors'
import { IconType } from 'react-icons'

interface DashboardHeaderProps {
  title: string
  subtitle: string
  userName?: string
  currentTime: Date
  icon?: IconType
  gradientType?: 'primary' | 'secondary' | 'hero' | 'heroAlt'
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  userName,
  currentTime,
  icon: Icon,
  gradientType = 'hero'
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const gradientStyle = DASHBOARD_GRADIENTS[gradientType]

  return (
    <div className="relative overflow-hidden rounded-3xl p-8 mb-8 shadow-xl" 
         style={{ background: gradientStyle }}>
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                {Icon ? (
                  <Icon className="text-3xl text-white" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {userName?.charAt(0) || title.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  {userName ? `${getGreeting()}, ${userName.split(' ')[0]}!` : title}
                </h1>
                <p className="text-white/90 text-lg mt-1">
                  {subtitle}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{formatTime(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">System Online</span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
    </div>
  )
}
