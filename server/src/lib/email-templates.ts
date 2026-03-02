function layout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:8px;padding:40px;">
          <tr>
            <td>
              ${content}
              <p style="margin-top:32px;font-size:13px;color:#71717a;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function button(url: string, label: string): string {
  const safeUrl = Bun.escapeHTML(url);
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr>
    <td align="center">
      <a href="${safeUrl}" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
        ${Bun.escapeHTML(label)}
      </a>
    </td>
  </tr>
</table>`;
}

function actionTemplate(heading: string, body: string, buttonLabel: string, url: string): string {
  return layout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#18181b;">${Bun.escapeHTML(heading)}</h1>
    <p style="margin:0;font-size:15px;color:#3f3f46;line-height:1.5;">
      ${Bun.escapeHTML(body)}
    </p>
    ${button(url, buttonLabel)}
    <p style="margin-top:16px;font-size:13px;color:#71717a;word-break:break-all;">
      Or copy and paste this link: ${Bun.escapeHTML(url)}
    </p>
  `);
}

export function resetPasswordTemplate(url: string): string {
  return actionTemplate(
    "Reset your password",
    "We received a request to reset the password for your Juggling Tools account. Click the button below to set a new password.",
    "Reset password",
    url,
  );
}

export function verifyEmailTemplate(url: string): string {
  return actionTemplate(
    "Verify your email",
    "Thanks for signing up for Juggling Tools! Please verify your email address by clicking the button below.",
    "Verify email",
    url,
  );
}
