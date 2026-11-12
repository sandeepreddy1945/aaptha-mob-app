import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import * as SQLite from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

export const LOCATION_TASK_NAME = 'background-location-task';
export const LOCATION_INTERVAL_MS = 20 * 1000;
export const LOCATION_UPLOAD_BATCH_SIZE = getBatchSize(process.env.EXPO_PUBLIC_LOCATION_BATCH_SIZE);

const DATABASE_NAME = 'location-queue.db';
const TABLE_NAME = 'pending_locations';

function getBatchSize(value: string | undefined) {
  const batchSize = Number(value);
  return Number.isInteger(batchSize) && batchSize > 0 ? batchSize : 10;
}

function getLocationEndpoint() {
  const configuredEndpoint = process.env.EXPO_PUBLIC_LOCATION_ENDPOINT?.trim();
  if (configuredEndpoint) return configuredEndpoint;
  if (!__DEV__) return '';

  return 'https://location-backend-mup5.onrender.com/locations';
}

const ENDPOINT = getLocationEndpoint();
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type PendingLocation = {
  id: number;
  payload: string;
};

let databasePromise: ReturnType<typeof SQLite.openDatabaseAsync> | null = null;
let isFlushing = false;
let flushRequested = false;
let foregroundSubscription: Location.LocationSubscription | null = null;
let networkSubscription: ReturnType<typeof Network.addNetworkStateListener> | null = null;

function hasInternetConnection(networkState: Network.NetworkState) {
  return networkState.isConnected === true && networkState.isInternetReachable !== false;
}

function startNetworkMonitoring() {
  if (networkSubscription) return;
  networkSubscription = Network.addNetworkStateListener((networkState) => {
    if (hasInternetConnection(networkState)) void flushPendingLocations();
  });
}

async function isInternetAvailable() {
  try {
    return hasInternetConnection(await Network.getNetworkStateAsync());
  } catch (error) {
    console.warn('Unable to check network status; retaining locations in SQLite.', error);
    return false;
  }
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (database) => {
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            payload TEXT NOT NULL,
            created_at INTEGER NOT NULL
          );
        `);
        return database;
      })
      .catch((error) => {
        databasePromise = null;
        throw error;
      });
  }

  return databasePromise;
}

async function enqueueLocations(locations: Location.LocationObject[]) {
  if (locations.length === 0) return;

  const database = await getDatabase();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const location of locations) {
      await transaction.runAsync(
        `INSERT INTO ${TABLE_NAME} (payload, created_at) VALUES (?, ?)`,
        JSON.stringify(location),
        Date.now()
      );
    }
  });
}

function toApiLocation(location: Location.LocationObject) {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    altitude: location.coords.altitude,
    speed: location.coords.speed,
    heading: location.coords.heading,
    timestamp: location.timestamp,
  };
}

async function sendEvents(locations: Location.LocationObject[]) {
  if (locations.length === 0) return false;
  if (!ENDPOINT) {
    console.warn('Location publishing requires EXPO_PUBLIC_LOCATION_ENDPOINT.');
    return false;
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'location',
        platform: Platform.OS,
        sessionId: Constants.sessionId || `${Platform.OS}-session`,
        sentAt: new Date().toISOString(),
        locations: locations.map(toApiLocation),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`Location publishing failed: HTTP ${response.status} from ${ENDPOINT}`, body);
      return false;
    }

    console.info(`Published ${locations.length} location(s) to ${ENDPOINT}`);
    return true;
  } catch (error) {
    console.warn(`Location publishing failed for ${ENDPOINT}:`, error);
    return false;
  }
}

async function deleteAcknowledgedLocations(
  database: Awaited<ReturnType<typeof getDatabase>>,
  ids: number[]
) {
  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const id of ids) {
      await transaction.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, id);
    }
  });
}

async function drainLocationQueue() {
  if (!ENDPOINT) {
    console.warn('Location queue retained; configure EXPO_PUBLIC_LOCATION_ENDPOINT to upload it.');
    return;
  }
  if (!(await isInternetAvailable())) {
    console.info('No internet connection; retaining the location queue in SQLite.');
    return;
  }

  const database = await getDatabase();
  while (true) {
    const rows = await database.getAllAsync<PendingLocation>(
      `SELECT id, payload FROM ${TABLE_NAME} ORDER BY id ASC LIMIT ?`,
      LOCATION_UPLOAD_BATCH_SIZE
    );
    if (rows.length === 0) return;

    let locations: Location.LocationObject[];
    try {
      locations = rows.map((row) => JSON.parse(row.payload) as Location.LocationObject);
    } catch (error) {
      console.warn('Unable to read a queued location batch; retaining it in SQLite.', error);
      return;
    }

    if (!(await sendEvents(locations))) return;

    await deleteAcknowledgedLocations(
      database,
      rows.map((row) => row.id)
    );
  }
}

export async function flushPendingLocations() {
  if (isFlushing) {
    flushRequested = true;
    return;
  }

  isFlushing = true;
  try {
    do {
      flushRequested = false;
      await drainLocationQueue();
    } while (flushRequested);
  } catch (error) {
    console.warn('Failed to process the SQLite location queue:', error);
  } finally {
    isFlushing = false;
    if (flushRequested) void flushPendingLocations();
  }
}

export async function publishLocationNow() {
  const foregroundPermission = await Location.requestForegroundPermissionsAsync();
  if (foregroundPermission.status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  await enqueueLocations([location]);
  void flushPendingLocations();
  return location;
}

async function handleLocations(locations: Location.LocationObject[]) {
  if (locations.length === 0) return;
  await enqueueLocations(locations);
  await flushPendingLocations();
}

// Must be defined at module scope so it is registered when the app is woken in the background.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      console.warn('Background location task failed:', error);
      return;
    }
    await handleLocations(data?.locations ?? []);
  }
);

// Fallback when background tracking is unavailable; only runs while the app is open.
async function startForegroundLocation() {
  if (foregroundSubscription) return;
  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: LOCATION_INTERVAL_MS,
      distanceInterval: 0,
    },
    (location) => void handleLocations([location]),
    (reason) => console.warn('Foreground location watch failed:', reason)
  );
  console.warn('Location publishing is running in foreground-only mode.');
}

export async function startBackgroundLocation() {
  startNetworkMonitoring();
  const foregroundPermission = await Location.requestForegroundPermissionsAsync();
  if (foregroundPermission.status !== 'granted') {
    console.warn('Location permission denied; location publishing is disabled.');
    return false;
  }
  console.log(
    `Location events will be queued and uploaded in batches of ${LOCATION_UPLOAD_BATCH_SIZE} to ${ENDPOINT || '(no endpoint configured)'}`
  );
  void flushPendingLocations();

  if (IS_EXPO_GO) {
    console.warn('Background location is not supported in Expo Go; use a development build.');
    await startForegroundLocation();
    return false;
  }

  const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
  if (backgroundPermission.status !== 'granted') {
    console.warn(
      'Background location permission denied. Enable "Allow all the time" in app settings.'
    );
    await startForegroundLocation();
    return false;
  }

  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) return true;

  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: LOCATION_INTERVAL_MS,
      distanceInterval: 0,
      deferredUpdatesInterval: LOCATION_INTERVAL_MS,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Aaptha is tracking your location',
        notificationBody: `Location is shared every ${LOCATION_INTERVAL_MS / 1000} seconds.`,
      },
    });
  } catch (error) {
    console.warn('Failed to start background location updates:', error);
    await startForegroundLocation();
    return false;
  }
  return true;
}

export async function stopBackgroundLocation() {
  foregroundSubscription?.remove();
  foregroundSubscription = null;
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}
