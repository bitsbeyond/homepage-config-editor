// Utility functions for making API calls

// In-memory storage for access token (more secure than localStorage)
let accessToken = null;

/**
 * Sets the access token in memory.
 * @param {string} token - The access token to store.
 */
function setAccessToken(token) {
    accessToken = token;
}

/**
 * Retrieves the stored access token from memory.
 * @returns {string|null} The access token or null if not found.
 */
function getAccessToken() {
    return accessToken;
}

/**
 * Clears the access token from memory.
 */
function clearAccessToken() {
    accessToken = null;
}

/**
 * Legacy function for backward compatibility.
 * @deprecated Use getAccessToken() instead.
 */
function getToken() {
    return getAccessToken();
}

/**
 * Attempts to refresh the access token using the refresh token cookie.
 * @returns {Promise<boolean>} True if refresh was successful, false otherwise.
 */
async function refreshAccessToken() {
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include' // Include cookies (refresh token)
        });

        if (response.ok) {
            const data = await response.json();
            setAccessToken(data.accessToken);
            console.log('Access token refreshed successfully');
            return true;
        } else {
            console.log('Token refresh failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

/**
 * Performs an authenticated API request with automatic token refresh.
 * Handles attaching the access token and automatic refresh on 401 errors.
 *
 * @param {string} url - The API endpoint URL (e.g., '/api/services').
 * @param {object} options - Optional fetch options (method, body, etc.).
 * @param {boolean} isRetry - Internal flag to prevent infinite retry loops.
 * @returns {Promise<any>} The parsed JSON response data.
 * @throws {Error} If the request fails or returns an error status.
 */
async function apiRequest(url, options = {}, isRetry = false) {
    const token = getAccessToken();
    const headers = { ...options.headers };

    // Only add Content-Type if there's a body being sent
    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include' // Include cookies for refresh token
        });

        // Check for non-OK status codes (4xx, 5xx)
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: response.statusText };
            }

            // Handle 401 Unauthorized
            if (response.status === 401 && !isRetry) {
                // If the original request was a login attempt, don't try to refresh.
                // Propagate the original error (e.g., "Invalid email or password").
                if (url === '/api/auth/login') {
                    const error = new Error(errorData?.error || errorData?.message || 'Login failed.');
                    error.status = 401;
                    error.data = errorData;
                    throw error;
                }

                console.log("Access token potentially expired, attempting refresh...");
                const refreshSuccess = await refreshAccessToken();
                
                if (refreshSuccess) {
                    // Retry the original request with new token
                    return apiRequest(url, options, true);
                } else {
                    // Refresh failed - user needs to log in again
                    clearAccessToken();
                    const error = new Error('Session expired. Please log in again.');
                    error.status = 401;
                    error.needsLogin = true;
                    throw error;
                }
            }

            // Handle 423 Locked (Account Lockout)
            if (response.status === 423) {
                const error = new Error(errorData?.error || 'Account temporarily locked.');
                error.status = 423;
                error.data = errorData;
                error.isAccountLocked = true;
                throw error;
            }

            const error = new Error(errorData?.error || errorData?.message || `HTTP error ${response.status}`);
            error.status = response.status;
            error.data = errorData;
            throw error;
        }

        // Handle cases with no content (e.g., 204 No Content)
        if (response.status === 204) {
            return null;
        }

        return await response.json();

    } catch (error) {
        console.error(`API request failed: ${options.method || 'GET'} ${url}`, error);
        throw error;
    }
}

// --- Specific API Functions ---

/** Fetches the services configuration */
export async function fetchServicesApi() {
    return apiRequest('/api/services');
}

/** Saves the entire services configuration */
export async function saveServicesApi(servicesData) {
    return apiRequest('/api/services', {
        method: 'POST',
        body: JSON.stringify(servicesData),
    });
}

/** Fetches the bookmarks configuration */
export async function fetchBookmarksApi() {
    return apiRequest('/api/bookmarks');
}

/** Saves the entire bookmarks configuration */
export async function saveBookmarksApi(bookmarksData) {
    return apiRequest('/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify(bookmarksData),
    });
}

/** Fetches the widgets configuration */
export async function fetchWidgetsApi() {
    return apiRequest('/api/widgets');
}

