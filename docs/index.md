# rustledger

A modern, blazing-fast implementation of [Beancount](https://beancount.github.io/) in Rust.

## Features

- **25x faster** than Python Beancount
- **Full compatibility** with Beancount syntax
- **20+ built-in plugins** for validation and transformation
- **7 booking methods** including FIFO, LIFO, and average cost
- **BQL query engine** for powerful data analysis
- **Language Server** for editor integration

## Quick Start

Install with Cargo:

```sh
cargo install rustledger
```

Or Homebrew:

```sh
brew install rustledger/tap/rustledger
```

Then check your ledger:

```sh
rledger check ledger.beancount
```

## Next Steps

- [Installation](/getting-started/installation) - Detailed installation instructions
- [Quick Start](/getting-started/quick-start) - Get up and running in 5 minutes
- [Why rustledger?](/about/why-rustledger) - Learn what makes rustledger different
