import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  limit?: string;
  offset?: string;
  sort?: string;
  modifiedSince?: string;
  email?: string;
  attributes?: string;
  listIds?: string;
  unlinkListIds?: string;
  updateEnabled?: boolean;
  emailBlacklisted?: boolean;
  smsBlacklisted?: boolean;
}

/** Parse a comma-separated list of numeric IDs */
function numIds(csv?: string): number[] | undefined {
  if (!csv) return undefined;
  return csv.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
}

export const contactsResource = new Command("contacts").description("Manage contacts");

// ── LIST ──────────────────────────────────────────────
contactsResource
  .command("list")
  .description("List contacts")
  .option("--limit <n>", "Max results (max 1000)", "50")
  .option("--offset <n>", "Index of the first item", "0")
  .option("--sort <dir>", "Sort by creation date: asc | desc", "desc")
  .option("--modified-since <date>", "Only contacts modified since (ISO 8601)")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  brevo-cli contacts list --limit 10\n  brevo-cli contacts list --fields id,email,listIds --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/contacts", {
        limit: opts.limit ?? "50",
        offset: opts.offset ?? "0",
        ...(opts.sort && { sort: opts.sort }),
        ...(opts.modifiedSince && { modifiedSince: opts.modifiedSince }),
      })) as { contacts?: unknown[] };
      output(res.contacts ?? res, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
contactsResource
  .command("get")
  .description("Get a contact by email or ID")
  .argument("<identifier>", "Contact email or numeric ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  brevo-cli contacts get john@example.com")
  .action(async (identifier: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/contacts/${encodeURIComponent(identifier)}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
contactsResource
  .command("create")
  .description("Create a contact")
  .requiredOption("--email <email>", "Contact email address")
  .option("--attributes <json>", 'Attributes as JSON, e.g. \'{"FIRSTNAME":"John"}\'')
  .option("--list-ids <ids>", "Comma-separated list IDs to add the contact to")
  .option("--update-enabled", "Update the contact if it already exists", false)
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  brevo-cli contacts create --email john@example.com --list-ids 3,5\n  brevo-cli contacts create --email a@b.com --attributes '{\"FIRSTNAME\":\"Ada\"}'",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = { email: opts.email };
      if (opts.attributes) body.attributes = JSON.parse(opts.attributes);
      const listIds = numIds(opts.listIds);
      if (listIds) body.listIds = listIds;
      if (opts.updateEnabled) body.updateEnabled = true;
      const data = await client.post("/contacts", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
contactsResource
  .command("update")
  .description("Update a contact by email or ID")
  .argument("<identifier>", "Contact email or numeric ID")
  .option("--attributes <json>", "Attributes as JSON")
  .option("--list-ids <ids>", "Comma-separated list IDs to add to")
  .option("--unlink-list-ids <ids>", "Comma-separated list IDs to remove from")
  .option("--email-blacklisted", "Blacklist the contact for emails")
  .option("--sms-blacklisted", "Blacklist the contact for SMS")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  brevo-cli contacts update john@example.com --attributes '{\"FIRSTNAME\":\"John\"}'",
  )
  .action(async (identifier: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.attributes) body.attributes = JSON.parse(opts.attributes);
      const listIds = numIds(opts.listIds);
      if (listIds) body.listIds = listIds;
      const unlink = numIds(opts.unlinkListIds);
      if (unlink) body.unlinkListIds = unlink;
      if (opts.emailBlacklisted) body.emailBlacklisted = true;
      if (opts.smsBlacklisted) body.smsBlacklisted = true;
      await client.put(`/contacts/${encodeURIComponent(identifier)}`, body);
      output({ updated: true, identifier }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
contactsResource
  .command("delete")
  .description("Delete a contact by email or ID")
  .argument("<identifier>", "Contact email or numeric ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli contacts delete john@example.com")
  .action(async (identifier: string, opts: ActionOpts) => {
    try {
      await client.delete(`/contacts/${encodeURIComponent(identifier)}`);
      output({ deleted: true, identifier }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
