# BOLT12 Streaming Mint Example

This example demonstrates how to handle multiple BOLT12 mint operations concurrently using CDK's streaming interface. This is particularly useful for high-volume applications that need to process many payments simultaneously.

## What This Example Does

1. **Creates multiple BOLT12 quotes** simultaneously
2. **Uses a proof stream** to handle concurrent minting operations
3. **Processes payments as they arrive** without blocking
4. **Implements cancellation** to stop processing when needed
5. **Demonstrates stream lifecycle management**

## Key Concepts

- **Proof streams**: Concurrent processing of multiple mint quotes
- **Async streams**: Non-blocking iteration over payment results
- **Cancellation tokens**: Graceful shutdown of streaming operations
- **BOLT12 batch processing**: Efficient handling of multiple offers

## Code Example

```rust
use std::sync::Arc;

use cdk::error::Error;
use cdk::nuts::nut00::ProofsMethods;
use cdk::nuts::CurrencyUnit;
use cdk::wallet::{SendOptions, Wallet};
use cdk::{Amount, StreamExt};
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

    let quotes = vec![
        wallet.mint_bolt12_quote(None, None).await?,
        wallet.mint_bolt12_quote(None, None).await?,
        wallet.mint_bolt12_quote(None, None).await?,
    ];

    let mut stream = wallet.mints_proof_stream(quotes, Default::default(), None);

    let stop = stream.get_cancel_token();

    let mut processed = 0;

    while let Some(proofs) = stream.next().await {
        let (mint_quote, proofs) = proofs?;

        // Mint the received amount
        let receive_amount = proofs.total_amount()?;
        println!("Received {} from mint {}", receive_amount, mint_quote.id);

        // Send a token with the specified amount
        let prepared_send = wallet.prepare_send(amount, SendOptions::default()).await?;
        let token = prepared_send.confirm(None).await?;
        println!("Token:");
        println!("{}", token);

        processed += 1;

        if processed == 3 {
            stop.cancel()
        }
    }

    println!("Stopped the loop after {} quotes being minted", processed);

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
Received 10 from mint 8f2c1a3b4d5e6f7a...
Token:
cashuAeyJ0eXAiOiJib2x0MTEi...
Received 10 from mint 9a3d2f4e5b6c7d8e...
Token:
cashuAeyJ0eXAiOiJib2x0MTEi...
Received 10 from mint 1b4e7a8d2f5c9e6f...
Token:
cashuAeyJ0eXAiOiJib2x0MTEi...
Stopped the loop after 3 quotes being minted
```

## Understanding Proof Streams

### Stream Creation
```rust
let mut stream = wallet.mints_proof_stream(quotes, Default::default(), None);
```
Creates a stream that processes multiple mint quotes concurrently.

### Stream Processing
```rust
while let Some(proofs) = stream.next().await {
    let (mint_quote, proofs) = proofs?;
    // Process each result as it becomes available
}
```
The stream yields results as payments are confirmed, not in order.

### Cancellation Control
```rust
let stop = stream.get_cancel_token();
// Later...
stop.cancel(); // Gracefully stop the stream
```

## Advanced Stream Patterns

### 1. Conditional Processing
```rust
while let Some(result) = stream.next().await {
    match result {
        Ok((quote, proofs)) => {
            let amount = proofs.total_amount()?;
            
            if amount >= Amount::from(100) {
                // Process large payments differently
                process_large_payment(quote, proofs).await?;
            } else {
                // Handle small payments
                process_small_payment(quote, proofs).await?;
            }
        },
        Err(e) => {
            eprintln!("Stream error: {}", e);
            continue; // Skip failed payments
        }
    }
}
```

### 2. Progress Tracking
```rust
let total_quotes = quotes.len();
let mut completed = 0;
let mut total_received = Amount::from(0);

while let Some(result) = stream.next().await {
    let (quote, proofs) = result?;
    let amount = proofs.total_amount()?;
    
    completed += 1;
    total_received = total_received + amount;
    
    println!("Progress: {}/{} ({:.1}%)", 
             completed, total_quotes, 
             (completed as f64 / total_quotes as f64) * 100.0);
    println!("Total received: {} sats", total_received);
}
```

### 3. Error Resilience
```rust
let mut successful = 0;
let mut failed = 0;

while let Some(result) = stream.next().await {
    match result {
        Ok((quote, proofs)) => {
            successful += 1;
            process_successful_payment(quote, proofs).await?;
        },
        Err(e) => {
            failed += 1;
            eprintln!("Payment failed: {}", e);
            
            // Continue processing other payments
            if failed > 10 {
                println!("Too many failures, stopping stream");
                break;
            }
        }
    }
}

println!("Results: {} successful, {} failed", successful, failed);
```

## Stream Configuration Options

### 1. Split Targets
```rust
use cdk::amount::SplitTarget;

let split_target = SplitTarget::new(Some(8), Some(Amount::from(1)), false);
let stream = wallet.mints_proof_stream(quotes, split_target, None);
```

