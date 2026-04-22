CREATE TABLE IF NOT EXISTS "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE TABLE IF NOT EXISTS "users"(
  "id" integer primary key autoincrement not null,
  "employee_id" varchar,
  "name" varchar not null,
  "email" varchar not null,
  "role" varchar not null default 'staff',
  "email_verified_at" datetime,
  "password" varchar not null,
  "remember_token" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "two_factor_secret" text,
  "two_factor_recovery_codes" text,
  "two_factor_confirmed_at" datetime,
  "phone" varchar,
  "location" varchar,
  "department" varchar,
  "position" varchar,
  "status" varchar not null default 'active',
  "employee_stage" varchar not null default 'performer'
);
CREATE UNIQUE INDEX "users_employee_id_unique" on "users"("employee_id");
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE TABLE IF NOT EXISTS "password_reset_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE IF NOT EXISTS "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE IF NOT EXISTS "cache"(
  "key" varchar not null,
  "value" text not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE TABLE IF NOT EXISTS "cache_locks"(
  "key" varchar not null,
  "owner" varchar not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE TABLE IF NOT EXISTS "jobs"(
  "id" integer primary key autoincrement not null,
  "queue" varchar not null,
  "payload" text not null,
  "attempts" integer not null,
  "reserved_at" integer,
  "available_at" integer not null,
  "created_at" integer not null
);
CREATE INDEX "jobs_queue_index" on "jobs"("queue");
CREATE TABLE IF NOT EXISTS "job_batches"(
  "id" varchar not null,
  "name" varchar not null,
  "total_jobs" integer not null,
  "pending_jobs" integer not null,
  "failed_jobs" integer not null,
  "failed_job_ids" text not null,
  "options" text,
  "cancelled_at" integer,
  "created_at" integer not null,
  "finished_at" integer,
  primary key("id")
);
CREATE TABLE IF NOT EXISTS "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" text not null,
  "queue" text not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE TABLE IF NOT EXISTS "conversations"(
  "id" integer primary key autoincrement not null,
  "type" varchar check("type" in('direct', 'group')) not null default 'group',
  "name" varchar,
  "department" varchar,
  "is_read_only" tinyint(1) not null default '0',
  "is_global" tinyint(1) not null default '0',
  "created_at" datetime,
  "updated_at" datetime,
  "is_confidential" tinyint(1) not null default '0'
);
CREATE TABLE IF NOT EXISTS "messages"(
  "id" integer primary key autoincrement not null,
  "conversation_id" integer not null,
  "user_id" integer not null,
  "content" text not null,
  "created_at" datetime,
  "updated_at" datetime,
  "attachment_path" varchar,
  "attachment_name" varchar,
  "attachment_type" varchar,
  "attachment_size" integer,
  "is_edited" tinyint(1) not null default '0',
  "edited_at" datetime,
  "deleted_at" datetime,
  foreign key("conversation_id") references "conversations"("id") on delete cascade,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "conversation_participants"(
  "id" integer primary key autoincrement not null,
  "conversation_id" integer not null,
  "user_id" integer not null,
  "last_read_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("conversation_id") references "conversations"("id") on delete cascade,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_unique" on "conversation_participants"(
  "conversation_id",
  "user_id"
);
CREATE TABLE IF NOT EXISTS "message_reactions"(
  "id" integer primary key autoincrement not null,
  "message_id" integer not null,
  "user_id" integer not null,
  "emoji" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("message_id") references "messages"("id") on delete cascade,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "message_reactions_message_id_user_id_emoji_unique" on "message_reactions"(
  "message_id",
  "user_id",
  "emoji"
);
CREATE TABLE IF NOT EXISTS "profile_change_requests"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "changes" text not null,
  "status" varchar not null default 'pending',
  "review_notes" text,
  "reviewed_by" integer,
  "reviewed_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade,
  foreign key("reviewed_by") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "tasks"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "assigned_to_user_id" integer not null,
  "assigned_by_user_id" integer not null,
  "priority" varchar not null default 'medium',
  "due_date" date not null,
  "status" varchar not null default 'todo',
  "progress" integer not null default '0',
  "description" text,
  "department" varchar,
  "project" varchar,
  "subtasks" text,
  "tags" text,
  "attachments" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("assigned_to_user_id") references "users"("id") on delete cascade,
  foreign key("assigned_by_user_id") references "users"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "task_comments"(
  "id" integer primary key autoincrement not null,
  "task_id" integer not null,
  "user_id" integer not null,
  "text" text not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("task_id") references "tasks"("id") on delete cascade,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "attendance_records"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "date" date not null,
  "clock_in_at" datetime,
  "clock_out_at" datetime,
  "total_hours" numeric not null default '0',
  "status" varchar not null default 'present',
  "notes" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "attendance_records_user_id_date_unique" on "attendance_records"(
  "user_id",
  "date"
);
CREATE INDEX "attendance_records_user_id_date_index" on "attendance_records"(
  "user_id",
  "date"
);
CREATE TABLE IF NOT EXISTS "resource_requests"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "reviewed_by_user_id" integer,
  "type" varchar not null,
  "title" varchar not null,
  "description" text not null,
  "amount" numeric,
  "project" varchar not null,
  "status" varchar not null default 'pending',
  "tagged_person" varchar,
  "attachments" text,
  "receipts" text,
  "reviewed_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  "approval_chain" text,
  "approval_level" integer not null default '0',
  foreign key("user_id") references "users"("id") on delete cascade,
  foreign key("reviewed_by_user_id") references "users"("id") on delete set null
);
CREATE INDEX "resource_requests_user_id_status_index" on "resource_requests"(
  "user_id",
  "status"
);
CREATE TABLE IF NOT EXISTS "resource_request_comments"(
  "id" integer primary key autoincrement not null,
  "resource_request_id" integer not null,
  "user_id" integer not null,
  "content" text not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("resource_request_id") references "resource_requests"("id") on delete cascade,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "leave_requests"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "reviewed_by_user_id" integer,
  "type" varchar not null,
  "start_date" date not null,
  "end_date" date not null,
  "days" integer not null,
  "reason" text not null,
  "status" varchar not null default 'pending',
  "hr_comment" text,
  "reviewed_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade,
  foreign key("reviewed_by_user_id") references "users"("id") on delete set null
);
CREATE INDEX "leave_requests_user_id_status_index" on "leave_requests"(
  "user_id",
  "status"
);
CREATE TABLE IF NOT EXISTS "content_categories"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "slug" varchar not null,
  "icon" varchar,
  "parent_id" integer,
  "sort_order" integer not null default '0',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("parent_id") references "content_categories"("id") on delete set null
);
CREATE UNIQUE INDEX "content_categories_slug_unique" on "content_categories"(
  "slug"
);
CREATE TABLE IF NOT EXISTS "content_pages"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "slug" varchar not null,
  "body" text not null,
  "category_id" integer not null,
  "stage_visibility" text not null default '["joiner",
  "performer",
  "leader"]', "is_published" tinyint(1) not null default '0',
  "author_id" integer not null,
  "featured_image" varchar,
  "attachments" text,
  "requires_acknowledgement" tinyint(1) not null default '0',
  "acknowledgement_deadline" date,
  "published_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  "deleted_at" datetime,
  foreign key("category_id") references "content_categories"("id"),
  foreign key("author_id") references "users"("id")
);
CREATE UNIQUE INDEX "content_pages_slug_unique" on "content_pages"("slug");
CREATE TABLE IF NOT EXISTS "newsletters"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "body" text not null,
  "featured_image" varchar,
  "author_id" integer not null,
  "target_audience" text not null default '{"type":"all",
  "value":"all"}', "status" varchar not null default 'draft',
  "published_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("author_id") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "bulletins"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "body" text not null,
  "priority" varchar not null default 'info',
  "author_id" integer not null,
  "is_pinned" tinyint(1) not null default '0',
  "expires_at" date,
  "is_published" tinyint(1) not null default '0',
  "published_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("author_id") references "users"("id")
);
CREATE TABLE IF NOT EXISTS "policy_acknowledgements"(
  "id" integer primary key autoincrement not null,
  "content_page_id" integer not null,
  "user_id" integer not null,
  "acknowledged_at" datetime not null,
  "ip_address" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("content_page_id") references "content_pages"("id"),
  foreign key("user_id") references "users"("id")
);
CREATE UNIQUE INDEX "policy_acknowledgements_content_page_id_user_id_unique" on "policy_acknowledgements"(
  "content_page_id",
  "user_id"
);
CREATE TABLE IF NOT EXISTS "checklist_templates"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "description" text,
  "stage" varchar not null default 'joiner',
  "is_default" tinyint(1) not null default '0',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE TABLE IF NOT EXISTS "checklist_items"(
  "id" integer primary key autoincrement not null,
  "checklist_template_id" integer not null,
  "title" varchar not null,
  "description" text,
  "sort_order" integer not null default '0',
  "is_required" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("checklist_template_id") references "checklist_templates"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "user_checklists"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "checklist_template_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade,
  foreign key("checklist_template_id") references "checklist_templates"("id") on delete cascade
);
CREATE UNIQUE INDEX "user_checklists_user_id_checklist_template_id_unique" on "user_checklists"(
  "user_id",
  "checklist_template_id"
);
CREATE TABLE IF NOT EXISTS "user_checklist_progress"(
  "id" integer primary key autoincrement not null,
  "user_checklist_id" integer not null,
  "checklist_item_id" integer not null,
  "completed_at" datetime,
  "notes" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_checklist_id") references "user_checklists"("id") on delete cascade,
  foreign key("checklist_item_id") references "checklist_items"("id") on delete cascade
);
CREATE UNIQUE INDEX "user_checklist_progress_user_checklist_id_checklist_item_id_unique" on "user_checklist_progress"(
  "user_checklist_id",
  "checklist_item_id"
);
CREATE TABLE IF NOT EXISTS "courses"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "description" text not null,
  "type" varchar not null default 'optional',
  "stage_visibility" text not null default '["joiner",
  "performer",
  "leader"]', "category" varchar not null,
  "content" text not null,
  "duration_minutes" integer,
  "is_published" tinyint(1) not null default '0',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE TABLE IF NOT EXISTS "course_enrollments"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "course_id" integer not null,
  "status" varchar not null default 'assigned',
  "progress" integer not null default '0',
  "started_at" datetime,
  "completed_at" datetime,
  "score" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade,
  foreign key("course_id") references "courses"("id") on delete cascade
);
CREATE UNIQUE INDEX "course_enrollments_user_id_course_id_unique" on "course_enrollments"(
  "user_id",
  "course_id"
);
CREATE TABLE IF NOT EXISTS "recognitions"(
  "id" integer primary key autoincrement not null,
  "from_user_id" integer not null,
  "to_user_id" integer not null,
  "message" text not null,
  "badge_type" varchar not null,
  "is_public" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("from_user_id") references "users"("id") on delete cascade,
  foreign key("to_user_id") references "users"("id") on delete cascade
);
CREATE INDEX "recognitions_to_user_id_created_at_index" on "recognitions"(
  "to_user_id",
  "created_at"
);
CREATE TABLE IF NOT EXISTS "job_postings"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "department" varchar not null,
  "description" text not null,
  "requirements" text not null,
  "posted_by_user_id" integer not null,
  "status" varchar not null default 'open',
  "closes_at" date,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("posted_by_user_id") references "users"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "job_applications"(
  "id" integer primary key autoincrement not null,
  "job_posting_id" integer not null,
  "user_id" integer not null,
  "cover_letter" text not null,
  "status" varchar not null default 'applied',
  "applied_at" datetime not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("job_posting_id") references "job_postings"("id") on delete cascade,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "job_applications_job_posting_id_user_id_unique" on "job_applications"(
  "job_posting_id",
  "user_id"
);
CREATE TABLE IF NOT EXISTS "objectives"(
  "id" integer primary key autoincrement not null,
  "title" varchar not null,
  "description" text,
  "owner_user_id" integer not null,
  "department" varchar,
  "period" varchar not null,
  "status" varchar check("status" in('draft', 'active', 'completed')) not null default 'draft',
  "progress" integer not null default '0',
  "parent_id" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("owner_user_id") references "users"("id") on delete cascade,
  foreign key("parent_id") references "objectives"("id") on delete set null
);
CREATE TABLE IF NOT EXISTS "key_results"(
  "id" integer primary key autoincrement not null,
  "objective_id" integer not null,
  "title" varchar not null,
  "target_value" numeric not null,
  "current_value" numeric not null default '0',
  "unit" varchar not null,
  "status" varchar check("status" in('on_track', 'at_risk', 'behind')) not null default 'on_track',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("objective_id") references "objectives"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "faq_entries"(
  "id" integer primary key autoincrement not null,
  "question" varchar not null,
  "answer" text not null,
  "category" varchar not null,
  "sort_order" integer not null default '0',
  "is_published" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "faq_entries_category_sort_order_index" on "faq_entries"(
  "category",
  "sort_order"
);
CREATE TABLE IF NOT EXISTS "cost_centres"(
  "id" integer primary key autoincrement not null,
  "code" varchar not null,
  "name" varchar not null,
  "parent_id" integer,
  "head_user_id" integer,
  "budget_kobo" integer not null default '0',
  "status" varchar not null default 'active',
  "created_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("parent_id") references "cost_centres"("id") on delete set null,
  foreign key("head_user_id") references "users"("id") on delete set null,
  foreign key("created_by") references "users"("id") on delete set null
);
CREATE INDEX "cost_centres_parent_id_index" on "cost_centres"("parent_id");
CREATE INDEX "cost_centres_status_index" on "cost_centres"("status");
CREATE UNIQUE INDEX "cost_centres_code_unique" on "cost_centres"("code");
CREATE TABLE IF NOT EXISTS "account_codes"(
  "id" integer primary key autoincrement not null,
  "code" varchar not null,
  "category" varchar not null,
  "description" varchar not null,
  "tax_vat_applicable" tinyint(1) not null default '0',
  "tax_wht_applicable" tinyint(1) not null default '0',
  "wht_rate" integer,
  "status" varchar not null default 'active',
  "created_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("created_by") references "users"("id") on delete set null
);
CREATE INDEX "account_codes_category_index" on "account_codes"("category");
CREATE INDEX "account_codes_status_index" on "account_codes"("status");
CREATE UNIQUE INDEX "account_codes_code_unique" on "account_codes"("code");
CREATE TABLE IF NOT EXISTS "vendors"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "tax_id" varchar,
  "bank_name" varchar,
  "bank_account" varchar,
  "contact_email" varchar,
  "contact_phone" varchar,
  "status" varchar not null default 'active',
  "created_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("created_by") references "users"("id") on delete set null
);
CREATE INDEX "vendors_status_index" on "vendors"("status");
CREATE UNIQUE INDEX "vendors_name_unique" on "vendors"("name");
CREATE TABLE IF NOT EXISTS "financial_periods"(
  "id" integer primary key autoincrement not null,
  "year" integer not null,
  "month" integer not null,
  "status" varchar not null default 'open',
  "opened_at" datetime,
  "closed_at" datetime,
  "closed_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("closed_by") references "users"("id") on delete set null
);
CREATE UNIQUE INDEX "financial_periods_year_month_unique" on "financial_periods"(
  "year",
  "month"
);
CREATE INDEX "financial_periods_status_index" on "financial_periods"("status");
CREATE TABLE IF NOT EXISTS "finance_audit_logs"(
  "id" integer primary key autoincrement not null,
  "user_id" integer,
  "model_type" varchar not null,
  "model_id" integer not null,
  "action" varchar not null,
  "before_json" text,
  "after_json" text,
  "logged_at" datetime not null default CURRENT_TIMESTAMP,
  foreign key("user_id") references "users"("id") on delete set null
);
CREATE INDEX "finance_audit_logs_model_type_model_id_index" on "finance_audit_logs"(
  "model_type",
  "model_id"
);
CREATE INDEX "finance_audit_logs_user_id_index" on "finance_audit_logs"(
  "user_id"
);
CREATE INDEX "finance_audit_logs_logged_at_index" on "finance_audit_logs"(
  "logged_at"
);

INSERT INTO migrations VALUES(1,'0001_01_01_000000_create_users_table',1);
INSERT INTO migrations VALUES(2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO migrations VALUES(3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO migrations VALUES(4,'2025_08_26_100418_add_two_factor_columns_to_users_table',1);
INSERT INTO migrations VALUES(5,'2026_01_14_173555_create_conversations_table',1);
INSERT INTO migrations VALUES(6,'2026_01_14_173557_create_messages_table',1);
INSERT INTO migrations VALUES(7,'2026_01_14_173558_create_conversation_participants_table',1);
INSERT INTO migrations VALUES(8,'2026_01_14_175625_add_attachments_to_messages_table',1);
INSERT INTO migrations VALUES(9,'2026_01_14_175626_create_message_reactions_table',1);
INSERT INTO migrations VALUES(10,'2026_01_15_045440_create_profile_change_requests_table',1);
INSERT INTO migrations VALUES(11,'2026_01_15_045605_add_profile_fields_to_users_table',1);
INSERT INTO migrations VALUES(12,'2026_03_27_120000_add_staff_enrollment_fields_to_users_table',1);
INSERT INTO migrations VALUES(13,'2026_03_27_130000_create_tasks_table',1);
INSERT INTO migrations VALUES(14,'2026_03_27_140000_create_attendance_records_table',1);
INSERT INTO migrations VALUES(15,'2026_03_27_141000_create_resource_requests_tables',1);
INSERT INTO migrations VALUES(16,'2026_03_27_142000_create_leave_requests_table',1);
INSERT INTO migrations VALUES(17,'2026_04_09_000001_add_employee_stage_to_users_table',1);
INSERT INTO migrations VALUES(18,'2026_04_09_100000_create_content_categories_table',1);
INSERT INTO migrations VALUES(19,'2026_04_09_100001_create_content_pages_table',1);
INSERT INTO migrations VALUES(20,'2026_04_09_200000_create_newsletters_table',1);
INSERT INTO migrations VALUES(21,'2026_04_09_300000_create_bulletins_table',1);
INSERT INTO migrations VALUES(22,'2026_04_09_400000_create_policy_acknowledgements_table',1);
INSERT INTO migrations VALUES(23,'2026_04_09_500000_create_checklist_templates_table',1);
INSERT INTO migrations VALUES(24,'2026_04_09_500001_create_checklist_items_table',1);
INSERT INTO migrations VALUES(25,'2026_04_09_500002_create_user_checklists_table',1);
INSERT INTO migrations VALUES(26,'2026_04_09_500003_create_user_checklist_progress_table',1);
INSERT INTO migrations VALUES(27,'2026_04_09_600000_create_courses_table',1);
INSERT INTO migrations VALUES(28,'2026_04_09_600001_create_course_enrollments_table',1);
INSERT INTO migrations VALUES(29,'2026_04_09_700000_create_recognitions_table',1);
INSERT INTO migrations VALUES(30,'2026_04_09_800000_create_job_postings_table',1);
INSERT INTO migrations VALUES(31,'2026_04_09_800001_create_job_applications_table',1);
INSERT INTO migrations VALUES(32,'2026_04_14_100000_create_objectives_table',1);
INSERT INTO migrations VALUES(33,'2026_04_14_100001_create_key_results_table',1);
INSERT INTO migrations VALUES(34,'2026_04_14_200000_add_approval_chain_to_resource_requests_table',1);
INSERT INTO migrations VALUES(35,'2026_04_14_300000_add_is_confidential_to_conversations_table',1);
INSERT INTO migrations VALUES(36,'2026_04_14_400000_create_faq_entries_table',1);
INSERT INTO migrations VALUES(37,'2026_04_16_010000_add_finance_roles_to_users',1);
INSERT INTO migrations VALUES(38,'2026_04_16_020000_create_cost_centres_table',1);
INSERT INTO migrations VALUES(39,'2026_04_16_020001_create_account_codes_table',1);
INSERT INTO migrations VALUES(40,'2026_04_16_020002_create_vendors_table',1);
INSERT INTO migrations VALUES(41,'2026_04_16_020003_create_financial_periods_table',1);
INSERT INTO migrations VALUES(42,'2026_04_16_020004_create_finance_audit_logs_table',1);
