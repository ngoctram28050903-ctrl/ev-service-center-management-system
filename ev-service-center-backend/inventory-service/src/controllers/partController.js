import Part from "../models/part.js";
import StockLog from "../models/stockLog.js";
import { publishToExchange } from '../utils/rabbitmq.js';
import redisClient from '../config/redis.js';
import PartsUsage from "../models/partsUsage.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
// Nhập các hằng số (constants) để sử dụng trong logic
import { 
  STOCK_CHANGE_TYPES, 
  STOCK_CHANGE_TYPE_VALUES, 
  DEFAULT_VALUES, 
  PAGINATION_DEFAULTS 
} from "../constants/stockConstants.js";

// Định nghĩa thời gian hết hạn (Time-To-Live)
const PART_DETAIL_TTL = 3600;      // 1 giờ: Cache chi tiết vật tư (vì nó nặng)
const PART_LIST_TTL = 300;         // 5 phút: Cache danh sách vật tư (thay đổi thường xuyên)
const PART_STATS_TTL = 3600;       // 1 giờ: Cache thống kê (stats)
const PART_HISTORY_TTL = 3600;     // 1 giờ: Cache lịch sử kho (paginated)
// Hàm helper để tạo key cho danh sách, tránh lặp code
const getPartsListCacheKey = (query) => {
  const { 
    page = PAGINATION_DEFAULTS.PAGE, 
    limit = PAGINATION_DEFAULTS.LIMIT, 
    search, 
    minStock 
  } = query;
  // Key phải đại diện cho TẤT CẢ các tham số query
  return `parts:list:page:${page}:limit:${limit}:search:${search || 'all'}:minStock:${minStock || 'all'}`;
};

/**
 * Lấy tất cả phụ tùng (hỗ trợ phân trang, tìm kiếm, và lọc theo số lượng tồn kho)
 */
export const getParts = async (req, res) => {
  try {
    const cacheKey = getPartsListCacheKey(req.query);
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    // Lấy các tham số query (phân trang và tìm kiếm)
    console.log(`[Cache] MISS for ${cacheKey}`);
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.LIMIT, search, minStock } = req.query;
    const offset = (page - 1) * limit;

    // Xây dựng điều kiện truy vấn (where)
    const whereCondition = {};
    if (search) {
      // Tìm kiếm theo 'name' hoặc 'partNumber'
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { partNumber: { [Op.like]: `%${search}%` } }
      ];
    }
    if (minStock !== undefined) {
      // Lọc các phụ tùng có số lượng sắp hết (dưới mức minStock)
      whereCondition.quantity = { [Op.lte]: minStock };
    }

    // Tìm và đếm tất cả phụ tùng khớp điều kiện
    const { count, rows: parts } = await Part.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']], // Sắp xếp mới nhất lên đầu
      include: [
        {
          // Bao gồm 5 lịch sử kho (StockLog) gần nhất
          model: StockLog,
          as: 'StockLogs',
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    // Trả về dữ liệu kèm thông tin phân trang
    const responseData = {
      data: parts,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      hasNext: offset + parseInt(limit) < count,
      hasPrev: parseInt(page) > 1
    };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: PART_LIST_TTL
    });
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy thông tin chi tiết của một phụ tùng bằng ID
 */
