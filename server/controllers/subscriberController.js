import Subscriber from '../models/Subscriber.js';
import Delivery from '../models/Delivery.js';
import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    },
    connectionTimeout: 10000,
    socketTimeout: 10000
  });
};

const sendEmailWithRetry = async (mailOptions, retries = 2) => {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      const transporter = createTransporter();
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      lastError = error;
      console.warn(`Email send attempt ${i + 1} failed:`, error?.message);
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
};

export const subscribe = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please login to subscribe' });
    }

    const { email } = req.body;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
      }
      return res.json({ success: true, message: 'Already subscribed' });
    }

    await Subscriber.create({ email });

    // Send confirmation email (non-blocking)
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const backend = process.env.BACKEND_URL || 'http://localhost:4000';
    const unsubscribeUrl = `${backend}/api/subscribe/unsubscribe?email=${encodeURIComponent(email)}`;
    const username = email.split('@')[0];

    const html = `<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>QuickBlog Newsletter</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;">
    <!-- HEADER -->
    <tr>
      <td style="background:linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899); padding:35px 20px; text-align:center;">
        <h1 style="margin:0; font-size:30px; color:#ffffff; font-weight:800;">
          Welcome to QuickBlog 🚀
        </h1>
        <p style="margin:10px 0 0; color:#f3e8ff; font-size:16px; font-weight:500;">
          Smart Content. Smarter Creativity.
        </p>
      </td>
    </tr>
    <!-- HERO SECTION -->
    <tr>
      <td style="padding:30px; text-align:center;">
        <h2 style="margin:0; font-size:26px; font-weight:800; color:#111827;">
          Hello ${username}, thanks for subscribing! 🎉
        </h2>
        <p style="margin:15px 0; font-size:16px; line-height:1.7; color:#374151;">
          You're now part of <strong>QuickBlog's Creative Community</strong>. Expect insightful stories, trending topics, and exclusive AI-powered writing tips right in your inbox.
        </p>
        <!-- MAIN CTA BUTTON -->
        <a href="${frontend}" style="display:inline-block; margin-top:25px; padding:14px 28px; background:linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899); color:#ffffff; text-decoration:none; font-size:18px; font-weight:700; border-radius:8px;">
          Read Latest Blogs
        </a>
      </td>
    </tr>
    <!-- FEATURE SECTION -->
    <tr>
      <td style="padding:25px 30px;">
        <h3 style="font-size:20px; margin:0 0 12px; font-weight:700; color:#111827;">
          What you'll get:
        </h3>
        <ul style="margin:0; padding-left:18px; font-size:15px; line-height:1.7; color:#374151;">
          <li>🔥 Trending blog recommendations</li>
          <li>🧠 AI-powered writing guides</li>
          <li>✨ Personalized topics based on your interests</li>
          <li>📢 Early access to new features</li>
        </ul>
      </td>
    </tr>
    <!-- FOOTER -->
    <tr>
      <td style="background:#f9fafb; padding:20px; text-align:center;">
        <p style="margin:0; font-size:14px; color:#6b7280;">
          You are receiving this email because you subscribed to QuickBlog.
        </p>
        <p style="margin:12px 0 0; font-size:13px; color:#6b7280;">
          If you no longer wish to receive emails:
        </p>
        <a href="${unsubscribeUrl}" style="display:inline-block; margin-top:10px; padding:10px 16px; font-size:14px; background:#ef4444; color:white; text-decoration:none; border-radius:6px;">
          Unsubscribe
        </a>
        <p style="margin-top:15px; font-size:12px; color:#9ca3af;">
          © 2025 QuickBlog. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email with retry (non-blocking)
    sendEmailWithRetry({
      from: `QuickBlog <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Welcome to QuickBlog! 🚀',
      html
    }).catch(err => {
      console.error('Failed to send confirmation email:', err?.message);
    });

    return res.json({ success: true, message: 'Subscription successful! Check your email for confirmation.' });
  } catch (error) {
    console.error('Subscription error:', error?.message);
    return res.status(500).json({ success: false, message: 'Subscription failed. Please try again.' });
  }
};

