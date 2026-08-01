import { ServiceResult, ok, fail } from "../services/types";

export interface SyncAction {
  id: string;
  companyId: string;
  staffId: string;
  actionType: "UPDATE_JOB_STATUS" | "CLOCK_IN" | "CLOCK_OUT" | "UPLOAD_PHOTO";
  payload: Record<string, any>;
  timestamp: string;
  synced: boolean;
}

export class SyncEngine {
  private static queue: SyncAction[] = [];

  static enqueueAction(action: Omit<SyncAction, "id" | "synced">): SyncAction {
    const item: SyncAction = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      synced: false,
    };
    this.queue.push(item);
    return item;
  }

  static getPendingQueue(): SyncAction[] {
    return this.queue.filter((item) => !item.synced);
  }

  static async flushQueue(): Promise<ServiceResult<{ processed: number }>> {
    try {
      const pending = this.getPendingQueue();
      let processed = 0;

      for (const item of pending) {
        item.synced = true;
        processed++;
      }

      return ok({ processed });
    } catch (err: any) {
      return fail(err.message || "Failed to flush sync queue");
    }
  }
}
