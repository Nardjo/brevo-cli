# brevo-cli

CLI for the [Brevo](https://www.brevo.com) (ex-Sendinblue) API v3: contacts, lists, folders, senders, transactional email & SMS, templates, campaigns and webhooks. Made with [api2cli.dev](https://api2cli.dev).

## Install

```bash
npx api2cli install Nardjo/brevo-cli
```

This clones the repo, builds the CLI, links it to your PATH, and installs the AgentSkill to your coding agents.

## Install AgentSkill only

```bash
npx skills add Nardjo/brevo-cli
```

## Authentication

Get an API v3 key from Brevo: **Settings > SMTP & API > API Keys** (it starts with `xkeysib-`).

```bash
brevo-cli auth set "xkeysib-..."
brevo-cli auth test
```

The key is sent in the `api-key` header and stored in `~/.config/tokens/brevo-cli.txt` (chmod 600).

## Usage

```bash
brevo-cli --help                     # List all resources and global flags
brevo-cli <resource> --help          # List all actions for a resource
brevo-cli <resource> <action> --help # Show flags for a specific action
```

Always pass `--json` when calling commands programmatically.

## Resources

### account

| Command | Description |
|---------|-------------|
| `brevo-cli account get --json` | Get account details: plan, credits, company info |

### contacts

| Command | Description |
|---------|-------------|
| `brevo-cli contacts list --limit 50 --json` | List contacts (`--offset`, `--sort asc\|desc`, `--modified-since`) |
| `brevo-cli contacts get <email-or-id> --json` | Get a contact by email or numeric ID |
| `brevo-cli contacts create --email a@b.com --list-ids 3,5 --attributes '{"FIRSTNAME":"Ada"}' --json` | Create / upsert a contact |
| `brevo-cli contacts update <email-or-id> --attributes '{"FIRSTNAME":"John"}' --json` | Update a contact |
| `brevo-cli contacts delete <email-or-id> --json` | Delete a contact |

### lists

| Command | Description |
|---------|-------------|
| `brevo-cli lists list --json` | List all contact lists |
| `brevo-cli lists get <listId> --json` | Get a list by ID |
| `brevo-cli lists create --name "Newsletter" --folder-id 1 --json` | Create a list in a folder |
| `brevo-cli lists update <listId> --name "VIP" --json` | Rename or move a list |
| `brevo-cli lists delete <listId> --json` | Delete a list |
| `brevo-cli lists contacts <listId> --json` | List contacts inside a list |
| `brevo-cli lists add <listId> --emails a@b.com,c@d.com --json` | Add contacts to a list |
| `brevo-cli lists remove <listId> --emails a@b.com --json` | Remove contacts (or `--all`) |

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
| `brevo-cli senders create --name "Support" --email support@acme.com --json` | Create a sender |
| `brevo-cli senders update <senderId> --name "Sales" --json` | Update a sender |
| `brevo-cli senders delete <senderId> --json` | Delete a sender |

### email

| Command | Description |
|---------|-------------|
| `brevo-cli email send --to a@b.com --sender-email me@acme.com --subject "Hi" --html "<h1>Hello</h1>" --json` | Send a transactional email |
| `brevo-cli email send --to a@b.com --template-id 12 --params '{"name":"Ada"}' --json` | Send using a template + params |
| `brevo-cli email events --days 7 --event bounces --json` | List transactional email events |

### templates

| Command | Description |
|---------|-------------|
| `brevo-cli templates list --status true --json` | List (active) email templates |
| `brevo-cli templates get <templateId> --json` | Get a template by ID |
| `brevo-cli templates create --name Welcome --subject "Hi" --sender-email me@acme.com --html "<h1>Hi</h1>" --active --json` | Create a template |
| `brevo-cli templates update <templateId> --subject "New" --json` | Update a template |
| `brevo-cli templates delete <templateId> --json` | Delete a template |
| `brevo-cli templates send-test <templateId> --to me@acme.com --json` | Send a test of a template |

### campaigns

| Command | Description |
|---------|-------------|
| `brevo-cli campaigns list --status draft --json` | List email campaigns |
| `brevo-cli campaigns get <campaignId> --json` | Get a campaign by ID |
| `brevo-cli campaigns create --name "July" --subject "Hello" --sender-email me@acme.com --html "<h1>Hi</h1>" --list-ids 3,5 --json` | Create a campaign |
| `brevo-cli campaigns update <campaignId> --subject "New" --json` | Update a campaign |
| `brevo-cli campaigns delete <campaignId> --json` | Delete a campaign |
| `brevo-cli campaigns send <campaignId> --json` | Send a campaign immediately |

### sms

| Command | Description |
|---------|-------------|
| `brevo-cli sms send --sender Acme --recipient +33612345678 --content "Code: 1234" --json` | Send a transactional SMS |
| `brevo-cli sms events --days 7 --event delivered --json` | List transactional SMS events |

### webhooks

| Command | Description |
|---------|-------------|
| `brevo-cli webhooks list --type transactional --json` | List webhooks |
| `brevo-cli webhooks get <webhookId> --json` | Get a webhook by ID |
| `brevo-cli webhooks create --url https://acme.com/hook --events delivered,opened --json` | Create a webhook |
| `brevo-cli webhooks update <webhookId> --events delivered,opened,click --json` | Update a webhook |
| `brevo-cli webhooks delete <webhookId> --json` | Delete a webhook |

## Output Format

`--json` returns a standardized envelope:

```json
{ "ok": true, "data": { }, "meta": { "total": 42 } }
```

On error: `{ "ok": false, "error": { "code": 401, "message": "...", "suggestion": "..." } }`

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 = success, 1 = API error, 2 = usage error
