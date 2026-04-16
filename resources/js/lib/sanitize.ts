import DOMPurify from 'dompurify';

/**
 * Sanitise untrusted HTML (e.g. TipTap output) before rendering via
 * dangerouslySetInnerHTML. This is the single approved sanitisation utility
 * for all HTML rendering in this codebase.
 *
 * Allowed tags: standard prose elements used by TipTap. Script, iframe,
 * object, embed, form, and input tags are stripped.
 *
 * Usage:
 *   dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'blockquote', 'code', 'pre',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'span', 'div', 'sub', 'sup',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false,
  });
}
