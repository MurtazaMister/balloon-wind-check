import type { Sample } from '../types/balloon';
import type { SegmentFeature, IndexItem } from '../state/trails';

// Worker instance - singleton
let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/segments.worker.ts', import.meta.url), {
      type: 'module'
    });
  }
  return worker;
}

export interface BuildPairSegmentsInput {
  left: Sample[];
  right: Sample[];
  hLeft: number;
  maxKmPerHour?: number;
}

export interface BuildPairSegmentsOutput {
  pairH: number;
  segments: SegmentFeature[];
  indexItems: IndexItem[];
}

export async function buildPairSegmentsOffMain(
  input: BuildPairSegmentsInput
): Promise<BuildPairSegmentsOutput> {
  const { left, right, hLeft, maxKmPerHour = 500 } = input;
  
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    
    const handleMessage = (e: MessageEvent) => {
      worker.removeEventListener('message', handleMessage);
      
      if (e.data.error) {
        reject(new Error(e.data.error));
      } else {
        resolve(e.data);
      }
    };
    
    worker.addEventListener('message', handleMessage);
    worker.postMessage({ left, right, hLeft, maxKmPerHour });
  });
}

// Cleanup function
export function cleanupWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
