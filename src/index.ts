#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { accountResource } from "./resources/account.js";
import { contactsResource } from "./resources/contacts.js";
import { listsResource } from "./resources/lists.js";
import { foldersResource } from "./resources/folders.js";
import { sendersResource } from "./resources/senders.js";
import { emailResource } from "./resources/email.js";
import { templatesResource } from "./resources/templates.js";
import { campaignsResource } from "./resources/campaigns.js";
import { smsResource } from "./resources/sms.js";
import { webhooksResource } from "./resources/webhooks.js";

const program = new Command();

program
  .name("brevo-cli")
  .description("CLI for the Brevo API (contacts, email, SMS, campaigns)")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

// Built-in commands
program.addCommand(authCommand);

// Resources
program.addCommand(accountResource);
program.addCommand(contactsResource);
program.addCommand(listsResource);
program.addCommand(foldersResource);
program.addCommand(sendersResource);
program.addCommand(emailResource);
program.addCommand(templatesResource);
program.addCommand(campaignsResource);
program.addCommand(smsResource);
program.addCommand(webhooksResource);

program.parse();
