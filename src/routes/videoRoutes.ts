import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';
import { authUser } from '@/middlewares/auth.js';
import { confirmSuccessUpload, initiateVideoUploader } from '@/controllers/videoController.js';

const router = Router();

const videoInitiateSchema = z.object({
    duration: z.int(),
    size: z.int(),
    name: z.string().min(1)
})

router.post('/init-video-uploader', validate(videoInitiateSchema), authUser, initiateVideoUploader);
router.get('/confirm-upload/:video_uuid', authUser, confirmSuccessUpload);


export default router;