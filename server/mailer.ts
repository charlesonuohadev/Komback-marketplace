/**
 * Transactional email.
 *
 * Komback does not pretend to send mail: if no provider is configured the message
 * is reported as undelivered and the caller surfaces the actionable fallback
 * (e.g. the operator reads the reset link from the server log).
 *
 * Configure with either:
 *   EMAIL_API_URL=https://api.resend.com/emails   (any JSON API accepting
 *   EMAIL_API_KEY=re_...                           { from, to, subject, text, html })
 *   EMAIL_FROM="Komback <no-reply@komback.com>"
 */

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailResult {
  delivered: boolean;
  provider: string;
  error?: string;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.EMAIL_API_URL && process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  if (!isMailConfigured()) {
    console.warn(
      `[komback] email not sent (no provider configured) → to=${message.to} subject="${message.subject}"`
    );
    console.warn(`[komback] message body:\n${message.text}`);
    return { delivered: false, provider: 'none' };
  }

  try {
    const response = await fetch(process.env.EMAIL_API_URL as string, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        delivered: false,
        provider: 'api',
        error: `Provider responded ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
      };
    }

    return { delivered: true, provider: 'api' };
  } catch (error) {
    return {
      delivered: false,
      provider: 'api',
      error: error instanceof Error ? error.message : 'Email request failed',
    };
  }
}

export function passwordResetEmail(name: string, resetUrl: string, expiresMinutes: number) {
  const text = [
    `Hello ${name},`,
    '',
    `Someone requested a password reset for your Komback admin account.`,
    `Open this link within ${expiresMinutes} minutes to choose a new password:`,
    '',
    resetUrl,
    '',
    'If you did not request this, you can ignore this email — your password stays unchanged.',
    '',
    '— Komback Security',
  ].join('\n');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${name},</p>
      <p>Someone requested a password reset for your Komback admin account.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">
          Choose a new password
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">This link expires in ${expiresMinutes} minutes. If you did not request it, no action is needed.</p>
    </div>
  `;

  return { subject: 'Reset your Komback admin password', text, html };
}
