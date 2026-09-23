// Database types for Smile Please, matching the live schema (verified against
// the hosted project via information_schema, 2026-08-04).
// NOTE: hand-generated (CLI `supabase gen types` needs Docker/login on this
// machine) — identical to `supabase gen types typescript --linked` output.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          full_name: string;
          phone: string | null;
          email: string | null;
          is_minor: boolean;
          guardian_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          full_name: string;
          phone?: string | null;
          email?: string | null;
          is_minor?: boolean;
          guardian_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          is_minor?: boolean;
          guardian_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_guardian_profile_id_fkey";
            columns: ["guardian_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          profile_id: string;
          age_band: Database["public"]["Enums"]["age_band"] | null;
          locality: string | null;
          pincode: string | null;
        };
        Insert: {
          profile_id: string;
          age_band?: Database["public"]["Enums"]["age_band"] | null;
          locality?: string | null;
          pincode?: string | null;
        };
        Update: {
          profile_id?: string;
          age_band?: Database["public"]["Enums"]["age_band"] | null;
          locality?: string | null;
          pincode?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patients_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dentists: {
        Row: {
          profile_id: string;
          slug: string;
          display_name: string;
          dci_registration_no: string | null;
          dci_verified_at: string | null;
          clinic_name: string | null;
          address_line: string | null;
          locality: string;
          city: string;
          pincode: string | null;
          geo_lat: number | null;
          geo_lng: number | null;
          specialties: string[];
          languages: string[];
          bio: string | null;
          photo_path: string | null;
          status: Database["public"]["Enums"]["dentist_status"];
          is_public: boolean;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          slug: string;
          display_name: string;
          dci_registration_no?: string | null;
          dci_verified_at?: string | null;
          clinic_name?: string | null;
          address_line?: string | null;
          locality: string;
          city?: string;
          pincode?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          specialties?: string[];
          languages?: string[];
          bio?: string | null;
          photo_path?: string | null;
          status?: Database["public"]["Enums"]["dentist_status"];
          is_public?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          slug?: string;
          display_name?: string;
          dci_registration_no?: string | null;
          dci_verified_at?: string | null;
          clinic_name?: string | null;
          address_line?: string | null;
          locality?: string;
          city?: string;
          pincode?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          specialties?: string[];
          languages?: string[];
          bio?: string | null;
          photo_path?: string | null;
          status?: Database["public"]["Enums"]["dentist_status"];
          is_public?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dentists_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dentists_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_day_blocks: {
        Row: {
          dentist_id: string;
          local_date: string;
          created_at: string;
        };
        Insert: {
          dentist_id: string;
          local_date: string;
          created_at?: string;
        };
        Update: {
          dentist_id?: string;
          local_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_day_blocks_dentist_id_fkey";
            columns: ["dentist_id"];
            isOneToOne: false;
            referencedRelation: "dentists";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      availability_slots: {
        Row: {
          id: string;
          dentist_id: string;
          starts_at: string;
          ends_at: string;
          capacity: number;
          booked_count: number;
          status: Database["public"]["Enums"]["slot_status"];
          held_until: string | null;
          hold_owner: string | null;
          location_type: Database["public"]["Enums"]["location_type"];
          camp_name: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          dentist_id: string;
          starts_at: string;
          ends_at: string;
          capacity?: number;
          booked_count?: number;
          status?: Database["public"]["Enums"]["slot_status"];
          held_until?: string | null;
          hold_owner?: string | null;
          location_type?: Database["public"]["Enums"]["location_type"];
          camp_name?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          dentist_id?: string;
          starts_at?: string;
          ends_at?: string;
          capacity?: number;
          booked_count?: number;
          status?: Database["public"]["Enums"]["slot_status"];
          held_until?: string | null;
          hold_owner?: string | null;
          location_type?: Database["public"]["Enums"]["location_type"];
          camp_name?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_slots_dentist_id_fkey";
            columns: ["dentist_id"];
            isOneToOne: false;
            referencedRelation: "dentists";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "availability_slots_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          reference_code: string;
          patient_id: string;
          dentist_id: string | null;
          slot_id: string | null;
          source: Database["public"]["Enums"]["appointment_source"];
          status: Database["public"]["Enums"]["appointment_status"];
          reason_category: Database["public"]["Enums"]["reason_category"];
          patient_note: string | null;
          preferred_window: Json | null;
          preferred_locality: string | null;
          scheduled_for: string | null;
          cancelled_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_code?: string;
          patient_id: string;
          dentist_id?: string | null;
          slot_id?: string | null;
          source: Database["public"]["Enums"]["appointment_source"];
          status?: Database["public"]["Enums"]["appointment_status"];
          reason_category: Database["public"]["Enums"]["reason_category"];
          patient_note?: string | null;
          preferred_window?: Json | null;
          preferred_locality?: string | null;
          scheduled_for?: string | null;
          cancelled_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_code?: string;
          patient_id?: string;
          dentist_id?: string | null;
          slot_id?: string | null;
          source?: Database["public"]["Enums"]["appointment_source"];
          status?: Database["public"]["Enums"]["appointment_status"];
          reason_category?: Database["public"]["Enums"]["reason_category"];
          patient_note?: string | null;
          preferred_window?: Json | null;
          preferred_locality?: string | null;
          scheduled_for?: string | null;
          cancelled_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_dentist_id_fkey";
            columns: ["dentist_id"];
            isOneToOne: false;
            referencedRelation: "dentists";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "appointments_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "availability_slots";
            referencedColumns: ["id"];
          },
        ];
      };
      clinical_notes: {
        Row: {
          appointment_id: string;
          note: string;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          appointment_id: string;
          note: string;
          author_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          appointment_id?: string;
          note?: string;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_notes_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: true;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_events: {
        Row: {
          id: string;
          appointment_id: string;
          from_status: Database["public"]["Enums"]["appointment_status"] | null;
          to_status: Database["public"]["Enums"]["appointment_status"];
          actor_id: string | null;
          actor_role: Database["public"]["Enums"]["user_role"] | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          from_status?: Database["public"]["Enums"]["appointment_status"] | null;
          to_status: Database["public"]["Enums"]["appointment_status"];
          actor_id?: string | null;
          actor_role?: Database["public"]["Enums"]["user_role"] | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          from_status?: Database["public"]["Enums"]["appointment_status"] | null;
          to_status?: Database["public"]["Enums"]["appointment_status"];
          actor_id?: string | null;
          actor_role?: Database["public"]["Enums"]["user_role"] | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_events_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_submissions: {
        Row: {
          id: string;
          reference_code: string;
          type: Database["public"]["Enums"]["submission_type"];
          name: string;
          email: string | null;
          phone: string | null;
          organization_name: string | null;
          dci_registration_no: string | null;
          partnership_type: Database["public"]["Enums"]["partnership_type"] | null;
          clinic_area: string | null;
          availability: string | null;
          message: string;
          status: Database["public"]["Enums"]["submission_status"];
          assigned_to: string | null;
          admin_notes: string | null;
          converted_to_profile_id: string | null;
          source_page: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_code?: string;
          type: Database["public"]["Enums"]["submission_type"];
          name: string;
          email?: string | null;
          phone?: string | null;
          organization_name?: string | null;
          dci_registration_no?: string | null;
          partnership_type?: Database["public"]["Enums"]["partnership_type"] | null;
          clinic_area?: string | null;
          availability?: string | null;
          message: string;
          status?: Database["public"]["Enums"]["submission_status"];
          assigned_to?: string | null;
          admin_notes?: string | null;
          converted_to_profile_id?: string | null;
          source_page?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_code?: string;
          type?: Database["public"]["Enums"]["submission_type"];
          name?: string;
          email?: string | null;
          phone?: string | null;
          organization_name?: string | null;
          dci_registration_no?: string | null;
          partnership_type?: Database["public"]["Enums"]["partnership_type"] | null;
          clinic_area?: string | null;
          availability?: string | null;
          message?: string;
          status?: Database["public"]["Enums"]["submission_status"];
          assigned_to?: string | null;
          admin_notes?: string | null;
          converted_to_profile_id?: string | null;
          source_page?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_submissions_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_submissions_converted_to_profile_id_fkey";
            columns: ["converted_to_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body_md: string;
          cover_path: string | null;
          category: string;
          status: Database["public"]["Enums"]["article_status"];
          published_at: string | null;
          author_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          body_md: string;
          cover_path?: string | null;
          category?: string;
          status?: Database["public"]["Enums"]["article_status"];
          published_at?: string | null;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          body_md?: string;
          cover_path?: string | null;
          category?: string;
          status?: Database["public"]["Enums"]["article_status"];
          published_at?: string | null;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      consents: {
        Row: {
          id: string;
          subject_type: string;
          subject_id: string;
          purpose: Database["public"]["Enums"]["consent_purpose"];
          notice_version: string;
          granted_at: string;
          withdrawn_at: string | null;
          method: string;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          subject_type: string;
          subject_id: string;
          purpose: Database["public"]["Enums"]["consent_purpose"];
          notice_version: string;
          granted_at?: string;
          withdrawn_at?: string | null;
          method?: string;
          ip_hash?: string | null;
        };
        Update: {
          id?: string;
          subject_type?: string;
          subject_id?: string;
          purpose?: Database["public"]["Enums"]["consent_purpose"];
          notice_version?: string;
          granted_at?: string;
          withdrawn_at?: string | null;
          method?: string;
          ip_hash?: string | null;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          metadata: Json | null;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_hash?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limits: {
        Row: {
          key: string;
          window_at: string;
          count: number;
        };
        Insert: {
          key: string;
          window_at: string;
          count?: number;
        };
        Update: {
          key?: string;
          window_at?: string;
          count?: number;
        };
        Relationships: [];
      };
      appointment_reminders: {
        Row: {
          appointment_id: string;
          kind: string;
          scheduled_for: string;
          status: "pending" | "claimed" | "sending" | "sent" | "failed" | "uncertain";
          attempts: number;
          claim_token: string | null;
          claimed_at: string | null;
          claim_expires_at: string | null;
          sending_expires_at: string | null;
          sent_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          appointment_id: string;
          kind: string;
          scheduled_for: string;
          status?: "pending" | "claimed" | "sending" | "sent" | "failed" | "uncertain";
          attempts?: number;
          claim_token?: string | null;
          claimed_at?: string | null;
          claim_expires_at?: string | null;
          sending_expires_at?: string | null;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          appointment_id?: string;
          kind?: string;
          scheduled_for?: string;
          status?: "pending" | "claimed" | "sending" | "sent" | "failed" | "uncertain";
          attempts?: number;
          claim_token?: string | null;
          claimed_at?: string | null;
          claim_expires_at?: string | null;
          sending_expires_at?: string | null;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_dentists: {
        Row: {
          slug: string | null;
          display_name: string | null;
          locality: string | null;
          city: string | null;
          specialties: string[] | null;
          languages: string[] | null;
          bio: string | null;
          photo_path: string | null;
        };
        Relationships: [];
      };
      public_slots: {
        Row: {
          id: string | null;
          dentist_id: string | null;
          dentist_slug: string | null;
          starts_at: string | null;
          ends_at: string | null;
          location_type: Database["public"]["Enums"]["location_type"] | null;
          camp_name: string | null;
          remaining: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "availability_slots_dentist_id_fkey";
            columns: ["dentist_id"];
            isOneToOne: false;
            referencedRelation: "dentists";
            referencedColumns: ["profile_id"];
          },
        ];
      };
    };
    Functions: {
      gen_appointment_ref: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      gen_submission_ref: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_dentist: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      record_signin_attempt: {
        Args: { p_ip: string };
        Returns: boolean;
      };
      hold_slot: {
        Args: { p_slot_id: string; p_hold_owner?: string | null };
        Returns: Tables<"availability_slots">;
      };
      release_slot_hold: {
        Args: { p_slot_id: string; p_hold_owner?: string | null };
        Returns: boolean;
      };
      create_booking_request: {
        Args: {
          p_email: string;
          p_full_name: string;
          p_phone: string;
          p_age_band: Enums<"age_band">;
          p_reason_category: Enums<"reason_category">;
          p_patient_note?: string | null;
          p_preferred_locality?: string | null;
          p_preferred_window?: Json | null;
          p_consent_updates?: boolean | null;
          p_actor_id?: string | null;
        };
        Returns: Tables<"appointments">;
      };
      admin_appointment_action: {
        Args: {
          p_appointment_id: string;
          p_to: Enums<"appointment_status">;
          p_reason: string;
          p_new_dentist_id?: string | null;
          p_new_slot_id?: string | null;
          p_new_scheduled_for?: string | null;
        };
        Returns: Tables<"appointments">;
      };
      submit_contact: {
        Args: {
          p_type: Enums<"submission_type">;
          p_name: string;
          p_phone: string | null;
          p_email: string | null;
          p_organization_name: string | null;
          p_dci_registration_no: string | null;
          p_clinic_area: string | null;
          p_availability: string | null;
          p_partnership_type: Enums<"partnership_type"> | null;
          p_message: string;
          p_source_page?: string | null;
          p_ip_hash?: string | null;
        };
        Returns: Tables<"contact_submissions">;
      };
      confirm_booking: {
        Args: {
          p_slot_id: string;
          p_email: string;
          p_full_name: string;
          p_phone: string;
          p_age_band: Enums<"age_band">;
          p_locality: string;
          p_pincode?: string | null;
          p_reason_category: Enums<"reason_category">;
          p_patient_note?: string | null;
          p_consent_updates?: boolean | null;
          p_reschedule_appointment_id?: string | null;
          p_actor_id?: string | null;
          p_hold_owner?: string | null;
        };
        Returns: Tables<"appointments">;
      };
      transition_appointment: {
        Args: {
          p_appointment_id: string;
          p_to: Enums<"appointment_status">;
          p_reason?: string | null;
        };
        Returns: Tables<"appointments">;
      };
      withdraw_booking_consent: {
        Args: { p_purpose: Enums<"consent_purpose"> };
        Returns: undefined;
      };
      lookup_appointment: {
        Args: { p_ref: string; p_phone: string };
        Returns: Json;
      };
      get_slot_details: {
        Args: { p_slot_id: string };
        Returns: Json;
      };
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      touch_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      block_availability_day: {
        Args: { p_dentist_id: string; p_date: string };
        Returns: number;
      };
      update_patient_profile: {
        Args: {
          p_full_name: string;
          p_phone: string;
          p_locality: string;
          p_age_band: Enums<"age_band">;
        };
        Returns: undefined;
      };
      claim_appointment_reminder: {
        Args: {
          p_appointment_id: string;
          p_kind: string;
          p_due_start: string;
          p_due_end: string;
        };
        Returns: Json;
      };
      begin_appointment_reminder_send: {
        Args: {
          p_appointment_id: string;
          p_kind: string;
          p_scheduled_for: string;
          p_claim_token: string;
        };
        Returns: Json;
      };
      complete_appointment_reminder: {
        Args: {
          p_appointment_id: string;
          p_kind: string;
          p_scheduled_for: string;
          p_claim_token: string;
          p_sent: boolean;
          p_error?: string | null;
          p_retryable?: boolean;
        };
        Returns: undefined;
      };
    };
    Enums: {
      age_band: "under_12" | "12_17" | "18_39" | "40_59" | "60_plus";
      appointment_source: "self_booked" | "patient_request" | "admin_created";
      appointment_status:
        | "requested"
        | "assigned"
        | "confirmed"
        | "completed"
        | "no_show"
        | "cancelled_by_patient"
        | "cancelled_by_dentist"
        | "cancelled_by_admin";
      article_status: "draft" | "published";
      consent_purpose: "booking" | "contact" | "reminders" | "awareness_updates";
      dentist_status: "pending" | "active" | "paused" | "rejected";
      location_type: "clinic" | "camp";
      partnership_type: "funding" | "venue" | "camp_host" | "supplies" | "other";
      reason_category: "pain" | "bleeding_gums" | "cleaning" | "checkup" | "child" | "other";
      slot_status: "open" | "held" | "booked" | "blocked";
      submission_status: "new" | "in_review" | "contacted" | "resolved" | "spam";
      submission_type: "patient" | "dentist" | "organization";
      user_role: "patient" | "dentist" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
