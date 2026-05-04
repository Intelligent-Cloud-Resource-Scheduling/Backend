import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/middlewares/asyncHandler.js';
import { validate } from '@/middlewares/validate.js';
import {
  calcVmCost,
  createVm,
  deleteVm,
  dispatchVm,
  stopVm,
  getCurrentStatus,
  getHistory,
  addHistory,
  getSpentCost,
  getVmDetails,
  getAllVms,
  getAllByStatus,
} from '@/controllers/vmController.js';

const router = Router();

const calcSchema = z.object({
  cores: z.number().int().min(1),
  rams: z.number().int().min(1),
});

const createVmSchema = z.object({
  name: z.string().min(1),
  cores: z.number().int().min(1),
  rams: z.number().int().min(1),
});

const addHistorySchema = z.object({
  batch_uuid: z.string().uuid().optional(),
  duration: z.number().min(0),
});

router.post('/calc/vm-cost', validate(calcSchema), asyncHandler(calcVmCost));
router.post('/create', validate(createVmSchema), asyncHandler(createVm));
router.delete('/delete/:uuid', asyncHandler(deleteVm));
router.patch('/stop/:uuid', asyncHandler(stopVm));
router.patch('/dispatch/:uuid', asyncHandler(dispatchVm));
router.get('/current-status/:uuid', asyncHandler(getCurrentStatus));
router.get('/history/:uuid', asyncHandler(getHistory));
router.post('/history/:uuid', validate(addHistorySchema), asyncHandler(addHistory));
router.get('/spentcost/:uuid', asyncHandler(getSpentCost));
router.get('/:uuid', asyncHandler(getVmDetails));
router.get('/', asyncHandler(getAllVms));
router.get('/all/:status', asyncHandler(getAllByStatus));

export default router;
