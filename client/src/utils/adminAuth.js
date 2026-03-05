/**
 * What it is: Admin login helper (stores/reads admin token in the browser).
 * Non-tech note: This keeps the admin logged in on this device.
 */

export const ADMIN_TOKEN_STORAGE_KEY = 'adminToken'

export /**
 * Purpose: Get Admin Token
 * Plain English: What this function is used for.
 */
const getAdminToken = () => {
    try {
		return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
	} catch {
		return null
	}
};

export /**
 * Purpose: Check whether Admin Authenticated
 * Plain English: What this function is used for.
 */
const isAdminAuthenticated = () => {
    return Boolean(getAdminToken());
};

export /**
 * Purpose: Set Admin Token
 * Plain English: What this function is used for.
 */
const setAdminToken = token => {
    try {
		localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, String(token))
		// Backward-compat with old access-code-based flow
		localStorage.setItem('isAdmin', 'true')
	} catch {
		// ignore
	}
};

export /**
 * Purpose: Do Clear Admin Token
 * Plain English: What this function is used for.
 */
const clearAdminToken = () => {
    try {
		localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
		localStorage.removeItem('isAdmin')
	} catch {
		// ignore
	}
};

export /**
 * Purpose: Get Admin Auth Headers
 * Plain English: What this function is used for.
 */
const getAdminAuthHeaders = (baseHeaders = {}) => {
    const token = getAdminToken()
    if (!token) return { ...(baseHeaders || {}) }
    return { ...(baseHeaders || {}), Authorization: `Bearer ${token}` }
};

export /**
 * Purpose: Do Admin Fetch
 * Plain English: What this function is used for.
 */
const adminFetch = (url, options = {}) => {
    const headers = getAdminAuthHeaders(options.headers || {})
    return fetch(url, { ...options, headers })
};
