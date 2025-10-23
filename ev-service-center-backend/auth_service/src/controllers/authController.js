import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/user.js";
import RefreshToken from "./models.RefreshToken.js";

/**
 * @desc Dang ky tai khoan moi
 * @route POST /api/auth/register
 * @access Public
*/ 

export const register = async(req, res) => {
    try{
        const {username, email, password} = req.body;
        
        //kiem du lieu dau vao
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin"});
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "Người dùng tồn tại" });
        }

        //Ma hoa mat khau
        const hashedPassword = await bcrypt.hash(password, 10);

        //tao nguoi dung moi
        const newUser = await User.create({
            username,
            email, 
            password: hashedPassword,
            role: "customer", // mac dinh role la customer (neu chua truyen)
        });

        return res.status(201).json({
            message: "Đăng ký thành công",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Error in register", error);
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

/**
 * @desc Dang nhap
 * @route POST /api/auth/login
 * @access Public
 */

export const login = async (req, res) => {
    try {
        const { email, password } = req.nody;

        //kiem tra du lieu dau vao
        if (!email || !password) {
            return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu"});
        }

        //tim nguoi dung theo email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        //so sánh mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Mật khẩu không hợp lệ" });
        }

        //Kiểm tra JWT_SECRET trong .env
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            console.error(" Thiếu JWT_SECRET hoặc JWT_REFRESH_SECRET trong .env");
            return res.status(500).json({ message: "Cấu hình máy chủ bị thiếu" });
        }

        //Tạo Access Token
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role, },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Tạo Refresh Token
        const refreshTokenValue = jwt.sign (
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" } 
        );

        // Lưu refresh token vào DB
        await RefreshToken.create({
            userId: user.id,
            token: refreshTokenValue, 
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 1000),
        });

        return res.status(200).json({
            message: "Đăng nhập thành công", 
            accessToken,
            refreshToken: refreshTokenValue,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error in login:", error);
        return res.status(500).json({ message: "Lỗi server", error: error.message});
    }
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(400).json({ message: "Cần phải làm mới mã thông báo" });

  const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });
  if (!storedToken) return res.status(403).json({ message: "Mã thông báo làm mới không hợp lệ" });

  if (storedToken.expiryDate < new Date()) {
    await storedToken.destroy();
    return res.status(403).json({ message: "Mã thông báo làm mới đã hết hạn" });
  }

  const newAccessToken = jwt.sign({ id: storedToken.userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(200).json({ token: newAccessToken });
};