import { DeleteObjectCommand, PutObjectCommand, S3Client, S3ServiceException, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DescribeInstancesCommand, EC2Client, RunInstancesCommand, StopInstancesCommand, TerminateInstancesCommand } from "@aws-sdk/client-ec2";
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

/**
 * Stops a running EC2 instance (instance is preserved, billing halted).
 * @param instanceId  The EC2 instance ID to stop.
 */
export const stopEC2Instance = async (instanceId: string): Promise<void> => {
    const command = new StopInstancesCommand({ InstanceIds: [instanceId] })

    try {
        await ec2.send(command)
        console.log(`EC2 instance stopped: ${instanceId}`)
    } catch (e: any) {
        throw new AppError(`Failed to stop EC2 instance ${instanceId}: ${e?.message ?? e}`, 500, ERRORS.E500)
    }
}

/**
 * Terminates (permanently destroys) an EC2 instance.
 * @param instanceId  The EC2 instance ID to terminate.
 */
export const terminateEC2Instance = async (instanceId: string): Promise<void> => {
    const command = new TerminateInstancesCommand({ InstanceIds: [instanceId] })

    try {
        await ec2.send(command)
        console.log(`EC2 instance terminated: ${instanceId}`)
    } catch (e: any) {
        throw new AppError(`Failed to terminate EC2 instance ${instanceId}: ${e?.message ?? e}`, 500, ERRORS.E500)
    }
}

/**
 * Fetches the real-time state of an EC2 instance directly from AWS.
 * @param instanceId  The EC2 instance ID to query.
 * @returns           The instance state name (e.g. 'pending' | 'running' | 'stopping' | 'stopped' | 'shutting-down' | 'terminated').
 */
export const getEC2InstanceStatus = async (instanceId: string): Promise<string> => {
    const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] })

    try {
        const response = await ec2.send(command)
        const state = response.Reservations?.[0]?.Instances?.[0]?.State?.Name
        if (!state) throw new Error('No state returned for instance')
        return state
    } catch (e: any) {
        throw new AppError(`Failed to describe EC2 instance ${instanceId}: ${e?.message ?? e}`, 500, ERRORS.E500)
    }
}

/**
 * Fetches the real-time state for multiple EC2 instances in a single API call.
 * @param instanceIds  List of EC2 instance IDs to query.
 * @returns            A map of { instanceId -> state name }, e.g. { 'i-abc': 'running' }.
 *                     Instances not found in the response are omitted from the map.
 */
export const getEC2InstancesStatusMap = async (instanceIds: string[]): Promise<Record<string, string>> => {
    if (instanceIds.length === 0) return {}

    const command = new DescribeInstancesCommand({ InstanceIds: instanceIds })

    try {
        const response = await ec2.send(command)
        const map: Record<string, string> = {}

        for (const reservation of response.Reservations ?? []) {
            for (const instance of reservation.Instances ?? []) {
                if (instance.InstanceId && instance.State?.Name) {
                    map[instance.InstanceId] = instance.State.Name
                }
            }
        }

        return map
    } catch (e: any) {
        throw new AppError(`Failed to describe EC2 instances: ${e?.message ?? e}`, 500, ERRORS.E500)
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