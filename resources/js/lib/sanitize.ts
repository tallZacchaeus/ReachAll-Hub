import DOMPurify from 'dompurify';

/**
 * Sanitise untrusted HTML (e.g. TipTap output) before rendering via
 * dangerouslySetInnerHTML. This is the single approved sanitisation utility
 * for all HTML rendering in this codebase.
 *
 * Allowed tags: standard prose elements used by TipTap. Script, iframe,
 * object, embed, form, and input tags are stripped.
 *
 * X4-01: 'style' attribute removed — it allows CSS injection (e.g. url() exfil,
 * expression() in legacy IE). Use class-based styling only.
 *
 * X4-02: afterSanitizeAttributes hook forces rel="noopener noreferrer" on every
 * <a target="_blank"> link to prevent reverse tabnapping.
 *
 * Usage:
 *   dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
 */

// X4-02: Register once at module load — DOMPurify hooks are global per instance.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

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
    // X4-01: 'style' removed to prevent CSS injection via url()/expression().
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false,
  });
}
