import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/middlewares/asyncHandler.js';
import { validate } from '@/middlewares/validate.js';
import { startGA, receiveGAResults, getGASession } from '@/controllers/gaController.js';

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const processSchema = z.object({
  uuid: z.string().min(1),
  duration: z.number().int().positive(),
  cores: z.number().int().positive(),
  memory: z.number().int().positive(),
});

const vmSchema = z.object({
  uuid: z.string().min(1),
  cores: z.number().int().positive(),
  memory: z.number().int().positive(),
  cost: z.number().int().positive(),
});

const startGASchema = z.object({
  processes: z.array(processSchema).min(1, 'At least one process is required.'),
  vms: z.array(vmSchema).min(1, 'At least one VM is required.'),
});

const gaResultSchema = z.object({
  session_uuid: z.string().min(1),
}).passthrough(); // accept any additional fields from the GA engine

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Client → Backend: submit a scheduling job
router.post('/start', validate(startGASchema), asyncHandler(startGA));

// GA Engine → Backend: deliver completed results
router.post('/results', validate(gaResultSchema), asyncHandler(receiveGAResults));

// Client → Backend: poll session status / retrieve results
router.get('/session/:session_uuid', asyncHandler(getGASession));

export default router;
