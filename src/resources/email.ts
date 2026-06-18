import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  senderEmail?: string;
  senderName?: string;
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  params?: string;
  replyTo?: string;
  tag?: string;
  limit?: string;
  offset?: string;
  days?: string;
  email?: string;
  event?: string;
  sort?: string;
}

/** Build a Brevo recipient array from a comma-separated email list */
function recipients(csv?: string): { email: string }[] | undefined {
  if (!csv) return undefined;
  const list = csv.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list.map((email) => ({ email })) : undefined;
}

export const emailResource = new Command("email").description(
  "Send transactional emails and inspect email events",
);

// ── SEND ──────────────────────────────────────────────
emailResource
  .command("send")
  .description("Send a transactional email")
  .requiredOption("--to <emails>", "Comma-separated recipient emails")
  .option("--sender-email <email>", "Sender email (or configure a default sender)")
  .option("--sender-name <name>", "Sender display name")
  .option("--subject <subject>", "Email subject")
  .option("--html <html>", "HTML body content")
  .option("--text <text>", "Plain-text body content")
  .option("--template-id <id>", "Use a transactional template ID instead of html/subject")
  .option("--params <json>", 'Template params as JSON, e.g. \'{"name":"Ada"}\'')
  .option("--cc <emails>", "Comma-separated CC emails")
  .option("--bcc <emails>", "Comma-separated BCC emails")
  .option("--reply-to <email>", "Reply-to email address")
  .option("--tag <tag>", "Tag for tracking")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  brevo-cli email send --to a@b.com --sender-email me@acme.com --subject 'Hi' --html '<h1>Hello</h1>'\n  brevo-cli email send --to a@b.com --template-id 12 --params '{\"name\":\"Ada\"}'",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = { to: recipients(opts.to) };
      if (opts.senderEmail) {
        body.sender = {
          email: opts.senderEmail,
          ...(opts.senderName && { name: opts.senderName }),
        };
      }
      if (opts.subject) body.subject = opts.subject;
      if (opts.html) body.htmlContent = opts.html;
      if (opts.text) body.textContent = opts.text;
      if (opts.templateId) body.templateId = Number(opts.templateId);
      if (opts.params) body.params = JSON.parse(opts.params);
      const cc = recipients(opts.cc);
      if (cc) body.cc = cc;
      const bcc = recipients(opts.bcc);
      if (bcc) body.bcc = bcc;
      if (opts.replyTo) body.replyTo = { email: opts.replyTo };
      if (opts.tag) body.tags = [opts.tag];
      const data = await client.post("/smtp/email", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── EVENTS ────────────────────────────────────────────
emailResource
  .command("events")
  .description("List transactional email events (delivered, opened, bounced...)")
  .option("--limit <n>", "Max results (max 100)", "50")
  .option("--offset <n>", "Index of the first item", "0")
  .option("--days <n>", "Number of days in the past to include")
  .option("--email <email>", "Filter by recipient email")
  .option("--event <type>", "Filter by event: delivered, opened, clicks, bounces...")
  .option("--sort <dir>", "Sort by date: asc | desc", "desc")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  brevo-cli email events --days 7\n  brevo-cli email events --event bounces --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/smtp/statistics/events", {
        limit: opts.limit ?? "50",
        offset: opts.offset ?? "0",
        ...(opts.days && { days: opts.days }),
        ...(opts.email && { email: opts.email }),
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
