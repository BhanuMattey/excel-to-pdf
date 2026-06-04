const BASE_STYLE = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f9fafb; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
`

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ExcelfromPDF</title>
  ${BASE_STYLE}
</head>
<body style="background-color:#f9fafb;padding:40px 16px;margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr>
      <td>

        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;text-align:center;">
          <tr>
            <td style="padding:0 0 8px;">
              <span style="font-size:22px;font-weight:700;color:#166534;letter-spacing:-0.5px;">
                Excel<span style="color:#16a34a;">from</span>PDF
              </span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <!-- Green top bar -->
            <td style="height:4px;background:linear-gradient(90deg,#166534 0%,#16a34a 50%,#22c55e 100%);display:block;"></td>
          </tr>
          <tr>
            <td style="padding:40px 40px 36px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;text-align:center;">
          <tr>
            <td style="font-size:12px;color:#9ca3af;line-height:1.6;">
              ExcelfromPDF &mdash; Convert PDFs to Excel instantly<br/>
              You received this email because an action was requested on your account.<br/>
              If you didn't request this, you can safely ignore this email.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, url: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td align="center">
          <a href="${url}"
            style="display:inline-block;padding:13px 32px;background:#166534;color:#ffffff;
                   font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;
                   letter-spacing:0.1px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `
}

function fallbackLink(url: string): string {
  return `
    <p style="font-size:12px;color:#9ca3af;margin-top:20px;word-break:break-all;">
      Button not working? Copy and paste this link into your browser:<br/>
      <a href="${url}" style="color:#166534;text-decoration:underline;">${url}</a>
    </p>
  `
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />`
}

// ─── Password Reset ────────────────────────────────────────────────────────────

export function resetPasswordEmail(name: string, resetUrl: string, appUrl = 'https://www.excelfrompdf.com'): string {
  const displayName = name || 'there'

  const content = `
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <div style="width:48px;height:48px;background:#f0fdf4;border-radius:12px;
                      display:flex;align-items:center;justify-content:center;
                      font-size:24px;line-height:48px;text-align:center;">
            🔐
          </div>
        </td>
      </tr>
    </table>

    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.3px;">
      Reset your password
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 4px;line-height:1.6;">
      Hi ${displayName},
    </p>
    <p style="font-size:15px;color:#6b7280;margin:0;line-height:1.6;">
      We received a request to reset the password for your ExcelfromPDF account.
      Click the button below to choose a new password.
    </p>

    ${ctaButton('Reset Password', resetUrl)}

    <!-- Expiry notice -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#fffbeb;border:1px solid #fef3c7;border-radius:8px;
                   padding:12px 16px;">
          <p style="font-size:13px;color:#92400e;margin:0;">
            ⏱ This link expires in <strong>1 hour</strong>. If it expires, you can
            <a href="${appUrl}/forgot-password" style="color:#166534;font-weight:600;text-decoration:none;">
              request a new one
            </a>.
          </p>
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
      Didn't request a password reset? No action is needed — your account is safe.
      Someone may have typed your email address by mistake.
    </p>

    ${fallbackLink(resetUrl)}
  `

  return wrapper(content)
}

// ─── Email Verification ────────────────────────────────────────────────────────

export function verifyEmailTemplate(name: string, verifyUrl: string): string {
  const displayName = name || 'there'

  const content = `
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <div style="width:48px;height:48px;background:#f0fdf4;border-radius:12px;
                      display:flex;align-items:center;justify-content:center;
                      font-size:24px;line-height:48px;text-align:center;">
            ✉️
          </div>
        </td>
      </tr>
    </table>

    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.3px;">
      Verify your email address
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 4px;line-height:1.6;">
      Hi ${displayName},
    </p>
    <p style="font-size:15px;color:#6b7280;margin:0;line-height:1.6;">
      Welcome to ExcelfromPDF! Please verify your email address to activate your account
      and start converting PDFs to Excel.
    </p>

    ${ctaButton('Verify Email Address', verifyUrl)}

    <!-- What you get -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;padding:16px 20px;">
          <p style="font-size:13px;font-weight:600;color:#166534;margin:0 0 10px;">
            What you get with ExcelfromPDF:
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#15803d;padding:3px 0;">✓&nbsp;&nbsp;Convert PDFs to Excel in seconds</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#15803d;padding:3px 0;">✓&nbsp;&nbsp;Accurate table detection &amp; formatting</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#15803d;padding:3px 0;">✓&nbsp;&nbsp;5 free conversions to get started</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
      Didn't create an ExcelfromPDF account? You can safely ignore this email —
      no account will be created without verification.
    </p>

    ${fallbackLink(verifyUrl)}
  `

  return wrapper(content)
}
