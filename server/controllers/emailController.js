// server/controllers/emailController.js
// Uses Gmail API via OAuth2 — no app passwords needed
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// GMAIL OAUTH2 SETUP
// 
// One-time setup to get your refresh token:
// 1. Go to https://developers.google.com/oauthplayground
// 2. Click settings gear (top right) → check "Use your own OAuth credentials"
// 3. Enter your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
// 4. In the left panel, find "Gmail API v1" → select "https://mail.google.com/"
// 5. Click "Authorize APIs" → sign in → click "Exchange authorization code for tokens"
// 6. Copy the "Refresh token" → add it to your .env as GMAIL_REFRESH_TOKEN
// ─────────────────────────────────────────────

const getTransporter = async () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const { token: accessToken } = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken,
    },
  });
};

exports.send = async (req, res) => {
  try {
    const { recipients, subject, body } = req.body;
    if (!recipients?.length || !subject || !body) {
      return res.status(400).json({ error: 'recipients, subject, and body are required' });
    }

    const transporter = await getTransporter();

    await transporter.sendMail({
      from: `"EMS System" <${process.env.GMAIL_USER}>`,
      to: recipients.join(', '),
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Employee Management System</h2>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            ${body.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
            This email was sent via EMS. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    // Log the email in DB
    await prisma.emailLog.create({
      data: {
        senderId: req.user.id,
        recipients,
        subject,
        body,
        status: 'SENT',
      },
    });

    res.json({ message: `Email sent to ${recipients.length} recipient(s)` });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email. Check your Gmail OAuth setup.' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { sender: { select: { email: true } } },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
