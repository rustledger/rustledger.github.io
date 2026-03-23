# Quick Start

Get up and running with rustfava in under 5 minutes.

## Opening a Ledger File

1. Launch rustfava
2. Click **Open File** or use `Cmd/Ctrl + O`
3. Select your `.beancount` file
4. Your ledger loads instantly

## Interface Overview

### Sidebar

- **Accounts** - Browse your chart of accounts
- **Income Statement** - View income and expenses
- **Balance Sheet** - See assets and liabilities
- **Journal** - Browse all transactions

### Main Area

The main area shows the selected report or view. Click on accounts or transactions to drill down.

### Status Bar

Shows validation status, file path, and rustfava version.

## Common Tasks

### View Account Balance

1. Click **Accounts** in the sidebar
2. Expand the account tree
3. Click on any account to see its transactions

### Run a Query

1. Press `Cmd/Ctrl + Q` or click the Query tab
2. Enter a BQL query, e.g., `SELECT account, sum(position) GROUP BY account`
3. Press Enter to run

### Filter by Date

Use the date picker in the toolbar to filter transactions to a specific period.

## Next Steps

- Learn about [keyboard shortcuts](/reference/shortcuts)
- Customize your [configuration](/reference/configuration)
