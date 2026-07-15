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
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          install_date: string | null
          name: string
          serial_number: string | null
          service_history: Json
          make: string | null
          model: string | null
          warranty_expiry: string | null
          equipment_type: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          install_date?: string | null
          name: string
          serial_number?: string | null
          service_history?: Json
          make?: string | null
          model?: string | null
          warranty_expiry?: string | null
          equipment_type?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          install_date?: string | null
          name?: string
          serial_number?: string | null
          service_history?: Json
          make?: string | null
          model?: string | null
          warranty_expiry?: string | null
          equipment_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
          auth_user_id: string
          created_at: string
          currency: string
          id: string
          max_admin_seats: number
          max_field_crew_seats: number
          name: string
          prefix: string
          subscription_status: string
          subscription_tier: string
          enabled_modules: Json
          industry: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          currency?: string
          id?: string
          max_admin_seats?: number
          max_field_crew_seats?: number
          name: string
          prefix: string
          subscription_status?: string
          subscription_tier?: string
          enabled_modules?: Json
          industry?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          currency?: string
          id?: string
          max_admin_seats?: number
          max_field_crew_seats?: number
          name?: string
          prefix?: string
          subscription_status?: string
          subscription_tier?: string
          enabled_modules?: Json
          industry?: string
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
        ]
      }
      incident_reports: {
        Row: {
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
      jobs: {
        Row: {
          assigned_staff_id: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          priority: string
          project_id: string
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
          title: string
          job_type_id: string | null
          business_unit_id: string | null
          arrival_window_start: string | null
          arrival_window_end: string | null
        }
        Insert: {
          assigned_staff_id?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          priority?: string
          project_id: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          title: string
          job_type_id?: string | null
          business_unit_id?: string | null
          arrival_window_start?: string | null
          arrival_window_end?: string | null
        }
        Update: {
          assigned_staff_id?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          priority?: string
          project_id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          title?: string
          job_type_id?: string | null
          business_unit_id?: string | null
          arrival_window_start?: string | null
          arrival_window_end?: string | null
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
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
      companies: {
        Row: {
          auth_user_id: string
          created_at: string
          currency: string
          id: string
          max_admin_seats: number
          max_field_crew_seats: number
          name: string
          prefix: string
          subscription_status: string
          subscription_tier: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          currency?: string
          id?: string
          max_admin_seats?: number
          max_field_crew_seats?: number
          name: string
          prefix: string
          subscription_status?: string
          subscription_tier?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          currency?: string
          id?: string
          max_admin_seats?: number
          max_field_crew_seats?: number
          name?: string
          prefix?: string
          subscription_status?: string
          subscription_tier?: string
        }
        Relationships: []
      }
      pricebook: {
        Row: {
          company_id: string
          created_at: string
          id: string
          item_name: string
          unit_cost: number
          kind: string
          description: string | null
          image_url: string | null
          cost: number
          member_price: number | null
          category: string | null
          subcategory: string | null
          is_active: boolean
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          item_name: string
          unit_cost?: number
          kind?: string
          description?: string | null
          image_url?: string | null
          cost?: number
          member_price?: number | null
          category?: string | null
          subcategory?: string | null
          is_active?: boolean
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          item_name?: string
          unit_cost?: number
          kind?: string
          description?: string | null
          image_url?: string | null
          cost?: number
          member_price?: number | null
          category?: string | null
          subcategory?: string | null
          is_active?: boolean
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
          {
            foreignKeyName: "project_assignments_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
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
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
          address: string | null
          auth_user_id: string | null
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
          username: string
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
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
          username: string
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
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
          geofence_id: string
          id: string
          is_active: boolean
          job_id: string | null
          shift_date: string | null
          staff_id: string
        }
        Insert: {
          check_in_time: string
          check_out_time?: string | null
          created_at?: string
          geofence_id: string
          id?: string
          is_active?: boolean
          job_id?: string | null
          shift_date?: string | null
          staff_id: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          geofence_id?: string
          id?: string
          is_active?: boolean
          job_id?: string | null
          shift_date?: string | null
          staff_id?: string
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
          approval_status: string
          approved_at: string | null
          assignee_id: string | null
          before_photo_url: string | null
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
          approval_status?: string
          approved_at?: string | null
          assignee_id?: string | null
          before_photo_url?: string | null
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
          approval_status?: string
          approved_at?: string | null
          assignee_id?: string | null
          before_photo_url?: string | null
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
      toolbox_talks: {
        Row: {
          acknowledged_by: Json
          company_id: string
          conducted_by: string
          content: string
          created_at: string
          id: string
          project_id: string | null
          title: string
        }
        Insert: {
          acknowledged_by?: Json
          company_id: string
          conducted_by: string
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          title: string
        }
        Update: {
          acknowledged_by?: Json
          company_id?: string
          conducted_by?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_talks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toolbox_talks_conducted_by_fkey"
            columns: ["conducted_by"]
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
      audit_log: {
        Row: {
          id: string
          company_id: string
          table_name: string
          record_id: string
          action: string
          old_data: Record<string, unknown> | null
          new_data: Record<string, unknown> | null
          changed_by: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          table_name: string
          record_id: string
          action: string
          old_data?: Record<string, unknown> | null
          new_data?: Record<string, unknown> | null
          changed_by?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_data?: Record<string, unknown> | null
          new_data?: Record<string, unknown> | null
          changed_by?: string | null
          ip_address?: string | null
          created_at?: string
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
      job_events: {
        Row: {
          id: string
          job_id: string
          from_status: string | null
          to_status: string
          changed_by: string | null
          notes: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          from_status?: string | null
          to_status: string
          changed_by?: string | null
          notes?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string | null
          notes?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_types: {
        Row: {
          id: string
          company_id: string
          name: string
          default_duration_minutes: number
          required_skills: string[]
          default_price: number | null
          description: string | null
          color: string
          icon: string
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          default_duration_minutes?: number
          required_skills?: string[]
          default_price?: number | null
          description?: string | null
          color?: string
          icon?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          default_duration_minutes?: number
          required_skills?: string[]
          default_price?: number | null
          description?: string | null
          color?: string
          icon?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
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
      leads: {
        Row: {
          id: string
          company_id: string
          customer_name: string
          phone: string | null
          email: string | null
          address: string | null
          source: string
          status: string
          follow_up_date: string | null
          notes: string | null
          converted_job_id: string | null
          assigned_to: string | null
          estimated_value: number | null
          job_type_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          source?: string
          status?: string
          follow_up_date?: string | null
          notes?: string | null
          converted_job_id?: string | null
          assigned_to?: string | null
          estimated_value?: number | null
          job_type_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          source?: string
          status?: string
          follow_up_date?: string | null
          notes?: string | null
          converted_job_id?: string | null
          assigned_to?: string | null
          estimated_value?: number | null
          job_type_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
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
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
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
      action_items: {
        Row: {
          id: string
          company_id: string
          type: string
          entity_type: string
          entity_id: string
          title: string
          description: string | null
          severity: string
          action_url: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: string
          entity_type: string
          entity_id: string
          title: string
          description?: string | null
          severity?: string
          action_url?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: string
          entity_type?: string
          entity_id?: string
          title?: string
          description?: string | null
          severity?: string
          action_url?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          expires_at?: string | null
          created_at?: string
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
      estimates: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          job_id: string | null
          title: string
          status: string
          total_amount: number
          valid_until: string | null
          notes: string | null
          signature_url: string | null
          signed_at: string | null
          approval_token: string
          created_at: string
          updated_at: string
          introduction: string | null
          introduction_image_url: string | null
          discount_amount: number
          tax_percent: number
          disclaimer: string | null
          client_message: string | null
        }
        Insert: {
          id?: string
          company_id: string
          customer_id: string
          job_id?: string | null
          title: string
          status?: string
          total_amount?: number
          valid_until?: string | null
          notes?: string | null
          signature_url?: string | null
          signed_at?: string | null
          approval_token?: string
          created_at?: string
          updated_at?: string
          introduction?: string | null
          introduction_image_url?: string | null
          discount_amount?: number
          tax_percent?: number
          disclaimer?: string | null
          client_message?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string
          job_id?: string | null
          title?: string
          status?: string
          total_amount?: number
          valid_until?: string | null
          notes?: string | null
          signature_url?: string | null
          signed_at?: string | null
          approval_token?: string
          created_at?: string
          updated_at?: string
          introduction?: string | null
          introduction_image_url?: string | null
          discount_amount?: number
          tax_percent?: number
          disclaimer?: string | null
          client_message?: string | null
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
      estimate_options: {
        Row: {
          id: string
          estimate_id: string
          name: string
          sort_order: number
          total: number
          is_recommended: boolean
          created_at: string
        }
        Insert: {
          id?: string
          estimate_id: string
          name?: string
          sort_order?: number
          total?: number
          is_recommended?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          estimate_id?: string
          name?: string
          sort_order?: number
          total?: number
          is_recommended?: boolean
          created_at?: string
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
      estimate_items: {
        Row: {
          id: string
          option_id: string
          pricebook_id: string | null
          name: string
          description: string | null
          quantity: number
          unit_price: number
          created_at: string
          is_optional: boolean
          selected_by_client: boolean
          image_url: string | null
        }
        Insert: {
          id?: string
          option_id: string
          pricebook_id?: string | null
          name: string
          description?: string | null
          quantity?: number
          unit_price?: number
          created_at?: string
          is_optional?: boolean
          selected_by_client?: boolean
          image_url?: string | null
        }
        Update: {
          id?: string
          option_id?: string
          pricebook_id?: string | null
          name?: string
          description?: string | null
          quantity?: number
          unit_price?: number
          created_at?: string
          is_optional?: boolean
          selected_by_client?: boolean
          image_url?: string | null
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
      payments: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          payment_method: string
          stripe_payment_id: string | null
          stripe_checkout_url: string | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          amount: number
          payment_method?: string
          stripe_payment_id?: string | null
          stripe_checkout_url?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          amount?: number
          payment_method?: string
          stripe_payment_id?: string | null
          stripe_checkout_url?: string | null
          status?: string
          notes?: string | null
          created_at?: string
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
      accounting_sync_logs: {
        Row: {
          id: string
          company_id: string
          platform: string
          records_count: number
          status: string
          error_message: string | null
          created_at: string
          synced_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          platform: string
          records_count?: number
          status?: string
          error_message?: string | null
          created_at?: string
          synced_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          platform?: string
          records_count?: number
          status?: string
          error_message?: string | null
          created_at?: string
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
      business_units: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
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
      job_equipment: {
        Row: {
          id: string
          job_id: string
          asset_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          asset_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          asset_id?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_equipment_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          id: string
          company_id: string
          name: string
          price: number
          billing_frequency: string
          visits_per_year: number
          discount_percent: number
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          price?: number
          billing_frequency?: string
          visits_per_year?: number
          discount_percent?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          price?: number
          billing_frequency?: string
          visits_per_year?: number
          discount_percent?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
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
      memberships: {
        Row: {
          id: string
          plan_id: string
          customer_id: string
          status: string
          start_date: string
          renewal_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          customer_id: string
          status?: string
          start_date?: string
          renewal_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          customer_id?: string
          status?: string
          start_date?: string
          renewal_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_visits: {
        Row: {
          id: string
          membership_id: string
          job_id: string | null
          due_date: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          membership_id: string
          job_id?: string | null
          due_date: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          membership_id?: string
          job_id?: string | null
          due_date?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_visits_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_visits_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_entries: {
        Row: {
          id: string
          staff_id: string
          job_id: string | null
          entry_type: string
          source: string
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          approval_status: string
          approved_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          job_id?: string | null
          entry_type?: string
          source?: string
          start_time: string
          end_time?: string | null
          duration_minutes?: number | null
          approval_status?: string
          approved_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          job_id?: string | null
          entry_type?: string
          source?: string
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          approval_status?: string
          approved_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_staff_id_fkey"
            columns: ["staff_id"]
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
            foreignKeyName: "timesheet_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          schema: Json
          job_type_id: string | null
          is_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          schema?: Json
          job_type_id?: string | null
          is_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          schema?: Json
          job_type_id?: string | null
          is_required?: boolean
          created_at?: string
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
      form_responses: {
        Row: {
          id: string
          template_id: string
          job_id: string
          submitted_by: string
          data: Json
          submitted_at: string
        }
        Insert: {
          id?: string
          template_id: string
          job_id: string
          submitted_by: string
          data?: Json
          submitted_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          job_id?: string
          submitted_by?: string
          data?: Json
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
