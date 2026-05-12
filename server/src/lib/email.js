import nodemailer from 'nodemailer';

const isEmailConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.EMAIL_FROM
);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const formatCredentials = (credential) => {
  if (!credential) return 'Seller has not submitted account credentials yet.';

  const payload = credential.originalCredential?.length
    ? credential.originalCredential
    : credential.updatedCredential?.length
      ? credential.updatedCredential
      : [];

  if (!payload.length) return 'Seller has not submitted account credentials yet.';

  return payload.map((item, index) => {
    if (!item || typeof item !== 'object') return `• ${String(item)}`;

    const entries = Object.entries(item);
    if (entries.length === 0) return `• Item ${index + 1}`;

    return `• ${entries.map(([key, value]) => `${key}: ${value}`).join(' | ')}`;
  }).join('\n');
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.log('Email transport is not configured. Skipping send.');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    if (html) console.log('HTML:', html);
    return null;
  }

  return transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html });
};

export const sendOrderConfirmationEmail = async ({ buyer, listing, transaction, credential }) => {
  if (!buyer || !buyer.email) {
    throw new Error('Buyer email is not available.');
  }

  const subject = `Your FlipEarn purchase is complete — ${listing?.title ?? 'Purchased listing'}`;
  const credentialText = formatCredentials(credential);

  const text = `Hi ${buyer.name || 'there'},

Thank you for your purchase of "${listing?.title ?? 'a listing'}" for ${process.env.CURRENCY || '$'}${transaction.amount?.toLocaleString() ?? transaction.amount}.

Here are the credentials submitted by the seller:

${credentialText}

Please change the account email and password immediately after you log in.

If the credentials are not available yet, they will be delivered to you as soon as the seller submits them.

Thank you,
The FlipEarn team`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;">
    <p>Hi ${buyer.name || 'there'},</p>
    <p>Thank you for your purchase of <strong>${listing?.title ?? 'a listing'}</strong> for <strong>${process.env.CURRENCY || '$'}${transaction.amount?.toLocaleString() ?? transaction.amount}</strong>.</p>
    <p>Here are the credentials submitted by the seller:</p>
    <pre style="background:#f5f5f5;padding:14px;border-radius:10px;white-space:pre-wrap;">${credentialText}</pre>
    <p>Please change the account email and password immediately after you log in.</p>
    <p>If the credentials are not available yet, they will be delivered to you as soon as the seller submits them.</p>
    <p>Thanks,<br/>The FlipEarn team</p>
  </div>`;

  return sendEmail({ to: buyer.email, subject, text, html });
};
