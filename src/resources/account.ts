import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
}

export const accountResource = new Command("account").description(
  "Inspect your Brevo account, plan and credits",
);

// ── GET ───────────────────────────────────────────────
accountResource
  .command("get")
  .description("Get account details: plan, credits, company info")
  .option("--fields <cols>", "Comma-separated keys to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  brevo-cli account get\n  brevo-cli account get --json")
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/account");
      output(data, { json: opts.json, format: opts.format, fields: opts.fields?.split(",") });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
