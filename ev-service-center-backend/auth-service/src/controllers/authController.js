import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { publishToExchange } from "../utils/rabbitmq.js";
import redisClient from "../config/redis.js";
import User from "../models/user.js";
import Role from "../models/role.js"; // Đã import
import { v4 as uuidv4 } from "uuid";
import RefreshToken from "../models/refreshToken.js";
import UserRole from "../models/userRole.js"; // Đã import


const USER_DETAIL_TTL = 3600; 
const USER_LIST_TTL = 300; 
const USER_STATS_TTL = 43200; 


const invalidateUserCaches = async (userId) => {
  console.log("[Cache] Bắt đầu vô hiệu hóa cache người dùng...");
  try {
    const promises = [];
    const statsCacheKey = getUserStatsCacheKey();
    promises.push(redisClient.del(statsCacheKey));
    console.log(`[Cache] Đã lên lịch xóa: ${statsCacheKey}`);

    const listKeyPattern = "users:list:*";
    const listKeys = await redisClient.keys(listKeyPattern);
    if (listKeys.length > 0) {
      promises.push(redisClient.del(listKeys));
      console.log(`[Cache] Đã lên lịch xóa ${listKeys.length} list keys (pattern: ${listKeyPattern})`);
    }

    if (userId) {
      const detailCacheKey = getUserDetailCacheKey(userId);
      promises.push(redisClient.del(detailCacheKey));
      console.log(`[Cache] Đã lên lịch xóa: ${detailCacheKey}`);
    }
    
    await Promise.all(promises);
    console.log("[Cache] Vô hiệu hóa cache người dùng thành công.");
  } catch (err) {
    console.error("[Cache] Lỗi khi vô hiệu hóa cache người dùng:", err);
  }
};

const getUserStatsCacheKey = () => "users:stats";
const getUserListCacheKey = (page, limit, role) => `users:list:page:${page}:limit:${limit}:role:${role || 'all'}`;
const getUserDetailCacheKey = (id) => `user:detail:${id}`;


export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: { username, email, password: hashedPassword },
    });

    if (!created) {
      return res.status(409).json({ message: "Email đã tồn tại." });
    }

    const userRole = await Role.findOne({ where: { name: "user" } });
    if (userRole) {
      await UserRole.create({ userId: user.id, roleId: userRole.id });
    }

    await invalidateUserCaches();

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      where: { email },
      include: {
        model: UserRole,
        as: "userRoles",
        include: { model: Role, as: "role" },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const userRoles = user.userRoles.map((ur) => ur.role.name);

    const accessToken = jwt.sign(
      { userId: user.id, roles: userRoles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const existingToken = await RefreshToken.findOne({ where: { userId: user.id } });
    if (existingToken) {
      await existingToken.destroy();
    }

    const refreshTokenValue = uuidv4();
    await RefreshToken.create({
      token: refreshTokenValue,
      userId: user.id,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Xóa password trước khi gửi về client
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken,
      refreshToken: refreshTokenValue,
      user: userResponse,
      roles: userRoles,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token là bắt buộc" });
  }

  try {
    const tokenDoc = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!tokenDoc) {
      return res.status(403).json({ message: "Refresh token không hợp lệ" });
    }

    if (tokenDoc.expiresAt < new Date()) {
      await tokenDoc.destroy();
      return res.status(403).json({ message: "Refresh token đã hết hạn" });
    }

    const user = await User.findByPk(tokenDoc.userId, {
      include: {
        model: UserRole,
        as: "userRoles",
        include: { model: Role, as: "role" },
      },
    });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const userRoles = user.userRoles.map((ur) => ur.role.name);

    const newAccessToken = jwt.sign(
      { userId: user.id, roles: userRoles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const indexUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const role = req.query.role;
  const offset = (page - 1) * limit;
  const cacheKey = getUserListCacheKey(page, limit, role);

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    let includeOptions = {
      model: Role,
      as: 'roles', // Dùng bí danh 'roles' (từ user.js)
      attributes: ['name'],
      through: { attributes: [] } // Không cần lấy data từ bảng trung gian
    };
    if (role) {
      includeOptions.where = { name: role };
    }
    
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ["password"] },
      include: [includeOptions], 
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true, 
    });

    const totalPages = Math.ceil(count / limit);
    const responseData = {
      data: rows,
      total: count,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: USER_LIST_TTL,
    });

    res.status(200).json(responseData);
  } catch (err) {
    console.error("Lỗi trong hàm indexUsers:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = getUserDetailCacheKey(id);

  try {
    const cachedUser = await redisClient.get(cacheKey);
    if (cachedUser) {
      return res.status(200).json(JSON.parse(cachedUser));
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserRole,
          as: "userRoles",
          include: {
            model: Role,
            as: "role",
            attributes: ["name"],
          },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const responseData = { data: user, message: "Lấy thông tin người dùng thành công" };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: USER_DETAIL_TTL,
    });

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createUser = async (req, res) => {
  const { username, email, password, roles } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: { username, email, password: hashedPassword },
    });

    if (!created) {
      return res.status(409).json({ message: "Email đã tồn tại." });
    }

    if (roles && roles.length > 0) {
      const roleObjects = await Role.findAll({ where: { name: roles } });
      if (roleObjects.length) {
        await UserRole.bulkCreate(
          roleObjects.map((role) => ({ userId: user.id, roleId: role.id }))
        );
      }
    }

    await invalidateUserCaches();
    res.status(201).json({ data: user, message: "Tạo người dùng thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, roles } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    
    await user.save();

    if (roles) {
      await UserRole.destroy({ where: { userId: id } });
      const roleObjects = await Role.findAll({ where: { name: roles } });
      if (roleObjects.length) {
        await UserRole.bulkCreate(
          roleObjects.map((role) => ({ userId: user.id, roleId: role.id }))
        );
      }
    }

    await invalidateUserCaches(id);
    res.status(200).json({ message: "Cập nhật người dùng thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    await UserRole.destroy({ where: { userId: id } });
    await RefreshToken.destroy({ where: { userId: id } });
    await user.destroy();
    
    await invalidateUserCaches(id);
    res.status(200).json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserStats = async (req, res) => {
  const cacheKey = getUserStatsCacheKey();
  try {
    const cachedStats = await redisClient.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json(JSON.parse(cachedStats));
    }

    const currentYear = new Date().getFullYear();

    // Total users (chỉ role 'user')
    const totalStats = await User.count({
      include: {
        model: UserRole,
        as: 'userRoles',
        include: { model: Role, as: 'role', where: { name: "user" } },
        required: true // Bắt buộc phải có role 'user'
      }
    });

    // Monthly new users (chỉ role 'user')
    const monthlyUserStats = await User.findAll({
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("User.createdAt")), "month"],
        [sequelize.fn("COUNT", sequelize.col("User.id")), "count"],
      ],
      include: {
        model: UserRole,
        as: 'userRoles',
        include: { model: Role, as: 'role', where: { name: "user" } },
        required: true,
        attributes: []
      },
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1),
        },
      },
      group: [sequelize.fn("MONTH", sequelize.col("User.createdAt"))],
      order: [[sequelize.fn("MONTH", sequelize.col("User.createdAt")), "ASC"]],
    });

    const monthlyUsers = new Array(12).fill(0);
    monthlyUserStats.forEach((stat) => {
      const monthIndex = parseInt(stat.dataValues.month) - 1;
      monthlyUsers[monthIndex] = parseInt(stat.dataValues.count);
    });

    const totalUsers = totalStats; 

    const userStats = {
      totalUsers,
      monthlyUsers,
    };

    console.log("User stats result (from DB):", userStats);
    const responseData = {
      data: userStats,
      message: "User stats retrieved successfully",
    };

    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: USER_STATS_TTL,
    });

    res.status(200).json(responseData);
  } catch (err) {
    console.error("Error getting user stats:", err);
    res.status(500).json({ message: "Failed to get user stats" });
  }
};


