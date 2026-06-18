---
name: brevo
description: "Manage Brevo (ex-Sendinblue) via CLI - account, contacts, lists, folders, senders, email, templates, campaigns, sms, webhooks. Use when user mentions 'brevo', 'sendinblue', 'send transactional email', 'send SMS', 'email campaign', 'contact list', 'email template', 'newsletter', 'marketing contacts', or wants to interact with the Brevo API."
category: email
---

# brevo-cli

## When To Use This Skill

Use the `brevo-cli` skill when you need to:

- Send transactional emails or SMS and inspect their delivery events (delivered, opened, bounced)
- List, create, update, or delete marketing contacts and organize them into lists and folders
- Add or remove contacts from a list in bulk
- Manage email templates and email campaigns (create, schedule, send)
- Manage sending identities (senders) and webhooks for event notifications
- Inspect account state: plan, credits, and company details
- Automate multi-step Brevo jobs using stable, parseable `--json` output

## Capabilities

- **Read operations**: list/get contacts, lists, folders, senders, templates, campaigns, webhooks; inspect account plan and credits; query email/SMS event statistics.
- **Write operations**: create/update/delete contacts, lists, folders, senders, templates, campaigns, webhooks; add/remove contacts to/from lists; send transactional email and SMS; send a campaign now; send a template test.
- **Email/SMS specifics**: send a transactional email with raw HTML or a template ID plus dynamic `params`; send a transactional SMS to an E.164 number; filter delivery events by type, date range, recipient.
- **Automation**: stable `--json` envelope for chaining with other tools.
- **Discovery**: `--help` works at CLI, resource, and action level.

## Common Use Cases

- "Send a transactional email to john@acme.com using template 12 with the name param set to John."
- "Add these three emails to list 3, then show how many subscribers the list now has."
- "List the contacts modified in the last 7 days and export them as CSV."
- "Create a draft email campaign for lists 3 and 5, then send it now."
- "Show the email events for bounces over the last 14 days as JSON."
- "Send a verification SMS to +33612345678 from sender 'Acme'."

## Setup

If `brevo-cli` is not found, install and build it:
```bash
bun --version || curl -fsSL https://bun.sh/install | bash
npx api2cli bundle brevo
npx api2cli link brevo
```

`api2cli link` adds `~/.local/bin` to PATH automatically. The CLI is available in the next command.

Always use the `--json` flag when calling commands programmatically.

## Working Rules

- Always use `--json` for agent-driven calls so downstream steps can parse the result.
- Start with `--help` if the exact action or flags are unclear instead of guessing.
- Prefer read commands first when you need to inspect current state before mutating data.
- Brevo IDs are numeric; contacts are addressable by **email or numeric ID** (`contacts get`, `update`, `delete`).
- JSON-valued flags (`--attributes`, `--params`) expect a single-quoted JSON string, e.g. `'{"FIRSTNAME":"Ada"}'`.
- Comma-separated flags (`--list-ids 3,5`, `--to a@b.com,c@d.com`, `--events delivered,opened`) take no spaces.

## Authentication

```bash
brevo-cli auth set "xkeysib-..."   # your Brevo API v3 key (Settings > SMTP & API > API Keys)
brevo-cli auth test
```

Auth commands: `auth set <token>`, `auth show`, `auth remove`, `auth test`

The key is sent in the `api-key` header. Token is stored in `~/.config/tokens/brevo-cli.txt` (chmod 600).

## Resources

### account

| Command | Description |
|---------|-------------|
| `brevo-cli account get --json` | Get account details: plan, credits, company info |
| `brevo-cli account get --fields email,plan --json` | Get only specific keys |

### contacts

| Command | Description |
|---------|-------------|
| `brevo-cli contacts list --limit 50 --json` | List contacts (paginate with `--offset`, sort `asc`/`desc`) |
| `brevo-cli contacts list --modified-since 2026-06-01T00:00:00Z --json` | List contacts modified since a date |
| `brevo-cli contacts get <email-or-id> --json` | Get a contact by email or numeric ID |
| `brevo-cli contacts create --email a@b.com --list-ids 3,5 --json` | Create a contact and add to lists |
| `brevo-cli contacts create --email a@b.com --attributes '{"FIRSTNAME":"Ada"}' --update-enabled --json` | Create or upsert with attributes |
| `brevo-cli contacts update <email-or-id> --attributes '{"FIRSTNAME":"John"}' --json` | Update contact attributes |
| `brevo-cli contacts update <email-or-id> --unlink-list-ids 3 --email-blacklisted --json` | Remove from list / blacklist |
| `brevo-cli contacts delete <email-or-id> --json` | Delete a contact |

### lists

