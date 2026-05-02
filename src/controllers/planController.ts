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
        throw new AppError(
            "Plan name already exists, If you are trying ti update, use the update endpoint.", 
            409, ERRORS.E409PLAN
        );
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

export const updatePlan = async(req: Request, res:Response) => {
    const { uuid } = req.params;
    const { name, description, price, max_uploads_per_week } = req.body;

    const updateData = Object.fromEntries(
        Object.entries({name, description, price, max_uploads_per_week})
        .filter(([indx, value]) => value != undefined)
    )

    if (typeof uuid !== 'string') {
        throw new AppError("Invalid UUID format", 400, ERRORS.E400);
    }

    const existingPlan = await prisma.plans.findUnique({
        where: {uuid},
    })

    if(!existingPlan){
        throw new AppError("Plan not found", 404, ERRORS.E404);
    }

    const dublicatesCheck = [];
    if(name !== undefined)
        dublicatesCheck.push({ name })
    if(price !== 0)
        dublicatesCheck.push({ price })

    if(dublicatesCheck.length > 0){
        const duplicates = await prisma.plans.findFirst({
            where: {
                AND: [
                    {OR: dublicatesCheck},
                    {NOT: {uuid}}
                ]
            }
        })

        if(duplicates) {
            throw new AppError("Plan name or price already exists", 409, ERRORS.E409PLAN);
        }
    }

    const updatedPlan = await prisma.plans.update({
        where: {uuid},
        data: updateData
    })

    return sendSuccess(res, updatedPlan, "Plan updates successfully", 200);
}
