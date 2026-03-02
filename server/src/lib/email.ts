import { Resend } from "resend";

import { logger } from "./logger";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!Bun.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    resend = new Resend(Bun.env.RESEND_API_KEY);
  }
  return resend;
}

const emailFrom = Bun.env.EMAIL_FROM ?? "Juggling Tools <noreply@jugglingtools.com>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { error } = await getResend().emails.send({
    from: emailFrom,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error({ event: "email_send_failed", to, subject, error: error.message });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
