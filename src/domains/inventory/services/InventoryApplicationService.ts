import { InventoryRepository, InventoryItemEntity } from "../repositories/InventoryRepository";
import { ServiceResult, ok, fail } from "@/services/types";

export class InventoryApplicationService {
  static async getItem(id: string): Promise<ServiceResult<InventoryItemEntity>> {
    try {
      const item = await InventoryRepository.findById(id);
      if (!item) return fail("Inventory item not found");
      return ok(item);
    } catch (err: any) {
      return fail(err.message || "Failed to retrieve inventory item");
    }
  }

  static async getCompanyInventory(companyId: string): Promise<ServiceResult<InventoryItemEntity[]>> {
    try {
      const items = await InventoryRepository.findByCompany(companyId);
      return ok(items);
    } catch (err: any) {
      return fail(err.message || "Failed to list inventory");
    }
  }

  static async adjustStock(id: string, newQuantity: number): Promise<ServiceResult<boolean>> {
    try {
      if (newQuantity < 0) {
        return fail("Inventory quantity cannot be negative");
      }
      const success = await InventoryRepository.updateQuantity(id, newQuantity);
      if (!success) return fail("Failed to update inventory quantity");
      return ok(true);
    } catch (err: any) {
      return fail(err.message || "Error adjusting stock");
    }
  }
}
