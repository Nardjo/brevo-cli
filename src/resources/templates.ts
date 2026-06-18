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
  status?: string;
  name?: string;
  subject?: string;
  html?: string;
  senderEmail?: string;
  senderName?: string;
  replyTo?: string;
  tag?: string;
  active?: boolean;
  to?: string;
}

/** Parse a comma-separated list of emails */
function emailList(csv?: string): string[] | undefined {
  if (!csv) return undefined;
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

export const templatesResource = new Command("templates").description(
  "Manage transactional email templates",
);

// ── LIST ──────────────────────────────────────────────
templatesResource
  .command("list")
  .description("List transactional email templates")
  .option("--limit <n>", "Max results (max 1000)", "50")
  .option("--offset <n>", "Index of the first item", "0")
  .option("--sort <dir>", "Sort by creation date: asc | desc", "desc")
  .option("--status <bool>", "Filter by active status: true | false")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  brevo-cli templates list --fields id,name,subject,isActive\n  brevo-cli templates list --status true --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/smtp/templates", {
        limit: opts.limit ?? "50",
        offset: opts.offset ?? "0",
        ...(opts.sort && { sort: opts.sort }),
        ...(opts.status && { templateStatus: opts.status }),
      })) as { templates?: unknown[] };
      output(res.templates ?? res, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
templatesResource
  .command("get")
  .description("Get a template by ID")
  .argument("<templateId>", "Template ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  brevo-cli templates get 12")
  .action(async (templateId: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/smtp/templates/${templateId}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
templatesResource
  .command("create")
  .description("Create a transactional email template")
  .requiredOption("--name <name>", "Template name")
  .requiredOption("--subject <subject>", "Email subject")
  .requiredOption("--sender-email <email>", "Sender email address")
  .option("--sender-name <name>", "Sender display name")
  .option("--html <html>", "HTML content of the template")
  .option("--reply-to <email>", "Reply-to email address")
  .option("--tag <tag>", "Tag for the template")
  .option("--active", "Mark the template as active", false)
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  brevo-cli templates create --name Welcome --subject 'Hi {{params.name}}' --sender-email me@acme.com --html '<h1>Hi</h1>' --active",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {
        templateName: opts.name,
        subject: opts.subject,
        sender: {
          email: opts.senderEmail,
          ...(opts.senderName && { name: opts.senderName }),
        },
      };
      if (opts.html) body.htmlContent = opts.html;
      if (opts.replyTo) body.replyTo = opts.replyTo;
      if (opts.tag) body.tag = opts.tag;
      if (opts.active) body.isActive = true;
      const data = await client.post("/smtp/templates", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
templatesResource
  .command("update")
  .description("Update a transactional email template")
  .argument("<templateId>", "Template ID")
  .option("--name <name>", "New template name")
  .option("--subject <subject>", "New subject")
  .option("--sender-email <email>", "New sender email")
  .option("--sender-name <name>", "New sender display name")
  .option("--html <html>", "New HTML content")
  .option("--reply-to <email>", "New reply-to address")
  .option("--tag <tag>", "New tag")
  .option("--active <bool>", "Set active status: true | false")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli templates update 12 --subject 'Updated subject'")
  .action(async (templateId: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.templateName = opts.name;
      if (opts.subject) body.subject = opts.subject;
      if (opts.senderEmail || opts.senderName) {
        body.sender = {
          ...(opts.senderEmail && { email: opts.senderEmail }),
          ...(opts.senderName && { name: opts.senderName }),
        };
      }
      if (opts.html) body.htmlContent = opts.html;
      if (opts.replyTo) body.replyTo = opts.replyTo;
      if (opts.tag) body.tag = opts.tag;
      if (opts.active !== undefined) body.isActive = opts.active === "true";
      await client.put(`/smtp/templates/${templateId}`, body);
      output({ updated: true, templateId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
templatesResource
  .command("delete")
  .description("Delete a transactional email template")
  .argument("<templateId>", "Template ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli templates delete 12")
  .action(async (templateId: string, opts: ActionOpts) => {
    try {
      await client.delete(`/smtp/templates/${templateId}`);
      output({ deleted: true, templateId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── SEND TEST ─────────────────────────────────────────
templatesResource
  .command("send-test")
  .description("Send a test of a template to specific emails")
  .argument("<templateId>", "Template ID")
  .requiredOption("--to <emails>", "Comma-separated recipient emails")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli templates send-test 12 --to me@acme.com")
  .action(async (templateId: string, opts: ActionOpts) => {
    try {
      await client.post(`/smtp/templates/${templateId}/sendTest`, {
        emailTo: emailList(opts.to),
      });
      output({ sent: true, templateId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
