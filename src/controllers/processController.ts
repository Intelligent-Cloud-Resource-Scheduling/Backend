import { type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { ERRORS } from '@/constants/errorCodes.js';
import { calculateProcessResourceAlgo } from '@/utils/algorithms.js';
import { verifyToken } from '@/utils/jwt.js';
import { PROCESS_STATE } from '@/constants/status.js';

export const calcProcessDuration = async (req: Request, res: Response) => {
  const { duration, quality, fps, size } = req.body;

  const resources = calculateProcessResourceAlgo(duration, quality, fps, size)

  return sendSuccess(res, {
    resources
  }, "Video duration calculated.")
}

export const calcProcessDurationWithVideoUUID = async (req: Request, res: Response) => {
  const { video_uuid  } = req.params;
  const { quality, fps } = req.body; 

  if(typeof video_uuid  !== 'string') {
    throw new AppError("Invalid video uuid format", 400, ERRORS.E400);
  }

  const video = await prisma.video_uploads.findUnique({
    where: { uuid: video_uuid  },
    select: { duration: true, size: true } 
  });

  if (!video) {
    throw new AppError("Video not found", 404, ERRORS.E404);
  }

  const resources = calculateProcessResourceAlgo(video.duration!, quality, fps, video.size!);

  return sendSuccess(res, {
    resources,
  }, "Video duration calculated.");
};

export const createProcess = async (req: Request, res: Response) => {
  const { video_uuid, quality, fps } = req.body;

  const token = verifyToken(req.headers.authorization || "");
  const userUUID = token.uuid;

  const video = await prisma.video_uploads.findFirst({
    where: {
        uuid: video_uuid,
        user_uuid: userUUID,
    },
    select: { duration: true, size: true } 
  })

  if (!video) {
      throw new AppError("Video not found or unauthorized", 404, ERRORS.E404);
  }

  const resources = calculateProcessResourceAlgo(video.duration!, quality, fps, video.size!)

  const newProcess = await prisma.$transaction(async (tans) => {
    const process = await tans.processes.create({
      data: {
        user_uuid: userUUID,
        video_uuid: video_uuid,
        quality,
        fps: Number(fps),  
        cores: resources.process_cores,
        memory: resources.process_memory,
        duration: Number(resources.process_duration),
      },
    });

    // Create the initial history entry
    const process_history = await tans.process_history.create({
      data: {
        process_uuid: process.uuid,
        status: PROCESS_STATE.PENDING,
      },
    });

    return {process, process_history};
  });

  return sendSuccess(res, newProcess, 'Process created successfully.');
};

export const deleteProcess = async (req: Request, res: Response) => { // Must Deal with Queue
  const { process_uuid } = req.params;

  const token = verifyToken(req.headers.authorization || "");
  const userUUID = token.uuid;

  if (typeof process_uuid !== 'string') {
    throw new AppError("The uuid format is not correct", 400, ERRORS.E400)
  }

  const process = await prisma.processes.findUnique({
    where: {
        uuid: process_uuid,
        user_uuid: userUUID,
    },
  })

  if (!process) {
      throw new AppError("Process not found or unauthorized", 404, ERRORS.E404);
  }

  await prisma.$transaction(async (trans) => {
    // 1. Delete all related history first 
    await trans.process_history.deleteMany({
      where: { process_uuid }
    });

    // 2. Delete the process itself
    const deletedProcess = await trans.processes.delete({
      where: { uuid: process_uuid }
    });

    return deletedProcess;
  });

  return sendSuccess(res, null, 'Process and history deleted successfully.');
}

export const getProcessStatus = async (req: Request, res: Response) => {
  const { process_uuid } = req.params;

  if (typeof process_uuid !== 'string') {
    throw new AppError("The uuid format is not correct", 400, ERRORS.E400)
  }

  // 1. Fetch the process and its LATEST history entry
  const processWithStatus = await prisma.processes.findUnique({
    where: { uuid: process_uuid },
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
  const { process_uuid } = req.params;

  // type narrowing
  if (typeof process_uuid !== 'string') {
    throw new AppError("The uuid format is not correct", 400, ERRORS.E400)
  }

  // Query the history table directly using the process_uuid foreign key
  const history = await prisma.process_history.findMany({
    where: {
      process_uuid: process_uuid
    },
    orderBy: {
      changed_at: 'desc' // Chronological order
    }
  });

  return sendSuccess(res, history, 'Full process history retrieved (newest to oldest)');
};

export const getProcessesByStatus = async (req: Request, res: Response) => {
  const { status } = req.params;

  if (typeof status !== 'string') {
    throw new AppError("The status format is not correct", 400, ERRORS.E400)
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

  return sendSuccess(res, result, `Processes of status: ${status} fetched successfully`);
};

export const getUserAllProcesses = async (req: Request, res: Response) => {

  const token = verifyToken(req.headers.authorization || "");
  const userUUID = token.uuid;

  const user_processes = await prisma.processes.findMany({
    where: {
      user_uuid: userUUID,
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

  const result = user_processes.map((ele:any)=>{
    const item = {...ele, status: ele.process_history[0].status}
    delete item["process_history"]
    return item
  })

  return sendSuccess(res, result, 'All user processes retrieved (newest to oldest)');
}