# Implementing a Cashu Mint in Rust

This tutorial guides you through setting up a basic Cashu mint using the Cashu Dev Kit in Rust.

## Introduction

A Cashu mint is the central component of the Cashu ecosystem, responsible for issuing and redeeming tokens. While a mint in production should be approached with extreme care and security (as it holds actual Bitcoin funds), this tutorial will help you understand the basic structure and functionality for educational purposes.

::: tip Note
This is an educational implementation. For a production-ready mint, extensive security measures and testing would be required.
:::

## Prerequisites

- Rust development environment
- Basic understanding of cryptography concepts
- Familiarity with Lightning Network (for integration)

## Setting up the Mint

### Step 1: Project Setup

First, let's create a new Rust project for our mint:

```bash
cargo new cashu-mint
cd cashu-mint
```

Add the necessary dependencies to your `Cargo.toml`:

```toml
[dependencies]
cashu = "0.1.0"
tokio = { version = "1", features = ["full"] }
axum = "0.6"
bitcoin = "0.30"
lightning-client = "0.1"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"
```

### Step 2: Initialize the Key Manager

The key manager is responsible for creating and managing the mint's keys:

```rust
use cashu::mint::KeyManager;

struct MintState {
    key_manager: KeyManager,
    // We'll add more fields later
}

impl MintState {
    fn new() -> Self {
        // In production, you would load or generate secure seed
        let seed = [0u8; 32]; // Example only - NEVER use this in production!
        
        let key_manager = KeyManager::new(&seed);
        
        MintState {
            key_manager,
        }
    }
}
```

### Step 3: Implement the Core Mint Logic

The mint needs to handle several operations:

1. Key management
2. Blind signature issuance
3. Token verification
4. Lightning integration for funding/redemption

Let's implement these core components:

```rust
use cashu::mint::{BlindSignature, Mint, MintError};
use cashu::protocol::{Token, BlindedMessage};
use bitcoin::Amount;

struct CashuMint {
    state: MintState,
    // Store for keeping track of spent tokens
    spent_tokens: Vec<String>,
}

impl CashuMint {
    fn new() -> Self {
        CashuMint {
            state: MintState::new(),
            spent_tokens: Vec::new(),
        }
    }
    
    // Generate and return mint public keys
    fn get_public_keys(&self) -> Vec<(String, String)> {
        self.state.key_manager.get_public_keys()
    }
    
    // Process blinded messages and return blind signatures
    async fn mint_tokens(&mut self, blinded_messages: Vec<BlindedMessage>, amount: Amount) 
        -> Result<Vec<BlindSignature>, MintError> {
        
        // In a real implementation, we would:
        // 1. Verify that payment has been received
        // 2. Sign the blinded messages with appropriate keys
        // 3. Return blind signatures
        
        let blind_signatures = self.state.key_manager
            .sign_blinded_messages(blinded_messages, amount.as_sat());
            
        Ok(blind_signatures)
    }
    
    // Verify and redeem tokens
    async fn redeem_tokens(&mut self, tokens: Vec<Token>) 
        -> Result<Amount, MintError> {
        
        // In a real implementation, we would:
        // 1. Verify that tokens are valid
        // 2. Check that tokens haven't been spent before
        // 3. Mark tokens as spent
        // 4. Return the total amount
        
        let mut total_amount = Amount::ZERO;
        
        for token in tokens {
            // Verify the token signature
            if !self.state.key_manager.verify_token(&token) {
                return Err(MintError::InvalidSignature);
            }
            
            // Check for double-spending
            let token_id = token.id.to_string();
            if self.spent_tokens.contains(&token_id) {
                return Err(MintError::TokenAlreadySpent);
            }
            
            // Mark as spent
            self.spent_tokens.push(token_id);
            
            // Add to total
            total_amount += Amount::from_sat(token.amount);
        }
        
        Ok(total_amount)
    }
}
```

### Step 4: API Setup with Axum

Now, let's create a web server for the mint API:

