import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { generateUserToken, verifyToken } from '@/utils/jwt.js';
import { v4 as uuidv4 } from "uuid";
import { generateUploadURL } from '@/utils/aws.js';
import { ERRORS } from '@/constants/errorCodes.js';

export const initiateVideoUploader = async(req: Request, res: Response) => {
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

    if(!video_upload){
        throw new AppError(`Failed to store video`, 500, ERRORS.E500);
    }

    return sendSuccess(res, {uploadURL, videoUUID, s3Key}, 'Private video upload linke is successfully generated.')
}