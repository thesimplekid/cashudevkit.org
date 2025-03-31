# Building a Single Mint Wallet with CDK

This tutorial will guide you through creating a simple Cashu wallet that interacts with a single mint. You'll learn how to:

- Set up a Rust project with CDK
- Create a wallet with a random seed
- Request a mint quote
- Mint tokens after payment
- Send tokens to another wallet

## 1. Project Setup

First, let's create a new Rust project:

```shell
cargo new cdk-tutorial
cd cdk-tutorial
```

Next, add the required dependencies to your `Cargo.toml` file:

```toml
[dependencies]
cdk = { version = "*", default-features = false, features = ["wallet"] }
cdk-sqlite = { version = "*", features = ["wallet"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"
```

The `cdk` crate provides the core Cashu functionality, while `cdk-sqlite` gives us storage capabilities. We'll use `tokio` for async runtime and `rand` for generating random seeds.



## 2. Implementing the Wallet

Create a new file `src/main.rs` with the following code:

```rust
use std::sync::Arc;
use std::time::Duration;

use cdk::amount::SplitTarget;
use cdk::nuts::nut00::ProofsMethods;
use cdk::nuts::{CurrencyUnit, MintQuoteState};
use cdk::wallet::{SendOptions, Wallet};
use cdk::Amount;
use cdk_sqlite::wallet::memory;
use rand::random;
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Step 1: Generate a random seed for the wallet
    let seed = random::<[u8; 32]>();
    println!("Created wallet with random seed");

    // Step 2: Configure mint URL and amount
    let mint_url = "https://testnut.cashu.space";
    let unit = CurrencyUnit::Sat;
    let amount = Amount::from(10);
    println!("Using mint: {}", mint_url);
    println!("Amount to mint: {} {}", amount, unit);

    // Step 3: Initialize the memory store and create wallet
    let localstore = Arc::new(memory::empty().await?);
    let wallet = Wallet::new(mint_url, unit, localstore, &seed, None)?;
    println!("Wallet initialized successfully");

    // Step 4: Request a mint quote
    let quote = wallet.mint_quote(amount, None).await?;
    println!("\nPay this Lightning invoice to mint tokens:");
    println!("{}", quote.request);
    println!("\nWaiting for payment confirmation...");

    // Step 5: Check the quote state until paid or timeout
    let timeout = Duration::from_secs(120);
    let start = std::time::Instant::now();

    loop {
        let status = wallet.mint_quote_state(&quote.id).await?;

        match status.state {
            MintQuoteState::Paid => {
                println!("Payment received!");
                break;
            }
            MintQuoteState::Expired => {
                return Err("Quote expired".into());
            }
            _ => {
                print!(".");
            }
        }

        if start.elapsed() >= timeout {
            return Err("Timeout waiting for payment".into());
        }

        sleep(Duration::from_secs(2)).await;
    }

    // Step 6: Mint the tokens
    println!("\nMinting tokens...");
    let proofs = wallet.mint(&quote.id, SplitTarget::default(), None).await?;
    let receive_amount = proofs.total_amount()?;
    println!("Successfully minted {} {}", receive_amount, unit);

    // Step 7: Send tokens
    println!("\nPreparing to send tokens...");
    let prepared_send = wallet.prepare_send(amount, SendOptions::default()).await?;
    let token = wallet.send(prepared_send, None).await?;

    println!("\nToken to send to recipient:");
    println!("{}", token);
    println!("\nThe recipient can redeem this token using a Cashu wallet");

    Ok(())
}
```

## 3. Running the Application

Build and run your application with:

```shell
cargo run
```

This will:
1. Create a new wallet with a random seed
2. Generate a Lightning invoice for 10 sats
3. Wait for payment confirmation
4. Mint tokens once payment is confirmed
5. Create a token that can be sent to another user

## 4. Next Steps

- Try modifying the code to use a persistent SQLite database instead of memory storage
- Implement a function to receive and redeem tokens
- Add error handling for network issues
- Create a simple CLI interface with user commands

For more advanced usage, check out the [CDK documentation](https://github.com/cashubtc/cdk) and other tutorials in this series.

