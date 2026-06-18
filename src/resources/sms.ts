import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  sender?: string;
  recipient?: string;
  content?: string;
  tag?: string;
  limit?: string;
  offset?: string;
  days?: string;
  phoneNumber?: string;
  event?: string;
  sort?: string;
}

export const smsResource = new Command("sms").description(
  "Send transactional SMS and inspect SMS events",
);

// ── SEND ──────────────────────────────────────────────
smsResource
  .command("send")
  .description("Send a transactional SMS")
  .requiredOption("--sender <name>", "Sender name (max 11 chars) or number")
  .requiredOption("--recipient <number>", "Recipient phone in E.164 format, e.g. +33612345678")
  .requiredOption("--content <text>", "SMS message content")
  .option("--tag <tag>", "Tag for tracking")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  brevo-cli sms send --sender Acme --recipient +33612345678 --content 'Your code is 1234'",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {
        sender: opts.sender,
        recipient: opts.recipient,
        content: opts.content,
      };
      if (opts.tag) body.tag = opts.tag;
      const data = await client.post("/transactionalSMS/sms", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── EVENTS ────────────────────────────────────────────
smsResource
  .command("events")
  .description("List transactional SMS events (sent, delivered, hardBounces...)")
  .option("--limit <n>", "Max results (max 100)", "50")
  .option("--offset <n>", "Index of the first item", "0")
  .option("--days <n>", "Number of days in the past to include")
  .option("--phone-number <number>", "Filter by recipient phone number")
  .option("--event <type>", "Filter by event: sent, delivered, hardBounces, softBounces...")
  .option("--sort <dir>", "Sort by date: asc | desc", "desc")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  brevo-cli sms events --days 7\n  brevo-cli sms events --event delivered --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/transactionalSMS/statistics/events", {
        limit: opts.limit ?? "50",
        offset: opts.offset ?? "0",
        ...(opts.days && { days: opts.days }),
        ...(opts.phoneNumber && { phoneNumber: opts.phoneNumber }),
        ...(opts.event && { event: opts.event }),
        ...(opts.sort && { sort: opts.sort }),
      })) as { events?: unknown[] };
      output(res.events ?? res, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
