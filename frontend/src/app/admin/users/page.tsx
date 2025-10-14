"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  FiUsers, FiUser, FiUserPlus, FiUserCheck, FiUserX,
  FiEdit, FiTrash2, FiEye, FiSearch, FiFilter,
  FiRefreshCw, FiDownload, FiMail, FiPhone,
  FiCalendar, FiSettings, FiLock, FiUnlock,
  FiShield, FiStar, FiActivity, FiAlertCircle
} from 'react-icons/fi'
import { 
  MdPerson, MdPersonAdd, MdSecurity, MdVerifiedUser,
  MdAdminPanelSettings, MdWork, MdAccountCircle,
  MdGroup, MdNotifications, MdHistory
} from 'react-icons/md'
import Link from "next/link"

interface User {
  id: string
  email: string
  fullNameFirst: string
  fullNameMiddle?: string
  fullNameLast: string
  // Legacy support for firstName/lastName
  firstName?: string
  middleName?: string
  lastName?: string
  role: 'ADMIN' | 'EMPLOYEE' | 'CITIZEN' | 'admin' | 'employee' | 'citizen'
  isActive?: boolean
  status?: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  avatar?: string
  contactNo?: string
  contactNumber?: string
  address?: string
  dateOfBirth?: string
  department?: string
  position?: string
  employeeId?: string
  organization?: string
  permissions?: string[]
  lastLogin?: string
  createdAt: string
  updatedAt: string
  emailVerified?: boolean
  twoFactorEnabled?: boolean
  loginAttempts?: number
  lastFailedLogin?: string
  notes?: string
}

interface UserActivity {
  id: string
  userId: string
  action: string
  module: string
  description: string
  ipAddress: string
  userAgent: string
  timestamp: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'users' | 'activities'>('users')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/users')
        
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        
        const data = await response.json()
        setUsers(data.users || [])

