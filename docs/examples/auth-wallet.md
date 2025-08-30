# Authentication Wallet Example

This example demonstrates how to use CDK with mints that require authentication. Some mints implement access controls using CAT (Client Authentication Token) or OIDC (OpenID Connect) to restrict access to their services.

## What This Example Does

1. **Sets up a wallet** with authentication capabilities
2. **Fetches mint information** including authentication requirements
3. **Obtains an access token** using OIDC password flow
4. **Mints blind authentication tokens** for ongoing operations
5. **Performs authenticated operations** like minting and sending tokens

## Key Concepts

- **CAT (Client Authentication Token)**: Tokens required for accessing protected mint endpoints
- **OIDC (OpenID Connect)**: Authentication protocol for obtaining access tokens
- **Blind authentication**: Pre-authorized tokens for seamless future operations
- **Protected endpoints**: Mint operations that require authentication

## Code Example

```rust
use std::sync::Arc;
use std::time::Duration;

use cdk::error::Error;
use cdk::nuts::CurrencyUnit;
use cdk::wallet::{SendOptions, Wallet};
use cdk::{Amount, OidcClient};
use cdk_common::amount::SplitTarget;
use cdk_common::{MintInfo, ProofsMethods};
use cdk_sqlite::wallet::memory;
use rand::Rng;
use tracing_subscriber::EnvFilter;

const TEST_USERNAME: &str = "cdk-test";
const TEST_PASSWORD: &str = "cdkpassword";

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Set up logging
    let default_filter = "debug";
    let sqlx_filter = "sqlx=warn,hyper_util=warn,reqwest=warn,rustls=warn";
    let env_filter = EnvFilter::new(format!("{},{}", default_filter, sqlx_filter));
    tracing_subscriber::fmt().with_env_filter(env_filter).init();

    // Initialize the memory store for the wallet
    let localstore = memory::empty().await?;

    // Generate a random seed for the wallet
    let seed = rand::rng().random::<[u8; 64]>();

    // Define the mint URL and currency unit
    let mint_url = "http://127.0.0.1:8085";
    let unit = CurrencyUnit::Sat;
    let amount = Amount::from(50);

    // Create a new wallet
    let wallet = Wallet::new(mint_url, unit, Arc::new(localstore), seed, None)?;

    let mint_info = wallet
        .fetch_mint_info()
        .await
        .expect("mint info")
        .expect("could not get mint info");

    // Request a mint quote from the wallet
    let quote = wallet.mint_quote(amount, None).await;

    println!("Minting nuts ... {:?}", quote);

    // Getting the CAT token is not in scope of cdk and expected to be handled by the implementor
    // We just use this helper fn with password auth for testing
    let access_token = get_access_token(&mint_info).await;

    wallet.set_cat(access_token).await.unwrap();

    wallet
        .mint_blind_auth(10.into())
        .await
        .expect("Could not mint blind auth");

    let quote = wallet.mint_quote(amount, None).await.unwrap();
    let proofs = wallet
        .wait_and_mint_quote(quote, SplitTarget::default(), None, Duration::from_secs(10))
        .await
        .unwrap();

    println!("Received: {}", proofs.total_amount()?);

    // Get the total balance of the wallet
    let balance = wallet.total_balance().await?;
    println!("Wallet balance: {}", balance);

    let prepared_send = wallet
        .prepare_send(10.into(), SendOptions::default())
        .await?;
    let token = prepared_send.confirm(None).await?;

    println!("Created token: {}", token);

    let remaining_blind_auth = wallet.get_unspent_auth_proofs().await?.len();

    // We started with 10 blind tokens we expect 8 at this point
    // 1 is used for the mint quote + 1 used for the mint
    // The swap is not expected to use one as it will be offline or we have "/swap" as an unprotected endpoint in the mint config
    assert_eq!(remaining_blind_auth, 8);

    println!("Remaining blind auth: {}", remaining_blind_auth);

    Ok(())
}

async fn get_access_token(mint_info: &MintInfo) -> String {
    let openid_discovery = mint_info
        .nuts
        .nut21
        .clone()
        .expect("Nut21 defined")
        .openid_discovery;

    let oidc_client = OidcClient::new(openid_discovery, None);

    // Get the token endpoint from the OIDC configuration
    let token_url = oidc_client
        .get_oidc_config()
        .await
        .expect("Failed to get OIDC config")
        .token_endpoint;

    // Create the request parameters
    let params = [
        ("grant_type", "password"),
        ("client_id", "cashu-client"),
        ("username", TEST_USERNAME),
        ("password", TEST_PASSWORD),
    ];

    // Make the token request directly
    let client = reqwest::Client::new();
    let response = client
        .post(token_url)
        .form(&params)
        .send()
        .await
        .expect("Failed to send token request");

    let token_response: serde_json::Value = response
        .json()
        .await
        .expect("Failed to parse token response");

    token_response["access_token"]
        .as_str()
        .expect("No access token in response")
        .to_string()
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
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
reqwest = { version = "0.12", features = ["json"] }
serde_json = "1.0"
```

