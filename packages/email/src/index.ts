import { Resend } from "resend";

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function sendInvitationEmail(params: {
  to: string;
  orgName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}) {
  const subject = `You're invited to join ${params.orgName} on ShipFlow`;
  const html = invitationEmailTemplate(params);

  if (!resend) {
    console.log("================== EMAIL SIMULATION ==================");
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log("======================================================");
    return { id: "simulated_email_id" };
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const result = await resend.emails.send({
    from, // Use configured from address or Resend's default testing domain
    to: params.to,
    subject,
    html,
  });

  if (result.error) {
    console.error("❌ Resend email failed:", result.error);
  } else {
    console.log("✅ Email sent successfully via Resend:", result.data);
  }

  return result;
}

function invitationEmailTemplate({ orgName, inviterName, role, acceptUrl }: { orgName: string, inviterName: string, role: string, acceptUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #333;">You've been invited!</h2>
      <p style="color: #555; font-size: 16px;">
        <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on ShipFlow as a <strong>${role}</strong>.
      </p>
      <p style="color: #555; font-size: 16px;">
        ShipFlow is the AI-powered product development platform that accelerates your workflow.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${acceptUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #999; font-size: 14px;">
        This invitation will expire in 72 hours. If you did not expect this invitation, you can safely ignore this email.
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 40px;">
        &copy; ${new Date().getFullYear()} ShipFlow. All rights reserved.
      </p>
    </div>
  `;
}
