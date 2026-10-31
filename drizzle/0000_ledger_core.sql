CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"appwrite_user_id" text,
	"appwrite_bank_id" text,
	"code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_kind_check" CHECK ("accounts"."kind" in ('user_bank', 'user_balance', 'clearing', 'fees')),
	CONSTRAINT "accounts_owner_check" CHECK (("accounts"."kind" in ('user_bank', 'user_balance') and "accounts"."appwrite_user_id" is not null)
				or ("accounts"."kind" in ('clearing', 'fees') and "accounts"."code" is not null))
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_cents" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "postings_amount_nonzero" CHECK ("postings"."amount_cents" <> 0)
);
--> statement-breakpoint
ALTER TABLE "postings" ADD CONSTRAINT "postings_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postings" ADD CONSTRAINT "postings_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_appwrite_bank_id_key" ON "accounts" USING btree ("appwrite_bank_id") WHERE "accounts"."appwrite_bank_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_code_key" ON "accounts" USING btree ("code") WHERE "accounts"."code" is not null;--> statement-breakpoint
CREATE INDEX "accounts_appwrite_user_id_idx" ON "accounts" USING btree ("appwrite_user_id");--> statement-breakpoint
CREATE INDEX "postings_journal_entry_id_idx" ON "postings" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "postings_account_id_idx" ON "postings" USING btree ("account_id");