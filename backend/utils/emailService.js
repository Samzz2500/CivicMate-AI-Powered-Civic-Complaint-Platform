const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter
let transporter;

const initializeEmailService = () => {
  try {
    transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    logger.info('Email service initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize email service', { error: error.message });
    return false;
  }
};

// Email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to CivicMate - Shahar Sahayya Kranti',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to CivicMate!</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Shahar Sahayya Kranti</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${user.firstname} ${user.lastname}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining CivicMate, your AI-powered civic engagement platform. 
            We're excited to have you as part of our community working towards a better city!
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">What you can do:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>🚧 Report potholes and road issues</li>
              <li>🗑️ Report garbage and waste problems</li>
              <li>💡 Report street light issues</li>
              <li>💧 Report water supply problems</li>
              <li>🚰 Report sewage and drainage issues</li>
              <li>📊 Track your complaint status in real-time</li>
              <li>⭐ Rate services after resolution</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Get Started
            </a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            CivicMate - AI Driven City Grievances<br>
            Thane Municipal Corporation
          </p>
        </div>
      </div>
    `
  }),

  complaintReceived: (user, complaint) => ({
    subject: `Complaint Received - ${complaint.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4CAF50; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="color: white; margin: 0;">✅ Complaint Received</h2>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #666;">Hello ${user.firstname},</p>
          <p style="color: #666;">Your complaint has been successfully registered in our system.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Complaint Details:</h3>
            <table style="width: 100%; color: #666;">
              <tr>
                <td style="padding: 8px 0;"><strong>Title:</strong></td>
                <td>${complaint.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Category:</strong></td>
                <td style="text-transform: capitalize;">${complaint.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Location:</strong></td>
                <td>${complaint.location}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                <td><span style="background: #FFA726; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PENDING</span></td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Complaint ID:</strong></td>
                <td>${complaint._id}</td>
              </tr>
            </table>
          </div>

          <p style="color: #666;">
            Our team will review your complaint and take appropriate action. 
            You'll receive updates via email and in-app notifications.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/profile" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Track Status
            </a>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Thank you for helping make our city better!
          </p>
        </div>
      </div>
    `
  }),

  statusChanged: (user, complaint, oldStatus, newStatus) => {
    const statusColors = {
      'pending': '#FFA726',
      'in-progress': '#42A5F5',
      'completed': '#66BB6A'
    };

    const statusEmojis = {
      'pending': '🟡',
      'in-progress': '🔵',
      'completed': '🟢'
    };

    return {
      subject: `Status Update: ${complaint.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${statusColors[newStatus]}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0;">${statusEmojis[newStatus]} Status Updated</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #666;">Hello ${user.firstname},</p>
            <p style="color: #666;">The status of your complaint has been updated.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">${complaint.title}</h3>
              <p style="color: #666; margin: 10px 0;">
                <strong>Location:</strong> ${complaint.location}
              </p>
              <div style="margin: 20px 0;">
                <span style="background: ${statusColors[oldStatus]}; color: white; padding: 6px 16px; border-radius: 12px; text-transform: uppercase; font-size: 12px;">
                  ${oldStatus}
                </span>
                <span style="margin: 0 10px; color: #999;">→</span>
                <span style="background: ${statusColors[newStatus]}; color: white; padding: 6px 16px; border-radius: 12px; text-transform: uppercase; font-size: 12px;">
                  ${newStatus}
                </span>
              </div>
            </div>

            ${newStatus === 'completed' ? `
              <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #66BB6A;">
                <p style="color: #2E7D32; margin: 0;">
                  <strong>🎉 Great news!</strong> Your complaint has been resolved. 
                  We'd love to hear your feedback about our service.
                </p>
              </div>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.FRONTEND_URL}/profile" 
                   style="background: #66BB6A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Rate Our Service
                </a>
              </div>
            ` : `
              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.FRONTEND_URL}/profile" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Details
                </a>
              </div>
            `}
          </div>
        </div>
      `
    };
  },

  feedbackRequest: (user, complaint) => ({
    subject: `Please Rate Our Service - ${complaint.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #66BB6A; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="color: white; margin: 0;">⭐ We Value Your Feedback</h2>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #666;">Hello ${user.firstname},</p>
          <p style="color: #666;">
            Your complaint "<strong>${complaint.title}</strong>" has been resolved. 
            We'd appreciate if you could take a moment to rate our service.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin-bottom: 20px;">How satisfied are you with our service?</p>
            <div style="font-size: 32px; margin: 20px 0;">
              ⭐ ⭐ ⭐ ⭐ ⭐
            </div>
            <a href="${process.env.FRONTEND_URL}/profile" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
              Submit Feedback
            </a>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Your feedback helps us improve our services and serve you better.
          </p>
        </div>
      </div>
    `
  }),

  weeklyDigest: (user, stats) => ({
    subject: 'Your Weekly CivicMate Summary',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="color: white; margin: 0;">📊 Your Weekly Summary</h2>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">CivicMate Activity Report</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #666;">Hello ${user.firstname},</p>
          <p style="color: #666;">Here's a summary of your complaints this week:</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; color: #667eea; font-weight: bold;">${stats.total}</div>
              <div style="color: #666; margin-top: 5px;">Total Complaints</div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; color: #66BB6A; font-weight: bold;">${stats.completed}</div>
              <div style="color: #666; margin-top: 5px;">Resolved</div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; color: #42A5F5; font-weight: bold;">${stats.inProgress}</div>
              <div style="color: #666; margin-top: 5px;">In Progress</div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; color: #FFA726; font-weight: bold;">${stats.pending}</div>
              <div style="color: #666; margin-top: 5px;">Pending</div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/profile" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View All Complaints
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            Thank you for being an active citizen!
          </p>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  if (!transporter) {
    const initialized = initializeEmailService();
    if (!initialized) {
      logger.warn('Email service not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }
  }

  try {
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: `"CivicMate" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', { 
      to, 
      template, 
      messageId: info.messageId 
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email', { 
      to, 
      template, 
      error: error.message 
    });
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendWelcomeEmail = (user) => {
  return sendEmail(user.email, 'welcome', user);
};

const sendComplaintReceivedEmail = (user, complaint) => {
  return sendEmail(user.email, 'complaintReceived', { user, complaint });
};

const sendStatusChangedEmail = (user, complaint, oldStatus, newStatus) => {
  return sendEmail(user.email, 'statusChanged', { user, complaint, oldStatus, newStatus });
};

const sendFeedbackRequestEmail = (user, complaint) => {
  return sendEmail(user.email, 'feedbackRequest', { user, complaint });
};

const sendWeeklyDigestEmail = (user, stats) => {
  return sendEmail(user.email, 'weeklyDigest', { user, stats });
};

module.exports = {
  initializeEmailService,
  sendEmail,
  sendWelcomeEmail,
  sendComplaintReceivedEmail,
  sendStatusChangedEmail,
  sendFeedbackRequestEmail,
  sendWeeklyDigestEmail
};
