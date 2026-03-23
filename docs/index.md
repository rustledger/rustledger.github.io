# rustledger

A modern, blazing-fast implementation of [Beancount](https://beancount.github.io/) in Rust.

<GitHubStars />

## Features

- **25x faster** than Python Beancount
- **Full compatibility** with Beancount syntax
- **20+ built-in plugins** for validation and transformation
- **7 booking methods** including FIFO, LIFO, and average cost
- **BQL query engine** for powerful data analysis
- **Language Server** for editor integration

## Installation

<InstallTabs />

## Quick Start

After installing, check your ledger:

```sh
rledger check ledger.beancount
```

Run a query:

```sh
rledger query ledger.beancount "SELECT account, sum(position) GROUP BY account"
```

## Next Steps

- [Quick Start](/getting-started/quick-start) - Get up and running in 5 minutes
- [Why rustledger?](/about/why-rustledger) - Learn what makes rustledger different
- [Commands](/commands/) - Full command reference
