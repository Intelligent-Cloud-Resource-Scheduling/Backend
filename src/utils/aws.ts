import { DeleteObjectCommand, PutObjectCommand, S3Client, S3ServiceException, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";
import { AppError } from "./AppError.js";
import { ERRORS } from "@/constants/errorCodes.js";


const s3 = new S3Client({
    region: `${process.env.AWS_S3_REGION}`,
    credentials: {
        accessKeyId: `${process.env.AWS_S3_ACCESS_KEY_ID}`,
        secretAccessKey: `${process.env.AWS_S3_SECRET_ACCESS_KEY}`
    }
})

const ec2 = new EC2Client({
    region: `${process.env.AWS_EC2_REGION}`,
    credentials: {
        accessKeyId: `${process.env.AWS_EC2_ACCESS_KEY_ID}`,
        secretAccessKey: `${process.env.AWS_EC2_SECRET_ACCESS_KEY}`
    }
})

/**
 * Launches a single EC2 worker instance and returns its instance ID.
 * @param name  The Name tag to assign to the instance.
 * @returns     The EC2 instance ID, or throws on failure.
 */
export const startWorkerInstance = async (name: string): Promise<string> => {
    const command = new RunInstancesCommand({
        ImageId: `${process.env.AMI_ID}`,
        InstanceType: 't3.micro',
        MinCount: 1,
        MaxCount: 1,
        KeyName: 'apiWorker-key',
        InstanceInitiatedShutdownBehavior: 'terminate',
        TagSpecifications: [{
            ResourceType: 'instance',
            Tags: [{ Key: 'Name', Value: name }]
        }]
    })

    try {
        const response = await ec2.send(command)
        const instanceId = response.Instances?.[0]?.InstanceId
        if (!instanceId) throw new Error('No instance ID returned from EC2')
        console.log(`EC2 instance started: ${instanceId} (${name})`)
        return instanceId
    } catch (e: any) {
        throw new AppError(`Failed to start EC2 instance: ${e?.message ?? e}`, 500, ERRORS.E500)
    }
}

export const generateUploadURL = async (key: string, ext: string) => {
    const bucketName = `${process.env.AWS_S3_BUCKET}`
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: ext
    })

    try {
        const url = await getSignedUrl(s3, command, { expiresIn: Number(process.env.AWS_S3_EXPIRESIN) ?? 3600 })
        return url;
    } catch (e) {
        if (e instanceof S3ServiceException && e.name === "NoSuchBucket") {
            throw new AppError(`Error from S3 while uploading video from ${bucketName}. The bucket doesn't exist.`, 500, ERRORS.E500);
        } else if (e instanceof S3ServiceException) {
            throw new AppError(`Error from S3 while uploading video to ${bucketName}. ${e.name}: ${e.message}`, 500, ERRORS.E500);
        }
        throw new AppError(`Failed to initiate video uploader.`, 500, ERRORS.E500);
    }
}

export const videoDeleter = async (key: string) => {
    const bucketName = `${process.env.AWS_S3_BUCKET}`
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    })

    try {
        await s3.send(command);
        return true;
    } catch (e) {
        if (e instanceof S3ServiceException && e.name === "NoSuchBucket") {
            throw new AppError(`Error from S3 while deleting object from ${bucketName}. The bucket doesn't exist.`, 500, ERRORS.E500);
        } else if (e instanceof S3ServiceException) {
            throw new AppError(`Error from S3 while deleting object from ${bucketName}. ${e.name}: ${e.message}`, 500, ERRORS.E500);
        }
        throw new AppError(`Failed to delete video.`, 500, ERRORS.E500);
    }
}