export const getPartById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `part:detail:${id}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json({ data: JSON.parse(cachedData) });
    }

    console.log(`[Cache] MISS for ${cacheKey}`);
    const part = await Part.findByPk(id, {
      include: [
        {
          // Bao gồm toàn bộ lịch sử kho
          model: StockLog,
          as: 'StockLogs',
          order: [['createdAt', 'DESC']]
        },
        {
          // Bao gồm lịch sử sử dụng (cho work order nào)
          model: PartsUsage,
          as: 'PartsUsages',
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }
    await redisClient.set(cacheKey, JSON.stringify(part), {
      EX: PART_DETAIL_TTL
    });

    res.status(200).json({
      data: part
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Thêm một phụ tùng mới vào kho
 */
export const addPart = async (req, res) => {
  try {
    const { name, partNumber, quantity = DEFAULT_VALUES.INITIAL_QUANTITY, minStock = DEFAULT_VALUES.MIN_STOCK } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !partNumber) {
      return res.status(400).json({ message: "Name and partNumber are required" });
    }

    // Kiểm tra xem mã phụ tùng (partNumber) đã tồn tại chưa
    const existingPart = await Part.findOne({ where: { partNumber } });
    if (existingPart) {
      return res.status(400).json({ message: "Part number already exists" });
    }

    // Tạo phụ tùng mới
    const part = await Part.create({ name, partNumber, quantity, minStock });
    
    // Nếu có số lượng ban đầu, tạo một log nhập kho (IN)
    if (quantity > 0) {
      await StockLog.create({ 
        changeType: STOCK_CHANGE_TYPES.IN, 
        quantity, 
        partId: part.id 
      });
    }

    // Gửi sự kiện nếu sắp hết hàng (ngay khi tạo)
    if (part.quantity < part.minStock) {
      await publishToExchange('inventory_events', {
        type: 'PART_LOW_STOCK',
        payload: part // Gửi thông tin phụ tùng sắp hết
      });
    }
    // Xóa cache thống kê (vì totalParts đã thay đổi)
    const statsCacheKey = `parts:stats:year:${new Date().getFullYear()}`;
    await redisClient.del(statsCacheKey);
    console.log(`[Cache] DELETED ${statsCacheKey}`);

    // Xóa cache trang 1 của danh sách
    const listCacheKey = getPartsListCacheKey({ page: 1 }); // Xóa cache trang 1
    await redisClient.del(listCacheKey);
    console.log(`[Cache] DELETED ${listCacheKey}`);

    res.status(201).json({
      data: part,
      message: "Part created successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cập nhật thông tin cơ bản của phụ tùng (tên, mã, mức tồn kho tối thiểu)
 */
export const updatePart = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, partNumber, minStock } = req.body;

    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    // Kiểm tra nếu partNumber bị thay đổi, nó không được trùng với cái khác
    if (partNumber && partNumber !== part.partNumber) {
      const existingPart = await Part.findOne({ 
        where: { 
          partNumber,
          id: { [Op.ne]: id } // Loại trừ chính nó
        } 
      });
      if (existingPart) {
        return res.status(400).json({ message: "Part number already exists" });
      }
    }

    // Tạo đối tượng dữ liệu để cập nhật (chỉ cập nhật các trường được cung cấp)
    const updateData = {};
    if (name) updateData.name = name;
    if (partNumber) updateData.partNumber = partNumber;
    if (minStock !== undefined) updateData.minStock = minStock;

    await part.update(updateData);
    
    // Dữ liệu chi tiết (name, minStock) đã thay đổi -> Xóa cache chi tiết
    const cacheKey = `part:detail:${id}`;
    await redisClient.del(cacheKey);
    console.log(`[Cache] DELETED ${cacheKey}`);

    res.status(200).json({
      data: part,
      message: "Part updated successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Xóa một phụ tùng (nếu nó chưa được sử dụng)
 */
export const deletePart = async (req, res) => {
  try {
    const { id } = req.params;

    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    // Kiểm tra xem phụ tùng có đang được sử dụng trong work order nào không
    const partsUsage = await PartsUsage.findOne({ where: { partId: id } });
    if (partsUsage) {
      return res.status(400).json({ 
        message: "Cannot delete part that is being used in work orders" 
      });
    }

    // Xóa các lịch sử kho liên quan
    await StockLog.destroy({ where: { partId: id } });
    
    // Xóa phụ tùng
    await part.destroy();

    // Xóa cache chi tiết
    const cacheKey = `part:detail:${id}`;
    await redisClient.del(cacheKey);
    console.log(`[Cache] DELETED ${cacheKey}`);

    // Xóa cache thống kê (vì totalParts đã thay đổi)
    const statsCacheKey = `parts:stats:year:${new Date().getFullYear()}`;
    await redisClient.del(statsCacheKey);
    console.log(`[Cache] DELETED ${statsCacheKey}`);

    res.status(200).json({ 
      message: "Part deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cập nhật số lượng tồn kho (Nhập kho / Xuất kho)
 */
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { changeType, quantity, reason } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!changeType || !quantity) {
      return res.status(400).json({ message: "changeType and quantity are required" });
    }

    if (!STOCK_CHANGE_TYPE_VALUES.includes(changeType)) {
      return res.status(400).json({ message: `changeType must be one of: ${STOCK_CHANGE_TYPE_VALUES.join(', ')}` });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "quantity must be greater than 0" });
    }

    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    // Kiểm tra tồn kho nếu là thao tác 'XUẤT' (OUT)
    if (changeType === STOCK_CHANGE_TYPES.OUT && part.quantity < quantity) {
      return res.status(400).json({ 
        message: "Insufficient stock", // Không đủ hàng
        available: part.quantity,
        requested: quantity 
      });
    }

    // Cập nhật số lượng
    if (changeType === STOCK_CHANGE_TYPES.IN) {
      part.quantity += quantity;
    } else {
      part.quantity -= quantity;
    }

    await part.save();
    
    // Tạo log cho lịch sử thay đổi kho
    await StockLog.create({ 
      changeType, 
      quantity, 
      partId: part.id,
      reason: reason || null
    });

    // Gửi sự kiện nếu sắp hết hàng (sau khi giảm số lượng)
    const minStock = part.minStock || DEFAULT_VALUES.MIN_STOCK;
    if (part.quantity < minStock) {
      await publishToExchange('inventory_events', {
        type: 'PART_LOW_STOCK',
        payload: part
      });
    }

    //'quantity' VÀ 'StockLog' (trong include) đã thay đổi
    // -> Xóa cache chi tiết (nặng)
    const detailCacheKey = `part:detail:${id}`;
    await redisClient.del(detailCacheKey);
    console.log(`[Cache] DELETED ${detailCacheKey}`);

    //'totalQuantity' đã thay đổi -> Xóa cache thống kê
    const statsCacheKey = `parts:stats:year:${new Date().getFullYear()}`;
    await redisClient.del(statsCacheKey);
    console.log(`[Cache] DELETED ${statsCacheKey}`);

    //lịch sử kho đã thay đổi -> Xóa cache lịch sử kho (trang 1)
    const historyCacheKey = `part:history:${id}:page:1:limit:${PAGINATION_DEFAULTS.STOCK_HISTORY_LIMIT}`;
    await redisClient.del(historyCacheKey);
    console.log(`[Cache] DELETED ${historyCacheKey}`);

    res.status(200).json({
      data: part,
      message: `Stock ${changeType === STOCK_CHANGE_TYPES.IN ? 'increased' : 'decreased'} by ${quantity}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy lịch sử nhập/xuất kho của một phụ tùng
 */
