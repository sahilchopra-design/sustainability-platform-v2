"""
Email service — sends invite and notification emails.

Supports two backends (checked in order):
  1. SendGrid — set SENDGRID_API_KEY in .env
  2. SMTP     — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env

If neither is configured the function logs a warning and returns False.
No deployment required — works locally with Gmail App Passwords or SendGrid free tier.
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)

# ── Config from environment ────────────────────────────────────────────────────
SENDGRID_API_KEY   = os.getenv("SENDGRID_API_KEY", "")
SMTP_HOST          = os.getenv("SMTP_HOST", "")
SMTP_PORT          = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER          = os.getenv("SMTP_USER", "")
SMTP_PASSWORD      = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL         = os.getenv("INVITE_FROM_EMAIL", SMTP_USER or "noreply@aaimpactinc.com")
FROM_NAME          = os.getenv("INVITE_FROM_NAME", "A² Intelligence")
PLATFORM_BASE_URL  = os.getenv("PLATFORM_BASE_URL", "http://localhost:3000")


# ── HTML email template ────────────────────────────────────────────────────────

def _invite_html(invite_url: str, recipient_email: str, role: str,
                 org: Optional[str] = None, expires_days: int = 7) -> tuple[str, str]:
    """Return (subject, html_body) for an invite email."""
    role_display = {
        "super_admin": "Super Administrator",
        "team_member": "Team Member",
        "partner": "Partner",
        "demo": "Demo User",
        "viewer": "Viewer",
    }.get(role, role.replace("_", " ").title())

    org_line = f"<p style='margin:0 0 8px;color:#5a6a7a;font-size:14px;'>{org}</p>" if org else ""
    subject  = f"You're invited to A² Intelligence"

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ede6;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1a2332;padding:28px 36px;border-bottom:3px solid #d4a843;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48px;height:48px;background:#d4a843;border-radius:50%;text-align:center;vertical-align:middle;">
                  <span style="color:#1a2332;font-size:18px;font-weight:900;font-family:monospace;">A²</span>
                </td>
                <td style="padding-left:14px;">
                  <div style="color:#ffffff;font-size:18px;font-weight:700;">A² Intelligence</div>
                  <div style="color:rgba(255,255,255,0.45);font-size:12px;">by AA Impact Inc.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <h2 style="margin:0 0 16px;color:#1a2332;font-size:22px;font-weight:700;">You've been invited</h2>
            <p style="margin:0 0 20px;color:#5a6a7a;font-size:15px;line-height:1.6;">
              You have been granted access to the <strong style="color:#1a2332;">A² Intelligence</strong>
              sustainability risk analytics platform.
            </p>
            <!-- Access details card -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#faf8f4;border:1px solid rgba(212,168,67,0.3);border-radius:8px;margin-bottom:28px;">
              <tr><td style="padding:18px 20px;">
                <div style="font-size:11px;font-weight:700;color:#92620a;text-transform:uppercase;
                            letter-spacing:0.07em;margin-bottom:10px;">Access Details</div>
                <table cellpadding="0" cellspacing="4">
                  <tr>
                    <td style="font-size:13px;color:#5a6a7a;width:80px;">Email</td>
                    <td style="font-size:13px;color:#1a2332;font-weight:600;">{recipient_email}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#5a6a7a;">Role</td>
                    <td style="font-size:13px;color:#1a2332;font-weight:600;">{role_display}</td>
                  </tr>
                  {f'<tr><td style="font-size:13px;color:#5a6a7a;">Org</td><td style="font-size:13px;color:#1a2332;font-weight:600;">{org}</td></tr>' if org else ''}
                  <tr>
                    <td style="font-size:13px;color:#5a6a7a;">Expires</td>
                    <td style="font-size:13px;color:#1a2332;">Link valid for {expires_days} days</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#d4a843;border-radius:6px;">
                  <a href="{invite_url}"
                     style="display:inline-block;padding:14px 32px;color:#1a2332;font-size:15px;
                            font-weight:700;text-decoration:none;letter-spacing:0.01em;">
                    Accept Invitation &amp; Set Up Account
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#5a6a7a;font-size:13px;">
              Or copy this link into your browser:
            </p>
            <p style="margin:0 0 24px;font-family:monospace;font-size:12px;color:#1a2332;
                      background:#f3f1ec;padding:10px 12px;border-radius:4px;word-break:break-all;">
              {invite_url}
            </p>
            <p style="margin:0;color:#9aabb8;font-size:12px;line-height:1.6;">
              This link can only be used once. If you didn't expect this invitation,
              you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f3f1ec;padding:16px 36px;text-align:center;
                     border-top:1px solid rgba(26,35,50,0.08);">
            <p style="margin:0;font-size:11px;color:#9aabb8;font-family:monospace;letter-spacing:0.06em;">
              A² INTELLIGENCE · CONFIDENTIAL · AA IMPACT INC.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    return subject, html


# ── Sending logic ──────────────────────────────────────────────────────────────

def send_invite_email(
    to_email: str,
    invite_url: str,
    role: str,
    org: Optional[str] = None,
    expires_days: int = 7,
) -> bool:
    """
    Send an invite email. Returns True on success, False if not configured or failed.
    Never raises — failures are logged as warnings so they don't break invite creation.
    """
    subject, html_body = _invite_html(invite_url, to_email, role, org, expires_days)

    # ── Option 1: SendGrid ─────────────────────────────────────────────────────
    if SENDGRID_API_KEY:
        try:
            import urllib.request as ureq, json as _json
            payload = _json.dumps({
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": FROM_EMAIL, "name": FROM_NAME},
                "subject": subject,
                "content": [{"type": "text/html", "value": html_body}],
            }).encode()
            req = ureq.Request(
                "https://api.sendgrid.com/v3/mail/send",
                data=payload,
                headers={
                    "Authorization": f"Bearer {SENDGRID_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            resp = ureq.urlopen(req, timeout=10)
            logger.info("Invite email sent via SendGrid to %s (HTTP %s)", to_email, resp.status)
            return True
        except Exception as exc:
            logger.warning("SendGrid send failed for %s: %s", to_email, exc)
            return False

    # ── Option 2: SMTP ─────────────────────────────────────────────────────────
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
            msg["To"]      = to_email
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
                s.ehlo()
                s.starttls()
                s.login(SMTP_USER, SMTP_PASSWORD)
                s.sendmail(FROM_EMAIL, [to_email], msg.as_string())

            logger.info("Invite email sent via SMTP to %s", to_email)
            return True
        except Exception as exc:
            logger.warning("SMTP send failed for %s: %s", to_email, exc)
            return False

    # ── Not configured ─────────────────────────────────────────────────────────
    logger.info(
        "Email not configured — invite link for %s: %s",
        to_email, invite_url
    )
    return False