```rust
use axum::{
    extract::Json,
    routing::{get, post},
    Router,
};
use std::sync::{Arc, Mutex};

// Our application state
struct AppState {
    mint: Mutex<CashuMint>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    // Create our mint
    let mint = CashuMint::new();
    let state = Arc::new(AppState {
        mint: Mutex::new(mint),
    });
    
    // Build our API router
    let app = Router::new()
        .route("/keys", get(get_keys))
        .route("/mint", post(mint_tokens))
        .route("/redeem", post(redeem_tokens))
        .with_state(state);
        
    // Start the server
    let addr = "0.0.0.0:3000";
    tracing::info!("Listening on {}", addr);
    axum::Server::bind(&addr.parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

// Handler implementations
async fn get_keys(
    state: axum::extract::State<Arc<AppState>>,
) -> Json<Vec<(String, String)>> {
    let mint = state.mint.lock().unwrap();
    Json(mint.get_public_keys())
}

async fn mint_tokens(
    state: axum::extract::State<Arc<AppState>>,
    Json(payload): Json<MintRequest>,
) -> Result<Json<MintResponse>, axum::http::StatusCode> {
    let mut mint = state.mint.lock().unwrap();
    
    match mint.mint_tokens(payload.blinded_messages, payload.amount).await {
        Ok(blind_signatures) => Ok(Json(MintResponse { blind_signatures })),
        Err(_) => Err(axum::http::StatusCode::BAD_REQUEST),
    }
}

async fn redeem_tokens(
    state: axum::extract::State<Arc<AppState>>,
    Json(payload): Json<RedeemRequest>,
) -> Result<Json<RedeemResponse>, axum::http::StatusCode> {
    let mut mint = state.mint.lock().unwrap();
    
    match mint.redeem_tokens(payload.tokens).await {
        Ok(amount) => Ok(Json(RedeemResponse { amount: amount.as_sat() })),
        Err(_) => Err(axum::http::StatusCode::BAD_REQUEST),
    }
}

// Request/response types
#[derive(serde::Deserialize)]
struct MintRequest {
    blinded_messages: Vec<BlindedMessage>,
    amount: Amount,
}

#[derive(serde::Serialize)]
struct MintResponse {
    blind_signatures: Vec<BlindSignature>,
}

#[derive(serde::Deserialize)]
struct RedeemRequest {
    tokens: Vec<Token>,
}

#[derive(serde::Serialize)]
struct RedeemResponse {
    amount: u64,
}
```

### Step 5: Lightning Integration

For a complete mint, you would integrate with a Lightning node to handle deposits and withdrawals:

```rust
use lightning_client::LightningClient;

// Add to MintState
struct MintState {
    key_manager: KeyManager,
    lightning_client: LightningClient,
}

// Lightning invoice creation
async fn create_lightning_invoice(
    state: axum::extract::State<Arc<AppState>>,
    Json(payload): Json<InvoiceRequest>,
) -> Result<Json<InvoiceResponse>, axum::http::StatusCode> {
    let mint = state.mint.lock().unwrap();
    
    // Create an invoice via Lightning client
    let invoice = mint.state.lightning_client
        .create_invoice(payload.amount, "Cashu mint deposit", 3600)
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
        
    Ok(Json(InvoiceResponse {
        invoice: invoice.bolt11,
        payment_hash: invoice.payment_hash,
    }))
}

// Lightning payment
async fn pay_lightning_invoice(
    state: axum::extract::State<Arc<AppState>>,
    Json(payload): Json<PaymentRequest>,
) -> Result<Json<PaymentResponse>, axum::http::StatusCode> {
    let mut mint = state.mint.lock().unwrap();
    
    // First redeem the tokens
    let amount = mint.redeem_tokens(payload.tokens).await
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        
    // Pay the invoice
    let payment = mint.state.lightning_client
        .pay_invoice(&payload.invoice)
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
        
    Ok(Json(PaymentResponse {
        payment_id: payment.id,
        status: payment.status,
    }))
}
```

## Conclusion

This tutorial has covered the basic components needed to implement a Cashu mint in Rust:

1. Key management for blind signatures
2. Token minting and redemption
3. Double-spend protection
4. API endpoints for client interaction
5. Lightning integration for deposits and withdrawals

In a production environment, you would need to add:

- Persistent storage for tokens and keys
- Robust error handling
- Security hardening
- Rate limiting and DoS protection
- Backup and recovery procedures
- Monitoring and alerting

The Cashu Dev Kit simplifies the implementation of these components while ensuring compliance with the Cashu protocol specification.