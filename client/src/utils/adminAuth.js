export const ADMIN_TOKEN_STORAGE_KEY = 'adminToken'

export const getAdminToken = () => {
	try {
		return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
	} catch {
		return null
	}
}

export const isAdminAuthenticated = () => Boolean(getAdminToken())

export const setAdminToken = (token) => {
	try {
		localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, String(token))
		// Backward-compat with old access-code-based flow
		localStorage.setItem('isAdmin', 'true')
	} catch {
		// ignore
	}
}

export const clearAdminToken = () => {
	try {
		localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
		localStorage.removeItem('isAdmin')
	} catch {
		// ignore
	}
}

export const getAdminAuthHeaders = (baseHeaders = {}) => {
	const token = getAdminToken()
	if (!token) return { ...(baseHeaders || {}) }
	return { ...(baseHeaders || {}), Authorization: `Bearer ${token}` }
}

export const adminFetch = (url, options = {}) => {
	const headers = getAdminAuthHeaders(options.headers || {})
	return fetch(url, { ...options, headers })
}
