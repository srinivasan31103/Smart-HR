const { Notification } = require('../models');
const { NOTIFICATION_TYPES, NOTIFICATION_EVENTS } = require('../config/constants');

/**
 * Notification Service
 *
 * Pluggable notification service supporting multiple channels:
 * - Email (Mock / SMTP)
 * - SMS (Mock / Twilio)
 * - WhatsApp (Mock / Twilio)
 * - In-App Notifications
 */

class NotificationService {
  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'mock';
    this.smsProvider = process.env.SMS_PROVIDER || 'mock';
  }

  /**
   * Send notification to user
   * @param {Object} options
   * @param {string} options.recipientId - Employee ID
   * @param {string} options.companyId - Company ID
   * @param {string} options.type - Notification type (EMAIL, SMS, etc.)
   * @param {string} options.event - Notification event
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.metadata - Additional metadata
   */
  async send(options) {
    const {
      recipientId,
      companyId,
      type = NOTIFICATION_TYPES.EMAIL,
      event,
      title,
      message,
      metadata = {},
      relatedEntity = {},
    } = options;

    try {
      // Create notification record
      const notification = await Notification.create({
        recipient: recipientId,
        company: companyId,
        type,
        event,
        title,
        message,
        metadata,
        relatedEntity,
        status: 'PENDING',
      });

      // Send via appropriate channel
      let sent = false;
      let failureReason = null;

      switch (type) {
        case NOTIFICATION_TYPES.EMAIL:
          sent = await this._sendEmail(notification);
          break;
        case NOTIFICATION_TYPES.SMS:
          sent = await this._sendSMS(notification);
          break;
        case NOTIFICATION_TYPES.WHATSAPP:
          sent = await this._sendWhatsApp(notification);
          break;
        case NOTIFICATION_TYPES.IN_APP:
          sent = true; // In-app notifications are just DB records
          break;
      }

      // Update notification status
      notification.status = sent ? 'SENT' : 'FAILED';
      notification.sentAt = sent ? new Date() : null;
      if (!sent) notification.failureReason = failureReason;
      await notification.save();

      return { success: sent, notificationId: notification._id };
    } catch (error) {
      console.error('Notification send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(notifications) {
    const results = await Promise.allSettled(notifications.map((notif) => this.send(notif)));
    return results;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(recipientId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { recipient: recipientId };
    if (unreadOnly) query.status = { $ne: 'READ' };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error('Notification not found');

    notification.status = 'READ';
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(recipientId) {
    await Notification.updateMany(
      { recipient: recipientId, status: { $ne: 'READ' } },
      { $set: { status: 'READ', readAt: new Date() } }
    );
  }

  // ==================== EMAIL SENDING ====================

  async _sendEmail(notification) {
    const recipient = await notification.populate('recipient');

    if (this.emailProvider === 'mock') {
      return await this._sendEmailMock(recipient.email, notification.title, notification.message);
    }

    // TODO: Implement real SMTP
    return await this._sendEmailSMTP(recipient.email, notification.title, notification.message);
  }

  async _sendEmailMock(to, subject, body) {
    console.log('📧 [MOCK EMAIL]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('---');
    return true;
  }

  async _sendEmailSMTP(to, subject, htmlBody) {
    // TODO: Implement with Nodemailer
    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlBody,
    });

    return true;
    */

    throw new Error('SMTP email not implemented yet');
  }

  // ==================== SMS SENDING ====================

  async _sendSMS(notification) {
    const recipient = await notification.populate('recipient');

    if (this.smsProvider === 'mock') {
      return await this._sendSMSMock(recipient.phone, notification.message);
    }

    // TODO: Implement Twilio
    return await this._sendSMSTwilio(recipient.phone, notification.message);
  }

  async _sendSMSMock(to, message) {
    console.log('📱 [MOCK SMS]');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('---');
    return true;
  }

  async _sendSMSTwilio(to, message) {
    // TODO: Implement with Twilio
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return true;
    */

    throw new Error('Twilio SMS not implemented yet');
  }

  // ==================== WHATSAPP SENDING ====================

  async _sendWhatsApp(notification) {
    const recipient = await notification.populate('recipient');

    if (this.smsProvider === 'mock') {
      return await this._sendWhatsAppMock(recipient.phone, notification.message);
    }

    // TODO: Implement Twilio WhatsApp
    return await this._sendWhatsAppTwilio(recipient.phone, notification.message);
  }

  async _sendWhatsAppMock(to, message) {
    console.log('💬 [MOCK WHATSAPP]');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('---');
    return true;
  }

  async _sendWhatsAppTwilio(to, message) {
    // TODO: Implement with Twilio WhatsApp
    throw new Error('Twilio WhatsApp not implemented yet');
  }

  // ==================== NOTIFICATION TEMPLATES ====================

  getLeaveAppliedTemplate(employeeName, leaveType, fromDate, toDate) {
    return {
      title: 'New Leave Application',
      message: `${employeeName} has applied for ${leaveType} from ${fromDate} to ${toDate}. Please review and approve.`,
    };
  }

  getLeaveApprovedTemplate(leaveType, fromDate, toDate) {
    return {
      title: 'Leave Approved',
      message: `Your ${leaveType} from ${fromDate} to ${toDate} has been approved.`,
    };
  }

  getLeaveRejectedTemplate(leaveType, fromDate, toDate, reason) {
    return {
      title: 'Leave Rejected',
      message: `Your ${leaveType} from ${fromDate} to ${toDate} has been rejected. Reason: ${reason}`,
    };
  }

  getLateArrivalTemplate(employeeName, punchInTime, lateBy) {
    return {
      title: 'Late Arrival Alert',
      message: `${employeeName} arrived late today at ${punchInTime}. Late by ${lateBy} minutes.`,
    };
  }
}

module.exports = new NotificationService();
