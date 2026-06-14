const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type ApiRequestOptions = RequestInit & {
  query?: Record<string, string | number | undefined>
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value.toString())
      }
    })
  }
  return url.toString()
}

function getAccessToken() {
  return window.localStorage.getItem('insiderguard_access_token')
}

function getRefreshToken() {
  return window.localStorage.getItem('insiderguard_refresh_token')
}

function setTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem('insiderguard_access_token', accessToken)
  window.localStorage.setItem('insiderguard_refresh_token', refreshToken)
}

function clearTokens() {
  window.localStorage.removeItem('insiderguard_access_token')
  window.localStorage.removeItem('insiderguard_refresh_token')
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { query, ...fetchOptions } = options
  const response = await fetch(buildUrl(path, query), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  })

  if (response.status === 204) {
    return (null as unknown) as T
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.detail || response.statusText || 'API request failed')
  }

  return payload as T
}

async function authRequest<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken()
  const headers = {
    Authorization: token ? `Bearer ${token}` : undefined,
    ...options.headers,
  }

  try {
    return await request<T>(path, { ...options, headers })
  } catch (error: unknown) {
    if (retry && error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      const refreshed = await refreshToken()
      if (refreshed) {
        return authRequest<T>(path, options, false)
      }
    }
    throw error
  }
}

export async function login(username: string, password: string) {
  const payload = await request<{ access_token: string; refresh_token: string; token_type: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setTokens(payload.access_token, payload.refresh_token)
  return payload
}

export async function refreshToken() {
  const refresh = getRefreshToken()
  if (!refresh) return false
  try {
    const payload = await request<{ access_token: string; refresh_token: string; token_type: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token: refresh }),
    })
    setTokens(payload.access_token, payload.refresh_token)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export function logout() {
  clearTokens()
}

export async function getProfile() {
  return authRequest<{ id: number; username: string; email: string; role: string | null }>('/auth/me')
}

export async function getUsers() {
  return authRequest<UserSummary[]>('/users/')
}

export async function getAccessLogs(limit = 100, offset = 0, username?: string, action?: string) {
  return authRequest<AccessLogPayload[]>('/access-logs/', {
    method: 'GET',
    query: {
      limit,
      offset,
      username,
      action,
    },
  })
}

export async function getAlerts(status_filter?: string, severity?: string, query?: string, limit = 100, offset = 0) {
  return authRequest<AlertPayload[]>('/alerts/', {
    method: 'GET',
    query: {
      status_filter,
      severity,
      query,
      limit,
      offset,
    },
  })
}

export async function getRiskScores() {
  return authRequest<RiskScorePayload[]>('/risk-score/')
}

export async function getInvestigations() {
  return authRequest<InvestigationPayload[]>('/investigation/')
}

export async function queryChat(query: string, sessionId?: number) {
  return authRequest<{ session_id: number; query: string; response: string; source_documents: { [key: string]: unknown }[] }>('/chat/query', {
    method: 'POST',
    body: JSON.stringify({ query, session_id: sessionId }),
  })
}

export async function generateReport(reportType: string) {
  return authRequest<{ generated_at: string; report_type: string; file_url: string; metadata: Record<string, unknown> }>('/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ report_type: reportType }),
  })
}

export async function getAnomalies(limit = 100, offset = 0) {
  return authRequest<AccessLogPayload[]>('/anomalies/', {
    method: 'GET',
  })
}

export type UserSummary = {
  id: number
  username: string
  email: string
  full_name?: string | null
  role?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AccessLogPayload = {
  id: number
  user_id?: number
  username: string
  role: string
  department: string
  resource: string
  action: string
  ip_address: string
  location: string
  device: string
  records_accessed: number
  session_duration: number
  anomaly_score?: number
  risk_score?: number
  metadata?: Record<string, unknown> | null
  created_at: string
}

export type AlertPayload = {
  id: number
  access_log_id?: number
  user_id?: number
  username: string
  severity: string
  risk_score: number
  title: string
  description: string
  status: string
  recommendations: string[]
  created_at: string
  resolved_at?: string | null
  assigned_to?: string | null
}

export type RiskScorePayload = {
  id: number
  user_id: number
  score: number
  category: string
  explanation: string
  factors: Record<string, unknown>[]
  created_at: string
}

export type InvestigationPayload = {
  id: number
  alert_id?: number
  user_id?: number
  summary: string
  risk_explanation: string
  root_cause: string
  recommendations: string[]
  status: string
  created_at: string
  completed_at?: string | null
  ai_report?: string | null
}

export type ChatResponsePayload = {
  session_id: number
  query: string
  response: string
  source_documents: Record<string, unknown>[]
}
