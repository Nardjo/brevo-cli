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
  type?: string;
  status?: string;
  name?: string;
  subject?: string;
  senderEmail?: string;
  senderName?: string;
  html?: string;
  listIds?: string;
  scheduledAt?: string;
}

/** Parse a comma-separated list of numeric IDs */
function numIds(csv?: string): number[] | undefined {
  if (!csv) return undefined;
  return csv.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
}

export const campaignsResource = new Command("campaigns").description("Manage email campaigns");

// ── LIST ──────────────────────────────────────────────
campaignsResource
  .command("list")
  .description("List email campaigns")
  .option("--limit <n>", "Max results (max 1000)", "50")
  .option("--offset <n>", "Index of the first item", "0")
  .option("--sort <dir>", "Sort by creation date: asc | desc", "desc")
  .option("--type <type>", "Filter by type: classic | trigger")
  .option("--status <status>", "Filter by status: sent, draft, queued, suspended...")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  brevo-cli campaigns list --status draft\n  brevo-cli campaigns list --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/emailCampaigns", {
        limit: opts.limit ?? "50",
        offset: opts.offset ?? "0",
        ...(opts.sort && { sort: opts.sort }),
        ...(opts.type && { type: opts.type }),
        ...(opts.status && { status: opts.status }),
      })) as { campaigns?: unknown[] };
      output(res.campaigns ?? res, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
campaignsResource
  .command("get")
  .description("Get an email campaign by ID")
  .argument("<campaignId>", "Campaign ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  brevo-cli campaigns get 42")
  .action(async (campaignId: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/emailCampaigns/${campaignId}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
campaignsResource
  .command("create")
  .description("Create an email campaign")
  .requiredOption("--name <name>", "Campaign name")
  .requiredOption("--subject <subject>", "Email subject")
  .requiredOption("--sender-email <email>", "Sender email address")
  .option("--sender-name <name>", "Sender display name")
  .option("--html <html>", "HTML content of the campaign")
  .option("--list-ids <ids>", "Comma-separated recipient list IDs")
  .option("--scheduled-at <date>", "Schedule date (ISO 8601, e.g. 2026-07-01T09:00:00Z)")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  brevo-cli campaigns create --name 'July News' --subject 'Hello' --sender-email me@acme.com --html '<h1>Hi</h1>' --list-ids 3,5",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {
        name: opts.name,
        subject: opts.subject,
        sender: {
          email: opts.senderEmail,
          ...(opts.senderName && { name: opts.senderName }),
        },
      };
      if (opts.html) body.htmlContent = opts.html;
      const listIds = numIds(opts.listIds);
      if (listIds) body.recipients = { listIds };
      if (opts.scheduledAt) body.scheduledAt = opts.scheduledAt;
      const data = await client.post("/emailCampaigns", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
campaignsResource
  .command("update")
  .description("Update an email campaign")
  .argument("<campaignId>", "Campaign ID")
  .option("--name <name>", "New campaign name")
  .option("--subject <subject>", "New subject")
  .option("--sender-email <email>", "New sender email")
  .option("--sender-name <name>", "New sender display name")
  .option("--html <html>", "New HTML content")
  .option("--list-ids <ids>", "New comma-separated recipient list IDs")
  .option("--scheduled-at <date>", "New schedule date (ISO 8601)")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli campaigns update 42 --subject 'New subject'")
  .action(async (campaignId: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.subject) body.subject = opts.subject;
      if (opts.senderEmail || opts.senderName) {
        body.sender = {
          ...(opts.senderEmail && { email: opts.senderEmail }),
          ...(opts.senderName && { name: opts.senderName }),
        };
      }
      if (opts.html) body.htmlContent = opts.html;
      const listIds = numIds(opts.listIds);
      if (listIds) body.recipients = { listIds };
      if (opts.scheduledAt) body.scheduledAt = opts.scheduledAt;
      await client.put(`/emailCampaigns/${campaignId}`, body);
      output({ updated: true, campaignId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
campaignsResource
  .command("delete")
  .description("Delete an email campaign")
  .argument("<campaignId>", "Campaign ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli campaigns delete 42")
  .action(async (campaignId: string, opts: ActionOpts) => {
    try {
      await client.delete(`/emailCampaigns/${campaignId}`);
      output({ deleted: true, campaignId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── SEND NOW ──────────────────────────────────────────
campaignsResource
  .command("send")
  .description("Send an email campaign immediately")
  .argument("<campaignId>", "Campaign ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli campaigns send 42")
  .action(async (campaignId: string, opts: ActionOpts) => {
    try {
      await client.post(`/emailCampaigns/${campaignId}/sendNow`);
      output({ sent: true, campaignId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
