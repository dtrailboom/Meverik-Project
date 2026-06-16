const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup (only in production)
if (process.env.NODE_ENV === 'production') {
  transporter.verify((err) => {
    if (err) console.error('Email transporter error:', err.message);
    else console.log('Email service ready');
  });
}

// Base HTML layout shared by all emails
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meverik</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #F3F4F6;">
              <span style="font-size:18px;font-weight:600;color:#111827;">Meverik<span style="color:#1D9E75;">.</span></span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #F3F4F6;background:#F9FAFB;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                © 2026 Meverik · Vienna, Austria ·
                <a href="${process.env.APP_URL}" style="color:#1D9E75;text-decoration:none;">meverik.at</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Helper to send an email
const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST?.includes('smtp')) {
    console.log(`[EMAIL - DEV] To: ${to} | Subject: ${subject}`);
    return; // Skip actual sending in dev unless SMTP is configured
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Meverik <hello@meverik.com>',
      replyTo: process.env.REPLY_TO_EMAIL || process.env.ADMIN_EMAIL,  // ← add this
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
  }
};

// ─────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────

/**
 * 1. Welcome email — sent after successful registration + payment
 */
const sendWelcomeEmail = async ({ to, name, businessName, plan, tokenBalance, portalUrl }) => {
  const planNames = { starter: 'Starter', growth: 'Growth', pro: 'Pro' };
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Welcome to Meverik, ${name}!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
      Your website subscription is active. Here's a summary of your account:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">Business</span><br/>
          <span style="font-size:15px;font-weight:500;color:#111827;">${businessName || name}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">Plan</span><br/>
          <span style="font-size:15px;font-weight:500;color:#111827;">${planNames[plan] || plan}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:13px;color:#6B7280;">Tokens available</span><br/>
          <span style="font-size:15px;font-weight:500;color:#1D9E75;">${tokenBalance} tokens</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#6B7280;">
      You can now submit your first website change request from your portal.
    </p>

    <a href="${portalUrl}" style="display:inline-block;margin-top:16px;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;">
      Go to your portal →
    </a>
  `);

  await sendEmail({ to, subject: `Welcome to Meverik, ${name}!`, html });
};

/**
 * 2. Ticket submitted — sent to client after they submit a request
 */
const sendTicketSubmittedEmail = async ({ to, name, ticketNumber, title, complexity, tokenCost, tokensRemaining, portalUrl }) => {
  const complexityColors = { small: '#1D9E75', medium: '#D97706', large: '#EF4444' };
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Request received</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
      Hi ${name}, we've received your request and our team will get to work shortly.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">Ticket</span><br/>
          <span style="font-size:15px;font-weight:500;color:#111827;">#${ticketNumber} · ${title}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">Type</span><br/>
          <span style="font-size:15px;font-weight:500;color:${complexityColors[complexity] || '#111827'};text-transform:capitalize;">${complexity} change</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">Tokens used</span><br/>
          <span style="font-size:15px;font-weight:500;color:#111827;">${tokenCost} token${tokenCost > 1 ? 's' : ''}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:13px;color:#6B7280;">Tokens remaining</span><br/>
          <span style="font-size:15px;font-weight:500;color:#1D9E75;">${tokensRemaining} tokens</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:14px;color:#6B7280;">
      We'll send you another email as soon as work begins and when it's delivered.
    </p>

    <a href="${portalUrl}/tickets" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;">
      View your tickets →
    </a>
  `);

  await sendEmail({ to, subject: `Request #${ticketNumber} received — ${title}`, html });
};

/**
 * 3. Ticket in progress — sent when admin moves ticket to in_progress
 */
const sendTicketInProgressEmail = async ({ to, name, ticketNumber, title, portalUrl }) => {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">We're working on it</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
      Hi ${name}, good news — your request is now in progress.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:13px;color:#6B7280;">Ticket in progress</span><br/>
          <span style="font-size:15px;font-weight:500;color:#111827;">#${ticketNumber} · ${title}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:14px;color:#6B7280;">
      Our team is actively working on your request. You'll get another email when it's delivered.
    </p>

    <a href="${portalUrl}/tickets" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;">
      Track progress →
    </a>
  `);

  await sendEmail({ to, subject: `Ticket #${ticketNumber} is in progress`, html });
};

/**
 * 4. Ticket delivered — sent when admin marks ticket as delivered
 */
