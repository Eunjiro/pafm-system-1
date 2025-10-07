import { getSession } from 'next-auth/react'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const headers = await this.getAuthHeaders()

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.error || 'An error occurred',
          message: data.message || `HTTP ${response.status}`,
        }
      }

      return { data }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Failed to connect to server',
      }
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health')
  }

  // Auth methods
  async register(userData: {
    email: string
    password: string
    fullNameFirst: string
    fullNameLast: string
    fullNameMiddle?: string
    contactNo?: string
    address?: string
  }): Promise<ApiResponse> {
    return this.post('/api/auth/register', userData)
  }

  async login(credentials: {
    email: string
    password: string
  }): Promise<ApiResponse> {
    return this.post('/api/auth/login', credentials)
  }

  async socialLogin(socialData: {
    email: string
    providerId: string
    provider: string
    fullNameFirst: string
    fullNameLast: string
    fullNameMiddle?: string
  }): Promise<ApiResponse> {
    return this.post('/api/auth/social-login', socialData)
  }

  async verifyToken(): Promise<ApiResponse> {
    return this.get('/api/auth/verify')
  }

  // User management
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
    isActive?: boolean
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const endpoint = `/api/users${queryParams.toString() ? `?${queryParams}` : ''}`
    return this.get(endpoint)
  }

  async getUser(id: number): Promise<ApiResponse> {
    return this.get(`/api/users/${id}`)
  }

  async updateUser(id: number, userData: any): Promise<ApiResponse> {
    return this.put(`/api/users/${id}`, userData)
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    return this.delete(`/api/users/${id}`)
  }

  async getUserStats(): Promise<ApiResponse> {
    return this.get('/api/users/stats/overview')
  }

  // Death registrations (placeholder for future implementation)
  async getDeathRegistrations(): Promise<ApiResponse> {
    return this.get('/api/death-registrations')
  }

  async createDeathRegistration(data: any): Promise<ApiResponse> {
    return this.post('/api/death-registrations', data)
  }

  // Permits (placeholder for future implementation)
  async getPermits(): Promise<ApiResponse> {
    return this.get('/api/permits')
  }

  async createPermit(data: any): Promise<ApiResponse> {
    return this.post('/api/permits', data)
  }

  // Certificates (placeholder for future implementation)
  async getCertificates(): Promise<ApiResponse> {
    return this.get('/api/certificates')
  }

  async createCertificate(data: any): Promise<ApiResponse> {
    return this.post('/api/certificates', data)
  }

  // Cemetery plots (placeholder for future implementation)
  async getPlots(params?: {
    status?: string
    section?: string
    search?: string
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const endpoint = `/api/plots${queryParams.toString() ? `?${queryParams}` : ''}`
    return this.get(endpoint)
  }

  async getPlot(id: number): Promise<ApiResponse> {
    return this.get(`/api/plots/${id}`)
  }

  async updatePlot(id: number, data: any): Promise<ApiResponse> {
    return this.put(`/api/plots/${id}`, data)
  }

  async assignPlot(id: number, data: any): Promise<ApiResponse> {
    return this.post(`/api/plots/${id}/assign`, data)
  }
}

// Create a singleton instance
const apiClient = new ApiClient()

export default apiClient
export type { ApiResponse }