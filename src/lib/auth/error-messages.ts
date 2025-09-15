// Common Supabase auth error messages mapping
export function getAuthErrorMessage(error: any): string {
  const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';

  // Network and parsing errors
  if (errorMessage.includes('Unexpected token') || errorMessage.includes('is not valid JSON')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Authentication errors
  if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (errorMessage.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for the verification link.';
  }

  if (errorMessage.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in or use a different email.';
  }

  // Rate limiting
  if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }

  // Password related
  if (errorMessage.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  if (errorMessage.includes('Signup disabled')) {
    return 'New registrations are temporarily disabled. Please try again later.';
  }

  // Session errors
  if (errorMessage.includes('refresh_token') || errorMessage.includes('session')) {
    return 'Your session has expired. Please sign in again.';
  }

  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return 'Server error occurred. Please try again later.';
  }

  if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
    return 'Service is temporarily unavailable. Please try again later.';
  }

  // CORS or configuration errors
  if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control')) {
    return 'Configuration error. Please contact support if this persists.';
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return 'Request timed out. Please check your connection and try again.';
  }

  // Email related
  if (errorMessage.includes('invalid email') || errorMessage.includes('Invalid email')) {
    return 'Please enter a valid email address.';
  }

  // Default fallback with slightly cleaned up message
  // Remove technical details like stack traces
  const cleanMessage = errorMessage.split('\n')[0].substring(0, 200);

  // If it's still too technical, return a generic message
  if (cleanMessage.includes('<!DOCTYPE') || cleanMessage.includes('<?xml') || cleanMessage.length > 100) {
    return 'An error occurred while connecting to the authentication service. Please try again.';
  }

  return cleanMessage;
}