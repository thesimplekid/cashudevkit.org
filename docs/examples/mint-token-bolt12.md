# BOLT12 Mint Token Example

This example demonstrates how to mint Cashu tokens using BOLT12 offers instead of traditional Lightning invoices. BOLT12 offers provide improved privacy, reusability, and advanced payment features compared to BOLT11 invoices.

## What This Example Does

1. **Creates a wallet** with logging enabled for debugging
2. **Requests a BOLT12 mint quote** from the mint
3. **Waits for payment** via the BOLT12 offer
4. **Mints tokens** automatically upon payment confirmation
5. **Creates a sendable token** for peer-to-peer transfers

## Key Concepts

- **BOLT12 Offers**: Reusable, privacy-preserving Lightning payment requests
- **Mint quotes**: Requests to mint tokens using specific payment methods
- **Offer-based payments**: Modern Lightning payments with enhanced features
- **Automatic minting**: Seamless token creation upon payment confirmation

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

    let quote = wallet.mint_bolt12_quote(None, None).await?;
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
cdk = { version = "*", default-features = false, features = ["wallet", "bolt12"] }
cdk-sqlite = { version = "*", features = ["wallet"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

## Running This Example

```bash
cargo run --features="bolt12"
```

## Expected Output

```
Received 10 from mint https://fake.thesimplekid.dev
Token:
cashuAeyJ0eXAiOiJib2x0MTEi... [BOLT12-funded token]
```

## Understanding BOLT12 vs BOLT11

### BOLT11 Limitations
- **Single use**: Each invoice can only be paid once
- **No privacy**: Invoice reveals destination node
- **Fixed amount**: Cannot be reused for different amounts
- **Limited metadata**: Minimal payment information

### BOLT12 Advantages
- **Reusable offers**: Single offer for multiple payments
- **Enhanced privacy**: Blinded paths hide destination
- **Flexible amounts**: Offers can specify amount ranges
- **Rich metadata**: Detailed payment descriptions and requirements

## BOLT12 Mint Quote Parameters

### Basic Quote Request
```rust
// Request a basic BOLT12 quote
let quote = wallet.mint_bolt12_quote(None, None).await?;
```

### Custom Amount Quote
```rust
// Request quote for specific amount
let amount = Some(Amount::from(100));
let quote = wallet.mint_bolt12_quote(amount, None).await?;
```

### Quote with Metadata
```rust
// Include additional metadata in the quote
let description = Some("Payment for premium features".to_string());
let quote = wallet.mint_bolt12_quote(None, description).await?;
```

## Advanced BOLT12 Features

### Offer Validation
```rust
// The wallet automatically validates BOLT12 offers
// including signature verification and path validation
let quote = match wallet.mint_bolt12_quote(None, None).await {
    Ok(q) => q,
    Err(Error::InvalidBolt12Offer) => {
        println!("Mint provided invalid BOLT12 offer");
        return Err(Error::InvalidBolt12Offer);
    },
    Err(e) => return Err(e),
};
```

### Payment Tracking
```rust
// BOLT12 payments include enhanced tracking information
let quote = wallet.mint_bolt12_quote(None, None).await?;
println!("Quote ID: {}", quote.id);
println!("Offer details: {:?}", quote.request);

// Monitor payment progress
let status = wallet.mint_quote_state(&quote.id).await?;
println!("Payment status: {}", status.state);
```

## Error Handling

### Common BOLT12 Errors
```rust
match wallet.mint_bolt12_quote(None, None).await {
    Err(Error::Bolt12NotSupported) => {
        println!("Mint doesn't support BOLT12 offers");
        // Fallback to BOLT11
        let bolt11_quote = wallet.mint_quote(amount, None).await?;
    },
    Err(Error::InvalidBolt12Offer) => {
        println!("Mint provided malformed BOLT12 offer");
    },
    Err(Error::Bolt12PaymentFailed) => {
        println!("BOLT12 payment routing failed");
    },
    Ok(quote) => {
        // Process successful quote
    }
}
```

## Production Considerations

### 1. Mint Compatibility
Not all mints support BOLT12. Always check mint capabilities:

```rust
let mint_info = wallet.fetch_mint_info().await?;
if mint_info.supports_bolt12() {
    // Use BOLT12 quotes
    let quote = wallet.mint_bolt12_quote(None, None).await?;
} else {
    // Fallback to BOLT11
    let quote = wallet.mint_quote(amount, None).await?;
}
```

### 2. Payment Timeout Handling
```rust
use tokio::time::{timeout, Duration};

let quote = wallet.mint_bolt12_quote(None, None).await?;

match timeout(Duration::from_secs(300), wallet.wait_and_mint_quote(
    quote,
    Default::default(),
    Default::default(),
    Duration::from_secs(30),
)).await {
    Ok(Ok(proofs)) => {
        println!("Payment successful: {} sats", proofs.total_amount()?);
    },
    Ok(Err(e)) => {
        println!("Minting failed: {}", e);
    },
    Err(_) => {
        println!("Payment timed out after 5 minutes");
    }
}
```

### 3. Offer Reuse Detection
```rust
// Track offer usage to detect reuse attempts
let mut used_offers = std::collections::HashSet::new();

let quote = wallet.mint_bolt12_quote(None, None).await?;
let offer_id = extract_offer_id(&quote.request);

if used_offers.contains(&offer_id) {
    println!("Warning: Reusing BOLT12 offer");
}
used_offers.insert(offer_id);
```

## Security Considerations

### 1. Offer Verification
- **Signature validation**: Always verify offer signatures
- **Path validation**: Ensure blinded paths are valid
- **Expiration checks**: Respect offer expiration times

### 2. Privacy Protection
- **Blinded paths**: Use offers with blinded paths when possible
- **Amount hiding**: Avoid revealing exact payment amounts
- **Route diversification**: Use different payment paths

### 3. Payment Safety
- **Amount limits**: Implement reasonable payment limits
- **Offer validation**: Verify offers before payment
- **Retry logic**: Handle payment failures gracefully

## Performance Optimization

### 1. Offer Caching
```rust
// Cache BOLT12 offers to reduce quote requests
let mut offer_cache = std::collections::HashMap::new();

let cache_key = (mint_url.clone(), amount);
let quote = if let Some(cached_offer) = offer_cache.get(&cache_key) {
    // Reuse cached offer if still valid
    cached_offer.clone()
} else {
    let new_quote = wallet.mint_bolt12_quote(None, None).await?;
    offer_cache.insert(cache_key, new_quote.clone());
    new_quote
};
```

### 2. Parallel Quote Requests
```rust
// Request multiple quotes concurrently
let futures = vec![
    wallet.mint_bolt12_quote(Some(Amount::from(10)), None),
    wallet.mint_bolt12_quote(Some(Amount::from(20)), None),
    wallet.mint_bolt12_quote(Some(Amount::from(50)), None),
];

let quotes = futures::future::try_join_all(futures).await?;
println!("Received {} quotes", quotes.len());
```

## Next Steps

- Learn about [streaming BOLT12 payments](./mint-token-bolt12-with-stream.md) for high-volume operations
- Explore [custom HTTP clients](./mint-token-bolt12-with-custom-http.md) for advanced networking
- Try [BIP-353 integration](./bip353.md) for human-readable BOLT12 addresses
