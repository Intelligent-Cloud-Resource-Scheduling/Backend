import type { Request, Response } from 'express';
import { prisma } from '@/config/prisma.js';
import { sendSuccess } from '@/utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { ERRORS } from '@/constants/errorCodes.js';
import { calculateVMCostAlgo } from '@/utils/algorithms.js';


export const calcVmCost = async (req: Request, res: Response) => {
  const { cores, memory } = req.body as { cores: number; memory: number };

  const cost = calculateVMCostAlgo(cores, memory);

  return sendSuccess(res, { cost }, 'Cost calculated');
};

export const createVm = async (req: Request, res: Response) => {
  const { name, cores, memory } = req.body as { name: string; cores: number; memory: number };

  const cost = calculateVMCostAlgo(cores, memory);

  const vm = await prisma.vms.create({
    data: {
      name,
      cores,
      memory,
      cost,
    },
  });

  if (!vm) throw new AppError('Failed to create VM', 500, ERRORS.E500);

  return sendSuccess(res, vm, 'VM created', 201);
};


export const deleteVm = async (req: Request, res: Response) => {
  const { vm_uuid } = req.params;

  if (typeof vm_uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const existing = await prisma.vms.findUnique({ where: { uuid: vm_uuid } });
  if (!existing) throw new AppError('VM not found', 404, ERRORS.E404);

  if(existing.status === "IDLE"){
    await prisma.vms.delete({ where: { uuid: vm_uuid } });
  } else {
    throw new AppError('VM can be removed only if it is in IDLE state.', 409, ERRORS.E409VM);
  }

  return sendSuccess(res, null, 'VM deleted', 200);
};


export const stopVm = async (req: Request, res: Response) => {
  const { vm_uuid } = req.params;

  if (typeof vm_uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  // Must send termination signal to GA

  await prisma.$transaction(async (tx) => {
      // Set VM idle
      const updatedVm = await tx.vms.updateMany({
          where: { uuid: vm_uuid },
          data: { status: 'IDLE' }
      });

      if (updatedVm.count === 0) {
        throw new AppError('VM not found', 404, ERRORS.E404);
      }

      // Get affected batches first
      const batches = await tx.batches.findMany({
          where: {
              vm_uuid: vm_uuid,
              status: 'RUNNING'
          },
          select: {
              uuid: true
          }
      });

      const batchUUIDs = batches.map(b => b.uuid);

      if (batchUUIDs.length === 0) {
        return
      }

      // Terminate batches
      await tx.batches.updateMany({
          where: {
              uuid: {
                  in: batchUUIDs
              }
          },
          data: {
              status: 'TERMINATED'
          }
      });

      // Terminate related batch processes
      await tx.batch_processes.updateMany({
          where: {
              batch_uuid: {
                  in: batchUUIDs
              },
              process_status: {
                  in: ['RUNNING', 'QUEUED']
              }
          },
          data: {
              process_status: 'TERMINATED'
          }
      });

      // Unlink processes from batches
      await tx.processes.updateMany({
          where: {
              batch_uuid: {
                  in: batchUUIDs
              }
          },
          data: {
              batch_uuid: null
          }
      });

  });

  return sendSuccess(res, null, 'VM terminated with all its batches and uncompleted processes are back to the queue');
};


export const getCurrentStatus = async (req: Request, res: Response) => {
  const { vm_uuid } = req.params;

  if (typeof vm_uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const vm = await prisma.vms.findUnique({ where: { uuid:vm_uuid } });
  if (!vm) throw new AppError('VM not found', 404, ERRORS.E404);

  return sendSuccess(res, { status: vm.status }, 'VM status fetched');
};


export const getHistory = async (req: Request, res: Response) => {
  const { vm_uuid } = req.params;

  if (typeof vm_uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const history = await prisma.vm_history.findMany({ where: { vm_uuid: vm_uuid }, orderBy: { created_at: 'desc' } });

  return sendSuccess(res, history, 'VM history fetched');
};


export const addHistory = async (req: Request, res: Response) => {
  const { vm_uuid } = req.params;
  const { batch_uuid, total_duration, total_cost } = req.body as { batch_uuid: string; total_duration: number; total_cost: number };

  if (typeof vm_uuid !== 'string') throw new AppError('Invalid input', 400, ERRORS.E400);

  const vm = await prisma.vms.findUnique({ where: { uuid: vm_uuid } });
  if (!vm) throw new AppError('VM not found', 404, ERRORS.E404);

  const entry = await prisma.vm_history.create({
    data: {
      vm_uuid: vm_uuid,
      batch_uuid: batch_uuid,
      run_duration: BigInt(total_duration),
      run_cost: total_cost,
    },
  });

  return sendSuccess(res, entry, 'VM history entry added');
};


export const getSpentCost = async (req: Request, res: Response) => {
  const { vm_uuid } = req.params;

  if (typeof vm_uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const agg = await prisma.vm_history.aggregate({ where: { vm_uuid: vm_uuid }, _sum: { run_cost: true } });

  const spent = agg._sum.run_cost;

  return sendSuccess(res, { spent }, 'VM total spent fetched');
};


export const getVmDetails = async (req: Request, res: Response) => {
  const { vm_uuid } = req.params;

  if (typeof vm_uuid !== 'string') throw new AppError('Invalid UUID', 400, ERRORS.E400);

  const vm = await prisma.vms.findUnique({ where: { uuid: vm_uuid } });
  if (!vm) throw new AppError('VM not found', 404, ERRORS.E404);

  return sendSuccess(res, vm, 'VM fetched');
};


export const getAllVms = async (req: Request, res: Response) => {
  const vms = await prisma.vms.findMany();
  return sendSuccess(res, vms, 'VMs fetched');
};


export const getAllByStatus = async (req: Request, res: Response) => {
  const { status } = req.params;
  if (typeof status !== 'string') throw new AppError('Invalid status', 400, ERRORS.E400);

  const vms = await prisma.vms.findMany({ where: { status } });
  return sendSuccess(res, vms, 'VMs by status fetched');
};