export const getStockHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.STOCK_HISTORY_LIMIT } = req.query;
    const offset = (page - 1) * limit;

    const cacheKey = `part:history:${id}:page:${page}:limit:${limit}`;
    
    // KIỂM TRA CACHE
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    // Tìm và đếm lịch sử kho (StockLog)
    const { count, rows: stockLogs } = await StockLog.findAndCountAll({
      where: { partId: id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const responseData = {
      data: {
        part: { id: part.id, name: part.name, partNumber: part.partNumber },
        stockLogs
      },
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      hasNext: offset + parseInt(limit) < count,
      hasPrev: parseInt(page) > 1
    };

    //LƯU VÀO CACHE
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: PART_HISTORY_TTL
    });
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy thống kê kho (cho Dashboard)
 */
export const getPartsStats = async (req, res) => {
  try {
    console.log('Start getPartsStats');
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const cacheKey = `parts:stats:year:${year}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log(`[Cache] MISS for ${cacheKey}`);
    // Thống kê tổng số loại phụ tùng và tổng số lượng
    const totalStats = await Part.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalParts'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
      ],
      raw: true
    });

    // Thống kê theo tháng (dựa trên StockLog - lịch sử nhập/xuất)
    const monthlyStats = await StockLog.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'], // Số lần nhập/xuất
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'] // Tổng số lượng nhập/xuất
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(year, 0, 1),
          [Op.lt]: new Date(year + 1, 0, 1)
        }
      },
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
      order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    console.log('monthlyPartsStats = ', monthlyStats);

    // Chuẩn bị mảng 12 tháng
    const monthlyParts = new Array(12).fill(0);
    const monthlyQuantities = new Array(12).fill(0);

    // Điền dữ liệu vào mảng
    monthlyStats.forEach(stat => {
      const monthIndex = parseInt(stat.month) - 1;
      monthlyParts[monthIndex] = parseInt(stat.count);
      monthlyQuantities[monthIndex] = parseInt(stat.totalQuantity) || 0;
    });

    const result = totalStats[0] || {};
    const totalParts = parseInt(result.totalParts) || 0;
    const totalQuantity = parseInt(result.totalQuantity) || 0;

    const partsStats = {
      totalParts,
      totalQuantity,
      monthlyParts,
      monthlyQuantities,
      year
    };

    console.log('Parts stats result:', partsStats);

    const responseData = {
      data: partsStats,
      message: 'Parts stats retrieved successfully'
    };
    //TTL dài
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: PART_STATS_TTL
    });

    console.log('Parts stats result (from DB):', partsStats);
    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error getting parts stats:', err);
    res.status(500).json({ message: 'Failed to get parts stats' });
  }
};

export const getPartStatsInternal = async (req, res) => {
  try {
    const result = await getPartStats(req, res); 
    res.status(200).json(result.data); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllPartsInternal = async (req, res) => {
  try {
    const result = await getAllParts(req, res);
    res.status(200).json(result.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPartByIdInternal = async (req, res) => {
  try {
    const result = await getPartById(req, res); 
    res.status(200).json(result.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
