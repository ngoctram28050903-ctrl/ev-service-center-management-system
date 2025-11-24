import Part from "../models/part.js";
import StockLog from "../models/stockLog.js";
import PartsUsage from "../models/partsUsage.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { 
  STOCK_CHANGE_TYPES, 
  STOCK_CHANGE_TYPE_VALUES, 
  DEFAULT_VALUES, 
  PAGINATION_DEFAULTS 
} from "../constants/stockConstants.js";

// Get all parts with pagination and filtering
export const getParts = async (req, res) => {
  try {
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.LIMIT, search, minStock } = req.query;
    const offset = (page - 1) * limit;

    // Build search conditions
    const whereCondition = {};
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { partNumber: { [Op.like]: `%${search}%` } }
      ];
    }
    if (minStock !== undefined) {
      whereCondition.quantity = { [Op.lte]: minStock };
    }

    const { count, rows: parts } = await Part.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: StockLog,
          as: 'StockLogs',
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    res.status(200).json({
      data: parts,
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

// Get part details by ID
export const getPartById = async (req, res) => {
  try {
    const { id } = req.params;
    const part = await Part.findByPk(id, {
      include: [
        {
          model: StockLog,
          as: 'StockLogs',
          order: [['createdAt', 'DESC']]
        },
        {
          model: PartsUsage,
          as: 'PartsUsages',
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    res.status(200).json({
      data: part
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new part
export const addPart = async (req, res) => {
  try {
    const { name, partNumber, quantity = DEFAULT_VALUES.INITIAL_QUANTITY, minStock = DEFAULT_VALUES.MIN_STOCK } = req.body;

    // Validate required fields
    if (!name || !partNumber) {
      return res.status(400).json({ message: "Name and partNumber are required" });
    }

    // Check if partNumber already exists
    const existingPart = await Part.findOne({ where: { partNumber } });
    if (existingPart) {
      return res.status(400).json({ message: "Part number already exists" });
    }

    const part = await Part.create({ name, partNumber, quantity, minStock });
    
    // Create stock log if initial quantity is provided
    if (quantity > 0) {
      await StockLog.create({ 
        changeType: STOCK_CHANGE_TYPES.IN, 
        quantity, 
        partId: part.id 
      });
    }

    res.status(201).json({
      data: part,
      message: "Part created successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update part information
export const updatePart = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, partNumber, minStock } = req.body;

    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    // Check if partNumber already exists (if changed)
    if (partNumber && partNumber !== part.partNumber) {
      const existingPart = await Part.findOne({ 
        where: { 
          partNumber,
          id: { [Op.ne]: id }
        } 
      });
      if (existingPart) {
        return res.status(400).json({ message: "Part number already exists" });
      }
    }

    // Update part information
    const updateData = {};
    if (name) updateData.name = name;
    if (partNumber) updateData.partNumber = partNumber;
    if (minStock !== undefined) updateData.minStock = minStock;

    await part.update(updateData);
    
    res.status(200).json({
      data: part,
      message: "Part updated successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete part
export const deletePart = async (req, res) => {
  try {
    const { id } = req.params;

    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    // Check if part is being used in work orders
    const partsUsage = await PartsUsage.findOne({ where: { partId: id } });
    if (partsUsage) {
      return res.status(400).json({ 
        message: "Cannot delete part that is being used in work orders" 
      });
    }

    // Delete related stock logs
    await StockLog.destroy({ where: { partId: id } });
    
    // Delete part
    await part.destroy();

    res.status(200).json({ 
      message: "Part deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update stock (in/out)
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { changeType, quantity, reason } = req.body;

    // Validate required fields
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

    // Check stock availability for OUT operations
    if (changeType === STOCK_CHANGE_TYPES.OUT && part.quantity < quantity) {
      return res.status(400).json({ 
        message: "Insufficient stock", 
        available: part.quantity,
        requested: quantity 
      });
    }

    // Update quantity
    if (changeType === STOCK_CHANGE_TYPES.IN) {
      part.quantity += quantity;
    } else {
      part.quantity -= quantity;
    }

    await part.save();
    
    // Create stock log
    await StockLog.create({ 
      changeType, 
      quantity, 
      partId: part.id,
      reason: reason || null
    });

    res.status(200).json({
      data: part,
      message: `Stock ${changeType === STOCK_CHANGE_TYPES.IN ? 'increased' : 'decreased'} by ${quantity}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get stock history for a part
export const getStockHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.STOCK_HISTORY_LIMIT } = req.query;
    const offset = (page - 1) * limit;

    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    const { count, rows: stockLogs } = await StockLog.findAndCountAll({
      where: { partId: id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
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
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPartsStats = async (req, res) => {
  try {
    console.log('Start getPartsStats');
    
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    const totalStats = await Part.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalParts'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
      ],
      raw: true
    });

    const monthlyStats = await StockLog.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
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

    const monthlyParts = new Array(12).fill(0);
    const monthlyQuantities = new Array(12).fill(0);

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

    res.status(200).json({
      data: partsStats,
      message: 'Parts stats retrieved successfully'
    });
  } catch (err) {
    console.error('Error getting parts stats:', err);
    res.status(500).json({ message: 'Failed to get parts stats' });
  }
};
