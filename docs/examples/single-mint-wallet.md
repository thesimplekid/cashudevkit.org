# Building a Single Mint Wallet

This comprehensive example walks you through building a complete Cashu wallet that interacts with a single mint. You'll implement the full workflow from setup to token transfers.

## What This Example Does

1. **Sets up a complete Rust project** with all necessary dependencies
2. **Creates a wallet with deterministic seed** for consistent behavior
3. **Requests and monitors mint quotes** with real-time payment tracking
4. **Implements automatic minting** upon payment confirmation
5. **Generates transferable tokens** for peer-to-peer payments

## Key Concepts

- **Project structure** for CDK applications
- **Wallet lifecycle management** from creation to operation
- **Quote monitoring** with timeout and state checking
- **Token minting workflow** with proper error handling
- **Token preparation** for transfers

## Complete Project Setup

### 1. Create New Project

```bash
cargo new cdk-single-mint-wallet
cd cdk-single-mint-wallet
```

### 2. Configure Dependencies

Add these dependencies to your `Cargo.toml`:

```toml
[dependencies]
cdk = { version = "*", default-features = false, features = ["wallet"] }
cdk-sqlite = { version = "*", features = ["wallet"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"
```

**Dependency Explanation:**
- **`cdk`**: Core Cashu functionality with wallet features
- **`cdk-sqlite`**: SQLite storage backend for wallet data
- **`tokio`**: Async runtime for non-blocking operations
- **`rand`**: Cryptographically secure random number generation

## Complete Implementation

Create `src/main.rs` with this full implementation:

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
    println!("🥜 Building a Single Mint Wallet with CDK");
    println!("==========================================");
    
    // Step 1: Generate a random seed for the wallet
    let seed = random::<[u8; 32]>();
    println!("✅ Created wallet with random seed");

    // Step 2: Configure mint URL and amount
    let mint_url = "https://testnut.cashu.space";
    let unit = CurrencyUnit::Sat;
    let amount = Amount::from(10);
    println!("📍 Using mint: {}", mint_url);
    println!("💰 Amount to mint: {} {}", amount, unit);

    // Step 3: Initialize the memory store and create wallet
    let localstore = Arc::new(memory::empty().await?);
    let wallet = Wallet::new(mint_url, unit, localstore, &seed, None)?;
    println!("🔧 Wallet initialized successfully");

    // Step 4: Request a mint quote
    println!("\n📋 Requesting mint quote...");
    let quote = wallet.mint_quote(amount, None).await?;
    println!("✅ Quote received with ID: {}", quote.id);
    println!("\n⚡ Pay this Lightning invoice to mint tokens:");
    println!("{}", quote.request);
    println!("\n⏳ Waiting for payment confirmation...");
    println!("   (Pay the invoice above in your Lightning wallet)");

    // Step 5: Check the quote state until paid or timeout
    let timeout = Duration::from_secs(120); // 2 minutes timeout
    let start = std::time::Instant::now();
    let mut dots_printed = 0;

    loop {
        let status = wallet.mint_quote_state(&quote.id).await?;

        match status.state {
            MintQuoteState::Paid => {
                println!("\n🎉 Payment received!");
                break;
            }
            MintQuoteState::Expired => {
                println!("\n❌ Quote expired");
                return Err("Quote expired".into());
            }
            MintQuoteState::Unpaid => {
                // Print a dot every few seconds to show we're waiting
                if dots_printed % 5 == 0 {
                    print!(".");
                    std::io::Write::flush(&mut std::io::stdout())?;
                }
                dots_printed += 1;
            }
            _ => {
                print!(".");
                std::io::Write::flush(&mut std::io::stdout())?;
            }
        }

        if start.elapsed() >= timeout {
            println!("\n❌ Timeout waiting for payment");
            return Err("Timeout waiting for payment".into());
        }

        sleep(Duration::from_secs(2)).await;
    }

    // Step 6: Mint the tokens
    println!("🏭 Minting tokens...");
    let proofs = wallet.mint(&quote.id, SplitTarget::default(), None).await?;
    let receive_amount = proofs.total_amount()?;
    println!("✅ Successfully minted {} {}", receive_amount, unit);
    
    // Show proof details
    println!("📊 Minted proofs breakdown:");
    for (i, proof) in proofs.iter().enumerate() {
        println!("   Proof {}: {} sats", i + 1, proof.amount);
    }

    // Step 7: Check wallet balance
    let balance = wallet.total_balance().await?;
    println!("💳 Current wallet balance: {} sats", balance);

    // Step 8: Prepare to send tokens
    println!("\n📤 Preparing to send tokens...");
    let send_amount = amount; // Send the same amount we minted
    println!("💸 Amount to send: {} sats", send_amount);
    
    let prepared_send = wallet.prepare_send(send_amount, SendOptions::default()).await?;
    println!("📋 Send preparation complete");
    println!("   Fee: {} sats", prepared_send.fee());
    
    let token = wallet.send(prepared_send, None).await?;

    println!("\n🎫 Token created successfully!");
    println!("📝 Token details:");
    println!("   Length: {} characters", token.len());
    println!("   Prefix: {}...", &token[..20]);
    
    println!("\n📤 Complete token to send to recipient:");
    println!("{}", token);
    
    println!("\n📋 Next steps:");
    println!("   1. Copy the token above");
    println!("   2. Send it to the recipient via any communication channel");
    println!("   3. The recipient can redeem it using any Cashu wallet");
    
    // Step 9: Check final wallet balance
    let final_balance = wallet.total_balance().await?;
    println!("\n💳 Final wallet balance: {} sats", final_balance);
    
    println!("\n🎉 Single mint wallet demo completed successfully!");

    Ok(())
}
```

## Running the Application

### 1. Build and Run

```bash
cargo run
```

### 2. Expected Output Flow

```
🥜 Building a Single Mint Wallet with CDK
==========================================
✅ Created wallet with random seed
📍 Using mint: https://testnut.cashu.space
💰 Amount to mint: 10 Sat
🔧 Wallet initialized successfully