## Running This Example

1. **Start an authenticated mint** on `http://127.0.0.1:8085` with OIDC enabled
2. **Configure the mint** with the test credentials (`cdk-test` / `cdkpassword`)
3. **Run the example**:

```bash
cargo run
```

## Expected Output

```
Minting nuts ... Ok(MintQuote { ... })
Received: 50
Wallet balance: 60
Created token: cashuAeyJ0eXAiOiJib2x0MTEi...
Remaining blind auth: 8
```

## Understanding Authentication Flow

### 1. Mint Information Discovery
```rust
let mint_info = wallet.fetch_mint_info().await?;
```
The wallet queries the mint for its capabilities, including authentication requirements.

### 2. OIDC Token Acquisition
```rust
let access_token = get_access_token(&mint_info).await;
wallet.set_cat(access_token).await?;
```
The wallet obtains an access token using OIDC and sets it for subsequent operations.

### 3. Blind Authentication Token Minting
```rust
wallet.mint_blind_auth(10.into()).await?;
```
The wallet pre-mints authentication tokens that can be used for future operations without requiring fresh authentication.

### 4. Authenticated Operations
Once authenticated, the wallet can perform standard operations like minting and sending tokens.

## Authentication Token Management

### Blind Auth Tokens
```rust
let remaining_blind_auth = wallet.get_unspent_auth_proofs().await?.len();
```
These tokens are consumed during operations:
- **Mint quote**: Uses 1 blind auth token
- **Mint operation**: Uses 1 blind auth token  
- **Swap operations**: May be unprotected depending on mint configuration

### Token Lifecycle
1. **Initial authentication**: Use OIDC to get access token
2. **Blind token minting**: Pre-authorize future operations
3. **Operation execution**: Consume blind auth tokens as needed
4. **Token replenishment**: Mint new blind auth tokens when running low

## Production Considerations

### Security Best Practices

1. **Credential Management**
```rust
// Use environment variables instead of hardcoded credentials
let username = std::env::var("CASHU_USERNAME")?;
let password = std::env::var("CASHU_PASSWORD")?;
```

2. **Token Storage**
```rust
// Store access tokens securely
wallet.set_cat(access_token).await?;
// Tokens are automatically saved in the wallet's secure storage
```

3. **Error Handling**
```rust
match wallet.mint_quote(amount, None).await {
    Ok(quote) => { /* handle success */ },
    Err(Error::InsufficientBlindAuth) => {
        // Mint more blind auth tokens
        wallet.mint_blind_auth(10.into()).await?;
        // Retry operation
    },
    Err(e) => return Err(e),
}
```

### Multi-Mint Support
```rust
// Different mints may have different auth requirements
let mint_configs = vec![
    ("https://mint1.example.com", Some(token1)),
    ("https://mint2.example.com", None), // No auth required
    ("https://mint3.example.com", Some(token3)),
];
```

## Troubleshooting

### Common Authentication Errors

1. **Invalid credentials**: Check username/password configuration
2. **OIDC configuration**: Verify mint's OIDC discovery endpoint
3. **Network connectivity**: Ensure mint and OIDC provider are accessible
4. **Token expiration**: Implement token refresh logic for long-running applications

### Debugging Authentication
```rust
// Enable detailed logging
RUST_LOG=debug cargo run

// Check mint info response
println!("Mint supports auth: {:?}", mint_info.nuts.nut21);

// Monitor auth token usage
let auth_balance = wallet.get_unspent_auth_proofs().await?.len();
println!("Available auth tokens: {}", auth_balance);
```

## Next Steps

- Learn about [BIP-353](./bip353.md) for human-readable payment addresses
- Explore [BOLT12 integration](./mint-token-bolt12.md) for modern Lightning features  
- Try [custom HTTP clients](./mint-token-bolt12-with-custom-http.md) for advanced networking
