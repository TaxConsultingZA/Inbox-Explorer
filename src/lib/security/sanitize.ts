import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes untrusted HTML email bodies to prevent Cross-Site Scripting (XSS),
 * form hijacking, phishing redirects, or unauthorized script execution.
 */
export function sanitizeEmailHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  // Configure DOMPurify with strict enterprise security rules
  const clean = DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: [
      'script',
      'iframe',
      'object',
      'embed',
      'applet',
      'form',
      'input',
      'button',
      'textarea',
      'select',
      'base',
      'meta',
      'link',
    ],
    FORBID_ATTR: [
      'onerror',
      'onload',
      'onclick',
      'onmouseover',
      'onfocus',
      'onblur',
      'formaction',
      'action',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|cid):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$)|data:image\/)/i,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
  });

  // Ensure all anchor tags have safe target and rel attributes
  // DOMPurify may leave target unchanged or strip it; we standardize anchor tags to open in new tab with noopener
  return clean.replace(/<a\s+(?!.*?target=)/gi, '<a target="_blank" rel="noopener noreferrer" ');
}

/**
 * Safely encodes plain text for HTML presentation when an email body is plain text.
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
