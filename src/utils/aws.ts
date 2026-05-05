import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
    const command = new PutObjectCommand({
        Bucket: `${process.env.AWS_S3_BUCKET}`,
        Key: key,
        ContentType: ext
    })

    try{
        const url = await getSignedUrl(s3, command, {expiresIn: Number(process.env.AWS_S3_EXPIRESIN) ?? 3600})
        return url;
    } catch(e){
        throw new AppError(`Failed to initiate video uploader.`, 500, ERRORS.E500);
    }
}