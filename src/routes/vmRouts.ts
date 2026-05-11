import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/middlewares/asyncHandler.js';
import { validate } from '@/middlewares/validate.js';
import {
  calcVmCost,
  createVm,
  deleteVm,
  stopVm,
  getCurrentStatus,
  getHistory,
  addHistory,
  getSpentCost,
  getVmDetails,
  getAllVms,
  getAllByStatus,
} from '@/controllers/vmController.js';
import { adminUser } from '@/middlewares/auth.js';

const router = Router();

const calcSchema = z.object({
  cores: z.number().int().min(1),
  memory: z.number().int().min(1),
});

const createVmSchema = z.object({
  name: z.string().min(3),
  cores: z.number().int().min(1),
  memory: z.number().int().min(1),
});

const addHistorySchema = z.object({
  batch_uuid: z.string(),
  total_duration: z.number().min(0),
  total_cost: z.number().min(0)
});

router.post('/calc/vm-cost', validate(calcSchema), asyncHandler(calcVmCost));
router.post('/create', validate(createVmSchema), adminUser, asyncHandler(createVm));
router.delete('/confirm-delete/:vm_uuid', adminUser, asyncHandler(deleteVm));
router.patch('/stop/:vm_uuid', adminUser, asyncHandler(stopVm));
router.get('/current-status/:vm_uuid', asyncHandler(getCurrentStatus));
router.get('/history/:vm_uuid', asyncHandler(getHistory));
router.post('/add-history/:vm_uuid', validate(addHistorySchema), adminUser, asyncHandler(addHistory));
router.get('/spentcost/:vm_uuid', adminUser, asyncHandler(getSpentCost));
router.get('/:vm_uuid', asyncHandler(getVmDetails));
router.get('/', asyncHandler(getAllVms));
router.get('/all/:status', asyncHandler(getAllByStatus));

export default router;