/** Saves the entire widgets configuration */
export async function saveWidgetsApi(widgetsData) {
    return apiRequest('/api/widgets', {
        method: 'POST',
        body: JSON.stringify(widgetsData),
    });
}

/** Fetches the settings configuration */
export async function fetchSettingsApi() {
    return apiRequest('/api/settings');
}

/** Saves the entire settings configuration */
export async function saveSettingsApi(settingsData) {
    return apiRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify(settingsData),
    });
}

/** Saves the order of items within a specific service group */
export async function saveServiceGroupOrderApi(groupName, orderedItems) {
    const encodedGroupName = encodeURIComponent(groupName);
    return apiRequest(`/api/services/group/${encodedGroupName}/order`, {
        method: 'PUT',
        body: JSON.stringify({ items: orderedItems }),
    });
}

/** Saves the order of items within a specific bookmark group */
export async function saveBookmarkGroupOrderApi(groupName, orderedItems) {
    const encodedGroupName = encodeURIComponent(groupName);
    return apiRequest(`/api/bookmarks/group/${encodedGroupName}/order`, {
        method: 'PUT',
        body: JSON.stringify({ items: orderedItems }),
    });
}

/** Saves the order of all bookmark groups (updates bookmarks.yaml) */
export async function saveBookmarkGroupsOrderApi(orderedGroupNames) {
    return apiRequest('/api/bookmarks/groups-order', {
        method: 'PUT',
        body: JSON.stringify({ orderedGroupNames }),
    });
}

/** Saves the order of all service groups (updates services.yaml) */
export async function saveServiceGroupsOrderApi(orderedGroupNames) {
    return apiRequest('/api/services/groups-order', {
        method: 'PUT',
        body: JSON.stringify({ orderedGroupNames }),
    });
}

/** Renames a group across all relevant configuration files */
export async function renameGroupApi(oldName, newName) {
    const encodedOldName = encodeURIComponent(oldName);
    return apiRequest(`/api/settings/groups/${encodedOldName}/rename`, {
        method: 'PUT',
        body: JSON.stringify({ newName }),
    });
}

/** Deletes a group across all relevant configuration files */
export async function deleteGroupApi(groupName) {
    const encodedGroupName = encodeURIComponent(groupName);
    return apiRequest(`/api/settings/groups/${encodedGroupName}`, {
        method: 'DELETE',
    });
}

/** Fetches the list of environment variable keys found in the .env file */
export async function fetchEnvKeysApi() {
    return apiRequest('/api/env');
}
// --- Raw File API Functions ---

/** Lists available raw configuration files */
export async function listRawFiles() {
    return apiRequest('/api/files');
}

/** Gets the raw content of a specific file */
export async function getRawFileContent(filename) {
    // Ensure filename is properly encoded for the URL
    const encodedFilename = encodeURIComponent(filename);
    return apiRequest(`/api/files/${encodedFilename}`);
}

/** Saves raw content to a specific file */
export async function saveRawFileContent(filename, content) {
    const encodedFilename = encodeURIComponent(filename);
    return apiRequest(`/api/files/${encodedFilename}`, {
        method: 'PUT',
        body: JSON.stringify({ content }), // Send content within a JSON object
    });
}

/** Fetches the commit history for a specific raw file */
export async function getFileHistoryApi(filename) {
    const encodedFilename = encodeURIComponent(filename);
    return apiRequest(`/api/files/${encodedFilename}/history`);
}

/** Triggers a rollback for a specific file to a given commit hash */
export async function rollbackFileApi(filename, commitHash) {
    const encodedFilename = encodeURIComponent(filename);
    return apiRequest(`/api/files/${encodedFilename}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ commitHash }),
    });
}

/** Updates the authenticated user's email address */
export async function updateUserEmailApi(newEmail, currentPassword) {
    return apiRequest('/api/users/me/email', {
        method: 'PUT',
        body: JSON.stringify({ newEmail, currentPassword }),
    });
}

// Export generic request function and token helpers
export {
    apiRequest,
    getToken,
    getAccessToken,
    setAccessToken,
    clearAccessToken,
    refreshAccessToken
};