import type { Request, Response } from 'express';
import { prisma } from '@/config/prisma.js';
import { sendSuccess } from '@/utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { ERRORS } from '@/constants/errorCodes.js';

// Pricing formula used across endpoints: cost = cores * 10 + rams * 5
const COST_PER_CORE = 10;
const COST_PER_RAM = 5;

export const calcVmCost = async (req: Request, res: Response) => {
  const { cores, rams } = req.body as { cores: number; rams: number };

  if (typeof cores !== 'number' || typeof rams !== 'number') {
    throw new AppError('Invalid input', 400, ERRORS.E400);
  }

  const cost = cores * COST_PER_CORE + rams * COST_PER_RAM;

  return sendSuccess(res, { cost }, 'Cost calculated', 200);
};

export const createVm = async (req: Request, res: Response) => {
  const { name, cores, rams } = req.body as { name: string; cores: number; rams: number };

  if (!name || typeof cores !== 'number' || typeof rams !== 'number') {
    throw new AppError('Invalid input', 400, ERRORS.E400);
  }

  const cost = cores * COST_PER_CORE + rams * COST_PER_RAM;

  const vm = await prisma.vms.create({
    data: {
      name,
      cores,
      rams,
      cost,
    },
  });

  if (!vm.uuid) throw new AppError('Failed to create VM', 500, ERRORS.E500);

  return sendSuccess(res, { uuid: vm.uuid }, 'VM created', 201);
};

export const deleteVm = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const existing = await prisma.vms.findUnique({ where: { uuid } });
  if (!existing) throw new AppError('VM not found', 404, ERRORS.E404);

  await prisma.vms.delete({ where: { uuid } });

  return sendSuccess(res, null, 'VM deleted', 200);
};

export const dispatchVm = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const vm = await prisma.vms.update({ where: { uuid }, data: { status: 'Dispatched' } });

  return sendSuccess(res, vm, 'VM dispatched', 200);
};

export const stopVm = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const vm = await prisma.vms.update({ where: { uuid }, data: { status: 'Idle' } });

  return sendSuccess(res, vm, 'VM stopped', 200);
};

export const getCurrentStatus = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const vm = await prisma.vms.findUnique({ where: { uuid } });
  if (!vm) throw new AppError('VM not found', 404, ERRORS.E404);

  return sendSuccess(res, { status: vm.status }, 'VM status fetched', 200);
};

export const getHistory = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const history = await prisma.vm_history.findMany({ where: { vm_uuid: uuid }, orderBy: { created_at: 'desc' } });

  return sendSuccess(res, history, 'VM history fetched', 200);
};

export const addHistory = async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const { batch_uuid, duration } = req.body as { batch_uuid?: string; duration: number };

  if (typeof uuid !== 'string' || typeof duration !== 'number') throw new AppError('Invalid input', 400, ERRORS.E400);

  const vm = await prisma.vms.findUnique({ where: { uuid } });
  if (!vm) throw new AppError('VM not found', 404, ERRORS.E404);

  // vm.cost is treated as cost-per-unit (e.g., per hour)
  const cost = (vm.cost ?? 0) * duration;

  const entry = await prisma.vm_history.create({
    data: {
      vm_uuid: uuid,
      batch_uuid: batch_uuid ?? undefined,
      duration,
      cost,
    },
  });

  return sendSuccess(res, entry, 'VM history entry added', 201);
};

export const getSpentCost = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const agg = await prisma.vm_history.aggregate({ where: { vm_uuid: uuid }, _sum: { cost: true } });

  const spent = agg._sum.cost ?? 0;

  return sendSuccess(res, { spent }, 'VM total spent fetched', 200);
};

export const getVmDetails = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const vm = await prisma.vms.findUnique({ where: { uuid } });
  if (!vm) throw new AppError('VM not found', 404, ERRORS.E404);

  return sendSuccess(res, vm, 'VM fetched', 200);
};

export const getAllVms = async (req: Request, res: Response) => {
  const vms = await prisma.vms.findMany();
  return sendSuccess(res, vms, 'VMs fetched', 200);
};

export const getAllByStatus = async (req: Request, res: Response) => {
  const { status } = req.params;
  if (typeof status !== 'string') throw new AppError('Invalid status', 400, ERRORS.E400);

  const vms = await prisma.vms.findMany({ where: { status } });
  return sendSuccess(res, vms, 'VMs by status fetched', 200);
};