        // Fetch activities
        const activitiesResponse = await fetch('/api/users/activities')
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json()
          setActivities(activitiesData.activities || [])
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        setUsers([])
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleUserStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      console.log('Updating user status:', userId, newStatus)
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          status: newStatus as any,
          updatedAt: new Date().toISOString()
        } : user
      ))
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const handleUserDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      console.log('Deleting user:', userId)
      setUsers(prev => prev.filter(user => user.id !== userId))
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const userRole = (user.role || '').toLowerCase()
    const userStatus = user.status || (user.isActive ? 'active' : 'inactive')
    
    const matchesRole = filterRole === 'all' || userRole === filterRole || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || userStatus === filterStatus
    
    // Use fullNameFirst/fullNameLast from database, fallback to firstName/lastName
    const firstName = user.fullNameFirst || user.firstName || ''
    const lastName = user.fullNameLast || user.lastName || ''
    const email = user.email || ''
    
    const matchesSearch = 
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.department?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.organization?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesRole && matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'suspended': 'bg-red-100 text-red-800',
      'pending_verification': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRoleColor = (role: string) => {
    const normalizedRole = (role || '').toLowerCase()
    const colors = {
      'admin': 'text-red-600',
      'employee': 'text-blue-600',
      'citizen': 'text-green-600'
    }
    return colors[normalizedRole as keyof typeof colors] || 'text-gray-600'
  }

  const getRoleIcon = (role: string) => {
    const normalizedRole = (role || '').toLowerCase()
    switch (normalizedRole) {
      case 'admin':
        return <MdAdminPanelSettings size={16} />
      case 'employee':
        return <MdWork size={16} />
      case 'citizen':
        return <MdPerson size={16} />
      default:
        return <MdAccountCircle size={16} />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-purple-600">
                <MdGroup size={28} />
              </span>
              User Management
            </h1>
            <p className="text-gray-600">Manage system users, roles, permissions, and activities</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <span className="mr-2">
                <FiRefreshCw size={16} />
              </span>
              Refresh
            </button>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('users')}
                className={`px-3 py-2 ${viewMode === 'users' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="mr-1">
                  <FiUsers size={16} />
                </span>
                Users
              </button>
              <button
                onClick={() => setViewMode('activities')}
                className={`px-3 py-2 ${viewMode === 'activities' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="mr-1">
                  <FiActivity size={16} />
                </span>
                Activities
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90 flex items-center"
              style={{backgroundColor: '#4CAF50'}}
            >
              <span className="mr-2">
                <FiUserPlus size={16} />
              </span>
              Add User
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-purple-600 mr-3">
                <FiUsers size={20} />
              </span>
              <div>
                <p className="text-sm text-purple-600">Total Users</p>
                <p className="text-xl font-bold text-purple-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 mr-3">
                <MdAdminPanelSettings size={20} />
              </span>
              <div>
                <p className="text-sm text-red-600">Admins</p>
                <p className="text-xl font-bold text-red-900">
                  {users.filter(u => (u.role || '').toLowerCase() === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-blue-600 mr-3">
                <MdWork size={20} />
              </span>
              <div>
                <p className="text-sm text-blue-600">Employees</p>
                <p className="text-xl font-bold text-blue-900">
                  {users.filter(u => (u.role || '').toLowerCase() === 'employee').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-600 mr-3">
                <MdPerson size={20} />
              </span>
              <div>
                <p className="text-sm text-green-600">Citizens</p>
                <p className="text-xl font-bold text-green-900">
                  {users.filter(u => (u.role || '').toLowerCase() === 'citizen').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-3">
                <FiAlertCircle size={20} />
              </span>
              <div>
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="text-xl font-bold text-yellow-900">
                  {users.filter(u => (u.status || (u.isActive ? 'active' : 'inactive')) === 'pending_verification').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Search users, email, employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">
                <FiFilter size={16} />
              </span>
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="citizen">Citizen</option>
              </select>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending_verification">Pending Verification</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="mr-2">
                <FiDownload size={16} />
              </span>
              Export Users
            </button>
            <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="mr-2">
                <MdHistory size={16} />
              </span>
              Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      {viewMode === 'users' && (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {(user.fullNameFirst || user.firstName || 'U')[0]}{(user.fullNameLast || user.lastName || 'N')[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.fullNameFirst || user.firstName} {user.fullNameMiddle || user.middleName} {user.fullNameLast || user.lastName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || (user.isActive ? 'active' : 'inactive'))}`}>
                          {(user.status || (user.isActive ? 'active' : 'inactive')).replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`flex items-center text-sm font-medium ${getRoleColor(user.role?.toLowerCase() || 'citizen')}`}>
                          <span className="mr-1">
                            {getRoleIcon(user.role?.toLowerCase() || 'citizen')}
                          </span>
                          {(user.role || 'CITIZEN').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                      {user.employeeId && (
                        <p className="text-sm text-gray-600">
                          {user.employeeId} • {user.department} • {user.position}
                        </p>
                      )}
                      {user.organization && (
                        <p className="text-sm text-gray-600">{user.organization}</p>
                      )}
                      {(user.contactNo || user.contactNumber) && (
                        <p className="text-sm text-gray-600">{user.contactNo || user.contactNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {user.lastLogin && (
                      <p>Last login: {new Date(user.lastLogin).toLocaleDateString()}</p>
                    )}
                    <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {(user.permissions || []).slice(0, 3).map((perm, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {perm.replace('_', ' ')}
                        </span>
                      ))}
                      {(user.permissions || []).length > 3 && (
                        <span className="text-xs text-gray-500">+{(user.permissions || []).length - 3} more</span>
                      )}
                      {(!user.permissions || user.permissions.length === 0) && (
                        <span className="text-xs text-gray-500">Role-based permissions</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Security</p>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                        Email {user.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className={`text-xs ${user.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                        2FA {user.twoFactorEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Login Attempts</p>
                    <p className="text-sm text-gray-600">
                      {user.loginAttempts || 0} failed attempts
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowUserModal(true)
                      }}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span className="mr-1">
                        <FiEye size={14} />
                      </span>
                      View Details
                    </button>
                    <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="mr-1">
                        <FiEdit size={14} />
                      </span>
                      Edit
                    </button>
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleUserStatusUpdate(user.id, 'suspended')}
                        className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <span className="mr-1">
                          <FiLock size={14} />
                        </span>
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserStatusUpdate(user.id, 'active')}
                        className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <span className="mr-1">
                          <FiUnlock size={14} />
                        </span>
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleUserDelete(user.id)}
                      className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <span className="mr-1">
                        <FiTrash2 size={14} />
                      </span>
                      Delete
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    {user.notes && (
                      <span className="text-xs text-gray-500">Has notes</span>
                    )}
                    <span className="text-xs text-gray-500">
                      Updated: {new Date(user.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activities View */}
      {viewMode === 'activities' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent User Activities</h2>
            <div className="space-y-3">
              {activities.map((activity) => {
                const user = users.find(u => u.id === activity.userId)
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {(user?.fullNameFirst || user?.firstName || 'U')[0]}{(user?.fullNameLast || user?.lastName || 'N')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.fullNameFirst || user?.firstName} {user?.fullNameLast || user?.lastName} • {activity.action.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Module: {activity.module}</span>
                        <span>IP: {activity.ipAddress}</span>
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && viewMode === 'users' && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <span className="mx-auto text-gray-400 mb-4 block">
            <FiUsers size={48} />
          </span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">No users match your current search and filter criteria.</p>
        </div>
      )}
    </div>
  )
}