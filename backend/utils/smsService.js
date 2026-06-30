const logger = require('./logger');

let twilioClient;

// Initialize Twilio
const initializeSMSService = () => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn('Twilio credentials not configured');
      return false;
    }

    const twilio = require('twilio');
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    logger.info('SMS service (Twilio) initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize SMS service', { error: error.message });
    return false;
  }
};

// SMS templates
const smsTemplates = {
  complaintReceived: (complaint) => 
    `CivicMate: Your complaint "${complaint.title}" has been registered. ID: ${complaint._id.toString().slice(-6)}. Track status at ${process.env.FRONTEND_URL}/profile`,

  statusChanged: (complaint, newStatus) => {
    const statusMessages = {
      'pending': 'is now pending review',
      'in-progress': 'is being worked on',
      'completed': 'has been resolved'
    };
    return `CivicMate: Your complaint "${complaint.title}" ${statusMessages[newStatus]}. View details at ${process.env.FRONTEND_URL}/profile`;
  },

  feedbackRequest: (complaint) =>
    `CivicMate: Your complaint "${complaint.title}" is resolved. Please rate our service at ${process.env.FRONTEND_URL}/profile`,

  assignmentNotification: (complaint, assignedTo) =>
    `CivicMate: Complaint "${complaint.title}" has been assigned to you. ID: ${complaint._id.toString().slice(-6)}. View at ${process.env.FRONTEND_URL}/admin`,

  urgentAlert: (complaint) =>
    `CivicMate URGENT: High priority complaint "${complaint.title}" requires immediate attention. ID: ${complaint._id.toString().slice(-6)}`
};

// Send SMS function
const sendSMS = async (to, template, data) => {
  if (!twilioClient) {
    const initialized = initializeSMSService();
    if (!initialized) {
      logger.warn('SMS service not configured, skipping SMS');
      return { success: false, error: 'SMS service not configured' };
    }
  }

  // Validate phone number format
  if (!to || !to.match(/^\+?[1-9]\d{1,14}$/)) {
    logger.warn('Invalid phone number format', { to });
    return { success: false, error: 'Invalid phone number' };
  }

  // Ensure phone number has country code
  const phoneNumber = to.startsWith('+') ? to : `+91${to}`;

  try {
    const message = smsTemplates[template](data);
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    logger.info('SMS sent successfully', { 
      to: phoneNumber, 
      template, 
      sid: result.sid 
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    logger.error('Failed to send SMS', { 
      to: phoneNumber, 
      template, 
      error: error.message 
    });
    return { success: false, error: error.message };
  }
};

// Specific SMS functions
const sendComplaintReceivedSMS = (phone, complaint) => {
  return sendSMS(phone, 'complaintReceived', complaint);
};

const sendStatusChangedSMS = (phone, complaint, newStatus) => {
  return sendSMS(phone, 'statusChanged', { complaint, newStatus });
};

const sendFeedbackRequestSMS = (phone, complaint) => {
  return sendSMS(phone, 'feedbackRequest', complaint);
};

const sendAssignmentNotificationSMS = (phone, complaint, assignedTo) => {
  return sendSMS(phone, 'assignmentNotification', { complaint, assignedTo });
};

const sendUrgentAlertSMS = (phone, complaint) => {
  return sendSMS(phone, 'urgentAlert', complaint);
};

// Bulk SMS function
const sendBulkSMS = async (recipients, template, data) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, template, data);
    results.push({
      phone: recipient.phone,
      ...result
    });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successCount = results.filter(r => r.success).length;
  logger.info('Bulk SMS completed', { 
    total: recipients.length, 
    success: successCount,
    failed: recipients.length - successCount
  });

  return results;
};

module.exports = {
  initializeSMSService,
  sendSMS,
  sendComplaintReceivedSMS,
  sendStatusChangedSMS,
  sendFeedbackRequestSMS,
  sendAssignmentNotificationSMS,
  sendUrgentAlertSMS,
  sendBulkSMS
};
