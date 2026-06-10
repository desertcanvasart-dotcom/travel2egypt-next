/**
 * Resume email templates (Session 4). Plain branded HTML — cream surface,
 * serif heading, faience button — no @react-email for v1. EN + ES.
 */

interface ResumeEmailContent {
  subject: string;
  html: string;
  text: string;
}

const BRAND = {
  paper: '#faf6f0',
  surface: '#ffffff',
  ink: '#14243b',
  inkSoft: '#5c6675',
  accent: '#1b4965',
  line: '#e7e0d5',
};

function shell(headingHtml: string, bodyHtml: string, buttonLabel: string, url: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${BRAND.paper};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BRAND.surface};border:1px solid ${BRAND.line};">
        <tr><td style="padding:32px 32px 24px;">
          <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.accent};">Travel2Egypt</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;line-height:1.25;color:${BRAND.ink};">${headingHtml}</h1>
          ${bodyHtml}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr>
            <td style="background:${BRAND.accent};">
              <a href="${url}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#ffffff;text-decoration:none;">${buttonLabel}</a>
            </td>
          </tr></table>
          <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.inkSoft};word-break:break-all;">${url}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function resumeEmail(url: string, locale: string): ResumeEmailContent {
  if (locale === 'es') {
    const heading = 'Retoma tu conversación';
    const body = `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:${BRAND.ink};">Aquí tienes un enlace privado para seguir planificando tu viaje a Egipto con nuestro concierge, desde cualquier dispositivo. El enlace funciona durante 30 días.</p>`;
    return {
      subject: 'Tu conversación con Travel2Egypt — retoma donde lo dejaste',
      html: shell(heading, body, 'Continuar la conversación', url),
      text: `Retoma tu conversación con el concierge de Travel2Egypt (válido 30 días):\n${url}\n\n— El equipo de Travel2Egypt`,
    };
  }
  const heading = 'Pick up where you left off';
  const body = `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:${BRAND.ink};">Here's a private link to continue planning your Egypt trip with our concierge, on any device. This link works for 30 days.</p>`;
  return {
    subject: 'Your Travel2Egypt conversation — pick up where you left off',
    html: shell(heading, body, 'Continue the conversation', url),
    text: `Continue your conversation with the Travel2Egypt concierge (valid 30 days):\n${url}\n\n— The Travel2Egypt team`,
  };
}
