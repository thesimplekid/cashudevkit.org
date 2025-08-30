# Getting Started with CDK

Welcome to the Cashu Dev Kit! This guide will help you set up your development environment and create your first Cashu application.

## What You'll Learn

- **System requirements** for CDK development
- **Installation process** for CDK and dependencies
- **Project setup** for a new Cashu application
- **Basic CDK usage** patterns

## System Requirements

CDK supports the following platforms:
- **macOS** (Intel and Apple Silicon)
- **Linux** (x86_64 and ARM64)
- **Windows** (via WSL recommended)

### Prerequisites

- **Rust 1.70+**: Install from [rustup.rs](https://rustup.rs/)
- **Git**: For cloning repositories and version control

### Verify Installation

```bash
# Check Rust version
rustc --version

# Check Cargo version  
cargo --version
```

## Creating Your First CDK Project

### 1. Initialize a New Project

```bash
cargo new my-cashu-app
cd my-cashu-app
```

### 2. Add CDK Dependencies

Add these dependencies to your `Cargo.toml`:

```toml
[dependencies]
# Core CDK functionality
cdk = { version = "*", default-features = false, features = ["wallet"] }

# Storage backend
cdk-sqlite = { version = "*", features = ["wallet"] }

# Async runtime
tokio = { version = "1", features = ["full"] }

# Random number generation
rand = "0.8"

# Error handling
anyhow = "1.0"
```

### 3. Basic CDK Usage

Create `src/main.rs` with this minimal example:

```rust
use std::sync::Arc;
use cdk::nuts::CurrencyUnit;
use cdk::wallet::Wallet;
use cdk::Amount;
use cdk_sqlite::wallet::memory;
use rand::random;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("🥜 Starting your first CDK application!");
    
    // Generate a random wallet seed
    let seed = random::<[u8; 64]>();
    
    // Configure wallet settings
    let mint_url = "https://fake.thesimplekid.dev";
    let unit = CurrencyUnit::Sat;
    
    // Create in-memory storage
    let localstore = Arc::new(memory::empty().await?);
    
    // Initialize the wallet
    let wallet = Wallet::new(mint_url, unit, localstore, seed, None)?;
    
    println!("✅ Wallet created successfully!");
    println!("📍 Mint URL: {}", mint_url);
    println!("💰 Currency: {}", unit);
    
    // Get wallet balance (should be 0 for new wallet)
    let balance = wallet.total_balance().await?;
    println!("💳 Current balance: {} sats", balance);
    
    Ok(())
}
```

### 4. Run Your Application

```bash
cargo run
```

Expected output:
```
🥜 Starting your first CDK application!
✅ Wallet created successfully!
📍 Mint URL: https://fake.thesimplekid.dev
💰 Currency: Sat
💳 Current balance: 0 sats
```

## Common CDK Features

### Feature Flags

CDK uses feature flags to include only the functionality you need:

```toml
[dependencies]
cdk = { 
    version = "*", 
    default-features = false, 
    features = [
        "wallet",      # Wallet functionality
        "mint",        # Mint operations
        "bolt12",      # BOLT12 support
        "bip353",      # BIP-353 support
        "auth",        # Authentication features
    ] 
}
```

### Storage Options

Choose the storage backend that fits your needs:

```toml
# In-memory storage (for testing)
cdk-sqlite = { version = "*", features = ["wallet"] }

# Persistent SQLite storage
cdk-sqlite = { version = "*", features = ["wallet", "mint"] }

# Custom storage backends available
```

### Logging Setup

Add structured logging to your application:

```toml
[dependencies]
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

```rust
use tracing_subscriber::EnvFilter;

// Set up logging
let env_filter = EnvFilter::new("info,cdk=debug");
tracing_subscriber::fmt().with_env_filter(env_filter).init();
```

## Development Workflow

### 1. Testing with Local Mints

For development, you might want to run a local mint:

```bash
# Example using nutshell (Python mint implementation)
git clone https://github.com/cashubtc/nutshell
cd nutshell
python -m poetry install
python -m poetry run mint
```

### 2. Using Test Mints

For quick testing, use public test mints:
- `https://fake.thesimplekid.dev`
- `https://testnut.cashu.space`

⚠️ **Never use test mints for real value!**

### 3. Environment Configuration

Use environment variables for configuration:

```rust
use std::env;

let mint_url = env::var("MINT_URL")
    .unwrap_or_else(|_| "https://fake.thesimplekid.dev".to_string());
```

```bash
# Set environment variables
export MINT_URL="https://your-mint.example.com"
export RUST_LOG="debug"

cargo run
```

## Next Steps

Now that you have CDK set up, explore these examples:

### Beginner Examples
- **[Basic Wallet](./basic-wallet.md)** - Create, fund, and use a simple wallet
- **[Single Mint Wallet](./single-mint-wallet.md)** - Complete wallet implementation

### Payment Examples  
- **[Mint Token](./mint-token.md)** - Detailed token minting process
- **[Melt Token](./melt-token.md)** - Convert tokens to Lightning payments

### Advanced Features
- **[P2PK Tokens](./p2pk.md)** - Cryptographically locked tokens
- **[BOLT12 Integration](./mint-token-bolt12.md)** - Modern Lightning features

## Getting Help

If you encounter issues:

### Community Support
- **Matrix Chat**: [#cdk:matrix.cashu.space](https://matrix.to/#/#cdk:matrix.cashu.space)
- **GitHub Issues**: [cashubtc/cdk](https://github.com/cashubtc/cdk/issues)

### Documentation
- **API Reference**: [/api-reference/](/api-reference/)
- **Examples**: Browse all examples in this section

### Common Issues

**Compilation Errors**
```bash
# Update Rust toolchain
rustup update

# Clean and rebuild
cargo clean && cargo build
```

**Network Issues**
```bash
# Check connectivity to mint
curl -I https://fake.thesimplekid.dev

# Use different mint URL if needed
```

**Missing Features**
```toml
# Ensure you have the required features enabled
cdk = { version = "*", features = ["wallet", "bolt12"] }
```

Ready to build amazing Cashu applications! 🚀
