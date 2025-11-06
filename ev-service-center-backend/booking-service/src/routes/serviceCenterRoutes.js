import express from 'express';
import {
  getAllServiceCenters,
  getServiceCenterById,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter
} from '../controllers/serviceCenterController.js';

const router = express.Router();

router.get('/', getAllServiceCenters);
router.get('/:id', getServiceCenterById);
router.post('/', createServiceCenter);
router.put('/:id', updateServiceCenter);
router.delete('/:id', deleteServiceCenter);

export default router;


