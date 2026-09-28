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
      access_reviews: {
        Row: {
          account_ref: string
          evidence_source: string
          id: string
          next_review_at: string
          notes: string | null
          review_period: string
          review_status: string
          reviewed_at: string
          reviewed_by_domain: string
          role_name: string
          system_name: string
        }
        Insert: {
          account_ref: string
          evidence_source: string
          id?: string
          next_review_at: string
          notes?: string | null
          review_period: string
          review_status: string
          reviewed_at: string
          reviewed_by_domain: string
          role_name: string
          system_name: string
        }
        Update: {
          account_ref?: string
          evidence_source?: string
          id?: string
          next_review_at?: string
          notes?: string | null
          review_period?: string
          review_status?: string
          reviewed_at?: string
          reviewed_by_domain?: string
          role_name?: string
          system_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_reviews_reviewed_by_domain_fkey"
            columns: ["reviewed_by_domain"]
            isOneToOne: false
            referencedRelation: "governance_domain_owners"
            referencedColumns: ["domain"]
          },
        ]
      }
      app_schema_releases: {
        Row: {
          applied_at: string
          checksum: string | null
          git_sha: string | null
          migration_name: string
          notes: string | null
          version: string
        }
        Insert: {
          applied_at?: string
          checksum?: string | null
          git_sha?: string | null
          migration_name: string
          notes?: string | null
          version: string
        }
        Update: {
          applied_at?: string
          checksum?: string | null
          git_sha?: string | null
          migration_name?: string
          notes?: string | null
          version?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          http_status: number | null
          id: number
          job_name: string
          metadata: Json
          request_id: number | null
          started_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          http_status?: number | null
          id?: never
          job_name: string
          metadata?: Json
          request_id?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          http_status?: number | null
          id?: never
          job_name?: string
          metadata?: Json
          request_id?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      elo_audit_runs: {
        Row: {
          generated_at: string
          id: string
          issues: Json
          model_version: string
          status: string
          summary: Json
        }
        Insert: {
          generated_at?: string
          id?: string
          issues?: Json
          model_version: string
          status: string
          summary: Json
        }
        Update: {
          generated_at?: string
          id?: string
          issues?: Json
          model_version?: string
          status?: string
          summary?: Json
        }
        Relationships: []
      }
      elo_cross_competitions: {
        Row: {
          active: boolean
          competition_id: number
          competition_name: string
          last_sync_error: string | null
          last_sync_status: string | null
          last_synced_at: string | null
          region: string
        }
        Insert: {
          active?: boolean
          competition_id: number
          competition_name: string
          last_sync_error?: string | null
          last_sync_status?: string | null
          last_synced_at?: string | null
          region: string
        }
        Update: {
          active?: boolean
          competition_id?: number
          competition_name?: string
          last_sync_error?: string | null
          last_sync_status?: string | null
          last_synced_at?: string | null
          region?: string
        }
        Relationships: []
      }
      elo_cross_fixtures: {
        Row: {
          away_goals: number
          away_team_id: number
          away_team_name: string
          competition_id: number
          competition_name: string
          fetched_at: string
          fixture_id: number
          home_goals: number
          home_team_id: number
          home_team_name: string
          kickoff_at: string
          region: string
          updated_at: string
        }
        Insert: {
          away_goals: number
          away_team_id: number
          away_team_name: string
          competition_id: number
          competition_name: string
          fetched_at?: string
          fixture_id: number
          home_goals: number
          home_team_id: number
          home_team_name: string
          kickoff_at: string
          region: string
          updated_at?: string
        }
        Update: {
          away_goals?: number
          away_team_id?: number
          away_team_name?: string
          competition_id?: number
          competition_name?: string
          fetched_at?: string
          fixture_id?: number
          home_goals?: number
          home_team_id?: number
          home_team_name?: string
          kickoff_at?: string
          region?: string
          updated_at?: string
        }
        Relationships: []
      }
      elo_fixture_history: {
        Row: {
          actual_home_score: number
          away_goals: number
          away_rating_after: number
          away_rating_before: number
          away_team_id: number
          away_team_name: string
          created_at: string
          elo_delta: number
          expected_home_score: number
          fixture_id: number
          home_advantage_points: number
          home_goals: number
          home_rating_after: number
          home_rating_before: number
          home_team_id: number
          home_team_name: string
          kickoff_at: string
          league_id: number
          league_key: string
          league_name: string
          model_version: string
        }
        Insert: {
          actual_home_score: number
          away_goals: number
          away_rating_after: number
          away_rating_before: number
          away_team_id: number
          away_team_name: string
          created_at?: string
          elo_delta: number
          expected_home_score: number
          fixture_id: number
          home_advantage_points: number
          home_goals: number
          home_rating_after: number
          home_rating_before: number
          home_team_id: number
          home_team_name: string
          kickoff_at: string
          league_id: number
          league_key: string
          league_name: string
          model_version: string
        }
        Update: {
          actual_home_score?: number
          away_goals?: number
          away_rating_after?: number
          away_rating_before?: number
          away_team_id?: number
          away_team_name?: string
          created_at?: string
          elo_delta?: number
          expected_home_score?: number
          fixture_id?: number
          home_advantage_points?: number
          home_goals?: number
          home_rating_after?: number
          home_rating_before?: number
          home_team_id?: number
          home_team_name?: string
          kickoff_at?: string
          league_id?: number
          league_key?: string
          league_name?: string
          model_version?: string
        }
        Relationships: []
      }
      elo_fixtures: {
        Row: {
          away_goals: number
          away_team_id: number
          away_team_name: string
          country_code: string | null
          fetched_at: string
          fixture_id: number
          home_goals: number
          home_team_id: number
          home_team_name: string
          kickoff_at: string
          league_id: number
          league_key: string
          league_name: string
          source: string
          updated_at: string
        }
        Insert: {
          away_goals: number
          away_team_id: number
          away_team_name: string
          country_code?: string | null
          fetched_at?: string
          fixture_id: number
          home_goals: number
          home_team_id: number
          home_team_name: string
          kickoff_at: string
          league_id: number
          league_key: string
          league_name: string
          source?: string
          updated_at?: string
        }
        Update: {
          away_goals?: number
          away_team_id?: number
          away_team_name?: string
          country_code?: string | null
          fetched_at?: string
          fixture_id?: number
          home_goals?: number
          home_team_id?: number
          home_team_name?: string
          kickoff_at?: string
          league_id?: number
          league_key?: string
          league_name?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      elo_league_fixture_history: {
        Row: {
          actual_home_score: number
          away_global_rating_before: number
          away_league_id: number
          away_league_key: string
          away_league_rating_after: number
          away_league_rating_before: number
          away_local_rating: number
          away_team_id: number
          competition_id: number
          competition_name: string
          created_at: string
          expected_home_score: number
          fixture_id: number
          home_global_rating_before: number
          home_league_id: number
          home_league_key: string
          home_league_rating_after: number
          home_league_rating_before: number
          home_local_rating: number
          home_team_id: number
          kickoff_at: string
          league_delta: number
          model_version: string
        }
        Insert: {
          actual_home_score: number
          away_global_rating_before: number
          away_league_id: number
          away_league_key: string
          away_league_rating_after: number
          away_league_rating_before: number
          away_local_rating: number
          away_team_id: number
          competition_id: number
          competition_name: string
          created_at?: string
          expected_home_score: number
          fixture_id: number
          home_global_rating_before: number
          home_league_id: number
          home_league_key: string
          home_league_rating_after: number
          home_league_rating_before: number
          home_local_rating: number
          home_team_id: number
          kickoff_at: string
          league_delta: number
          model_version: string
        }
        Update: {
          actual_home_score?: number
          away_global_rating_before?: number
          away_league_id?: number
          away_league_key?: string
          away_league_rating_after?: number
          away_league_rating_before?: number
          away_local_rating?: number
          away_team_id?: number
          competition_id?: number
          competition_name?: string
          created_at?: string
          expected_home_score?: number
          fixture_id?: number
          home_global_rating_before?: number
          home_league_id?: number
          home_league_key?: string
          home_league_rating_after?: number
          home_league_rating_before?: number
          home_local_rating?: number
          home_team_id?: number
          kickoff_at?: string
          league_delta?: number
          model_version?: string
        }
        Relationships: []
      }
      elo_league_ratings: {
        Row: {
          country_code: string
          division_level: number
          evidence_adjustment: number
          evidence_matches: number
          focus_role: string
          hierarchy_constrained: boolean
          league_id: number
          league_key: string
          league_name: string
          model_version: string
          prior_rating: number
          rating: number
          region: string
          updated_at: string
        }
        Insert: {
          country_code: string
          division_level: number
          evidence_adjustment?: number
          evidence_matches?: number
          focus_role: string
          hierarchy_constrained?: boolean
          league_id: number
          league_key: string
          league_name: string
          model_version: string
          prior_rating: number
          rating: number
          region: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          division_level?: number
          evidence_adjustment?: number
          evidence_matches?: number
          focus_role?: string
          hierarchy_constrained?: boolean
          league_id?: number
          league_key?: string
          league_name?: string
          model_version?: string
          prior_rating?: number
          rating?: number
          region?: string
          updated_at?: string
        }
        Relationships: []
      }
      elo_seed_rebuild_queue: {
        Row: {
          league_id: number
          pass1_done: boolean
          pass2_done: boolean
          updated_at: string
        }
        Insert: {
          league_id: number
          pass1_done?: boolean
          pass2_done?: boolean
          updated_at?: string
        }
        Update: {
          league_id?: number
          pass1_done?: boolean
          pass2_done?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      elo_sync_state: {
        Row: {
          api_requests: number
          details: Json
          error_message: string | null
          fixtures_fetched: number
          id: string
          last_completed_at: string | null
          last_started_at: string | null
          last_status: string
          leagues_processed: number
          model_version: string
          source: string
          updated_at: string
        }
        Insert: {
          api_requests?: number
          details?: Json
          error_message?: string | null
          fixtures_fetched?: number
          id?: string
          last_completed_at?: string | null
          last_started_at?: string | null
          last_status?: string
          leagues_processed?: number
          model_version: string
          source?: string
          updated_at?: string
        }
        Update: {
          api_requests?: number
          details?: Json
          error_message?: string | null
          fixtures_fetched?: number
          id?: string
          last_completed_at?: string | null
          last_started_at?: string | null
          last_status?: string
          leagues_processed?: number
          model_version?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      elo_target_leagues: {
        Row: {
          active: boolean
          country_code: string
          created_at: string
          division_level: number
          focus_role: string
          last_sync_error: string | null
          last_sync_status: string | null
          last_synced_at: string | null
          league_id: number
          league_key: string
          league_name: string
          parent_league_key: string | null
          prior_rating: number
          region: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          country_code: string
          created_at?: string
          division_level?: number
          focus_role: string
          last_sync_error?: string | null
          last_sync_status?: string | null
          last_synced_at?: string | null
          league_id: number
          league_key: string
          league_name: string
          parent_league_key?: string | null
          prior_rating: number
          region: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          country_code?: string
          created_at?: string
          division_level?: number
          focus_role?: string
          last_sync_error?: string | null
          last_sync_status?: string | null
          last_synced_at?: string | null
          league_id?: number
          league_key?: string
          league_name?: string
          parent_league_key?: string | null
          prior_rating?: number
          region?: string
          updated_at?: string
        }
        Relationships: []
      }
      elo_team_ratings: {
        Row: {
          first_fixture_at: string | null
          last_fixture_at: string | null
          league_id: number
          league_key: string
          league_name: string
          matches_processed: number
          model_version: string
          rating: number
          team_id: number
          team_name: string
          updated_at: string
        }
        Insert: {
          first_fixture_at?: string | null
          last_fixture_at?: string | null
          league_id: number
          league_key: string
          league_name: string
          matches_processed?: number
          model_version: string
          rating: number
          team_id: number
          team_name: string
          updated_at?: string
        }
        Update: {
          first_fixture_at?: string | null
          last_fixture_at?: string | null
          league_id?: number
          league_key?: string
          league_name?: string
          matches_processed?: number
          model_version?: string
          rating?: number
          team_id?: number
          team_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      external_api_cache: {
        Row: {
          cache_key: string
          expires_at: string
          fetched_at: string
          http_status: number | null
          payload: Json
          provider: string
        }
        Insert: {
          cache_key: string
          expires_at: string
          fetched_at: string
          http_status?: number | null
          payload: Json
          provider: string
        }
        Update: {
          cache_key?: string
          expires_at?: string
          fetched_at?: string
          http_status?: number | null
          payload?: Json
          provider?: string
        }
        Relationships: []
      }
      external_api_capabilities: {
        Row: {
          capability_key: string
          enabled: boolean
          metadata: Json
          minimum_plan: string
          provider: string
          reason: string
          reviewed_at: string
        }
        Insert: {
          capability_key: string
          enabled: boolean
          metadata?: Json
          minimum_plan: string
          provider: string
          reason: string
          reviewed_at?: string
        }
        Update: {
          capability_key?: string
          enabled?: boolean
          metadata?: Json
          minimum_plan?: string
          provider?: string
          reason?: string
          reviewed_at?: string
        }
        Relationships: []
      }
      external_api_rate_limit_state: {
        Row: {
          bucket: string
          request_count: number
          updated_at: string
          window_started_at: string
        }
        Insert: {
          bucket: string
          request_count?: number
          updated_at?: string
          window_started_at: string
        }
        Update: {
          bucket?: string
          request_count?: number
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      external_api_rate_state: {
        Row: {
          blocked_until: string | null
          provider: string
          updated_at: string
          used_count: number
          window_started_at: string
        }
        Insert: {
          blocked_until?: string | null
          provider: string
          updated_at?: string
          used_count?: number
          window_started_at?: string
        }
        Update: {
          blocked_until?: string | null
          provider?: string
          updated_at?: string
          used_count?: number
          window_started_at?: string
        }
        Relationships: []
      }
      external_api_status_snapshots: {
        Row: {
          checked_at: string
          payload: Json
          plan: string | null
          provider: string
          reported_limit: number | null
        }
        Insert: {
          checked_at?: string
          payload?: Json
          plan?: string | null
          provider: string
          reported_limit?: number | null
        }
        Update: {
          checked_at?: string
          payload?: Json
          plan?: string | null
          provider?: string
          reported_limit?: number | null
        }
        Relationships: []
      }
      governance_change_log: {
        Row: {
          actor_db_role: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          changed_at: string
          context: Json
          id: number
          operation: string
          record_key: string | null
          table_name: string
        }
        Insert: {
          actor_db_role: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string
          context?: Json
          id?: never
          operation: string
          record_key?: string | null
          table_name: string
        }
        Update: {
          actor_db_role?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string
          context?: Json
          id?: never
          operation?: string
          record_key?: string | null
          table_name?: string
        }
        Relationships: []
      }
      governance_domain_owners: {
        Row: {
          approval_policy: string
          data_owner: string
          domain: string
          review_cadence_days: number
          technical_owner: string
          updated_at: string
        }
        Insert: {
          approval_policy: string
          data_owner: string
          domain: string
          review_cadence_days: number
          technical_owner: string
          updated_at?: string
        }
        Update: {
          approval_policy?: string
          data_owner?: string
          domain?: string
          review_cadence_days?: number
          technical_owner?: string
          updated_at?: string
        }
        Relationships: []
      }
      metric_definitions: {
        Row: {
          data_owner_domain: string
          definition_version: string
          display_name: string
          effective_from: string
          formula: string
          metric_key: string
          notes: string | null
          population: string
          status: string
          unit: string
        }
        Insert: {
          data_owner_domain: string
          definition_version: string
          display_name: string
          effective_from: string
          formula: string
          metric_key: string
          notes?: string | null
          population: string
          status: string
          unit: string
        }
        Update: {
          data_owner_domain?: string
          definition_version?: string
          display_name?: string
          effective_from?: string
          formula?: string
          metric_key?: string
          notes?: string | null
          population?: string
          status?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_definitions_data_owner_domain_fkey"
            columns: ["data_owner_domain"]
            isOneToOne: false
            referencedRelation: "governance_domain_owners"
            referencedColumns: ["domain"]
          },
        ]
      }
      performance_vitals: {
        Row: {
          created_at: string
          id: number
          metric: string
          rating: string
          route: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: number
          metric: string
          rating: string
          route: string
          value: number
        }
        Update: {
          created_at?: string
          id?: number
          metric?: string
          rating?: string
          route?: string
          value?: number
        }
        Relationships: []
      }
      privacy_processing_activities: {
        Row: {
          active: boolean
          activity_key: string
          data_categories: string[]
          deletion_method: string
          lawful_basis: string
          purpose: string
          recipients: string[]
          retention_rule: string
          reviewed_at: string
          storage_locations: string[]
        }
        Insert: {
          active?: boolean
          activity_key: string
          data_categories: string[]
          deletion_method: string
          lawful_basis: string
          purpose: string
          recipients?: string[]
          retention_rule: string
          reviewed_at?: string
          storage_locations: string[]
        }
        Update: {
          active?: boolean
          activity_key?: string
          data_categories?: string[]
          deletion_method?: string
          lawful_basis?: string
          purpose?: string
          recipients?: string[]
          retention_rule?: string
          reviewed_at?: string
          storage_locations?: string[]
        }
        Relationships: []
      }
      privacy_retention_policies: {
        Row: {
          active: boolean
          deletion_action: string
          policy_key: string
          retention_basis: string
          retention_days: number | null
          reviewed_at: string
          target_scope: string
        }
        Insert: {
          active?: boolean
          deletion_action: string
          policy_key: string
          retention_basis: string
          retention_days?: number | null
          reviewed_at?: string
          target_scope: string
        }
        Update: {
          active?: boolean
          deletion_action?: string
          policy_key?: string
          retention_basis?: string
          retention_days?: number | null
          reviewed_at?: string
          target_scope?: string
        }
        Relationships: []
      }
      push_delivery_outbox: {
        Row: {
          attempts: number
          created_at: string
          delivery_state: Json
          event_key: string
          event_type: string
          id: string
          last_error: string | null
          lock_token: string | null
          locked_at: string | null
          next_attempt_at: string
          payload: Json
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivery_state?: Json
          event_key: string
          event_type: string
          id?: string
          last_error?: string | null
          lock_token?: string | null
          locked_at?: string | null
          next_attempt_at?: string
          payload?: Json
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivery_state?: Json
          event_key?: string
          event_type?: string
          id?: string
          last_error?: string | null
          lock_token?: string | null
          locked_at?: string | null
          next_attempt_at?: string
          payload?: Json
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      source_definitions: {
        Row: {
          configured: boolean
          created_at: string
          data_owner_domain: string
          data_steward: string
          definition_version: string
          governance_status: string
          id: string
          license_or_terms: string | null
          metric_definitions: Json
          next_review_at: string
          notes: string | null
          provider: string | null
          quality_tier: string | null
          reviewed_at: string
          sla_expectation: string | null
          source: string
        }
        Insert: {
          configured?: boolean
          created_at?: string
          data_owner_domain: string
          data_steward: string
          definition_version: string
          governance_status: string
          id?: string
          license_or_terms?: string | null
          metric_definitions?: Json
          next_review_at: string
          notes?: string | null
          provider?: string | null
          quality_tier?: string | null
          reviewed_at: string
          sla_expectation?: string | null
          source: string
        }
        Update: {
          configured?: boolean
          created_at?: string
          data_owner_domain?: string
          data_steward?: string
          definition_version?: string
          governance_status?: string
          id?: string
          license_or_terms?: string | null
          metric_definitions?: Json
          next_review_at?: string
          notes?: string | null
          provider?: string | null
          quality_tier?: string | null
          reviewed_at?: string
          sla_expectation?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_definitions_data_owner_domain_fkey"
            columns: ["data_owner_domain"]
            isOneToOne: false
            referencedRelation: "governance_domain_owners"
            referencedColumns: ["domain"]
          },
        ]
      }
      sports_briefing_items: {
        Row: {
          body: string | null
          briefing_id: string
          created_at: string
          facts: Json
          fixture_id: string | null
          id: string
          item_kind: string
          priority: number
          provenance: Json
          title: string
        }
        Insert: {
          body?: string | null
          briefing_id: string
          created_at?: string
          facts?: Json
          fixture_id?: string | null
          id?: string
          item_kind: string
          priority?: number
          provenance?: Json
          title: string
        }
        Update: {
          body?: string | null
          briefing_id?: string
          created_at?: string
          facts?: Json
          fixture_id?: string | null
          id?: string
          item_kind?: string
          priority?: number
          provenance?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_briefing_items_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "sports_daily_briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_briefing_items_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_broadcast_evidence: {
        Row: {
          broadcaster: string
          checked_at: string
          confidence: number
          created_at: string
          fixture_id: string
          id: string
          is_primary: boolean
          metadata: Json
          platform: string | null
          source_kind: string
          source_name: string
          source_url: string | null
        }
        Insert: {
          broadcaster: string
          checked_at: string
          confidence: number
          created_at?: string
          fixture_id: string
          id?: string
          is_primary?: boolean
          metadata?: Json
          platform?: string | null
          source_kind: string
          source_name: string
          source_url?: string | null
        }
        Update: {
          broadcaster?: string
          checked_at?: string
          confidence?: number
          created_at?: string
          fixture_id?: string
          id?: string
          is_primary?: boolean
          metadata?: Json
          platform?: string | null
          source_kind?: string
          source_name?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_broadcast_evidence_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_competitions: {
        Row: {
          active: boolean
          api_football_league_id: number | null
          canonical_key: string
          competition_kind: string
          country_code: string | null
          created_at: string
          division_level: number | null
          five_dollar_league_id: number | null
          id: string
          metadata: Json
          name: string
          region: string | null
          season: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          api_football_league_id?: number | null
          canonical_key: string
          competition_kind: string
          country_code?: string | null
          created_at?: string
          division_level?: number | null
          five_dollar_league_id?: number | null
          id?: string
          metadata?: Json
          name: string
          region?: string | null
          season?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          api_football_league_id?: number | null
          canonical_key?: string
          competition_kind?: string
          country_code?: string | null
          created_at?: string
          division_level?: number | null
          five_dollar_league_id?: number | null
          id?: string
          metadata?: Json
          name?: string
          region?: string | null
          season?: string
          updated_at?: string
        }
        Relationships: []
      }
      sports_daily_briefings: {
        Row: {
          briefing_date: string
          created_at: string
          editorial_payload: Json
          facts_through: string | null
          football_summary: string | null
          generated_at: string | null
          id: string
          metadata: Json
          other_sports_summary: string | null
          status: string
          updated_at: string
        }
        Insert: {
          briefing_date: string
          created_at?: string
          editorial_payload?: Json
          facts_through?: string | null
          football_summary?: string | null
          generated_at?: string | null
          id?: string
          metadata?: Json
          other_sports_summary?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          briefing_date?: string
          created_at?: string
          editorial_payload?: Json
          facts_through?: string | null
          football_summary?: string | null
          generated_at?: string | null
          id?: string
          metadata?: Json
          other_sports_summary?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sports_editorial_source_evidence: {
        Row: {
          body: string | null
          briefing_date: string
          confidence: number
          created_at: string
          evidence_type: string
          fetched_at: string
          fixture_id: string | null
          id: string
          metadata: Json
          payload: Json
          published_at: string | null
          source_event_id: string | null
          source_kind: string
          source_name: string
          source_url: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          briefing_date: string
          confidence: number
          created_at?: string
          evidence_type: string
          fetched_at: string
          fixture_id?: string | null
          id?: string
          metadata?: Json
          payload?: Json
          published_at?: string | null
          source_event_id?: string | null
          source_kind: string
          source_name: string
          source_url: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          briefing_date?: string
          confidence?: number
          created_at?: string
          evidence_type?: string
          fetched_at?: string
          fixture_id?: string | null
          id?: string
          metadata?: Json
          payload?: Json
          published_at?: string | null
          source_event_id?: string | null
          source_kind?: string
          source_name?: string
          source_url?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_editorial_source_evidence_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_fixture_events: {
        Row: {
          added_minute: number | null
          detail: string | null
          event_type: string
          external_event_id: string | null
          fetched_at: string
          fixture_id: string
          id: string
          metadata: Json
          minute: number | null
          player_external_id: string | null
          player_name: string | null
          provider: string
          team_id: string | null
        }
        Insert: {
          added_minute?: number | null
          detail?: string | null
          event_type: string
          external_event_id?: string | null
          fetched_at?: string
          fixture_id: string
          id?: string
          metadata?: Json
          minute?: number | null
          player_external_id?: string | null
          player_name?: string | null
          provider: string
          team_id?: string | null
        }
        Update: {
          added_minute?: number | null
          detail?: string | null
          event_type?: string
          external_event_id?: string | null
          fetched_at?: string
          fixture_id?: string
          id?: string
          metadata?: Json
          minute?: number | null
          player_external_id?: string | null
          player_name?: string | null
          provider?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_fixture_events_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixture_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_fixture_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_fixture_lineups: {
        Row: {
          fetched_at: string
          fixture_id: string
          formation: string | null
          grid_position: string | null
          is_starting: boolean
          is_substitute: boolean
          jersey_number: number | null
          metadata: Json
          player_id: string
          position: string | null
          provider: string
          team_id: string
        }
        Insert: {
          fetched_at?: string
          fixture_id: string
          formation?: string | null
          grid_position?: string | null
          is_starting?: boolean
          is_substitute?: boolean
          jersey_number?: number | null
          metadata?: Json
          player_id: string
          position?: string | null
          provider: string
          team_id: string
        }
        Update: {
          fetched_at?: string
          fixture_id?: string
          formation?: string | null
          grid_position?: string | null
          is_starting?: boolean
          is_substitute?: boolean
          jersey_number?: number | null
          metadata?: Json
          player_id?: string
          position?: string | null
          provider?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_fixture_lineups_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixture_lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sports_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixture_lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_fixture_lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_fixture_player_stats: {
        Row: {
          fetched_at: string
          fixture_id: string
          minutes: number | null
          participation_state: string
          player_id: string
          provider: string
          provider_rating: number | null
          stats: Json
          team_id: string
        }
        Insert: {
          fetched_at?: string
          fixture_id: string
          minutes?: number | null
          participation_state?: string
          player_id: string
          provider: string
          provider_rating?: number | null
          stats?: Json
          team_id: string
        }
        Update: {
          fetched_at?: string
          fixture_id?: string
          minutes?: number | null
          participation_state?: string
          player_id?: string
          provider?: string
          provider_rating?: number | null
          stats?: Json
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_fixture_player_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixture_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sports_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixture_player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_fixture_player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_fixture_team_stats: {
        Row: {
          fetched_at: string
          fixture_id: string
          metadata: Json
          observed_at: string | null
          provider: string
          raw_hash: string | null
          stat_key: string
          stat_text: string | null
          stat_value: number | null
          team_id: string
          unit: string | null
        }
        Insert: {
          fetched_at?: string
          fixture_id: string
          metadata?: Json
          observed_at?: string | null
          provider: string
          raw_hash?: string | null
          stat_key: string
          stat_text?: string | null
          stat_value?: number | null
          team_id: string
          unit?: string | null
        }
        Update: {
          fetched_at?: string
          fixture_id?: string
          metadata?: Json
          observed_at?: string | null
          provider?: string
          raw_hash?: string | null
          stat_key?: string
          stat_text?: string | null
          stat_value?: number | null
          team_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_fixture_team_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixture_team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_fixture_team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_fixtures: {
        Row: {
          api_football_fixture_id: number | null
          away_goals: number | null
          away_team_id: string
          canonical_key: string
          competition_id: string
          created_at: string
          finished_at: string | null
          five_dollar_fixture_id: number | null
          home_goals: number | null
          home_team_id: string
          id: string
          kickoff_at: string
          metadata: Json
          primary_fixture_id: string
          primary_provider: string
          season: string
          source_fetched_at: string | null
          source_payload_hash: string | null
          status: string
          updated_at: string
        }
        Insert: {
          api_football_fixture_id?: number | null
          away_goals?: number | null
          away_team_id: string
          canonical_key: string
          competition_id: string
          created_at?: string
          finished_at?: string | null
          five_dollar_fixture_id?: number | null
          home_goals?: number | null
          home_team_id: string
          id?: string
          kickoff_at: string
          metadata?: Json
          primary_fixture_id: string
          primary_provider: string
          season?: string
          source_fetched_at?: string | null
          source_payload_hash?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_football_fixture_id?: number | null
          away_goals?: number | null
          away_team_id?: string
          canonical_key?: string
          competition_id?: string
          created_at?: string
          finished_at?: string | null
          five_dollar_fixture_id?: number | null
          home_goals?: number | null
          home_team_id?: string
          id?: string
          kickoff_at?: string
          metadata?: Json
          primary_fixture_id?: string
          primary_provider?: string
          season?: string
          source_fetched_at?: string | null
          source_payload_hash?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_league_elo_current"
            referencedColumns: ["sports_competition_id"]
          },
          {
            foreignKeyName: "sports_fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_injuries: {
        Row: {
          ends_at: string | null
          fetched_at: string
          fixture_id: string | null
          id: string
          injury_type: string | null
          metadata: Json
          player_id: string | null
          provider: string
          reason: string | null
          starts_at: string | null
          team_id: string | null
        }
        Insert: {
          ends_at?: string | null
          fetched_at?: string
          fixture_id?: string | null
          id?: string
          injury_type?: string | null
          metadata?: Json
          player_id?: string | null
          provider: string
          reason?: string | null
          starts_at?: string | null
          team_id?: string | null
        }
        Update: {
          ends_at?: string | null
          fetched_at?: string
          fixture_id?: string | null
          id?: string
          injury_type?: string | null
          metadata?: Json
          player_id?: string | null
          provider?: string
          reason?: string | null
          starts_at?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_injuries_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_injuries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sports_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_injuries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_injuries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_jobs: {
        Row: {
          attempts: number
          available_at: string
          completed_at: string | null
          created_at: string
          fixture_id: string | null
          id: string
          idempotency_key: string
          job_type: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          max_attempts: number
          payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          completed_at?: string | null
          created_at?: string
          fixture_id?: string | null
          id?: string
          idempotency_key: string
          job_type: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          max_attempts?: number
          payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          completed_at?: string | null
          created_at?: string
          fixture_id?: string | null
          id?: string
          idempotency_key?: string
          job_type?: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          max_attempts?: number
          payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_jobs_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_match_fact_packs: {
        Row: {
          checksum: string | null
          definition_version: string
          fixture_id: string
          generated_at: string
          payload: Json
          source_fetched_at: string | null
        }
        Insert: {
          checksum?: string | null
          definition_version?: string
          fixture_id: string
          generated_at?: string
          payload: Json
          source_fetched_at?: string | null
        }
        Update: {
          checksum?: string | null
          definition_version?: string
          fixture_id?: string
          generated_at?: string
          payload?: Json
          source_fetched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_match_fact_packs_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_match_reviews: {
        Row: {
          auto_closed: boolean
          created_at: string
          finalized_at: string | null
          fixture_id: string
          id: string
          notes: string | null
          owner_id: string
          status: string
          updated_at: string
          watched: boolean | null
        }
        Insert: {
          auto_closed?: boolean
          created_at?: string
          finalized_at?: string | null
          fixture_id: string
          id?: string
          notes?: string | null
          owner_id: string
          status?: string
          updated_at?: string
          watched?: boolean | null
        }
        Update: {
          auto_closed?: boolean
          created_at?: string
          finalized_at?: string | null
          fixture_id?: string
          id?: string
          notes?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
          watched?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_match_reviews_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "sports_fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_player_personal_ratings: {
        Row: {
          notes: string | null
          participation_state: string
          player_id: string
          provider_rating_snapshot: number | null
          rating: number | null
          review_id: string
          updated_at: string
        }
        Insert: {
          notes?: string | null
          participation_state?: string
          player_id: string
          provider_rating_snapshot?: number | null
          rating?: number | null
          review_id: string
          updated_at?: string
        }
        Update: {
          notes?: string | null
          participation_state?: string
          player_id?: string
          provider_rating_snapshot?: number | null
          rating?: number | null
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_player_personal_ratings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sports_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_player_personal_ratings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "sports_match_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_player_season_stats: {
        Row: {
          appearances: number | null
          competition_id: string
          fetched_at: string
          minutes: number | null
          player_id: string
          provider: string
          provider_rating: number | null
          season: string
          starts: number | null
          stats: Json
          team_id: string
        }
        Insert: {
          appearances?: number | null
          competition_id: string
          fetched_at?: string
          minutes?: number | null
          player_id: string
          provider: string
          provider_rating?: number | null
          season?: string
          starts?: number | null
          stats?: Json
          team_id: string
        }
        Update: {
          appearances?: number | null
          competition_id?: string
          fetched_at?: string
          minutes?: number | null
          player_id?: string
          provider?: string
          provider_rating?: number | null
          season?: string
          starts?: number | null
          stats?: Json
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_player_season_stats_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_player_season_stats_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_league_elo_current"
            referencedColumns: ["sports_competition_id"]
          },
          {
            foreignKeyName: "sports_player_season_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sports_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_player_season_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_player_season_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_players: {
        Row: {
          api_football_player_id: number | null
          canonical_key: string
          created_at: string
          date_of_birth: string | null
          five_dollar_player_id: number | null
          id: string
          metadata: Json
          name: string
          nationality: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          api_football_player_id?: number | null
          canonical_key: string
          created_at?: string
          date_of_birth?: string | null
          five_dollar_player_id?: number | null
          id?: string
          metadata?: Json
          name: string
          nationality?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          api_football_player_id?: number | null
          canonical_key?: string
          created_at?: string
          date_of_birth?: string | null
          five_dollar_player_id?: number | null
          id?: string
          metadata?: Json
          name?: string
          nationality?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sports_prospective_collection_state: {
        Row: {
          activated_at: string
          day_zero_at: string
          definition_version: string
          metadata: Json
          singleton: boolean
        }
        Insert: {
          activated_at?: string
          day_zero_at: string
          definition_version?: string
          metadata?: Json
          singleton?: boolean
        }
        Update: {
          activated_at?: string
          day_zero_at?: string
          definition_version?: string
          metadata?: Json
          singleton?: boolean
        }
        Relationships: []
      }
      sports_review_field_marks: {
        Row: {
          created_at: string
          id: string
          note: string | null
          player_id: string | null
          review_id: string
          updated_at: string
          x_percent: number
          y_percent: number
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          player_id?: string | null
          review_id: string
          updated_at?: string
          x_percent: number
          y_percent: number
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          player_id?: string | null
          review_id?: string
          updated_at?: string
          x_percent?: number
          y_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "sports_review_field_marks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sports_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_review_field_marks_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "sports_match_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_standings: {
        Row: {
          competition_id: string
          draws: number | null
          fetched_at: string
          form: string | null
          goals_against: number | null
          goals_for: number | null
          losses: number | null
          payload: Json
          played: number | null
          points: number | null
          position: number | null
          provider: string
          season: string
          team_id: string
          wins: number | null
        }
        Insert: {
          competition_id: string
          draws?: number | null
          fetched_at?: string
          form?: string | null
          goals_against?: number | null
          goals_for?: number | null
          losses?: number | null
          payload?: Json
          played?: number | null
          points?: number | null
          position?: number | null
          provider: string
          season?: string
          team_id: string
          wins?: number | null
        }
        Update: {
          competition_id?: string
          draws?: number | null
          fetched_at?: string
          form?: string | null
          goals_against?: number | null
          goals_for?: number | null
          losses?: number | null
          payload?: Json
          played?: number | null
          points?: number | null
          position?: number | null
          provider?: string
          season?: string
          team_id?: string
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_standings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_standings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_league_elo_current"
            referencedColumns: ["sports_competition_id"]
          },
          {
            foreignKeyName: "sports_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_sync_state: {
        Row: {
          cursor_value: string | null
          domain: string
          last_attempt_at: string | null
          last_error: string | null
          last_success_at: string | null
          metadata: Json
          provider: string
          season: string
          updated_at: string
        }
        Insert: {
          cursor_value?: string | null
          domain: string
          last_attempt_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          metadata?: Json
          provider: string
          season?: string
          updated_at?: string
        }
        Update: {
          cursor_value?: string | null
          domain?: string
          last_attempt_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          metadata?: Json
          provider?: string
          season?: string
          updated_at?: string
        }
        Relationships: []
      }
      sports_team_competitions: {
        Row: {
          active: boolean
          competition_id: string
          fetched_at: string
          metadata: Json
          provider: string
          season: string
          team_id: string
        }
        Insert: {
          active?: boolean
          competition_id: string
          fetched_at?: string
          metadata?: Json
          provider: string
          season?: string
          team_id: string
        }
        Update: {
          active?: boolean
          competition_id?: string
          fetched_at?: string
          metadata?: Json
          provider?: string
          season?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_team_competitions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_team_competitions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_league_elo_current"
            referencedColumns: ["sports_competition_id"]
          },
          {
            foreignKeyName: "sports_team_competitions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_team_competitions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_team_squads: {
        Row: {
          active: boolean
          fetched_at: string
          jersey_number: number | null
          metadata: Json
          player_id: string
          position: string | null
          provider: string
          season: string
          team_id: string
        }
        Insert: {
          active?: boolean
          fetched_at?: string
          jersey_number?: number | null
          metadata?: Json
          player_id: string
          position?: string | null
          provider: string
          season?: string
          team_id: string
        }
        Update: {
          active?: boolean
          fetched_at?: string
          jersey_number?: number | null
          metadata?: Json
          player_id?: string
          position?: string | null
          provider?: string
          season?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_team_squads_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sports_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_team_squads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_team_squads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_teams: {
        Row: {
          api_football_team_id: number | null
          canonical_key: string
          country_code: string | null
          created_at: string
          five_dollar_team_id: number | null
          id: string
          logo_url: string | null
          metadata: Json
          name: string
          region: string | null
          short_name: string | null
          updated_at: string
        }
        Insert: {
          api_football_team_id?: number | null
          canonical_key: string
          country_code?: string | null
          created_at?: string
          five_dollar_team_id?: number | null
          id?: string
          logo_url?: string | null
          metadata?: Json
          name: string
          region?: string | null
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          api_football_team_id?: number | null
          canonical_key?: string
          country_code?: string | null
          created_at?: string
          five_dollar_team_id?: number | null
          id?: string
          logo_url?: string | null
          metadata?: Json
          name?: string
          region?: string | null
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sports_tracking_rules: {
        Row: {
          always_track: boolean
          competition_id: string | null
          competition_kind: string | null
          country_code: string | null
          created_at: string
          division_level: number | null
          enabled: boolean
          id: string
          metadata: Json
          priority: number
          region: string | null
          rule_key: string
          updated_at: string
        }
        Insert: {
          always_track?: boolean
          competition_id?: string | null
          competition_kind?: string | null
          country_code?: string | null
          created_at?: string
          division_level?: number | null
          enabled?: boolean
          id?: string
          metadata?: Json
          priority?: number
          region?: string | null
          rule_key: string
          updated_at?: string
        }
        Update: {
          always_track?: boolean
          competition_id?: string | null
          competition_kind?: string | null
          country_code?: string | null
          created_at?: string
          division_level?: number | null
          enabled?: boolean
          id?: string
          metadata?: Json
          priority?: number
          region?: string | null
          rule_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_tracking_rules_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_tracking_rules_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_league_elo_current"
            referencedColumns: ["sports_competition_id"]
          },
        ]
      }
    }
    Views: {
      access_review_status: {
        Row: {
          account_ref: string | null
          next_review_at: string | null
          notes: string | null
          overdue: boolean | null
          review_status: string | null
          reviewed_at: string | null
          role_name: string | null
          system_name: string | null
        }
        Insert: {
          account_ref?: string | null
          next_review_at?: string | null
          notes?: string | null
          overdue?: never
          review_status?: string | null
          reviewed_at?: string | null
          role_name?: string | null
          system_name?: string | null
        }
        Update: {
          account_ref?: string | null
          next_review_at?: string | null
          notes?: string | null
          overdue?: never
          review_status?: string | null
          reviewed_at?: string | null
          role_name?: string | null
          system_name?: string | null
        }
        Relationships: []
      }
      elo_audit_leagues: {
        Row: {
          audit_status: string | null
          country_code: string | null
          division_level: number | null
          evidence_adjustment: number | null
          evidence_matches: number | null
          focus_role: string | null
          hierarchy_constrained: boolean | null
          hierarchy_ok: boolean | null
          last_fixture_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          last_synced_at: string | null
          league_id: number | null
          league_key: string | null
          league_name: string | null
          league_rating: number | null
          local_avg_rating: number | null
          local_max_rating: number | null
          local_mean_drift: number | null
          local_min_rating: number | null
          parent_league_key: string | null
          parent_league_rating: number | null
          prior_rating: number | null
          region: string | null
          teams: number | null
        }
        Relationships: []
      }
      elo_global_team_ratings: {
        Row: {
          first_fixture_at: string | null
          global_rating: number | null
          last_fixture_at: string | null
          league_id: number | null
          league_key: string | null
          league_name: string | null
          league_rating: number | null
          local_rating: number | null
          matches_processed: number | null
          team_id: number | null
          team_model_version: string | null
          team_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      elo_team_integrity_audit: {
        Row: {
          first_fixture_mismatch_rows: number | null
          last_fixture_mismatch_rows: number | null
          match_count_mismatch_rows: number | null
          max_matches_processed: number | null
          max_rating: number | null
          metadata_mismatch_rows: number | null
          min_matches_processed: number | null
          min_rating: number | null
          missing_history_rows: number | null
          orphan_target_rows: number | null
          rating_mismatch_rows: number | null
          team_rows: number | null
          zero_match_rows: number | null
        }
        Relationships: []
      }
      sports_league_elo_current: {
        Row: {
          canonical_competition_name: string | null
          country_code: string | null
          division_level: number | null
          evidence_adjustment: number | null
          evidence_matches: number | null
          focus_role: string | null
          hierarchy_constrained: boolean | null
          league_id: number | null
          league_key: string | null
          league_name: string | null
          model_version: string | null
          prior_rating: number | null
          rating: number | null
          region: string | null
          sports_competition_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      sports_player_period_aggregates: {
        Row: {
          appearances: number | null
          competition_id: string | null
          fetched_at: string | null
          fixture_rows: number | null
          minutes: number | null
          period_end: string | null
          period_start: string | null
          player_id: string | null
          provider: string | null
          provider_rating: number | null
          season: string | null
          starts: number | null
          team_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_fixture_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sports_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixture_player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_team_elo_current"
            referencedColumns: ["sports_team_id"]
          },
          {
            foreignKeyName: "sports_fixture_player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sports_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "sports_league_elo_current"
            referencedColumns: ["sports_competition_id"]
          },
        ]
      }
      sports_team_elo_current: {
        Row: {
          canonical_team_name: string | null
          elo_team_id: number | null
          elo_team_name: string | null
          first_fixture_at: string | null
          global_rating: number | null
          last_fixture_at: string | null
          league_id: number | null
          league_key: string | null
          league_name: string | null
          league_rating: number | null
          local_rating: number | null
          matches_processed: number | null
          sports_team_id: string | null
          team_model_version: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      acquire_external_api_slot: {
        Args: {
          p_limit?: number
          p_provider: string
          p_window_seconds?: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      app_create_run_atomic: {
        Args: {
          p_filename: string
          p_headers: string[]
          p_invalid_count: number
          p_leagues: string[]
          p_prediction_at: string
          p_rows: Json
          p_target_date: string
        }
        Returns: string
      }
      apply_editorial_national_team_coverage: {
        Args: { p_date: string }
        Returns: number
      }
      apply_previous_day_editorial_context: {
        Args: { p_date: string }
        Returns: Json
      }
      apply_sports_editorial_evidence: {
        Args: { p_date: string }
        Returns: number
      }
      apply_sports_editorial_provider_stats: {
        Args: { p_date: string }
        Returns: number
      }
      auto_close_expired_sports_reviews: { Args: never; Returns: number }
      auto_close_expired_sports_reviews_at: {
        Args: { p_reference_at: string }
        Returns: number
      }
      auto_close_sports_reviews: {
        Args: { p_cutoff?: string; p_owner_id: string }
        Returns: number
      }
      claim_push_delivery_batch: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          created_at: string
          delivery_state: Json
          event_key: string
          event_type: string
          id: string
          last_error: string | null
          lock_token: string | null
          locked_at: string | null
          next_attempt_at: string
          payload: Json
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "push_delivery_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_sports_job: {
        Args: { p_lease_seconds?: number; p_worker_token: string }
        Returns: {
          attempts: number
          available_at: string
          completed_at: string | null
          created_at: string
          fixture_id: string | null
          id: string
          idempotency_key: string
          job_type: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          max_attempts: number
          payload: Json
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sports_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cleanup_external_api_cache: { Args: never; Returns: number }
      complete_push_delivery_event: {
        Args: { p_delivery_state: Json; p_id: string; p_lock_token: string }
        Returns: boolean
      }
      complete_sports_job: {
        Args: { p_job_id: string; p_worker_token: string }
        Returns: boolean
      }
      dead_sports_job: {
        Args: { p_error: string; p_job_id: string; p_worker_token: string }
        Returns: boolean
      }
      elo_bootstrap_runner: { Args: never; Returns: Json }
      elo_finalize_daily: { Args: never; Returns: Json }
      elo_is_target_league: {
        Args: { p_country: string; p_name: string }
        Returns: boolean
      }
      elo_league_key: {
        Args: { p_country: string; p_name: string }
        Returns: string
      }
      elo_rebuild_league: { Args: { p_league_id: number }; Returns: Json }
      elo_rebuild_league_ratings: { Args: never; Returns: Json }
      elo_run_audit: { Args: never; Returns: Json }
      elo_seed_rating: {
        Args: { p_before: string; p_new_league_id: number; p_team_id: number }
        Returns: number
      }
      elo_seed_rebuild_runner: { Args: never; Returns: Json }
      elo_store_5dollar_key: { Args: { p_key: string }; Returns: undefined }
      elo_sync_cross_competition: {
        Args: { p_competition_id: number }
        Returns: Json
      }
      elo_sync_domestic_league: { Args: { p_league_id: number }; Returns: Json }
      elo_sync_from_5dollar: { Args: never; Returns: Json }
      elo_sync_next_target: { Args: never; Returns: Json }
      elo_sync_next_target_when_idle: { Args: never; Returns: Json }
      enqueue_finished_sports_reviews: {
        Args: { p_limit?: number; p_owner_id: string }
        Returns: number
      }
      enqueue_push_delivery_event: {
        Args: {
          p_event_key: string
          p_event_type: string
          p_payload?: Json
          p_user_id: string
        }
        Returns: string
      }
      enqueue_sports_broadcast_sync: { Args: never; Returns: Json }
      enqueue_sports_job: {
        Args: {
          p_fixture_id?: string
          p_idempotency_key: string
          p_job_type: string
          p_max_attempts?: number
          p_payload?: Json
        }
        Returns: {
          attempts: number
          available_at: string
          completed_at: string | null
          created_at: string
          fixture_id: string | null
          id: string
          idempotency_key: string
          job_type: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          max_attempts: number
          payload: Json
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sports_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      enqueue_today_recent_form_backfill: {
        Args: { p_date?: string }
        Returns: Json
      }
      erase_user_application_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      external_api_take_rate_slot: {
        Args: { p_bucket: string; p_limit?: number; p_window_ms?: number }
        Returns: number
      }
      fail_push_delivery_event: {
        Args: {
          p_delivery_state: Json
          p_error: string
          p_id: string
          p_lock_token: string
          p_retryable: boolean
        }
        Returns: boolean
      }
      fail_sports_job: {
        Args: {
          p_error: string
          p_job_id: string
          p_retry_after_seconds?: number
          p_worker_token: string
        }
        Returns: string
      }
      finalize_previous_day_review_contract: {
        Args: { p_date: string }
        Returns: Json
      }
      get_owner_home_metrics: {
        Args: { p_owner_id: string }
        Returns: {
          locked_stake: number
          open_bets_count: number
          proposed_count: number
          settled_profit: number
        }[]
      }
      get_owner_latest_proposed_run_id: {
        Args: { p_owner_id: string }
        Returns: string
      }
      get_raw_observation_cache_rows: {
        Args: {
          p_cache_keys: string[]
          p_definition_version: string
          p_source: string
        }
        Returns: {
          cache_key: string
          fetched_at: string
          metric: string
          observed_at: string
          raw_value: Json
        }[]
      }
      get_recent_elo_movements: {
        Args: { p_limit?: number; p_since: string }
        Returns: {
          delta: number
          fixture_id: number
          goals_against: number
          goals_for: number
          kickoff_at: string
          league_name: string
          opponent_id: number
          opponent_name: string
          rating_after: number
          rating_before: number
          team_id: number
          team_name: string
        }[]
      }
      get_recent_priority_results: {
        Args: { p_limit?: number; p_since: string }
        Returns: {
          away_goals: number
          away_team: string
          away_team_id: string
          away_team_logo: string
          competition: string
          competition_id: string
          competition_kind: string
          country_code: string
          division_level: number
          fixture_id: string
          home_goals: number
          home_team: string
          home_team_id: string
          home_team_logo: string
          kickoff_at: string
          region: string
        }[]
      }
      get_recent_team_fixtures: {
        Args: {
          p_per_team?: number
          p_since: string
          p_team_ids: string[]
          p_until: string
        }
        Returns: {
          away_goals: number
          away_team_id: string
          fixture_id: string
          home_goals: number
          home_team_id: string
          kickoff_at: string
        }[]
      }
      get_today_tracked_fixtures: {
        Args: { p_end: string; p_limit?: number; p_start: string }
        Returns: {
          away_five_dollar_team_id: number
          away_goals: number
          away_team_id: string
          away_team_logo: string
          away_team_name: string
          competition_id: string
          competition_kind: string
          competition_name: string
          country_code: string
          division_level: number
          fixture_id: string
          home_five_dollar_team_id: number
          home_goals: number
          home_team_id: string
          home_team_logo: string
          home_team_name: string
          kickoff_at: string
          region: string
          status: string
        }[]
      }
      is_approved_app_user: { Args: never; Returns: boolean }
      kick_editorial_ai_refinement: {
        Args: { p_day_offset?: number }
        Returns: Json
      }
      kick_editorial_source_sync: {
        Args: { p_day_offset?: number }
        Returns: Json
      }
      kick_push_delivery_dispatcher: { Args: never; Returns: number }
      kick_sofascore_editorial_sync: {
        Args: { p_day_offset?: number }
        Returns: Json
      }
      kick_sports_api_maintenance: { Args: never; Returns: Json }
      kick_sports_daily_sync: { Args: { p_day_offset: number }; Returns: Json }
      kick_sports_job_worker: { Args: never; Returns: Json }
      mark_external_api_rate_limited: {
        Args: { p_provider: string; p_retry_after_seconds: number }
        Returns: undefined
      }
      prepare_sports_daily_briefing: {
        Args: { p_date?: string }
        Returns: string
      }
      publish_sports_daily_briefing: {
        Args: { p_date?: string }
        Returns: string
      }
      publish_sports_daily_briefing_base_v4: {
        Args: { p_date?: string }
        Returns: string
      }
      raw_observation_identity: {
        Args: {
          p_definition_version: string
          p_match_id: string
          p_metric: string
          p_observed_at: string
          p_raw_value: Json
          p_run_id: string
          p_source: string
        }
        Returns: string
      }
      reconcile_automation_runs: {
        Args: { p_timeout_minutes?: number }
        Returns: Json
      }
      refresh_derived_season_analytics: {
        Args: { p_season?: string }
        Returns: Json
      }
      release_sports_daily_briefing: {
        Args: { p_date?: string }
        Returns: Json
      }
      renew_sports_job_lease: {
        Args: {
          p_job_id: string
          p_lease_seconds?: number
          p_worker_token: string
        }
        Returns: boolean
      }
      requeue_unlinked_api_football_jobs: { Args: never; Returns: number }
      run_fifa_break_last_round_player_stats_once: {
        Args: never
        Returns: Json
      }
      run_performance_retention_cleanup: { Args: never; Returns: Json }
      run_privacy_retention_cleanup: { Args: never; Returns: Json }
      sports_fixture_in_api_football_scope: {
        Args: { p_fixture_id: string }
        Returns: boolean
      }
      sports_fixture_is_always_track: {
        Args: { p_fixture_id: string }
        Returns: boolean
      }
      sports_fixture_is_prospective: {
        Args: { p_fixture_id: string }
        Returns: boolean
      }
      sports_fixture_is_review_eligible: {
        Args: { p_fixture_id: string }
        Returns: boolean
      }
      sports_maintenance_tick: { Args: { p_now?: string }; Returns: Json }
      sports_review_team_ratings: {
        Args: { p_review_id: string }
        Returns: {
          complete: boolean
          participants: number
          personal_average: number
          rated_players: number
          team_id: string
        }[]
      }
      validate_external_api_maintenance_token: {
        Args: { p_token: string }
        Returns: boolean
      }
      validate_push_dispatch_token: {
        Args: { p_token: string }
        Returns: boolean
      }
      verify_sports_worker_cron_token: {
        Args: { p_token: string }
        Returns: boolean
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
