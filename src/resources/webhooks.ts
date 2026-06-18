import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  type?: string;
  url?: string;
  events?: string;
  description?: string;
}

/** Parse a comma-separated list of event names */
function eventList(csv?: string): string[] | undefined {
  if (!csv) return undefined;
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

export const webhooksResource = new Command("webhooks").description("Manage webhooks");

// ── LIST ──────────────────────────────────────────────
webhooksResource
  .command("list")
  .description("List webhooks")
  .option("--type <type>", "Filter by type: marketing | transactional", "transactional")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  brevo-cli webhooks list --type marketing\n  brevo-cli webhooks list --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/webhooks", {
        ...(opts.type && { type: opts.type }),
      })) as { webhooks?: unknown[] };
      output(res.webhooks ?? res, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
webhooksResource
  .command("get")
  .description("Get a webhook by ID")
  .argument("<webhookId>", "Webhook ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  brevo-cli webhooks get 5")
  .action(async (webhookId: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/webhooks/${webhookId}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
webhooksResource
  .command("create")
  .description("Create a webhook")
  .requiredOption("--url <url>", "Endpoint URL to call")
  .requiredOption("--events <events>", "Comma-separated events, e.g. delivered,opened,click")
  .option("--type <type>", "Webhook type: marketing | transactional", "transactional")
  .option("--description <text>", "Webhook description")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  brevo-cli webhooks create --url https://acme.com/hook --events delivered,opened --type transactional",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {
        url: opts.url,
        events: eventList(opts.events),
        type: opts.type,
      };
      if (opts.description) body.description = opts.description;
      const data = await client.post("/webhooks", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
webhooksResource
  .command("update")
  .description("Update a webhook")
  .argument("<webhookId>", "Webhook ID")
  .option("--url <url>", "New endpoint URL")
  .option("--events <events>", "New comma-separated events")
  .option("--description <text>", "New description")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli webhooks update 5 --events delivered,opened,click")
  .action(async (webhookId: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.url) body.url = opts.url;
      const events = eventList(opts.events);
      if (events) body.events = events;
      if (opts.description) body.description = opts.description;
      await client.put(`/webhooks/${webhookId}`, body);
      output({ updated: true, webhookId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
webhooksResource
  .command("delete")
  .description("Delete a webhook")
  .argument("<webhookId>", "Webhook ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli webhooks delete 5")
  .action(async (webhookId: string, opts: ActionOpts) => {
    try {
      await client.delete(`/webhooks/${webhookId}`);
      output({ deleted: true, webhookId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
