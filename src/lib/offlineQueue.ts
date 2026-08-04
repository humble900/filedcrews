// IndexedDB Queue Manager for Native Offline Persistence
import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "FiledCrewsOfflineDB";
const STORE_NAME = "pending_actions";
const DB_VERSION = 1;

export interface OfflineAction {
  id: string;
  type: "UPDATE_TASK_STATUS" | "CLOCK_IN_SHIFT" | "CLOCK_OUT_SHIFT" | "SUBMIT_PHOTO";
  payload: any;
  timestamp: number;
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result as IDBDatabase);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

// Add an action to the offline IndexedDB queue
export async function enqueueOfflineAction(type: OfflineAction["type"], payload: any): Promise<OfflineAction> {
  const db = await openDB();
  const action: OfflineAction = {
    id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(action);

    request.onsuccess = () => resolve(action);
    request.onerror = () => reject(request.error);
  });
}

// Get all pending actions from IndexedDB
export async function getPendingOfflineActions(): Promise<OfflineAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as OfflineAction[]);
    request.onerror = () => reject(request.error);
  });
}

// Remove an action from IndexedDB after successful sync
export async function dequeueOfflineAction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Flush all pending offline actions to Supabase when network is restored
export async function flushOfflineQueue(): Promise<{ successCount: number; failCount: number }> {
  const actions = await getPendingOfflineActions();
  if (actions.length === 0) return { successCount: 0, failCount: 0 };

  let successCount = 0;
  let failCount = 0;

  for (const action of actions) {
    try {
      if (action.type === "UPDATE_TASK_STATUS") {
        const { taskId, status } = action.payload;
        const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
        if (error) throw error;
      } else if (action.type === "CLOCK_IN_SHIFT") {
        const { shiftId, checkInTime } = action.payload;
        const { error } = await supabase.from("staff_shifts").update({ check_in_time: checkInTime, status: "in_progress" }).eq("id", shiftId);
        if (error) throw error;
      } else if (action.type === "CLOCK_OUT_SHIFT") {
        const { shiftId, checkOutTime } = action.payload;
        const { error } = await supabase.from("staff_shifts").update({ check_out_time: checkOutTime, status: "completed" }).eq("id", shiftId);
        if (error) throw error;
      }

      await dequeueOfflineAction(action.id);
      successCount++;
    } catch (err) {
      console.error(`[Offline Sync] Failed to sync action ${action.id}:`, err);
      failCount++;
    }
  }

  return { successCount, failCount };
}