const sendTicketDeliveredEmail = async ({ to, name, ticketNumber, title, websiteUrl, portalUrl }) => {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Your request has been delivered! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
      Hi ${name}, your website has been updated. Take a look!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#E1F5EE;border-radius:8px;border:1px solid #9FE1CB;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:13px;color:#0F6E56;">Delivered</span><br/>
          <span style="font-size:15px;font-weight:500;color:#111827;">#${ticketNumber} · ${title}</span>
        </td>
      </tr>
    </table>

    <div style="display:flex;gap:12px;">
      ${websiteUrl ? `
      <a href="${websiteUrl.startsWith('http') ? websiteUrl : 'https://' + websiteUrl}" style="display:inline-block;margin-right:12px;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;">
        View your website →
      </a>` : ''}
      <a href="${portalUrl}/tickets" style="display:inline-block;background:#F3F4F6;color:#374151;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;">
        View all tickets
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;">
      Need something else changed? Submit a new request from your portal anytime.
    </p>
  `);

  await sendEmail({ to, subject: `✓ Ticket #${ticketNumber} delivered — ${title}`, html });
};

/**
 * 5. Low token warning — sent when balance drops below 3
 */
const sendLowTokenWarningEmail = async ({ to, name, tokenBalance, portalUrl }) => {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">You're running low on tokens</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
      Hi ${name}, you only have <strong style="color:#D97706;">${tokenBalance} token${tokenBalance !== 1 ? 's' : ''}</strong> remaining this month.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-radius:8px;border:1px solid #FDE68A;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid #FDE68A;"><span style="font-size:13px;color:#92400E;">Small change</span><span style="float:right;font-size:13px;font-weight:500;color:#92400E;">1 token</span></td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #FDE68A;"><span style="font-size:13px;color:#92400E;">Medium change</span><span style="float:right;font-size:13px;font-weight:500;color:#92400E;">3 tokens</span></td></tr>
      <tr><td style="padding:16px 20px;"><span style="font-size:13px;color:#92400E;">Large change</span><span style="float:right;font-size:13px;font-weight:500;color:#92400E;">8 tokens</span></td></tr>
    </table>

    <a href="${portalUrl}/topup" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;">
      Top up tokens →
    </a>
  `);

  await sendEmail({ to, subject: `You have ${tokenBalance} token${tokenBalance !== 1 ? 's' : ''} left — top up to keep requesting`, html });
};

/**
 * 6. Token top-up confirmation
 */
const sendTopupConfirmationEmail = async ({ to, name, tokensAdded, newBalance, amountPaid, portalUrl }) => {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Tokens added successfully</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
      Hi ${name}, your token top-up was successful.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">Tokens added</span><br/>
          <span style="font-size:15px;font-weight:500;color:#1D9E75;">+${tokensAdded} tokens</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">New balance</span><br/>
          <span style="font-size:15px;font-weight:500;color:#111827;">${newBalance} tokens</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:13px;color:#6B7280;">Amount charged</span><br/>
          <span style="font-size:15px;font-weight:500;color:#111827;">€${amountPaid}</span>
        </td>
      </tr>
    </table>

    <a href="${portalUrl}/request" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;">
      Submit a request →
    </a>
  `);

  await sendEmail({ to, subject: `+${tokensAdded} tokens added to your account`, html });
};

/**
 * 7. Admin notification — new ticket submitted
 */
const sendAdminNewTicketEmail = async ({ ticketNumber, clientName, clientEmail, title, complexity, tokenCost, adminUrl }) => {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">New ticket submitted</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B7280;">A client has submitted a new request.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:24px;">
      <tr><td style="padding:14px 20px;border-bottom:1px solid #E5E7EB;"><span style="font-size:13px;color:#6B7280;">Ticket</span><br/><span style="font-size:15px;font-weight:500;color:#111827;">#${ticketNumber} · ${title}</span></td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #E5E7EB;"><span style="font-size:13px;color:#6B7280;">Client</span><br/><span style="font-size:15px;font-weight:500;color:#111827;">${clientName} (${clientEmail})</span></td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #E5E7EB;"><span style="font-size:13px;color:#6B7280;">Complexity</span><br/><span style="font-size:15px;font-weight:500;color:#111827;text-transform:capitalize;">${complexity}</span></td></tr>
      <tr><td style="padding:14px 20px;"><span style="font-size:13px;color:#6B7280;">Token cost</span><br/><span style="font-size:15px;font-weight:500;color:#111827;">${tokenCost} token${tokenCost > 1 ? 's' : ''}</span></td></tr>
    </table>

    <a href="${adminUrl}" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;text-decoration:none;">
      Open admin panel →
    </a>
  `);

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `New ticket #${ticketNumber} from ${clientName}`,
    html,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendTicketSubmittedEmail,
  sendTicketInProgressEmail,
  sendTicketDeliveredEmail,
  sendLowTokenWarningEmail,
  sendTopupConfirmationEmail,
  sendAdminNewTicketEmail,
};
