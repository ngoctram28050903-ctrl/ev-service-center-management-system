import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import User from "../models/user.js";
import RefreshToken from "../models/refreshToken.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    console.log(user);

    if (!user) return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = await RefreshToken.create({
      token: jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" }),
      userId: user.id,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({ token, refreshToken: refreshToken.token, user: {
      id: user.id,
      username: user.username,
      email: user.email,
      userRoles: [{ role: { name: user.role } }] },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

  const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });
  if (!storedToken) return res.status(403).json({ message: "Invalid refresh token" });

  if (storedToken.expiryDate < new Date()) {
    await storedToken.destroy();
    return res.status(403).json({ message: "Refresh token expired" });
  }

  const newAccessToken = jwt.sign({ id: storedToken.userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(200).json({ token: newAccessToken });
};

export const indexUsers = async (req, res) => {
  try {
    const { name, username, email, role, page = 1, limit = 10 } = req.query;
    
    const whereClause = {};
    
    if (name) {
      whereClause.username = { [Op.like]: `%${name}%` };
    }
    
    if (username) {
      whereClause.username = { [Op.like]: `%${username}%` };
    }
    
    if (email) {
      whereClause.email = { [Op.like]: `%${email}%` };
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });
    
    const mapped = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      userRoles: [{ role: { name: u.role } }],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    
    res.status(200).json({
      data: mapped,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      hasNext: offset + parseInt(limit) < count,
      hasPrev: parseInt(page) > 1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      userRoles: [{ role: { name: user.role } }],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, password are required" });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const role = Array.isArray(roles) && roles.length > 0 ? roles[0] : "user";
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword, role });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      userRoles: [{ role: { name: user.role } }],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, roles } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (Array.isArray(roles) && roles.length > 0) user.role = roles[0];
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      userRoles: [{ role: { name: user.role } }],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    return res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    console.log('Start getUserStats');

    const totalStats = await User.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers']
      ],
      where: {
        role: 'user'
      },
      raw: true
    });

    const currentYear = new Date().getFullYear();
    const monthlyUserStats = await User.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        },
        role: 'user'
      },
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
      order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    const monthlyUsers = new Array(12).fill(0);
    monthlyUserStats.forEach(stat => {
      const monthIndex = parseInt(stat.month) - 1;
      monthlyUsers[monthIndex] = parseInt(stat.count);
    });

    const result = totalStats[0] || {};
    const totalUsers = parseInt(result.totalUsers) || 0;

    const userStats = {
      totalUsers,
      monthlyUsers
    };

    console.log('User stats result:', userStats);

    res.status(200).json({
      data: userStats,
      message: 'User stats retrieved successfully'
    });
  } catch (err) {
    console.error('Error getting user stats:', err);
    res.status(500).json({ message: 'Failed to get user stats' });
  }
};
