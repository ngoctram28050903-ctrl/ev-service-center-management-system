import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình transporter (người gửi mail)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false, // true cho port 465, false cho các port khác (như 587)
  auth: {
    user: process.env.MAIL_USER, // Email của bạn
    pass: process.env.MAIL_PASS, // Mật khẩu ứng dụng
  },
  tls: {
    rejectUnauthorized: false // Bỏ qua lỗi tự chứng thực (nếu cần)
  }
});

/**
 * Dịch vụ gửi Email sử dụng Nodemailer
 */
class emailService {
  /**
   * Gửi một email
   * @param {string} to - Email người nhận
   * @param {string} subject - Chủ đề email
   * @param {string} text - Nội dung text (hoặc dùng html)
   * @param {string} [html] - Nội dung HTML (tùy chọn)
   */
  static async sendEmail(to, subject, text, html = null) {
    try {
      const mailOptions = {
        from: `"Garage Auto Service" <${process.env.MAIL_USER}>`, // Tên người gửi
        to: to,
        subject: subject,
        text: text, // Nội dung text
        html: html || text, // Ưu tiên HTML nếu có
      };

      // Gửi email
      let info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email đã gửi: ${info.messageId} (tới ${to})`);
      return true;

    } catch (error) {
      console.error(`❌ Lỗi gửi email tới ${to}:`, error.message);
      // Không ném lỗi ra ngoài để không làm hỏng consumer, chỉ ghi log
      return false;
    }
  }
}

// Lưu ý: Đổi từ 'module.exports' thành 'export default' để khớp với cách import trong consumer
export default emailService;