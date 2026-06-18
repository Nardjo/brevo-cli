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
  name?: string;
  folderId?: string;
  emails?: string;
  ids?: string;
  all?: boolean;
}

/** Parse a comma-separated list of emails */
function emailList(csv?: string): string[] | undefined {
  if (!csv) return undefined;
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Parse a comma-separated list of numeric IDs */
function numIds(csv?: string): number[] | undefined {
  if (!csv) return undefined;
  return csv.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
}

export const listsResource = new Command("lists").description("Manage contact lists");

// ── LIST ──────────────────────────────────────────────
listsResource
  .command("list")
  .description("List all contact lists")
  .option("--limit <n>", "Max results (max 50)", "20")
  .option("--offset <n>", "Index of the first item", "0")
  .option("--sort <dir>", "Sort by creation date: asc | desc", "desc")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  brevo-cli lists list\n  brevo-cli lists list --json")
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/contacts/lists", {
        limit: opts.limit ?? "20",
        offset: opts.offset ?? "0",
        ...(opts.sort && { sort: opts.sort }),
      })) as { lists?: unknown[] };
      output(res.lists ?? res, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
listsResource
  .command("get")
  .description("Get a contact list by ID")
  .argument("<listId>", "List ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  brevo-cli lists get 3")
  .action(async (listId: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/contacts/lists/${listId}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
listsResource
  .command("create")
  .description("Create a contact list")
  .requiredOption("--name <name>", "List name")
  .requiredOption("--folder-id <id>", "Folder ID the list belongs to")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli lists create --name 'Newsletter' --folder-id 1")
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.post("/contacts/lists", {
        name: opts.name,
        folderId: Number(opts.folderId),
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
listsResource
  .command("update")
  .description("Update a contact list")
  .argument("<listId>", "List ID")
  .option("--name <name>", "New list name")
  .option("--folder-id <id>", "Move the list to this folder ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli lists update 3 --name 'VIP Customers'")
  .action(async (listId: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.folderId) body.folderId = Number(opts.folderId);
      await client.put(`/contacts/lists/${listId}`, body);
      output({ updated: true, listId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
listsResource
  .command("delete")
  .description("Delete a contact list")
  .argument("<listId>", "List ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli lists delete 3")
  .action(async (listId: string, opts: ActionOpts) => {
    try {
      await client.delete(`/contacts/lists/${listId}`);
      output({ deleted: true, listId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CONTACTS IN LIST ──────────────────────────────────
listsResource
  .command("contacts")
  .description("List the contacts in a list")
  .argument("<listId>", "List ID")
  .option("--limit <n>", "Max results (max 500)", "50")
  .option("--offset <n>", "Index of the first item", "0")
  .option("--sort <dir>", "Sort by creation date: asc | desc", "desc")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  brevo-cli lists contacts 3 --limit 100 --json")
  .action(async (listId: string, opts: ActionOpts) => {
    try {
      const res = (await client.get(`/contacts/lists/${listId}/contacts`, {
        limit: opts.limit ?? "50",
        offset: opts.offset ?? "0",
        ...(opts.sort && { sort: opts.sort }),
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

// ── ADD CONTACTS ──────────────────────────────────────
listsResource
  .command("add")
  .description("Add contacts to a list (by email or ID)")
  .argument("<listId>", "List ID")
  .option("--emails <emails>", "Comma-separated emails to add")
  .option("--ids <ids>", "Comma-separated contact IDs to add")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli lists add 3 --emails a@b.com,c@d.com")
  .action(async (listId: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      const emails = emailList(opts.emails);
      if (emails) body.emails = emails;
      const ids = numIds(opts.ids);
      if (ids) body.ids = ids;
      const data = await client.post(`/contacts/lists/${listId}/contacts/add`, body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── REMOVE CONTACTS ───────────────────────────────────
listsResource
  .command("remove")
  .description("Remove contacts from a list (by email, ID, or all)")
  .argument("<listId>", "List ID")
  .option("--emails <emails>", "Comma-separated emails to remove")
  .option("--ids <ids>", "Comma-separated contact IDs to remove")
  .option("--all", "Remove all contacts from the list", false)
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli lists remove 3 --emails a@b.com")
  .action(async (listId: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.all) {
        body.all = true;
      } else {
        const emails = emailList(opts.emails);
        if (emails) body.emails = emails;
        const ids = numIds(opts.ids);
        if (ids) body.ids = ids;
      }
      const data = await client.post(`/contacts/lists/${listId}/contacts/remove`, body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