export const notifySubscribers = async (blogData) => {
  try {
    const subscribers = await Subscriber.find({ isActive: true });
    if (subscribers.length === 0) return;

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const blogLink = `${frontend}/blog/${blogData._id}`;

    for (const subscriber of subscribers) {
      // Skip if we've already sent this blog to this subscriber
      try {
        const already = await Delivery.findOne({ blogId: blogData._id || blogData.id, subscriberId: subscriber._id });
        if (already) continue;
      } catch (err) {
        console.warn('Delivery lookup failed, continuing with send for', subscriber.email);
      }
      const username = subscriber.email.split('@')[0];
      const backend = process.env.BACKEND_URL || 'http://localhost:4000';
      const unsubscribeUrl = `${backend}/api/subscribe/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

      const html = `<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>New Blog from QuickBlog</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden;">
    <!-- HEADER -->
    <tr>
      <td style="background:linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899); padding:35px 20px; text-align:center;">
        <h1 style="margin:0; font-size:30px; color:#ffffff; font-weight:800;">
          New Blog Published! 📝
        </h1>
      </td>
    </tr>
    <!-- CONTENT -->
    <tr>
      <td style="padding:30px;">
        <h2 style="margin:0 0 10px; font-size:24px; font-weight:800; color:#111827;">
          ${blogData.title || 'New Post'}
        </h2>
        <p style="margin:15px 0; font-size:16px; line-height:1.7; color:#374151;">
          Hello ${username},
        </p>
        <p style="margin:10px 0; font-size:16px; line-height:1.7; color:#374151;">
          A new blog post has been published on QuickBlog. Read it now and discover fresh insights!
        </p>
        <!-- MAIN CTA -->
        <a href="${blogLink}" style="display:inline-block; margin:25px 0; padding:14px 28px; background:linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899); color:#ffffff; text-decoration:none; font-size:18px; font-weight:700; border-radius:8px;">
          Read Full Blog →
        </a>
      </td>
    </tr>
    <!-- FOOTER -->
    <tr>
      <td style="background:#f9fafb; padding:20px; text-align:center;">
        <p style="margin:0; font-size:13px; color:#6b7280;">
          You're receiving this because you subscribed to QuickBlog updates.
        </p>
        <a href="${unsubscribeUrl}" style="display:inline-block; margin-top:12px; padding:8px 14px; font-size:13px; background:#ef4444; color:white; text-decoration:none; border-radius:6px;">
          Unsubscribe
        </a>
        <p style="margin-top:15px; font-size:12px; color:#9ca3af;">
          © 2025 QuickBlog. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Send and record delivery on success to prevent duplicate sends
      sendEmailWithRetry({
        from: `QuickBlog <${process.env.MAIL_USER}>`,
        to: subscriber.email,
        subject: `New Blog: ${blogData.title || 'Check out this new post'}`,
        html
      }).then(async () => {
        try {
          await Delivery.create({ blogId: blogData._id || blogData.id, subscriberId: subscriber._id, email: subscriber.email });
        } catch (err) {
          console.warn('Failed to record delivery for', subscriber.email, err?.message);
        }
      }).catch(err => {
        console.error(`Failed to notify ${subscriber.email}:`, err?.message);
      });
    }
  } catch (error) {
    console.error('Error notifying subscribers:', error?.message);
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - Error</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 100px auto; background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .error { color: #dc2626; font-size: 18px; margin: 20px 0; }
    .icon { font-size: 48px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>Unsubscribe Failed</h1>
    <p class="error">Email address is required</p>
    <p style="color: #666;">Please use the unsubscribe link from your email</p>
  </div>
</body>
</html>`);
    }

    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - Not Found</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 100px auto; background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .warning { color: #ea580c; font-size: 18px; margin: 20px 0; }
    .icon { font-size: 48px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Not Subscribed</h1>
    <p class="warning">This email is not in our subscriber list</p>
    <p style="color: #666;">You may have already unsubscribed or the email address is incorrect</p>
  </div>
</body>
</html>`);
    }

    // Remove related delivery records and delete the subscriber completely
    try {
      await Delivery.deleteMany({ email });
    } catch (err) {
      // if delete by email fails, try deleting by subscriber id after we fetch the subscriber
      console.warn('Delivery cleanup by email failed, will attempt by subscriberId if available');
    }

    // Delete deliveries by subscriber id (useful if email-based deletion didn't match)
    try {
      await Delivery.deleteMany({ subscriberId: subscriber._id });
    } catch (err) {
      console.warn('Delivery cleanup by subscriberId failed:', err?.message);
    }

    await Subscriber.deleteOne({ email });
    console.log(`Subscriber unsubscribed and deliveries removed: ${email}`);

    // Return a success HTML page
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - Success</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container { 
      max-width: 500px;
      background: white;
      padding: 50px 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      animation: slideIn 0.5s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
      animation: bounce 0.6s ease-out;
    }
    @keyframes bounce {
      0% { transform: scale(0.3); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    h1 {
      color: #111827;
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .success-message {
      color: #059669;
      font-size: 16px;
      margin: 20px 0;
      font-weight: 500;
    }
    .email-display {
      background: #f3f4f6;
      padding: 12px 16px;
      border-radius: 8px;
      color: #374151;
      margin: 20px 0;
      word-break: break-all;
      font-family: monospace;
    }
    .description {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 20px 0;
    }
    .actions {
      margin-top: 30px;
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    .btn-secondary:hover {
      background: #f3f4f6;
    }
    .footer {
      color: #9ca3af;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>Successfully Unsubscribed</h1>
    <p class="success-message">You have been removed from our subscriber list</p>
    
    <div class="email-display">${email}</div>
    
    <p class="description">
      We've removed your email address from QuickBlog's newsletter. 
      You will no longer receive any emails from us.
    </p>
    
    <div class="actions">
      <a href="http://localhost:3000" class="btn btn-primary">Back to QuickBlog</a>
      <a href="http://localhost:3000" class="btn btn-secondary">Visit Website</a>
    </div>
    
    <div class="footer">
      <p>If you change your mind, you can resubscribe anytime from the QuickBlog website.</p>
    </div>
  </div>
</body>
</html>`);
  } catch (error) {
    console.error('Unsubscribe error:', error?.message);
    return res.status(500).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - Error</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 100px auto; background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .error { color: #dc2626; font-size: 18px; margin: 20px 0; }
    .icon { font-size: 48px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>Error</h1>
    <p class="error">Something went wrong while unsubscribing</p>
    <p style="color: #666;">Please try again later or contact support</p>
  </div>
</body>
</html>`);
  }
};
