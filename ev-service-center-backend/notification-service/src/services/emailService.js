class emailService {
  static async sendEmail(to, subject, message) {
    console.log(`📧 Sending email to ${to}: ${subject} - ${message}`);
    // Thực tế có thể dùng nodemailer hoặc API khác ở đây
    return true;
  }
}

module.exports = emailService;
