// modules/user.ts
import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';
import { 
  calcProcessDuration, 
  calcProcessDurationWithVid,
  createProcess, 
  deleteProcess, 
  getProcessesByStatus, 
  getProcessHistory, 
  getProcessStatus 
} from '@/controllers/processController.js';

const router = Router();

const createProcessSchema = z.object({
  videoUuid: z.uuid(),
  userUuid: z.uuid(),
  quality: z.enum(['144p', '240p', '360p', '480p', '720p', '1080p', '2k', '4k']),
  fps: z.number().refine((val) => [30, 60].includes(val), {
    message: "FPS must be either 30 or 60",
  }),
})

router.post('/calc-duration', asyncHandler(calcProcessDuration));
router.post('/calc-duration/:videoUuid', asyncHandler(calcProcessDurationWithVid))
router.post('/create', validate(createProcessSchema), asyncHandler(createProcess));
router.delete('/:uuid/delete/', asyncHandler(deleteProcess));
router.get('/:uuid/current-status', asyncHandler(getProcessStatus));
router.get('/:uuid/history/', asyncHandler(getProcessHistory));
router.get('/all/:status', asyncHandler(getProcessesByStatus));


export default router;
