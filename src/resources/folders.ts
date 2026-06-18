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
}

export const foldersResource = new Command("folders").description("Manage contact folders");

// ── LIST ──────────────────────────────────────────────
foldersResource
  .command("list")
  .description("List all contact folders")
  .option("--limit <n>", "Max results (max 50)", "20")
  .option("--offset <n>", "Index of the first item", "0")
  .option("--sort <dir>", "Sort by creation date: asc | desc", "desc")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  brevo-cli folders list\n  brevo-cli folders list --json")
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/contacts/folders", {
        limit: opts.limit ?? "20",
        offset: opts.offset ?? "0",
        ...(opts.sort && { sort: opts.sort }),
      })) as { folders?: unknown[] };
      output(res.folders ?? res, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
foldersResource
  .command("get")
  .description("Get a contact folder by ID")
  .argument("<folderId>", "Folder ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  brevo-cli folders get 1")
  .action(async (folderId: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/contacts/folders/${folderId}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
foldersResource
  .command("create")
  .description("Create a contact folder")
  .requiredOption("--name <name>", "Folder name")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli folders create --name 'Campaigns 2026'")
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.post("/contacts/folders", { name: opts.name });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
foldersResource
  .command("update")
  .description("Rename a contact folder")
  .argument("<folderId>", "Folder ID")
  .requiredOption("--name <name>", "New folder name")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli folders update 1 --name 'Archive'")
  .action(async (folderId: string, opts: ActionOpts) => {
    try {
      await client.put(`/contacts/folders/${folderId}`, { name: opts.name });
      output({ updated: true, folderId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
foldersResource
  .command("delete")
  .description("Delete a contact folder")
  .argument("<folderId>", "Folder ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli folders delete 1")
  .action(async (folderId: string, opts: ActionOpts) => {
    try {
      await client.delete(`/contacts/folders/${folderId}`);
      output({ deleted: true, folderId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
