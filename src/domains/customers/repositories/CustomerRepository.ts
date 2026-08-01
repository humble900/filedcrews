import { supabase } from "@/integrations/supabase/client";

export interface CustomerEntity {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export class CustomerRepository {
  static async findById(id: string): Promise<CustomerEntity | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      createdAt: data.created_at,
    };
  }

  static async findByCompany(companyId: string): Promise<CustomerEntity[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("company_id", companyId);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      companyId: d.company_id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      address: d.address,
      createdAt: d.created_at,
    }));
  }

  static async create(customer: Omit<CustomerEntity, "id" | "createdAt">): Promise<CustomerEntity | null> {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        company_id: customer.companyId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      })
      .select()
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      createdAt: data.created_at,
    };
  }
}
