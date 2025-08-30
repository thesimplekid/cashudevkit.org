# Mint Token Example

This example demonstrates the detailed process of minting Cashu tokens using CDK, including proper logging setup and comprehensive error handling.

## What This Example Does

1. **Sets up detailed logging** for debugging and monitoring
2. **Creates a wallet** with memory-based storage
3. **Requests a mint quote** from the specified mint
4. **Waits for payment** and automatically mints tokens
5. **Creates a sendable token** for peer-to-peer transfers

## Key Features

- **Comprehensive logging** with filtered output for cleaner debugging
- **Error handling** using CDK's error types
- **Automatic token minting** upon payment confirmation
- **Token generation** ready for sharing with other users

## Code Example

```rust
use std::sync::Arc;
use std::time::Duration;

use cdk::error::Error;
use cdk::nuts::nut00::ProofsMethods;
use cdk::nuts::CurrencyUnit;
use cdk::wallet::{SendOptions, Wallet};
use cdk::Amount;
use cdk_sqlite::wallet::memory;
use rand::random;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let default_filter = "debug";

    let sqlx_filter = "sqlx=warn,hyper_util=warn,reqwest=warn,rustls=warn";

    let env_filter = EnvFilter::new(format!("{},{}", default_filter, sqlx_filter));

    // Parse input
    tracing_subscriber::fmt().with_env_filter(env_filter).init();

    // Initialize the memory store for the wallet
    let localstore = Arc::new(memory::empty().await?);

    // Generate a random seed for the wallet
    let seed = random::<[u8; 64]>();

    // Define the mint URL and currency unit
    let mint_url = "https://fake.thesimplekid.dev";
    let unit = CurrencyUnit::Sat;
    let amount = Amount::from(10);

    // Create a new wallet
    let wallet = Wallet::new(mint_url, unit, localstore, seed, None)?;

    let quote = wallet.mint_quote(amount, None).await?;
    let proofs = wallet
        .wait_and_mint_quote(
            quote,
            Default::default(),
            Default::default(),
            Duration::from_secs(10),
        )
        .await?;

    // Mint the received amount
    let receive_amount = proofs.total_amount()?;
    println!("Received {} from mint {}", receive_amount, mint_url);

    // Send a token with the specified amount
    let prepared_send = wallet.prepare_send(amount, SendOptions::default()).await?;
    let token = prepared_send.confirm(None).await?;
    println!("Token:");
    println!("{}", token);

    Ok(())
}
```

## Dependencies

Add these dependencies to your `Cargo.toml`:

```toml
[dependencies]
cdk = { version = "*", default-features = false, features = ["wallet"] }
cdk-sqlite = { version = "*", features = ["wallet"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

## Running This Example

1. Set up logging level (optional):

```bash
export RUST_LOG=debug
```

2. Run the example:

```bash
cargo run
```

## Expected Output

```
Received 10 from mint https://fake.thesimplekid.dev
Token:
cashuAeyJ0eXAiOiJib2x0MTEi... [full token string]
```

## Understanding the Output

- **Received amount**: Confirms successful minting of the requested tokens
- **Mint URL**: Shows which mint processed the request
- **Token string**: A Cashu token that can be shared and redeemed by others

## Logging Features

This example includes structured logging that filters out verbose logs from:
- **sqlx**: Database operations
- **hyper_util**: HTTP utilities
- **reqwest**: HTTP client operations
- **rustls**: TLS operations

This provides cleaner output while maintaining debug visibility for CDK operations.

## Error Handling

The example uses CDK's `Error` type for comprehensive error handling including:
- Network connectivity issues
- Mint communication failures
- Payment processing errors
- Token generation problems

## Next Steps

- Learn about [Lightning melting](./melt-token.md) to convert tokens back to Lightning
- Explore [BOLT12 minting](./mint-token-bolt12.md) for modern Lightning offers
- Try [P2PK tokens](./p2pk.md) for secured token transfers
