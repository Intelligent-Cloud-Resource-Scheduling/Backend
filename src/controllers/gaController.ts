import type { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '@/config/prisma.js';
import { sendSuccess } from '@/utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { ERRORS } from '@/constants/errorCodes.js';

// ---------------------------------------------------------------------------
// Types matching the GA engine's expected input
// ---------------------------------------------------------------------------
interface ProcessInput {
  uuid: string;
  duration: number;
  cores: number;
  memory: number;
}

interface VMInput {
  uuid: string;
  cores: number;
  memory: number;
  cost: number;
}

// ---------------------------------------------------------------------------
// POST /ga/start
// Accepts the scheduling input, creates a DB session, fires off the GA engine.
// ---------------------------------------------------------------------------
export const startGA = async (req: Request, res: Response) => {
  const { processes, vms } = req.body as { processes: ProcessInput[]; vms: VMInput[] };

  const gaServerUrl = process.env.GA_SERVER?.trim();
  if (!gaServerUrl) {
    throw new AppError('GA_SERVER environment variable is not configured.', 500, ERRORS.E500);
  }

  // 1. Create a new session row – status defaults to NOT_STARTED
  const session = await prisma.ga_sessions.create({ data: {} });

  // 2. Build the payload for the GA engine using the session UUID as the session identifier
  const gaPayload = {
    session_uuid: session.uuid,
    processes,
    vms,
  };

  // 3. Fire the request to the GA engine
  try {
    const gaUrl = `${gaServerUrl}/start-new`;
    await axios.post(gaUrl, gaPayload, { timeout: 10_000 });
  } catch (err: any) {
    // If the GA server is unreachable, mark the session as FAILED immediately
    await prisma.ga_sessions.update({
      where: { uuid: session.uuid },
      data: { status: 'FAILED' },
    });
    throw new AppError(
      `Failed to reach GA engine: ${err?.message ?? 'unknown error'}`,
      502,
      ERRORS.E500,
    );
  }

  // 4. Mark the session as STARTED
  await prisma.ga_sessions.update({
    where: { uuid: session.uuid },
    data: { status: 'STARTED' },
  });

  return sendSuccess(
    res,
    { session_uuid: session.uuid, status: 'STARTED' },
    'GA scheduling started. Poll /ga/session/:session_uuid for results.',
    202,
  );
};

// ---------------------------------------------------------------------------
// POST /ga/results
// Called by the GA engine when computation is complete.
// Stores the raw JSON result and marks the session DONE.
// ---------------------------------------------------------------------------
export const receiveGAResults = async (req: Request, res: Response) => {
  const { session_uuid, status } = req.body as { session_uuid: string; status?: string };

  if (!session_uuid) {
    throw new AppError('session_uuid is required.', 400, ERRORS.E400);
  }

  const session = await prisma.ga_sessions.findUnique({ where: { uuid: session_uuid } });
  if (!session) {
    throw new AppError(`Session '${session_uuid}' not found.`, 404, ERRORS.E404);
  }

  // Store the entire body as a raw JSON string
  const rawResult = JSON.stringify(req.body);
  const newStatus = status === 'failed' ? 'FAILED' : 'DONE';

  await prisma.ga_sessions.update({
    where: { uuid: session_uuid },
    data: { status: newStatus, raw_result: rawResult },
  });

  return sendSuccess(res, { session_uuid, status: newStatus }, 'Result stored.');
};

// ---------------------------------------------------------------------------
// GET /ga/session/:session_uuid
// Polled by the client to check status and retrieve results when ready.
// ---------------------------------------------------------------------------
export const getGASession = async (req: Request, res: Response) => {
  const { session_uuid } = req.params;

  const session = await prisma.ga_sessions.findUnique({ where: { uuid: session_uuid } });
  if (!session) {
    throw new AppError(`Session '${session_uuid}' not found.`, 404, ERRORS.E404);
  }

  // Parse the raw result back to an object only when DONE
  const result =
    session.status === 'DONE' && session.raw_result
      ? JSON.parse(session.raw_result)
      : null;

  return sendSuccess(
    res,
    {
      session_uuid: session.uuid,
      status: session.status,
      created_at: session.created_at,
      updated_at: session.updated_at,
      result,
    },
    session.status === 'DONE' ? 'Results ready.' : 'Session is still processing.',
  );
};
