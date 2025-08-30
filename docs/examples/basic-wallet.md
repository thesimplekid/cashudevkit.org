# Basic Wallet Example

This example demonstrates the fundamental operations of a Cashu wallet using CDK: creating a wallet, minting tokens, and preparing tokens for sending.

## What This Example Does

1. **Creates a new wallet** with a random seed and memory-based storage
2. **Requests a mint quote** for a specified amount
3. **Waits for payment** and mints tokens automatically
4. **Prepares tokens for sending** to another user

## Key Concepts

- **Wallet initialization** with seed-based deterministic key generation
- **Mint quotes** for requesting tokens from a mint
- **Automatic waiting** for payment confirmation and token minting
- **Token preparation** for peer-to-peer transfers

## Code Example

```rust
use std::sync::Arc;
use std::time::Duration;

use cdk::nuts::nut00::ProofsMethods;
use cdk::nuts::CurrencyUnit;
use cdk::wallet::{SendOptions, Wallet};
use cdk::Amount;
use cdk_sqlite::wallet::memory;
use rand::random;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Generate a random seed for the wallet
    let seed = random::<[u8; 64]>();

    // Mint URL and currency unit
    let mint_url = "https://fake.thesimplekid.dev";
    let unit = CurrencyUnit::Sat;
    let amount = Amount::from(10);

    // Initialize the memory store
    let localstore = Arc::new(memory::empty().await?);

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
    println!("Minted {}", receive_amount);

    // Send the token
    let prepared_send = wallet.prepare_send(amount, SendOptions::default()).await?;
    let token = prepared_send.confirm(None).await?;

    println!("{}", token);

    Ok(())
}
```

## Running This Example

1. Add the required dependencies to your `Cargo.toml`:

```toml
[dependencies]
cdk = { version = "*", default-features = false, features = ["wallet"] }
cdk-sqlite = { version = "*", features = ["wallet"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"
```

2. Run the example:

```bash
cargo run
```

## Expected Output

```
Minted 10
cashuAeyJ0... [token string]
```

## Notes

- This example uses a test mint URL that may not be available
- The `wait_and_mint_quote` method will timeout after 10 seconds if no payment is received
- The generated token can be redeemed by another Cashu wallet
- In production, use persistent storage instead of memory storage

## Next Steps

- Try the [Mint Token Example](./mint-token.md) for more detailed minting operations
- Learn about [P2PK (Pay-to-Public-Key)](./p2pk.md) for locked token transfers
- Explore [Melting Tokens](./melt-token.md) to convert tokens back to Lightning
