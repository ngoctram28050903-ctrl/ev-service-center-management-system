import express from 'express';
import {
  getAllServiceCenters,
  getServiceCenterById,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter
} from '../controllers/serviceCenterController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.get('/', getAllServiceCenters);
router.get('/:id', getServiceCenterById);
router.post('/', verifyToken, isAdmin, createServiceCenter);
router.put('/:id', verifyToken, isAdmin, updateServiceCenter);
router.delete('/:id', verifyToken, isAdmin, deleteServiceCenter);

export default router;


