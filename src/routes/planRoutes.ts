import { createPlan } from "@/controllers/planController.js";
import { asyncHandler } from "@/middlewares/asyncHandler.js";
import { validate } from "@/middlewares/validate.js";
import { Router } from "express";
import { z } from 'zod';

const router = Router();

const createPlanSchema = z.object({
    name: z.string().min(2).max(20),
    description: z.string().min(2).max(200),
    price: z.number().min(0),
    max_uploads_per_week: z.number().min(1),
})

const hideShowPlanSchema = z.boolean();

router.post('/create', validate(createPlanSchema), asyncHandler(createPlan))


export default router;