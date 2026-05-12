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
  getProcessStatus, 
  getUserAllProcesses
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
  quality: z.enum(VideoQuality),
  fps: z.number().refine((val) => VideoFPS.includes(val), {
    message: "FPS must be either 30 or 60",
  }),
})

router.post('/calc-duration', validate(calcProcessSchema), asyncHandler(calcProcessDuration));
router.post('/calc-duration/:video_uuid', validate(calcProcessWithVideoUUIDSchema), asyncHandler(calcProcessDurationWithVideoUUID))
router.post('/create/:video_uuid', validate(createProcessSchema), authUser, asyncHandler(createProcess));
router.delete('/confirm-delete/:process_uuid', authUser, asyncHandler(deleteProcess));
router.get('/current-status/:process_uuid', asyncHandler(getProcessStatus));
router.get('/history/:process_uuid', asyncHandler(getProcessHistory));
router.get('/all/:status', asyncHandler(getProcessesByStatus));
router.get('/', asyncHandler(getUserAllProcesses));


export default router;
