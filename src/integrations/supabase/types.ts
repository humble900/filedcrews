export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounting_sync_logs: {
        Row: {
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          platform: string
          records_count: number
          status: string
          synced_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          records_count?: number
          status?: string
          synced_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          records_count?: number
          status?: string
          synced_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_sync_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_sync_logs_synced_by_fkey"
            columns: ["synced_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      action_items: {
        Row: {
          action_url: string | null
          company_id: string
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          created_at: string
          customer_id: string
          equipment_type: string | null
          id: string
          install_date: string | null
          location_id: string | null
          make: string | null
          model: string | null
          name: string
          serial_number: string | null
          service_history: Json
          warranty_expiry: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          equipment_type?: string | null
          id?: string
          install_date?: string | null
          location_id?: string | null
          make?: string | null
          model?: string | null
          name: string
          serial_number?: string | null
          service_history?: Json
          warranty_expiry?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          equipment_type?: string | null
          id?: string
          install_date?: string | null
          location_id?: string | null
          make?: string | null
          model?: string | null
          name?: string
          serial_number?: string | null
          service_history?: Json
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changed_by: string | null
          company_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          source: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          source: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          cost_impact: number
          created_at: string
          description: string | null
          id: string
          project_id: string
          signature_url: string | null
          status: string
          title: string
        }
        Insert: {
          cost_impact?: number
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          signature_url?: string | null
          status?: string
          title: string
        }
        Update: {
          cost_impact?: number
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          signature_url?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          annual_revenue: string | null
          auth_user_id: string
          created_at: string
          currency: string
          enabled_modules: Json
          id: string
          industry: string
          max_admin_seats: number
          max_field_crew_seats: number
          name: string
          prefix: string
          staff_count: string | null
          subscription_status: string
          subscription_tier: string
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: string | null
          auth_user_id: string
          created_at?: string
          currency?: string
          enabled_modules?: Json
          id?: string
          industry?: string
          max_admin_seats?: number
          max_field_crew_seats?: number
          name: string
          prefix: string
          staff_count?: string | null
          subscription_status?: string
          subscription_tier?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: string | null
          auth_user_id?: string
          created_at?: string
          currency?: string
          enabled_modules?: Json
          id?: string
          industry?: string
          max_admin_seats?: number
          max_field_crew_seats?: number
          name?: string
          prefix?: string
          staff_count?: string | null
          subscription_status?: string
          subscription_tier?: string
          website?: string | null
        }
        Relationships: []
      }
      crew_members: {
        Row: {
          added_at: string
          crew_id: string
          id: string
          staff_id: string
        }
        Insert: {
          added_at?: string
          crew_id: string
          id?: string
          staff_id: string
        }
        Update: {
          added_at?: string
          crew_id?: string
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_members_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          billing_address: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          billing_address?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          billing_address?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_optional: boolean
          name: string
          option_id: string
          pricebook_id: string | null
          quantity: number
          selected_by_client: boolean
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_optional?: boolean
          name: string
          option_id: string
          pricebook_id?: string | null
          quantity?: number
          selected_by_client?: boolean
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_optional?: boolean
          name?: string
          option_id?: string
          pricebook_id?: string | null
          quantity?: number
          selected_by_client?: boolean
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "estimate_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_items_pricebook_id_fkey"
            columns: ["pricebook_id"]
            isOneToOne: false
            referencedRelation: "pricebook"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_options: {
        Row: {
          created_at: string
          estimate_id: string
          id: string
          is_recommended: boolean
          name: string
          sort_order: number
          total: number
        }
        Insert: {
          created_at?: string
          estimate_id: string
          id?: string
          is_recommended?: boolean
          name?: string
          sort_order?: number
          total?: number
        }
        Update: {
          created_at?: string
          estimate_id?: string
          id?: string
          is_recommended?: boolean
          name?: string
          sort_order?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_options_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approval_token: string | null
          client_message: string | null
          company_id: string
          created_at: string
          customer_id: string
          disclaimer: string | null
          discount_amount: number
          id: string
          introduction: string | null
          introduction_image_url: string | null
          job_id: string | null
          notes: string | null
          signature_url: string | null
          signed_at: string | null
          status: string
          tax_percent: number
          title: string
          total_amount: number
          updated_at: string
          valid_until: string | null
          planned_costs: Json
        }
        Insert: {
          approval_token?: string | null
          client_message?: string | null
          company_id: string
          created_at?: string
          customer_id: string
          disclaimer?: string | null
          discount_amount?: number
          id?: string
          introduction?: string | null
          introduction_image_url?: string | null
          job_id?: string | null
          notes?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: string
          tax_percent?: number
          title: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          planned_costs?: Json
        }
        Update: {
          approval_token?: string | null
          client_message?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string
          disclaimer?: string | null
          discount_amount?: number
          id?: string
          introduction?: string | null
          introduction_image_url?: string | null
          job_id?: string | null
          notes?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: string
          tax_percent?: number
          title?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          planned_costs?: Json
        }
        Relationships: [
          {
            foreignKeyName: "estimates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          data: Json
          id: string
          job_id: string
          submitted_at: string
          submitted_by: string
          template_id: string
        }
        Insert: {
          data?: Json
          id?: string
          job_id: string
          submitted_at?: string
          submitted_by: string
          template_id: string
        }
        Update: {
          data?: Json
          id?: string
          job_id?: string
          submitted_at?: string
          submitted_by?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          job_type_id: string | null
          name: string
          schema: Json
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          job_type_id?: string | null
          name: string
          schema?: Json
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          job_type_id?: string | null
          name?: string
          schema?: Json
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_templates_job_type_id_fkey"
            columns: ["job_type_id"]
            isOneToOne: false
            referencedRelation: "job_types"
            referencedColumns: ["id"]
          },
        ]
      }
      geofence_events: {
        Row: {
          created_at: string
          event_type: string
          face_check_at: string | null
          face_check_confidence: string | null
          face_check_override_by: string | null
          face_check_override_status: string | null
          face_check_photo_url: string | null
          face_check_status: string | null
          geofence_id: string
          id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          face_check_at?: string | null
          face_check_confidence?: string | null
          face_check_override_by?: string | null
          face_check_override_status?: string | null
          face_check_photo_url?: string | null
          face_check_status?: string | null
          geofence_id: string
          id?: string
          staff_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          face_check_at?: string | null
          face_check_confidence?: string | null
          face_check_override_by?: string | null
          face_check_override_status?: string | null
          face_check_photo_url?: string | null
          face_check_status?: string | null
          geofence_id?: string
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_events_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_events_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          ask_for_face_id: boolean
          check_in_time: string | null
          check_out_time: string | null
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          project_id: string | null
          radius_meters: number
        }
        Insert: {
          ask_for_face_id?: boolean
          check_in_time?: string | null
          check_out_time?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          project_id?: string | null
          radius_meters?: number
        }
        Update: {
          ask_for_face_id?: boolean
          check_in_time?: string | null
          check_out_time?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          project_id?: string | null
          radius_meters?: number
        }
        Relationships: [
          {
            foreignKeyName: "geofences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_reports: {
        Row: {
          attachment_urls: string[] | null
          created_at: string
          description: string
          id: string
          project_id: string
          reporter_id: string
          severity: string
          status: string
          type: string
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string
          description: string
          id?: string
          project_id: string
          reporter_id: string
          severity: string
          status?: string
          type: string
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string
          description?: string
          id?: string
          project_id?: string
          reporter_id?: string
          severity?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          company_id: string
          created_at: string
          current_stock: number
          description: string | null
          id: string
          minimum_stock: number
          name: string
          part_number: string
          unit_cost: number
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          minimum_stock?: number
          name: string
          part_number: string
          unit_cost?: number
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          minimum_stock?: number
          name?: string
          part_number?: string
          unit_cost?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_signature_url: string | null
          created_at: string
          id: string
          job_id: string
          payment_status: string
          status: string
        }
        Insert: {
          amount?: number
          client_signature_url?: string | null
          created_at?: string
          id?: string
          job_id: string
          payment_status?: string
          status?: string
        }
        Update: {
          amount?: number
          client_signature_url?: string | null
          created_at?: string
          id?: string
          job_id?: string
          payment_status?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_equipment: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          job_id: string
          notes: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_equipment_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_events: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          job_id: string
          metadata: Json | null
          notes: string | null
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          job_id: string
          metadata?: Json | null
          notes?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          job_id?: string
          metadata?: Json | null
          notes?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_types: {
        Row: {
          color: string
          company_id: string
          created_at: string
          default_duration_minutes: number
          default_price: number | null
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          required_skills: string[] | null
          sort_order: number
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          default_duration_minutes?: number
          default_price?: number | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          required_skills?: string[] | null
          sort_order?: number
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          default_duration_minutes?: number
          default_price?: number | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          required_skills?: string[] | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          arrival_window_end: string | null
          arrival_window_start: string | null
          assigned_staff_id: string | null
          business_unit_id: string | null
          campaign_id: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          job_type_id: string | null
          location_id: string | null
          priority: string | null
          project_id: string
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
          title: string
        }
        Insert: {
          arrival_window_end?: string | null
          arrival_window_start?: string | null
          assigned_staff_id?: string | null
          business_unit_id?: string | null
          campaign_id?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          job_type_id?: string | null
          location_id?: string | null
          priority?: string | null
          project_id: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          title: string
        }
        Update: {
          arrival_window_end?: string | null
          arrival_window_start?: string | null
          assigned_staff_id?: string | null
          business_unit_id?: string | null
          campaign_id?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          job_type_id?: string | null
          location_id?: string | null
          priority?: string | null
          project_id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_job_type_id_fkey"
            columns: ["job_type_id"]
            isOneToOne: false
            referencedRelation: "job_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          campaign_id: string | null
          company_id: string
          converted_job_id: string | null
          created_at: string
          customer_name: string
          email: string | null
          estimated_value: number | null
          follow_up_date: string | null
          id: string
          job_type_id: string | null
          notes: string | null
          phone: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          campaign_id?: string | null
          company_id: string
          converted_job_id?: string | null
          created_at?: string
          customer_name: string
          email?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          job_type_id?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          campaign_id?: string | null
          company_id?: string
          converted_job_id?: string | null
          created_at?: string
          customer_name?: string
          email?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          job_type_id?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_job_id_fkey"
            columns: ["converted_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_job_type_id_fkey"
            columns: ["job_type_id"]
            isOneToOne: false
            referencedRelation: "job_types"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          company_id: string
          created_at: string
          customer_id: string
          id: string
          name: string
        }
        Insert: {
          address: string
          company_id: string
          created_at?: string
          customer_id: string
          id?: string
          name: string
        }
        Update: {
          address?: string
          company_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          billing_frequency: string
          company_id: string
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          name: string
          price: number
          visits_per_year: number
        }
        Insert: {
          billing_frequency?: string
          company_id: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          visits_per_year?: number
        }
        Update: {
          billing_frequency?: string
          company_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          visits_per_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_visits: {
        Row: {
          created_at: string
          due_date: string
          id: string
          job_id: string | null
          membership_id: string
          status: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          job_id?: string | null
          membership_id: string
          status?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          job_id?: string | null
          membership_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_visits_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_visits_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          plan_id: string
          renewal_date: string | null
          start_date: string
          status: string
          contract_value: number | null
          billing_terms: string | null
          included_visits: number | null
          completed_visits: number | null
          sla_response_hours: number | null
          auto_renew: boolean | null
          renewal_status: string | null
          contract_notes: string | null
          contract_document_url: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          plan_id: string
          renewal_date?: string | null
          start_date?: string
          status?: string
          contract_value?: number | null
          billing_terms?: string | null
          included_visits?: number | null
          completed_visits?: number | null
          sla_response_hours?: number | null
          auto_renew?: boolean | null
          renewal_status?: string | null
          contract_notes?: string | null
          contract_document_url?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          plan_id?: string
          renewal_date?: string | null
          start_date?: string
          status?: string
          contract_value?: number | null
          billing_terms?: string | null
          included_visits?: number | null
          completed_visits?: number | null
          sla_response_hours?: number | null
          auto_renew?: boolean | null
          renewal_status?: string | null
          contract_notes?: string | null
          contract_document_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_method: string
          status: string
          stripe_checkout_url: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_method?: string
          status?: string
          stripe_checkout_url?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_method?: string
          status?: string
          stripe_checkout_url?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricebook: {
        Row: {
          category: string | null
          company_id: string
          cost: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          item_name: string
          kind: string
          member_price: number | null
          subcategory: string | null
          unit_cost: number
        }
        Insert: {
          category?: string | null
          company_id: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_name: string
          kind?: string
          member_price?: number | null
          subcategory?: string | null
          unit_cost?: number
        }
        Update: {
          category?: string | null
          company_id?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_name?: string
          kind?: string
          member_price?: number | null
          subcategory?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricebook_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          assigned_at: string
          crew_id: string | null
          id: string
          project_id: string
          role: string
          staff_id: string
        }
        Insert: {
          assigned_at?: string
          crew_id?: string | null
          id?: string
          project_id: string
          role?: string
          staff_id: string
        }
        Update: {
          assigned_at?: string
          crew_id?: string | null
          id?: string
          project_id?: string
          role?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          job_id: string | null
          name: string
          notes: string | null
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          job_id?: string | null
          name: string
          notes?: string | null
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          job_id?: string | null
          name?: string
          notes?: string | null
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          progress_percent: number
          project_id: string
          start_date: string | null
          status: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          progress_percent?: number
          project_id: string
          start_date?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          progress_percent?: number
          project_id?: string
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_costs: {
        Row: {
          id: string
          project_id: string
          company_id: string
          category: string
          title: string
          budget_amount: number
          actual_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          company_id: string
          category: string
          title: string
          budget_amount?: number
          actual_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          company_id?: string
          category?: string
          title?: string
          budget_amount?: number
          actual_amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget_labour_cost: number
          company_id: string
          contract_value: number
          created_at: string
          customer_id: string
          description: string | null
          end_date: string | null
          geofence_radius: number
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          ref_number: string
          start_date: string | null
          status: string
        }
        Insert: {
          address?: string | null
          budget_labour_cost?: number
          company_id: string
          contract_value?: number
          created_at?: string
          customer_id: string
          description?: string | null
          end_date?: string | null
          geofence_radius?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          ref_number: string
          start_date?: string | null
          status?: string
        }
        Update: {
          address?: string | null
          budget_labour_cost?: number
          company_id?: string
          contract_value?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          end_date?: string | null
          geofence_radius?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          ref_number?: string
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          item_name: string
          po_id: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          id?: string
          item_name: string
          po_id: string
          quantity?: number
          unit_cost?: number
        }
        Update: {
          id?: string
          item_name?: string
          po_id?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string
          created_at: string
          id: string
          po_number: string
          status: string
          total_amount: number
          vendor_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          po_number: string
          status?: string
          total_amount?: number
          vendor_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          po_number?: string
          status?: string
          total_amount?: number
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          permissions: Json | null
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json | null
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          company_id: string
          converted_lead_id: string | null
          created_at: string
          customer_id: string
          description: string
          id: string
          status: string
          urgency: string
        }
        Insert: {
          company_id: string
          converted_lead_id?: string | null
          created_at?: string
          customer_id: string
          description: string
          id?: string
          status?: string
          urgency?: string
        }
        Update: {
          company_id?: string
          converted_lead_id?: string | null
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          status?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_converted_lead_id_fkey"
            columns: ["converted_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_location_history: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          staff_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          staff_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_location_history_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_locations: {
        Row: {
          accuracy: number | null
          latitude: number
          longitude: number
          staff_id: string
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          latitude: number
          longitude: number
          staff_id: string
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          latitude?: number
          longitude?: number
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_locations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          account_number: string | null
          address: string | null
          auth_user_id: string | null
          bank_name: string | null
          can_manage_roles: boolean
          company_id: string | null
          created_at: string
          email: string | null
          expo_push_token: string | null
          first_name: string | null
          full_name: string
          global_role: string
          hourly_rate: number | null
          id: string
          is_active: boolean
          job_title: string | null
          last_face_verified_at: string | null
          last_name: string | null
          phone: string | null
          photo_url: string | null
          routing_number: string | null
          username: string
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          auth_user_id?: string | null
          bank_name?: string | null
          can_manage_roles?: boolean
          company_id?: string | null
          created_at?: string
          email?: string | null
          expo_push_token?: string | null
          first_name?: string | null
          full_name: string
          global_role?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_face_verified_at?: string | null
          last_name?: string | null
          phone?: string | null
          photo_url?: string | null
          routing_number?: string | null
          username: string
        }
        Update: {
          account_number?: string | null
          address?: string | null
          auth_user_id?: string | null
          bank_name?: string | null
          can_manage_roles?: boolean
          company_id?: string | null
          created_at?: string
          email?: string | null
          expo_push_token?: string | null
          first_name?: string | null
          full_name?: string
          global_role?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_face_verified_at?: string | null
          last_name?: string | null
          phone?: string | null
          photo_url?: string | null
          routing_number?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string
          decline_reason: string | null
          geofence_id: string
          id: string
          is_active: boolean
          job_id: string | null
          shift_date: string | null
          staff_id: string
          status: string
        }
        Insert: {
          check_in_time: string
          check_out_time?: string | null
          created_at?: string
          decline_reason?: string | null
          geofence_id: string
          id?: string
          is_active?: boolean
          job_id?: string | null
          shift_date?: string | null
          staff_id: string
          status?: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          decline_reason?: string | null
          geofence_id?: string
          id?: string
          is_active?: boolean
          job_id?: string | null
          shift_date?: string | null
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          after_photo_url: string | null
          after_photo_urls: string[] | null
          approval_status: string
          approved_at: string | null
          assignee_id: string | null
          before_photo_url: string | null
          before_photo_urls: string[] | null
          completed_at: string | null
          created_at: string
          description: string | null
          est_hours: number
          id: string
          job_id: string
          manager_feedback: string | null
          name: string
          phase_id: string | null
          priority: string
          staff_notes: string | null
          status: string
        }
        Insert: {
          after_photo_url?: string | null
          after_photo_urls?: string[] | null
          approval_status?: string
          approved_at?: string | null
          assignee_id?: string | null
          before_photo_url?: string | null
          before_photo_urls?: string[] | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          est_hours?: number
          id?: string
          job_id: string
          manager_feedback?: string | null
          name: string
          phase_id?: string | null
          priority?: string
          staff_notes?: string | null
          status?: string
        }
        Update: {
          after_photo_url?: string | null
          after_photo_urls?: string[] | null
          approval_status?: string
          approved_at?: string | null
          assignee_id?: string | null
          before_photo_url?: string | null
          before_photo_urls?: string[] | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          est_hours?: number
          id?: string
          job_id?: string
          manager_feedback?: string | null
          name?: string
          phase_id?: string | null
          priority?: string
          staff_notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_entries: {
        Row: {
          approval_status: string
          approved_by: string | null
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          entry_type: string
          id: string
          job_id: string | null
          notes: string | null
          source: string
          staff_id: string
          start_time: string
        }
        Insert: {
          approval_status?: string
          approved_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          entry_type?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          source?: string
          staff_id: string
          start_time: string
        }
        Update: {
          approval_status?: string
          approved_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          entry_type?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          source?: string
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      toolbox_talk_attendees: {
        Row: {
          id: string
          signed_at: string
          staff_id: string
          talk_id: string
        }
        Insert: {
          id?: string
          signed_at?: string
          staff_id: string
          talk_id: string
        }
        Update: {
          id?: string
          signed_at?: string
          staff_id?: string
          talk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_talk_attendees_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toolbox_talk_attendees_talk_id_fkey"
            columns: ["talk_id"]
            isOneToOne: false
            referencedRelation: "toolbox_talks"
            referencedColumns: ["id"]
          },
        ]
      }
      toolbox_talks: {
        Row: {
          created_at: string
          date: string
          id: string
          presenter_id: string
          project_id: string
          topic: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          presenter_id: string
          project_id: string
          topic: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          presenter_id?: string
          project_id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_talks_presenter_id_fkey"
            columns: ["presenter_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toolbox_talks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          company_id: string
          created_at: string
          id: string
          location: string | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_staff_can_manage: { Args: { staff_uuid: string }; Returns: boolean }
      get_staff_company_id: { Args: { user_uuid: string }; Returns: string }
      get_staff_profile_id: {
        Args: { p_auth_user_id: string }
        Returns: string
      }
      get_staff_role: { Args: { staff_uuid: string }; Returns: string }
      is_company_owner: {
        Args: { target_company_id: string; user_uuid: string }
        Returns: boolean
      }
      is_delegated_role_manager: {
        Args: { target_company_id: string; user_uuid: string }
        Returns: boolean
      }
      portal_get_assets: {
        Args: { p_customer_id: string }
        Returns: {
          equipment_type: string
          id: string
          install_date: string
          make: string
          model: string
          name: string
          serial_number: string
          warranty_expiry: string
        }[]
      }
      portal_get_estimates: {
        Args: { p_customer_id: string }
        Returns: {
          approval_token: string
          id: string
          status: string
          title: string
          total_amount: number
          valid_until: string
        }[]
      }
      portal_get_invoices: {
        Args: { p_customer_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          invoice_number: string
          payment_status: string
          status: string
        }[]
      }
      portal_get_jobs: {
        Args: { p_customer_id: string }
        Returns: {
          description: string
          id: string
          scheduled_end: string
          scheduled_start: string
          status: string
          title: string
        }[]
      }
      portal_verify_customer: {
        Args: { p_email: string; p_phone: string }
        Returns: {
          billing_address: string
          company_id: string
          email: string
          id: string
          name: string
          phone: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
