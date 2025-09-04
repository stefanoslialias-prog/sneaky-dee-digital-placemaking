/**
 * XSS Protection utilities for user-generated content
 */

/**
 * Sanitize text input to prevent XSS attacks
 * @param input - The text input to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized text
 */
export const sanitizeTextInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove common XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .substring(0, maxLength); // Enforce length limit
};

/**
 * Validate and sanitize email input
 * @param email - Email to validate and sanitize
 * @returns Sanitized email or null if invalid
 */
export const sanitizeEmail = (email: string): string | null => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : null;
};

/**
 * Generate a cryptographically secure random ID
 * @param prefix - Optional prefix for the ID
 * @returns Secure random ID
 */
export const generateSecureId = (prefix: string = 'id'): string => {
  const randomBytes = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}-${randomBytes[0].toString(36)}-${randomBytes[1].toString(36)}-${Date.now()}`;
};