### 2. Custom Preferences
```rust
use cdk::wallet::MintingPreferences;

let preferences = MintingPreferences {
    preferred_keyset: Some(keyset_id),
    denomination_preference: vec![1, 2, 4, 8, 16].into_iter().map(Amount::from).collect(),
};

let stream = wallet.mints_proof_stream(quotes, Default::default(), Some(preferences));
```

## Performance Considerations

### 1. Optimal Batch Size
```rust
// Process quotes in optimal batch sizes
const BATCH_SIZE: usize = 10;

for chunk in quotes.chunks(BATCH_SIZE) {
    let mut stream = wallet.mints_proof_stream(chunk.to_vec(), Default::default(), None);
    
    while let Some(result) = stream.next().await {
        // Process batch
    }
}
```

### 2. Memory Management
```rust
// Limit concurrent operations to prevent memory issues
use tokio::sync::Semaphore;

let semaphore = Arc::new(Semaphore::new(5)); // Max 5 concurrent

for quote_batch in quotes.chunks(10) {
    let permit = semaphore.acquire().await?;
    
    tokio::spawn({
        let wallet = wallet.clone();
        let quotes = quote_batch.to_vec();
        
        async move {
            let _permit = permit; // Hold permit for task duration
            let mut stream = wallet.mints_proof_stream(quotes, Default::default(), None);
            
            while let Some(result) = stream.next().await {
                // Process results
            }
        }
    });
}
```

### 3. Timeout Handling
```rust
use tokio::time::{timeout, Duration};

let stream_timeout = Duration::from_secs(300); // 5 minutes

match timeout(stream_timeout, async {
    while let Some(result) = stream.next().await {
        // Process results
    }
}).await {
    Ok(_) => println!("Stream completed successfully"),
    Err(_) => println!("Stream timed out"),
}
```

## Error Recovery Strategies

### 1. Retry Failed Quotes
```rust
let mut retry_quotes = Vec::new();

while let Some(result) = stream.next().await {
    match result {
        Ok((quote, proofs)) => {
            // Process successful payment
        },
        Err(e) => {
            eprintln!("Quote failed: {}", e);
            // Could add to retry queue based on error type
        }
    }
}

// Retry failed quotes
if !retry_quotes.is_empty() {
    println!("Retrying {} failed quotes", retry_quotes.len());
    let retry_stream = wallet.mints_proof_stream(retry_quotes, Default::default(), None);
    // Process retry stream...
}
```

### 2. Circuit Breaker Pattern
```rust
struct CircuitBreaker {
    failure_count: usize,
    failure_threshold: usize,
    is_open: bool,
}

impl CircuitBreaker {
    fn record_success(&mut self) {
        self.failure_count = 0;
        self.is_open = false;
    }
    
    fn record_failure(&mut self) {
        self.failure_count += 1;
        if self.failure_count >= self.failure_threshold {
            self.is_open = true;
        }
    }
    
    fn should_allow_request(&self) -> bool {
        !self.is_open
    }
}

let mut circuit_breaker = CircuitBreaker {
    failure_count: 0,
    failure_threshold: 5,
    is_open: false,
};

while let Some(result) = stream.next().await {
    if !circuit_breaker.should_allow_request() {
        println!("Circuit breaker open, stopping processing");
        break;
    }
    
    match result {
        Ok(_) => circuit_breaker.record_success(),
        Err(_) => circuit_breaker.record_failure(),
    }
}
```

## Real-World Applications

### 1. Payment Processing Service
```rust
// High-volume merchant payment processing
async fn process_merchant_payments(payments: Vec<PaymentRequest>) -> Result<Vec<Token>, Error> {
    let quotes = create_quotes_for_payments(payments).await?;
    let mut stream = wallet.mints_proof_stream(quotes, Default::default(), None);
    let mut tokens = Vec::new();
    
    while let Some(result) = stream.next().await {
        let (_, proofs) = result?;
        let token = create_customer_token(proofs).await?;
        tokens.push(token);
    }
    
    Ok(tokens)
}
```

### 2. Batched Refunds
```rust
// Process refunds in batches
async fn process_refunds(refunds: Vec<RefundRequest>) -> Result<(), Error> {
    let quotes = create_refund_quotes(refunds).await?;
    let mut stream = wallet.mints_proof_stream(quotes, Default::default(), None);
    
    while let Some(result) = stream.next().await {
        let (quote, proofs) = result?;
        send_refund_to_customer(quote.id, proofs).await?;
    }
    
    Ok(())
}
```

## Next Steps

- Learn about [custom HTTP clients](./mint-token-bolt12-with-custom-http.md) for advanced networking
- Explore [authentication](./auth-wallet.md) for secured mint operations
- Try [BIP-353 integration](./bip353.md) for user-friendly payment addresses
