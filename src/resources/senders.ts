import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  name?: string;
  email?: string;
}

export const sendersResource = new Command("senders").description("Manage sending identities");

// ── LIST ──────────────────────────────────────────────
sendersResource
  .command("list")
  .description("List all senders")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  brevo-cli senders list\n  brevo-cli senders list --json")
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/senders")) as { senders?: unknown[] };
      output(res.senders ?? res, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
sendersResource
  .command("create")
  .description("Create a sender (requires verification)")
  .requiredOption("--name <name>", "Sender display name")
  .requiredOption("--email <email>", "Sender email address")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli senders create --name 'Support' --email support@acme.com")
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.post("/senders", { name: opts.name, email: opts.email });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
sendersResource
  .command("update")
  .description("Update a sender")
  .argument("<senderId>", "Sender ID")
  .option("--name <name>", "New display name")
  .option("--email <email>", "New email address")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli senders update 1 --name 'Sales Team'")
  .action(async (senderId: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.email) body.email = opts.email;
      await client.put(`/senders/${senderId}`, body);
      output({ updated: true, senderId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
sendersResource
  .command("delete")
  .description("Delete a sender")
  .argument("<senderId>", "Sender ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli senders delete 1")
  .action(async (senderId: string, opts: ActionOpts) => {
    try {
      await client.delete(`/senders/${senderId}`);
      output({ deleted: true, senderId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
