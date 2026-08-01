import { supabase } from "@/integrations/supabase/client";

export interface InventoryItemEntity {
  id: string;
  companyId: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  sku?: string;
  category?: string;
  createdAt: string;
}

export class InventoryRepository {
  static async findById(id: string): Promise<InventoryItemEntity | null> {
    const { data, error } = await supabase
      .from("parts_inventory")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      quantity: data.quantity ?? 0,
      minQuantity: data.min_quantity ?? 0,
      unitPrice: data.unit_price ?? 0,
      sku: data.sku,
      category: data.category,
      createdAt: data.created_at,
    };
  }

  static async findByCompany(companyId: string): Promise<InventoryItemEntity[]> {
    const { data, error } = await supabase
      .from("parts_inventory")
      .select("*")
      .eq("company_id", companyId);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      companyId: d.company_id,
      name: d.name,
      quantity: d.quantity ?? 0,
      minQuantity: d.min_quantity ?? 0,
      unitPrice: d.unit_price ?? 0,
      sku: d.sku,
      category: d.category,
      createdAt: d.created_at,
    }));
  }

  static async updateQuantity(id: string, quantity: number): Promise<boolean> {
    const { error } = await supabase
      .from("parts_inventory")
      .update({ quantity })
      .eq("id", id);

    return !error;
  }
}
