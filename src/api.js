const AUTH_KEY = 'ezze/auth'

export const loadAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null } catch { return null }
}
export const saveAuth = (a) => { try { a ? localStorage.setItem(AUTH_KEY, JSON.stringify(a)) : localStorage.removeItem(AUTH_KEY) } catch { /* ignore */ } }

export class ApiError extends Error {
  constructor(status, message, detail) { super(message); this.status = status; this.detail = detail }
}

export async function api(path, { method = 'GET', body, token } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection.')
  }
  if (res.status === 204) return null
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = json.detail
    throw new ApiError(res.status, typeof d === 'string' ? d : d?.message || 'Something went wrong', d)
  }
  return json
}
