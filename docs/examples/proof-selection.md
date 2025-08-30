# Proof Selection Example

This example demonstrates how Cashu wallets select and manage proofs (tokens) for payments. Understanding proof selection is crucial for optimizing wallet performance and minimizing fees in Cashu transactions.

## What This Example Does

1. **Creates a wallet** and mints tokens of specific denominations
2. **Retrieves unspent proofs** from the wallet storage
3. **Demonstrates proof selection algorithms** for a given payment amount
4. **Shows how keysets affect** proof selection decisions

## Key Concepts

- **Proofs**: Individual Cashu tokens with specific amounts and cryptographic signatures
- **Proof selection**: Choosing the optimal combination of proofs for a payment
- **Keysets**: Cryptographic key sets used by mints for different token denominations
- **Active keysets**: Currently valid keysets that the mint accepts

## Code Example

```rust
//! Wallet example with memory store

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use cdk::nuts::nut00::ProofsMethods;
use cdk::nuts::CurrencyUnit;
use cdk::wallet::Wallet;
use cdk::Amount;
use cdk_common::nut02::KeySetInfosMethods;
use cdk_sqlite::wallet::memory;
use rand::random;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Generate a random seed for the wallet
    let seed = random::<[u8; 64]>();

    // Mint URL and currency unit
    let mint_url = "https://fake.thesimplekid.dev";
    let unit = CurrencyUnit::Sat;

    // Initialize the memory store
    let localstore = Arc::new(memory::empty().await?);

    // Create a new wallet
    let wallet = Wallet::new(mint_url, unit, localstore, seed, None)?;

    // Amount to mint
    for amount in [64] {
        let amount = Amount::from(amount);

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
    }

    // Get unspent proofs
    let proofs = wallet.get_unspent_proofs().await?;

    // Select proofs to send
    let amount = Amount::from(64);
    let active_keyset_ids = wallet
        .refresh_keysets()
        .await?
        .active()
        .map(|keyset| keyset.id)
        .collect();
    let selected =
        Wallet::select_proofs(amount, proofs, &active_keyset_ids, &HashMap::new(), false)?;
    for (i, proof) in selected.iter().enumerate() {
        println!("{}: {}", i, proof.amount);
    }

    Ok(())
}
```

## Dependencies

Add these dependencies to your `Cargo.toml`:

```toml
[dependencies]
cdk = { version = "*", default-features = false, features = ["wallet"] }
cdk-sqlite = { version = "*", features = ["wallet"] }
cdk-common = "*"
tokio = { version = "1", features = ["full"] }
rand = "0.8"
```

## Running This Example

```bash
cargo run
```

## Expected Output

```
Minted 64
0: 64
```

## Understanding Proof Selection

### 1. Proof Denominations
Cashu tokens are minted in specific denominations (powers of 2) for efficiency:
- 1, 2, 4, 8, 16, 32, 64 sats, etc.

### 2. Selection Algorithm
The wallet's proof selection considers:
- **Exact matches**: Prefer proofs that exactly match the required amount
- **Minimal change**: Choose combinations that minimize leftover amounts
- **Keyset validity**: Only use proofs from active keysets
- **Fee optimization**: Account for transaction fees in selection

### 3. Keyset Management
```rust
let active_keyset_ids = wallet
    .refresh_keysets()
    .await?
    .active()
    .map(|keyset| keyset.id)
    .collect();
```
This ensures only valid, active keysets are used for proof selection.

## Advanced Proof Selection

### Multiple Amount Selection
For complex scenarios, you might need to select proofs for multiple payments:

```rust
let amounts = vec![Amount::from(10), Amount::from(25), Amount::from(5)];
let mut total_selected = Vec::new();

for amount in amounts {
    let selected = Wallet::select_proofs(
        amount, 
        remaining_proofs.clone(), 
        &active_keyset_ids, 
        &HashMap::new(), 
        false
    )?;
    total_selected.extend(selected);
}
```

### Fee-Aware Selection
When fees are involved, the selection must account for additional costs:

```rust
let base_amount = Amount::from(50);
let estimated_fee = Amount::from(2);
let total_needed = base_amount + estimated_fee;

let selected = Wallet::select_proofs(
    total_needed,
    proofs,
    &active_keyset_ids,
    &HashMap::new(),
    true // include_fees parameter
)?;
```

## Optimization Strategies

### 1. Proof Consolidation
Regularly consolidate small proofs into larger ones to improve selection efficiency:

```rust
// Send to yourself to consolidate proofs
let balance = wallet.total_balance().await?;
let consolidated_token = wallet.prepare_send(balance, SendOptions::default()).await?;
let received = wallet.receive(&consolidated_token.to_string(), ReceiveOptions::default()).await?;
```

### 2. Strategic Minting
Mint amounts that result in useful denominations for your expected transaction patterns.

### 3. Proof Age Management
Consider the age of proofs to maintain good privacy characteristics.

## Error Scenarios

Common proof selection errors:
- **Insufficient funds**: Not enough total proof value for the requested amount
- **No valid keysets**: All available proofs use inactive keysets
- **Fragmentation**: Available proofs cannot be efficiently combined
- **Keyset mismatch**: Proofs from keysets not recognized by the mint

## Monitoring Proof Health

```rust
// Check proof distribution
let proofs = wallet.get_unspent_proofs().await?;
let mut denomination_count = HashMap::new();

for proof in proofs {
    *denomination_count.entry(proof.amount).or_insert(0) += 1;
}

for (amount, count) in denomination_count {
    println!("Amount {}: {} proofs", amount, count);
}
```

## Best Practices

### 1. Regular Keyset Updates
```rust
// Refresh keysets periodically
wallet.refresh_keysets().await?;
```

### 2. Proof Cleanup
Remove spent or invalid proofs from local storage regularly.

### 3. Balance Monitoring
Track proof distribution to identify when consolidation is needed.

## Next Steps

- Learn about [authentication wallets](./auth-wallet.md) for mint-level access controls
- Explore [BOLT12 integration](./mint-token-bolt12.md) for modern Lightning features
- Try [BIP-353](./bip353.md) for human-readable payment addresses
