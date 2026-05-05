import { DeleteObjectCommand, PutObjectCommand, S3Client, S3ServiceException, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "./AppError.js";
import { ERRORS } from "@/constants/errorCodes.js";


const s3 = new S3Client({
    region: `${process.env.AWS_S3_REGION}`,
    credentials: {
        accessKeyId: `${process.env.AWS_S3_ACCESS_KEY_ID}`,
        secretAccessKey: `${process.env.AWS_S3_SECRET_ACCESS_KEY}`
    }
})

export const generateUploadURL = async (key:string, ext:string) =>{
    const bucketName = `${process.env.AWS_S3_BUCKET}`
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: ext
    })

    try{
        const url = await getSignedUrl(s3, command, {expiresIn: Number(process.env.AWS_S3_EXPIRESIN) ?? 3600})
        return url;
    } catch(e){
        if(e instanceof S3ServiceException && e.name === "NoSuchBucket"){
            throw new AppError(`Error from S3 while uploading video from ${bucketName}. The bucket doesn't exist.`, 500, ERRORS.E500);
        } else if (e instanceof S3ServiceException) {
            throw new AppError(`Error from S3 while uploading video to ${bucketName}. ${e.name}: ${e.message}`, 500, ERRORS.E500);
        }
        throw new AppError(`Failed to initiate video uploader.`, 500, ERRORS.E500);
    }
}

export const videoDeleter = async (key : string) => {
    const bucketName = `${process.env.AWS_S3_BUCKET}`
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    })

    try {
        await s3.send(command);
        await waitUntilObjectNotExists(
            {
                client: s3,
                maxWaitTime: 200
            },
            { Bucket: `${process.env.AWS_S3_BUCKET}`, Key: key}
        )
    } catch (e) {
        if(e instanceof S3ServiceException && e.name === "NoSuchBucket"){
            throw new AppError(`Error from S3 while deleting object from ${bucketName}. The bucket doesn't exist.`, 500, ERRORS.E500);
        } else if (e instanceof S3ServiceException) {
            throw new AppError(`Error from S3 while deleting object from ${bucketName}. ${e.name}: ${e.message}`, 500, ERRORS.E500);
        }
        throw new AppError(`Failed to delete video.`, 500, ERRORS.E500);
    }
}