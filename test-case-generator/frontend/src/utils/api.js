// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
/**
 * Shared Authorized Fetch Helper
 * Automatically injects the JWT token from localStorage into requests.
 * 
 * @param {string} url - The target endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {function} onUnauthorized - Optional callback for 401 errors
 */
export const authFetch = async (url, options = {}, onUnauthorized = null) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const res = await fetch(url, { ...options, headers });
        
        if (res.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (onUnauthorized) {
                onUnauthorized();
            } else {
                // Fallback: reload page to trigger redirect to login if no callback provided
                window.location.reload();
            }
            throw new Error('Session expired. Please login again.');
        }
        
        return res;
    } catch (err) {
        console.error('API request error:', err);
        throw err;
    }
};