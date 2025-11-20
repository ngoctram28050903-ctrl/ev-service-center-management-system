import { Router } from "express";
import { 
  getParts, 
  getPartById, 
  addPart, 
  updatePart, 
  deletePart, 
  updateStock, 
  getStockHistory,
  getPartsStats,
  getPartStatsInternal,
  getAllPartsInternal,
  getPartByIdInternal
} from "../controllers/partController.js";

const router = Router();

// Part operations
router.get("/", getParts);
router.get("/stats/parts", getPartsStats);
router.get("/:id", getPartById);
router.post("/", addPart);
router.put("/:id", updatePart);
router.delete("/:id", deletePart);

// Stock operations
router.put("/:id/stock", updateStock);
router.get("/:id/stock-history", getStockHistory);
router.get('/internal/parts/stats/parts', getPartStatsInternal);
router.get('/internal/parts', getAllPartsInternal);
router.get('/internal/parts/:id', getPartByIdInternal);

export default router;
