import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Không có mã thông báo nào được cung cấp!" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Không được phép!" });
    req.user = {
      id: decoded.id,
      role: decoded.roles || []
    };
    next();
  });
};

export const isAdmin = (req, res, next) => {
  // req.user được tạo từ verifyToken
  console.log("DEBUG User tại isAdmin:", req.user);
  if (req.user && req.user.role && req.user.role.includes('admin')) {
    return next(); // Là admin, cho qua
  }
  console.log("--> Chặn truy cập: User không đủ quyền hoặc thiếu thông tin roles");
  return res.status(403).json({ message: "Yêu cầu quyền Admin!" });

};
/**
 * Middleware kiểm tra xem user có phải là "chính mình" HOẶC là Admin.
 * Dùng cho các tác vụ: xem profile, sửa profile.
 * Phải chạy SAU verifyToken.
 */
export const isSelfOrAdmin = (req, res, next) => {
  const userIdFromToken = req.user.id;
  const userIdFromParams = parseInt(req.params.id, 10); // Lấy id từ URL

  // Nếu là admin HOẶC id trong token khớp với id trên URL
  if (req.user.role.includes('admin') || userIdFromToken === userIdFromParams) {
    return next(); // Cho qua
  }
  
  return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này!" });
};
