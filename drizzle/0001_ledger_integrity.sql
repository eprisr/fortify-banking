-- Ledger integrity rules (ADR-016 §2), enforced by Postgres so they hold even
-- if application code is wrong. Hand-written: drizzle-kit doesn't model
-- triggers.

-- 1. Every journal entry balances: at least two postings, summing to zero.
--    Checked at COMMIT (deferred), so an entry and its postings can be
--    inserted in any order within one transaction.
CREATE FUNCTION ledger_assert_entry_balanced(entry_id uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
	posting_count integer;
	total bigint;
BEGIN
	SELECT count(*), coalesce(sum(amount_cents), 0)
	INTO posting_count, total
	FROM postings
	WHERE journal_entry_id = entry_id;

	IF posting_count < 2 OR total <> 0 THEN
		RAISE EXCEPTION 'journal entry % is unbalanced: % postings summing to % cents',
			entry_id, posting_count, total
			USING ERRCODE = 'check_violation';
	END IF;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION ledger_check_posting_entry() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
	PERFORM ledger_assert_entry_balanced(NEW.journal_entry_id);
	RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION ledger_check_journal_entry() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
	PERFORM ledger_assert_entry_balanced(NEW.id);
	RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER postings_entry_balanced
	AFTER INSERT ON postings
	DEFERRABLE INITIALLY DEFERRED
	FOR EACH ROW EXECUTE FUNCTION ledger_check_posting_entry();
--> statement-breakpoint
-- Catches an entry committed with no postings at all.
CREATE CONSTRAINT TRIGGER journal_entries_balanced
	AFTER INSERT ON journal_entries
	DEFERRABLE INITIALLY DEFERRED
	FOR EACH ROW EXECUTE FUNCTION ledger_check_journal_entry();
--> statement-breakpoint

-- 2. Append-only. Postings never change or disappear; a correction is a new
--    reversing entry. Journal entries can't be deleted, but stay updatable
--    because ADR-017 moves their status forward.
CREATE FUNCTION ledger_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
	RAISE EXCEPTION '% on % is not allowed: the ledger is append-only',
		TG_OP, TG_TABLE_NAME
		USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER postings_append_only
	BEFORE UPDATE OR DELETE ON postings
	FOR EACH ROW EXECUTE FUNCTION ledger_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER postings_no_truncate
	BEFORE TRUNCATE ON postings
	FOR EACH STATEMENT EXECUTE FUNCTION ledger_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER journal_entries_no_delete
	BEFORE DELETE ON journal_entries
	FOR EACH ROW EXECUTE FUNCTION ledger_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER journal_entries_no_truncate
	BEFORE TRUNCATE ON journal_entries
	FOR EACH STATEMENT EXECUTE FUNCTION ledger_reject_mutation();
