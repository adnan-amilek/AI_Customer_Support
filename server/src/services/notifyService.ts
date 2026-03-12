import { Resend } from "resend";
import type { Message } from "../types/index.js";
import { logger } from "../middleware/logger.js";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function buildTranscriptText(transcript: Message[]) {
  return transcript
    .map((m) => `${m.role === "user" ? "👤 User" : "🤖 Bot"}: ${m.content}`)
    .join("\n");
}

export async function sendEscalationSlack(
  sessionId: string,
  trigger: string,
  transcript: Message[]
): Promise<void> {
  if (!process.env.SLACK_WEBHOOK_URL) {
    logger.warn("SLACK_WEBHOOK_URL not set — skipping Slack notification");
    return;
  }

  const transcriptText = buildTranscriptText(transcript);
  const triggerLabel =
    trigger === "user_request"
      ? "🙋 User explicitly requested a human"
      : "⚠️ Low AI confidence score";

  const payload = {
    text: `🚨 *Support Escalation Required*`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🚨 Support Escalation Required" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Session ID:*\n\`${sessionId}\`` },
          { type: "mrkdwn", text: `*Trigger:*\n${triggerLabel}` },
          { type: "mrkdwn", text: `*Messages:*\n${transcript.length}` },
          { type: "mrkdwn", text: `*Time:*\n${new Date().toUTCString()}` },
        ],
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Transcript:*\n\`\`\`${transcriptText.slice(0, 2800)}\`\`\``,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            style: "primary",
            text: { type: "plain_text", text: "📋 View in Dashboard" },
            url: `${process.env.ADMIN_URL ?? "http://localhost:5173"}/admin`,
          },
        ],
      },
    ],
  };

  const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook failed: ${res.status} ${await res.text()}`);
  }
  logger.info({ sessionId, trigger }, "Slack escalation sent");
}

export async function sendEscalationEmail(
  sessionId: string,
  trigger: string,
  transcript: Message[]
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.warn("RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const transcriptHtml = transcript
    .map(
      (m) =>
        `<tr style="background:${m.role === "user" ? "#f9fafb" : "#fff"}">
          <td style="padding:8px 12px;font-weight:600;color:${m.role === "user" ? "#4f46e5" : "#059669"};white-space:nowrap">${m.role === "user" ? "User" : "Bot"}</td>
          <td style="padding:8px 12px;color:#374151">${m.content}</td>
        </tr>`
    )
    .join("");

  await resend.emails.send({
    from: `Support Bot <bot@${process.env.EMAIL_DOMAIN ?? "yourdomain.com"}>`,
    to: process.env.SUPPORT_EMAIL ?? "support@yourdomain.com",
    subject: `[Escalation] Chat Session ${sessionId} — ${trigger === "user_request" ? "User Request" : "Low Confidence"}`,
    html: `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">🚨 Support Escalation</h2>
          <p style="color:#c7d2fe;margin:8px 0 0">Session <code style="background:rgba(255,255,255,.2);padding:2px 8px;border-radius:4px">${sessionId}</code></p>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p><strong>Trigger:</strong> ${trigger === "user_request" ? "User explicitly requested a human agent" : "AI confidence score below threshold"}</p>
          <h3 style="color:#374151;margin-top:20px">Conversation Transcript</h3>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
            ${transcriptHtml}
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="${process.env.ADMIN_URL ?? "http://localhost:5173"}/admin"
              style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              View in Dashboard →
            </a>
          </div>
        </div>
      </div>`,
  });

  logger.info({ sessionId }, "Escalation email sent");
}
