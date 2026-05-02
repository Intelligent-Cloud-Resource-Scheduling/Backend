import { prisma } from "@/config/prisma.js";
import { sendSuccess } from "@/utils/response.js";
import { AppError } from "@/utils/AppError.js";
import type { Request, Response } from "express";
import { ERRORS } from "@/constants/errorCodes.js";


export const createPlan = async(req: Request, res:Response) => {
    const { name, description, price, max_uploads_per_week } = req.body;

    const existingPlan = await prisma.plans.findFirst({
        where: {
            OR: [
                { name },
                { price }
            ]
        }
    });

    if(existingPlan) {
        throw new AppError("Plan name already exists, If you are trying ti update, use the update endpoint.", 409, ERRORS.E409);
    }

    const plan = await prisma.plans.create({
        data: {
            name,
            description,
            price,
            max_uploads_per_week
        }
    });

    if(!plan.uuid){
        throw new AppError(`Failed to create plan ${plan.name}`, 500, ERRORS.E500);
    }

    return sendSuccess(res, plan, "Plan created successfully", 201);
}
