import { type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { ERRORS } from '@/constants/errorCodes.js';

export const calcProcessDuration = async (req: Request, res: Response) => {
  const { video_duration, quality, fps, size } = req.body;

  if (!video_duration || !quality || !fps || !size) {
    throw new AppError("Fill all required values.", 400, ERRORS.E400);
  }

  return sendSuccess(res, {
    "processDuration": Math.floor(Math.random() * 1000)
  }, "Video duration calculated")
}

export const createProcess = async (req: Request, res: Response) => {
  const { videoUuid, userUuid, quality, fps } = req.body;

  // 1. Validation
  if (!videoUuid || !userUuid || !quality || !fps) {
    throw new AppError("Fill all required values.", 400, ERRORS.E400);
  }

  // 2. Transaction to create Process and its History
  const newProcess = await prisma.$transaction(async (tx) => {
    // Create the process record using the foreign keys directly
    const process = await tx.processes.create({
      data: {
        user_uuid: userUuid,
        video_uuid: videoUuid,
        quality,
        fps: Number(fps),  
      },
    });

    // Create the initial history entry
    await tx.process_history.create({
      data: {
        process_uuid: process.uuid,
        status: "PENDING",
      },
    });

    return process;
  });

  return sendSuccess(res, newProcess, 'Process created successfully');
};

export const deleteProcess = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') {
    throw new AppError("The uuid format is not correct", 400, ERRORS.E400)
  }

  await prisma.$transaction(async (tx) => {
    // 1. Delete all related history first 
    await tx.process_history.deleteMany({
      where: { process_uuid: uuid }
    });

    // 2. Delete the process itself
    const deletedProcess = await tx.processes.delete({
      where: { uuid }
    });

    return deletedProcess;
  });

  return sendSuccess(res, null, 'Process and history deleted successfully');
}

export const getProcessStatus = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (typeof uuid !== 'string') {
    throw new AppError("The uuid format is not correct", 400, ERRORS.E400)
  }

  // 1. Fetch the process and its LATEST history entry
  const processWithStatus = await prisma.processes.findUnique({
    where: { uuid: uuid },
    include: {
      process_history: {
        orderBy: {
          changed_at: 'desc', // Get the most recent update first
        },
        take: 1, // We only need the current status
      },
    },
  });

  // 2. Error handling if process doesn't exist
  if (!processWithStatus) {
    throw new AppError("Process not found", 404, ERRORS.E404);
  }

  // 3. Format the response
  // If there's no history (shouldn't happen due to the usage of transaction), default to 'UNKNOWN'
  const currentStatus = processWithStatus.process_history[0]?.status || 'UNKNOWN';

  return sendSuccess(res, {
    processUuid: processWithStatus.uuid,
    status: currentStatus,
    updatedAt: processWithStatus.process_history[0]?.changed_at
  }, 'Current process status retrieved');
};

export const getProcessHistory = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  // type narrowing
  if (typeof uuid !== 'string') {
    throw new AppError("The uuid format is not correct", 400, ERRORS.E400)
  }

  // Query the history table directly using the process_uuid foreign key
  const history = await prisma.process_history.findMany({
    where: {
      process_uuid: uuid
    },
    orderBy: {
      changed_at: 'asc' // Chronological order
    }
  });

  // Basic check: if the array is empty, the process might not exist (or has no history)
  if (history.length === 0) {
    throw new AppError("No history found for this process", 404, ERRORS.E404);
  }

  return sendSuccess(res, history, 'Full process history retrieved (oldest to newest)');
};

export const getProcessesByStatus = async (req: Request, res: Response) => {
  const { status } = req.params;

  if (typeof status !== 'string') {
    return
  }
  // 1. Get the IDs of processes that have this status as their LATEST entry
  const processes = await prisma.processes.findMany({
    where: {
      process_history: {
        // We only want processes where the most recent history matches
        some: {
          status: status
        }
      }
    },
    include: {
      process_history: {
        orderBy: {
          changed_at: 'desc'
        },
        take: 1
      }
    }
  });

  // 2. Filter out the ones where the 'some' matched an old record 
  // but the 'latest' record is actually something else
  const result = processes.filter(p => p.process_history[0]?.status === status);

  return sendSuccess(res, result, 'Processes fetched successfully');
};