📋 Requesting mint quote...
✅ Quote received with ID: 8f2c1a3b4d5e6f7a...

⚡ Pay this Lightning invoice to mint tokens:
lnbc100n1p... [Lightning invoice]

⏳ Waiting for payment confirmation...
   (Pay the invoice above in your Lightning wallet)
.....
🎉 Payment received!
🏭 Minting tokens...
✅ Successfully minted 10 Sat
📊 Minted proofs breakdown:
   Proof 1: 2 sats
   Proof 2: 8 sats
💳 Current wallet balance: 10 sats

📤 Preparing to send tokens...
💸 Amount to send: 10 sats
📋 Send preparation complete
   Fee: 0 sats

🎫 Token created successfully!
📝 Token details:
   Length: 398 characters
   Prefix: cashuAeyJ0eXAiOiJib2x0...

📤 Complete token to send to recipient:
cashuAeyJ0eXAiOiJib2x0MTEi... [full token]

📋 Next steps:
   1. Copy the token above
   2. Send it to the recipient via any communication channel
   3. The recipient can redeem it using any Cashu wallet

💳 Final wallet balance: 0 sats

🎉 Single mint wallet demo completed successfully!
```

## Understanding the Flow

### 1. Wallet Creation
```rust
let seed = random::<[u8; 32]>();
let wallet = Wallet::new(mint_url, unit, localstore, &seed, None)?;
```
- **Deterministic keys**: The seed ensures reproducible wallet behavior
- **Storage**: Uses in-memory storage for this example
- **Configuration**: Connects to specified mint with chosen currency unit

### 2. Quote Management
```rust
let quote = wallet.mint_quote(amount, None).await?;
```
- **Amount specification**: Requests quote for exact amount needed
- **Invoice generation**: Mint provides Lightning invoice for payment
- **Expiration handling**: Quotes have time limits

### 3. Payment Monitoring
```rust
loop {
    let status = wallet.mint_quote_state(&quote.id).await?;
    match status.state {
        MintQuoteState::Paid => break,
        // Handle other states...
    }
}
```
- **Real-time checking**: Polls mint for payment status
- **State management**: Handles paid, unpaid, and expired states
- **Timeout protection**: Prevents infinite waiting

### 4. Token Minting
```rust
let proofs = wallet.mint(&quote.id, SplitTarget::default(), None).await?;
```
- **Proof generation**: Creates cryptographic proofs representing value
- **Denomination splitting**: Automatically splits into optimal denominations
- **Verification**: Ensures proofs are valid and properly signed

### 5. Token Transfer Preparation
```rust
let prepared_send = wallet.prepare_send(amount, SendOptions::default()).await?;
let token = wallet.send(prepared_send, None).await?;
```
- **Proof selection**: Chooses optimal proofs for the transfer amount
- **Fee calculation**: Determines any fees required
- **Token encoding**: Creates a transferable token string

## Production Considerations

### 1. Persistent Storage

Replace memory storage with persistent SQLite:

```rust
use cdk_sqlite::wallet::sqlite;

