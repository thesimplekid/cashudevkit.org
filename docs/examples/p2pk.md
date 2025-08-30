# Pay-to-Public-Key (P2PK) Example

This example demonstrates how to create and redeem Cashu tokens with Pay-to-Public-Key (P2PK) spending conditions. P2PK tokens are "locked" to a specific public key, meaning only the holder of the corresponding private key can spend them.

## What This Example Does

1. **Creates and funds a wallet** with standard tokens
2. **Generates a secret key** for P2PK conditions
3. **Creates P2PK-locked tokens** that require a signature to spend
4. **Redeems the locked tokens** using the private key
5. **Demonstrates the security model** of locked tokens

## Key Concepts

- **P2PK (Pay-to-Public-Key)**: Tokens locked to a specific public key
- **Spending conditions**: Rules that must be satisfied to spend tokens
- **Secret key generation**: Creating cryptographic keys for token locking
- **Token redemption**: Unlocking P2PK tokens with the correct private key

## Code Example

```rust
use std::sync::Arc;
use std::time::Duration;

use cdk::error::Error;
use cdk::nuts::{CurrencyUnit, SecretKey, SpendingConditions};
use cdk::wallet::{ReceiveOptions, SendOptions, Wallet};
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
    let amount = Amount::from(100);

    // Create a new wallet
    let wallet = Wallet::new(mint_url, unit, localstore, seed, None).unwrap();

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
    println!(
        "Minted nuts: {:?}",
        proofs.into_iter().map(|p| p.amount).collect::<Vec<_>>()
    );

    // Generate a secret key for spending conditions
    let secret = SecretKey::generate();

    // Create spending conditions using the generated public key
    let spending_conditions = SpendingConditions::new_p2pk(secret.public_key(), None);

    // Get the total balance of the wallet
    let bal = wallet.total_balance().await?;
    println!("Total balance: {}", bal);

    // Send a token with the specified amount and spending conditions
    let prepared_send = wallet
        .prepare_send(
            10.into(),
            SendOptions {
                conditions: Some(spending_conditions),
                include_fee: true,
                ..Default::default()
            },
        )
        .await?;
    println!("Fee: {}", prepared_send.fee());
    let token = prepared_send.confirm(None).await?;

    println!("Created token locked to pubkey: {}", secret.public_key());
    println!("{}", token);

    // Receive the token using the secret key
    let amount = wallet
        .receive(
            &token.to_string(),
            ReceiveOptions {
                p2pk_signing_keys: vec![secret],
                ..Default::default()
            },
        )
        .await?;

    println!("Redeemed locked token worth: {}", u64::from(amount));

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

```bash
cargo run
```

## Expected Output

```
Minted nuts: [1, 2, 4, 8, 16, 32, 32, 4, 1]
Total balance: 100
Fee: 0
Created token locked to pubkey: 02a1b2c3d4e5f6... [public key]
cashuAeyJ0eXAiOiJib2x0MTEi... [P2PK token]
Redeemed locked token worth: 10
```

## Understanding P2PK Flow

### 1. Standard Token Creation
The example starts by minting regular Cashu tokens to have funds available.

### 2. Key Generation
```rust
let secret = SecretKey::generate();
```
This creates a new cryptographic key pair for the P2PK condition.

### 3. Spending Conditions
```rust
let spending_conditions = SpendingConditions::new_p2pk(secret.public_key(), None);
```
This creates a spending condition that requires a signature from the specific private key.

### 4. Locked Token Creation
The token is created with the P2PK spending condition, making it spendable only by the holder of the private key.

### 5. Token Redemption
```rust
let amount = wallet.receive(
    &token.to_string(),
    ReceiveOptions {
        p2pk_signing_keys: vec![secret],
        ..Default::default()
    },
).await?;
```
The token is redeemed by providing the correct private key.

## Use Cases for P2PK Tokens

### 1. Secure Payments
Send tokens that only the intended recipient can redeem:
```rust
// Create token locked to recipient's public key
let recipient_pubkey = get_recipient_pubkey();
let conditions = SpendingConditions::new_p2pk(recipient_pubkey, None);
```

### 2. Escrow Services
Create tokens that require specific signatures for release.

### 3. Multi-step Workflows
Lock tokens until certain conditions are met or verified.

### 4. Enhanced Privacy
Combine P2PK with other spending conditions for complex payment scenarios.

## Security Considerations

### Key Management
- **Secure storage**: Private keys must be stored securely
- **Key backup**: Losing the private key means losing access to the tokens
- **Key rotation**: Consider using time-locked conditions for key rotation

### Token Validation
- **Public key verification**: Always verify the public key before creating P2PK tokens
- **Signature validation**: The wallet automatically validates signatures during redemption

## Advanced Features

### Time Locks
```rust
let lock_time = Some(unix_timestamp + 3600); // 1 hour from now
let conditions = SpendingConditions::new_p2pk(pubkey, lock_time);
```

### Multiple Signatures
You can create more complex spending conditions by combining P2PK with other conditions.

## Error Handling

Common errors include:
- **Missing private key**: Attempting to redeem without the correct signing key
- **Invalid signature**: Cryptographic signature validation failures
- **Expired tokens**: Time-locked tokens accessed before the unlock time

## Next Steps

- Learn about [proof selection](./proof-selection.md) for optimizing token usage
- Explore [authentication](./auth-wallet.md) for mint-level access controls
- Try [BIP-353](./bip353.md) for user-friendly payment addresses
