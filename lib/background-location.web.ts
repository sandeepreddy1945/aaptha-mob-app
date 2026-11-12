export const LOCATION_TASK_NAME = 'background-location-task';
export const LOCATION_INTERVAL_MS = getLocationInterval(
  process.env.EXPO_PUBLIC_LOCATION_INTERVAL_MS
);
export const LOCATION_UPLOAD_BATCH_SIZE = getBatchSize(process.env.EXPO_PUBLIC_LOCATION_BATCH_SIZE);
export type LocationTrackingMode = 'background' | 'foreground' | 'unavailable';

let activeShiftStart: string | null = null;

function getLocationInterval(value: string | undefined) {
  const interval = Number(value);
  return Number.isInteger(interval) && interval > 0 ? interval : 2 * 60 * 1000;
}

function getBatchSize(value: string | undefined) {
  const batchSize = Number(value);
  return Number.isInteger(batchSize) && batchSize > 0 ? batchSize : 10;
}

export async function getActiveShiftStart() {
  return activeShiftStart;
}

export async function setActiveShiftStart(startedAt: string | null) {
  activeShiftStart = startedAt;
}

export function startLocationQueueMonitoring() {}

export async function flushPendingLocations() {}

export async function publishLocationNow(): Promise<never> {
  throw new Error('Background location publishing is only available in the mobile app.');
}

export async function startBackgroundLocation(): Promise<LocationTrackingMode> {
  return 'unavailable';
}

export async function stopBackgroundLocation() {}