let db_path = "wallet.db";
let localstore = Arc::new(sqlite::SqliteWalletDatabase::new(db_path).await?);
```

### 2. Error Handling

Implement comprehensive error handling:

```rust
match wallet.mint_quote(amount, None).await {
    Ok(quote) => { /* process quote */ },
    Err(cdk::Error::InsufficientFunds) => {
        println!("❌ Insufficient funds in mint");
    },
    Err(cdk::Error::MintConnectionError) => {
        println!("❌ Cannot connect to mint");
    },
    Err(e) => {
        println!("❌ Unexpected error: {}", e);
    }
}
```

### 3. Configuration Management

Use environment variables and config files:

```rust
use std::env;

let mint_url = env::var("MINT_URL")
    .unwrap_or_else(|_| "https://testnut.cashu.space".to_string());
let amount = env::var("MINT_AMOUNT")
    .unwrap_or_else(|_| "10".to_string())
    .parse::<u64>()?;
```

### 4. Logging Integration

Add structured logging:

```rust
use tracing::{info, warn, error};

info!("Starting wallet creation");
warn!("Payment timeout approaching");
error!("Failed to connect to mint: {}", error);
```

## Security Best Practices

### 1. Seed Management
- **Secure generation**: Use cryptographically secure random generation
- **Storage**: Store seeds securely, consider encryption
- **Backup**: Implement seed backup and recovery mechanisms

### 2. Mint Verification
- **SSL/TLS**: Always use HTTPS connections to mints
- **Certificate validation**: Verify mint certificates
- **Reputation**: Only use trusted, established mints

### 3. Amount Validation
- **Limits**: Implement reasonable amount limits
- **Verification**: Verify amounts before processing
- **Balance checks**: Always check available balance

## Troubleshooting

### Common Issues

**Network Connectivity**
```bash
# Test mint connectivity
curl -I https://testnut.cashu.space

# Check firewall settings
# Ensure ports 80/443 are accessible
```

**Payment Issues**
- **Invoice expiration**: Lightning invoices have short lifespans
- **Amount precision**: Ensure amounts are in correct units (sats vs msats)
- **Network routing**: Lightning payments may fail due to routing

**Token Problems**
- **Invalid format**: Check token string integrity
- **Double spending**: Tokens can only be redeemed once
- **Mint compatibility**: Ensure token is for the correct mint

## Next Steps

After mastering single mint wallets, explore:

### Advanced Wallet Features
- **[Proof Selection](./proof-selection.md)** - Optimize token management
- **[P2PK Tokens](./p2pk.md)** - Implement locked tokens
- **[Multi-mint Wallets](./basic-wallet.md)** - Work with multiple mints

### Payment Integrations
- **[BOLT12 Support](./mint-token-bolt12.md)** - Modern Lightning features
- **[Melting Tokens](./melt-token.md)** - Convert tokens to Lightning
- **[BIP-353](./bip353.md)** - Human-readable addresses

### Production Features
- **[Authentication](./auth-wallet.md)** - Work with protected mints
- **[Custom HTTP](./mint-token-bolt12-with-custom-http.md)** - Advanced networking

This single mint wallet provides the foundation for building more complex Cashu applications! 🚀
