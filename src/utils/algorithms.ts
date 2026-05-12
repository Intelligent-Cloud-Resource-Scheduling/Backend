import type { calculatedResource } from "@/types/general.js";

export const calculateProcessResourceAlgo = (duration: bigint, quality: string, fps: number, size: bigint): calculatedResource => {
  return {
    process_duration: BigInt(Math.floor(Math.random() * 1000)),
    process_cores: Math.floor(Math.random() * 1000),
    process_memory: Math.floor(Math.random() * 1000)
  };
}

export const calculateVMCostAlgo = (cores: number, memory: number): number => {
  return Math.floor(Math.random() * 1000)
}
