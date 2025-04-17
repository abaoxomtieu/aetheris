/**
 * API helper for local development and production environments
 */

/**
 * Gets the base URL for API requests based on the environment
 */
export function getApiBaseUrl(): string {
  // Check if running locally using Vite dev server
  if (import.meta.env.VITE_DEV_SERVER_URL) {
    // If running locally, API requests should go to port 5000 instead of 5173
    return 'http://localhost:5001/api';
  }
  
  // In production or Replit, the API is on the same origin
  return '/api';
}

/**
 * Creates a complete API URL
 * @param path - The API endpoint path (without /api prefix)
 * @returns Full API URL
 */
export function apiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}