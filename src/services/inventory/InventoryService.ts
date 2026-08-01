import { supabase } from "@/integrations/supabase/client";
import { ServiceResult, ok, fail } from "../types";

export interface InventoryItem {
  id: string;
  company_id: string;
  part_number: string;
  name: string;
  description?: string | null;
  unit_cost: number;
  stock_quantity: number;
  min_stock_level: number;
  warehouse_id?: string | null;
}

export class InventoryService {
  /**
   * List catalog items for a company
   */
  static async listInventory(companyId: string): Promise<ServiceResult<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("company_id", companyId)
        .order("name");

      if (error) return fail(error.message);
      return ok(data as InventoryItem[]);
    } catch (err: any) {
      return fail(err.message || "Failed to fetch inventory");
    }
  }

  /**
   * Add a new item to catalog
   */
  static async createInventoryItem(
    payload: Omit<InventoryItem, "id">
  ): Promise<ServiceResult<InventoryItem>> {
    try {
      if (!payload.name || !payload.company_id || !payload.part_number) {
        return fail("Part number, name, and company_id are required.");
      }

      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          company_id: payload.company_id,
          part_number: payload.part_number,
          name: payload.name,
          description: payload.description || null,
          unit_cost: payload.unit_cost || 0,
          stock_quantity: payload.stock_quantity || 0,
          min_stock_level: payload.min_stock_level || 0,
          warehouse_id: payload.warehouse_id === "NONE" ? null : payload.warehouse_id,
        })
        .select("*")
        .single();

      if (error) return fail(error.message);
      return ok(data as InventoryItem);
    } catch (err: any) {
      return fail(err.message || "Failed to create inventory item");
    }
  }
}
