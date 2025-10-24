import Part from "../models/part.js";
import StockLog from "../models/stockLog.js";

/**
 * @desc Lấy danh sách tất cả phụ tùng
 * @route GET /api/inventory/parts
 */
export const getParts = async (req, res) => {
  try {
    const parts = await Part.findAll({ order: [["id", "ASC"]] });
    res.status(200).json(parts);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách phụ tùng:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc Thêm phụ tùng mới vào kho
 * @route POST /api/inventory/parts
 */
export const addPart = async (req, res) => {
  try {
    const { name, partNumber, quantity, minStock } = req.body;

    // Validate dữ liệu đầu vào
    if (!name || !partNumber || quantity === undefined || !minStock) {
      return res
        .status(400)
        .json({ error: "Thiếu thông tin: name, partNumber, quantity, minStock" });
    }

    const part = await Part.create({ name, partNumber, quantity, minStock });

    // Ghi log nhập kho
    await StockLog.create({
      changeType: "IN",
      quantity,
      partId: part.id,
      note: "Nhập mới kho",
    });

    res.status(201).json({
      message: "Phụ tùng đã được thêm thành công",
      part,
    });
  } catch (err) {
    console.error("❌ Lỗi khi thêm phụ tùng:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc Cập nhật tồn kho (nhập/xuất)
 * @route PUT /api/inventory/parts/:id/stock
 */
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { changeType, quantity, note } = req.body;

    const part = await Part.findByPk(id);
    if (!part) return res.status(404).json({ error: "Không tìm thấy phụ tùng" });

    // Kiểm tra dữ liệu đầu vào
    if (!["IN", "OUT"].includes(changeType)) {
      return res.status(400).json({ error: "changeType phải là IN hoặc OUT" });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: "Số lượng phải > 0" });
    }

    // Cập nhật số lượng tồn kho
    if (changeType === "IN") {
      part.quantity += quantity;
    } else if (changeType === "OUT") {
      if (part.quantity < quantity) {
        return res
          .status(400)
          .json({ error: "Không đủ hàng trong kho để xuất" });
      }
      part.quantity -= quantity;
    }

    await part.save();

    // Ghi log xuất/nhập
    await StockLog.create({
      changeType,
      quantity,
      partId: part.id,
      note: note || (changeType === "IN" ? "Nhập kho" : "Xuất kho"),
    });

    res.status(200).json({
      message: "Cập nhật tồn kho thành công",
      part,
    });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật kho:", err);
    res.status(500).json({ error: err.message });
  }
};
