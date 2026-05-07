import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { generateUserToken, verifyToken } from '@/utils/jwt.js';
import { v4 as uuidv4 } from "uuid";
import { generateUploadURL, videoDeleter } from '@/utils/aws.js';
import { ERRORS } from '@/constants/errorCodes.js';

export const initiateVideoUploader = async (req: Request, res: Response) => {
    const { name, duration, size } = req.body;

    const token = verifyToken(req.headers.authorization || "");
    const userUUID = token.uuid;
    const videoUUID = uuidv4();
    const extension = name.split(".")[1] || "mp4";
    const s3Key = `videos/${userUUID}/${videoUUID}.${extension}`;

    const uploadURL = await generateUploadURL(s3Key, `video/${extension}`);

    const video_upload = await prisma.video_uploads.create({
        data: {
            uuid: videoUUID,
            user_uuid: userUUID,
            s3_key: s3Key,
            name: name,
            duration: duration,
            size: size
        }
    });

    if (!video_upload) {
        throw new AppError(`Failed to store video`, 500, ERRORS.E500);
    }

    return sendSuccess(res, { upload_url: uploadURL, video_uuid: videoUUID, s3_key: s3Key }, 'Private video upload linke is successfully generated.')
}


export const confirmSuccessUpload = async (req: Request, res: Response) => {
    const { video_uuid } = req.params;

    const token = verifyToken(req.headers.authorization || "");
    const userUUID = token.uuid;

    if (typeof video_uuid !== 'string') {
        throw new AppError("Invalid video uuid format", 400, ERRORS.E400);
    }

    const video = await prisma.video_uploads.findFirst({
        where: {
            uuid: video_uuid,
            user_uuid: userUUID,
        }
    });

    if (!video) {
        throw new AppError("Video not found or unauthorized", 404, ERRORS.E404);
    }

    const uploaded_video = await prisma.video_uploads.update({
        where: {
            uuid: video.uuid,
        },
        data: {
            is_uploaded: true
        }
    });

    if (!uploaded_video) {
        throw new AppError(`Failed to confirm video uploading`, 500, ERRORS.E500);
    }

    return sendSuccess(res, uploaded_video, "Video upload successfully confirmed.");
}


export const allUserVideos = async (req: Request, res: Response) => {
    const token = verifyToken(req.headers.authorization || "");
    const userUUID = token.uuid;

    const videos = await prisma.video_uploads.findMany({
        where: {
            user_uuid: userUUID,
            is_deleted: false
        }
    })

    return sendSuccess(res, videos, "Videos list fetched successfully.");
}


export const signleVideo = async (req:Request, res: Response) => {
    const { video_uuid } = req.params;

    const token = verifyToken(req.headers.authorization || "");
    const userUUID = token.uuid;

    if (typeof video_uuid !== 'string') {
        throw new AppError("Invalid video uuid format", 400, ERRORS.E400);
    }

    const video = await prisma.video_uploads.findFirst({
        where: {
            uuid: video_uuid,
            user_uuid: userUUID,
        }
    })

    if (!video) {
        throw new AppError("Video not found or unauthorized", 404, ERRORS.E404);
    }

    return sendSuccess(res, video, "Video details fetched successfully.");
}


export const deleteVideo = async (req: Request, res: Response) => {
    const { video_uuid } = req.params;
    
    const token = verifyToken(req.headers.authorization || "");
    const userUUID = token.uuid;

    if(typeof video_uuid !== 'string'){
        throw new AppError("Invalid video uuid format", 400, ERRORS.E400);
    }

    const video = await prisma.video_uploads.findFirst({
        where: {
            uuid: video_uuid,
            user_uuid: userUUID,
        }
    })

    if (!video) {
        throw new AppError("Video not found or unauthorized", 404, ERRORS.E404);
    }

    await videoDeleter(video.s3_key);

    const deleted_video = await prisma.video_uploads.update({
        where: {
            uuid: video.uuid
        },
        data: {
            is_deleted: true
        }
    })

    if (!deleted_video) {
        throw new AppError(`Failed to confirm video deleting`, 500, ERRORS.E500);
    }

    return sendSuccess(res, deleted_video, "Video deleted successfully.");
}