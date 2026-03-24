# How does rustledger compare?

Plain text accounting tools at a glance.

<BenchmarkTable />

## Performance Benchmarks

<div class="benchmark-charts">
  <img src="https://raw.githubusercontent.com/rustledger/rustledger/benchmarks/.github/badges/validation-chart.svg" alt="Validation Benchmark" class="benchmark-chart" />
  <img src="https://raw.githubusercontent.com/rustledger/rustledger/benchmarks/.github/badges/balance-chart.svg" alt="Balance Report Benchmark" class="benchmark-chart" />
</div>

<p class="benchmark-note">Benchmarks run nightly on 10K transaction ledgers. <a href="https://github.com/rustledger/rustledger/actions/workflows/bench.yml">View workflow →</a></p>

<details class="benchmark-details">
<summary><strong>Benchmark details</strong></summary>

**What's measured:**
- **Validation**: Parse ledger + validate (balance assertions, account opens, etc.)
- **Balance Report**: Parse + compute all account balances

**Memory efficiency:**
rustledger typically uses 3-5x less memory than Python beancount thanks to Rust's zero-cost abstractions and efficient data structures.

**Run locally:**
```bash
# Quick comparison (requires nix)
nix develop .#bench
./scripts/bench.sh

# Criterion micro-benchmarks
cargo bench -p rustledger-core
cargo bench -p rustledger-parser
```

See [BENCHMARKING.md](https://github.com/rustledger/rustledger/blob/main/docs/BENCHMARKING.md) for detailed benchmark documentation.

</details>

<style>
.benchmark-charts {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
}

.benchmark-chart {
  width: 100%;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.benchmark-note {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: -0.5rem;
}

.benchmark-note a {
  color: #f97316;
}

.benchmark-details {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.benchmark-details summary {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
}

.benchmark-details summary:hover {
  color: white;
}
</style>
