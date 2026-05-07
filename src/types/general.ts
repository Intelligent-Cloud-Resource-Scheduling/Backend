export const VideoQuality = ['720p', '1080p', '2k', '4k']
export const VideoFPS = [30, 60]

export interface calculatedResource {
    process_duration: BigInt,
    process_cores: number,
    process_memory: number
}