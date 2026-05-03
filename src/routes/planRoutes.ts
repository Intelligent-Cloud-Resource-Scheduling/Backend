import { createPlan, getPlanDetails, getPlans, updatePlan } from "@/controllers/planController.js";
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

const updatePlanSchema = createPlanSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided for update." }
);

router.post('/create', validate(createPlanSchema), asyncHandler(createPlan));
router.patch('/edit/:uuid', validate(updatePlanSchema), asyncHandler(updatePlan));
router.get('/:uuid', asyncHandler(getPlanDetails));
router.get('/', asyncHandler(getPlans));

export default router;