| Command | Description |
|---------|-------------|
| `brevo-cli lists list --json` | List all contact lists |
| `brevo-cli lists get <listId> --json` | Get a list by ID |
| `brevo-cli lists create --name "Newsletter" --folder-id 1 --json` | Create a list in a folder |
| `brevo-cli lists update <listId> --name "VIP" --json` | Rename or move a list |
| `brevo-cli lists delete <listId> --json` | Delete a list |
| `brevo-cli lists contacts <listId> --limit 100 --json` | List the contacts inside a list |
| `brevo-cli lists add <listId> --emails a@b.com,c@d.com --json` | Add contacts to a list (by email or `--ids`) |
| `brevo-cli lists remove <listId> --emails a@b.com --json` | Remove contacts from a list (or `--all`) |

### folders

| Command | Description |
|---------|-------------|
| `brevo-cli folders list --json` | List all contact folders |
| `brevo-cli folders get <folderId> --json` | Get a folder by ID |
| `brevo-cli folders create --name "Campaigns 2026" --json` | Create a folder |
| `brevo-cli folders update <folderId> --name "Archive" --json` | Rename a folder |
| `brevo-cli folders delete <folderId> --json` | Delete a folder |

### senders

| Command | Description |
|---------|-------------|
| `brevo-cli senders list --json` | List all senders |
| `brevo-cli senders create --name "Support" --email support@acme.com --json` | Create a sender (needs verification) |
| `brevo-cli senders update <senderId> --name "Sales" --json` | Update a sender |
| `brevo-cli senders delete <senderId> --json` | Delete a sender |

### email

| Command | Description |
|---------|-------------|
| `brevo-cli email send --to a@b.com --sender-email me@acme.com --subject "Hi" --html "<h1>Hello</h1>" --json` | Send a transactional email (raw HTML) |
| `brevo-cli email send --to a@b.com --template-id 12 --params '{"name":"Ada"}' --json` | Send using a template + dynamic params |
| `brevo-cli email send --to a@b.com,c@d.com --cc x@y.com --reply-to me@acme.com --tag onboarding --json` | Send with cc/reply-to/tag |
| `brevo-cli email events --days 7 --json` | List email events from the last N days |
| `brevo-cli email events --event bounces --email a@b.com --json` | Filter events by type and recipient |

### templates

| Command | Description |
|---------|-------------|
| `brevo-cli templates list --limit 50 --json` | List transactional email templates |
| `brevo-cli templates list --status true --json` | List only active templates |
| `brevo-cli templates get <templateId> --json` | Get a template by ID |
| `brevo-cli templates create --name Welcome --subject "Hi {{params.name}}" --sender-email me@acme.com --html "<h1>Hi</h1>" --active --json` | Create a template |
| `brevo-cli templates update <templateId> --subject "New subject" --active true --json` | Update a template |
| `brevo-cli templates delete <templateId> --json` | Delete a template |
| `brevo-cli templates send-test <templateId> --to me@acme.com --json` | Send a test of a template |

### campaigns

| Command | Description |
|---------|-------------|
| `brevo-cli campaigns list --json` | List email campaigns |
| `brevo-cli campaigns list --status draft --json` | Filter campaigns by status |
| `brevo-cli campaigns get <campaignId> --json` | Get a campaign by ID |
| `brevo-cli campaigns create --name "July News" --subject "Hello" --sender-email me@acme.com --html "<h1>Hi</h1>" --list-ids 3,5 --json` | Create a campaign |
| `brevo-cli campaigns create ... --scheduled-at 2026-07-01T09:00:00Z --json` | Create a scheduled campaign |
| `brevo-cli campaigns update <campaignId> --subject "New subject" --json` | Update a campaign |
| `brevo-cli campaigns delete <campaignId> --json` | Delete a campaign |
| `brevo-cli campaigns send <campaignId> --json` | Send a campaign immediately |

### sms

| Command | Description |
|---------|-------------|
| `brevo-cli sms send --sender Acme --recipient +33612345678 --content "Your code is 1234" --json` | Send a transactional SMS |
| `brevo-cli sms send ... --tag otp --json` | Send an SMS with a tracking tag |
| `brevo-cli sms events --days 7 --json` | List SMS events from the last N days |
| `brevo-cli sms events --event delivered --phone-number +33612345678 --json` | Filter SMS events by type and number |

### webhooks

| Command | Description |
|---------|-------------|
| `brevo-cli webhooks list --type transactional --json` | List webhooks (or `--type marketing`) |
| `brevo-cli webhooks get <webhookId> --json` | Get a webhook by ID |
| `brevo-cli webhooks create --url https://acme.com/hook --events delivered,opened --type transactional --json` | Create a webhook |
| `brevo-cli webhooks update <webhookId> --events delivered,opened,click --json` | Update a webhook |
| `brevo-cli webhooks delete <webhookId> --json` | Delete a webhook |

## Output Format

`--json` returns a standardized envelope:
```json
{ "ok": true, "data": { ... }, "meta": { "total": 42 } }
```

On error: `{ "ok": false, "error": { "code": 401, "message": "...", "suggestion": "..." } }`

## Quick Reference

```bash
brevo-cli --help                     # List all resources and global flags
brevo-cli <resource> --help          # List all actions for a resource
brevo-cli <resource> <action> --help # Show flags for a specific action
```

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 = success, 1 = API error, 2 = usage error
