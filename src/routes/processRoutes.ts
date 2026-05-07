// modules/user.ts
import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';
import { 
  calcProcessDuration, 
  calcProcessDurationWithVideoUUID,
  createProcess, 
  deleteProcess, 
  getProcessesByStatus, 
  getProcessHistory, 
  getProcessStatus 
} from '@/controllers/processController.js';
import { VideoFPS, VideoQuality } from '@/types/general.js';
import { authUser } from '@/middlewares/auth.js';

const router = Router();

const calcProcessSchema = z.object({
  quality: z.enum(VideoQuality),
  fps: z.number().refine((val) => VideoFPS.includes(val), {
    message: "FPS must be either 30 or 60",
  }),
  duration: z.number().min(1),
  size: z.number().min(1)
})

const calcProcessWithVideoUUIDSchema = z.object({
  quality: z.enum(VideoQuality),
  fps: z.number().refine((val) => VideoFPS.includes(val), {
    message: "FPS must be either 30 or 60",
  }),
})

const createProcessSchema = z.object({
  videoUuid: z.uuid(),
  quality: z.enum(VideoQuality),
  fps: z.number().refine((val) => VideoFPS.includes(val), {
    message: "FPS must be either 30 or 60",
  }),
})

router.post('/calc-duration', validate(calcProcessSchema), asyncHandler(calcProcessDuration));
router.post('/calc-duration/:video_uuid', validate(calcProcessWithVideoUUIDSchema), asyncHandler(calcProcessDurationWithVideoUUID))
router.post('/create', validate(createProcessSchema), authUser, asyncHandler(createProcess));
router.delete('/:uuid/delete/', asyncHandler(deleteProcess));
router.get('/:uuid/current-status', asyncHandler(getProcessStatus));
router.get('/:uuid/history/', asyncHandler(getProcessHistory));
router.get('/all/:status', asyncHandler(getProcessesByStatus));


export default router;