export const getUserByIdInternal = async (req, res) => {
  // (Hàm này dành cho service-to-service, không dùng cache)
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          include: {
            model: Role,
            as: 'role',
            attributes: ['name']
          }
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found (internal)' });
    }
    
    // TRẢ VỀ DATA TRỰC TIẾP (cho client/index.js)
    res.status(200).json(user);
    
  } catch (err) {
    console.error("Error in getUserByIdInternal:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getUserStatsInternal = async (req, res) => {
  // (Hàm này dành cho service-to-service, không dùng cache)
  try {
    const currentYear = new Date().getFullYear();

    // Total users (chỉ role 'user')
    const totalStats = await User.count({
      include: {
        model: UserRole,
        as: 'userRoles',
        include: { model: Role, as: 'role', where: { name: "user" } },
        required: true 
      }
    });

    // Monthly new users (chỉ role 'user')
    const monthlyUserStats = await User.findAll({
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("User.createdAt")), "month"],
        [sequelize.fn("COUNT", sequelize.col("User.id")), "count"],
      ],
      include: {
        model: UserRole,
        as: 'userRoles',
        include: { model: Role, as: 'role', where: { name: "user" } },
        required: true,
        attributes: []
      },
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1),
        },
      },
      group: [sequelize.fn("MONTH", sequelize.col("User.createdAt"))],
      order: [[sequelize.fn("MONTH", sequelize.col("User.createdAt")), "ASC"]],
    });

    const monthlyUsers = new Array(12).fill(0);
    monthlyUserStats.forEach((stat) => {
      const monthIndex = parseInt(stat.dataValues.month) - 1;
      monthlyUsers[monthIndex] = parseInt(stat.dataValues.count);
    });

    const totalUsers = totalStats;

    const userStats = {
      totalUsers,
      monthlyUsers,
    };

    // TRẢ VỀ DATA TRỰC TIẾP (cho client/index.js)
    res.status(200).json(userStats);

  } catch (err) {
    console.error("Error getting user stats (internal):", err);
    res.status(500).json({ message: "Failed to get user stats (internal)" });
  }
};