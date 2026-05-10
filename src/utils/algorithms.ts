import type { calculatedResource } from "@/types/general.js";

export const calculateProcessResourceAlgo = (duration: BigInt, quality: string, fps: Number, size: BigInt) : calculatedResource => {
  return {
    process_duration: BigInt(Math.floor(Math.random() * 1000)),
    process_cores: Math.floor(Math.random() * 1000),
    process_memory: Math.floor(Math.random() * 1000)
  };
}