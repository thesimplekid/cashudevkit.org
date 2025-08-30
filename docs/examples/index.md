# Examples

Welcome to the CDK examples collection! These practical examples demonstrate how to build Cashu applications using the Cashu Dev Kit. Each example includes complete, runnable code with detailed explanations.

## Getting Started Examples

### [Getting Started](./getting-started.md)
Set up your development environment and create your first CDK application. Perfect introduction to CDK fundamentals.

**Key concepts**: Installation, project setup, basic wallet creation

### [Single Mint Wallet](./single-mint-wallet.md)
Complete tutorial building a full-featured wallet that interacts with a single mint. Includes the entire workflow from setup to token transfers.

**Key concepts**: Complete workflow, payment monitoring, production considerations

### [Basic Wallet](./basic-wallet.md)
Learn the fundamentals of creating a Cashu wallet, minting tokens, and preparing transfers. Simplified version focusing on core concepts.

**Key concepts**: Wallet creation, token minting, basic transfers

### [Mint Token](./mint-token.md)
A comprehensive example with logging and error handling that shows the complete token minting process from quote to final token.

**Key concepts**: Detailed logging, error handling, production patterns

## Payment Examples

### [Melt Token](./melt-token.md)
Convert Cashu tokens back to Lightning payments. Learn how to "melt" your ecash tokens to pay Lightning invoices.

**Key concepts**: Lightning payments, invoice handling, token redemption

### [P2PK (Pay-to-Public-Key)](./p2pk.md)
Create and redeem tokens that are locked to specific public keys, enabling secure and conditional payments.

**Key concepts**: Cryptographic locks, spending conditions, secure transfers

## BOLT12 Examples

BOLT12 offers provide improved privacy and reusability compared to traditional Lightning invoices.

### [BOLT12 Mint Token](./mint-token-bolt12.md)
Mint tokens using modern BOLT12 offers instead of traditional Lightning invoices.

**Key concepts**: BOLT12 offers, reusable payments, enhanced privacy

### [BOLT12 with Streaming](./mint-token-bolt12-with-stream.md)
Handle multiple BOLT12 payments concurrently using CDK's streaming interface for high-volume applications.

**Key concepts**: Concurrent processing, payment streams, batch operations

### [BOLT12 with Custom HTTP](./mint-token-bolt12-with-custom-http.md)
Implement custom HTTP clients for specialized networking requirements like custom timeouts, proxies, or alternative HTTP libraries.

**Key concepts**: Custom networking, HTTP transports, production deployment

## Advanced Examples

### [Proof Selection](./proof-selection.md)
Understand how wallets select and manage individual proofs (tokens) for optimal performance and minimal fees.

**Key concepts**: Proof optimization, denomination management, fee minimization

### [Authentication Wallet](./auth-wallet.md)
Work with mints that require authentication using CAT (Client Authentication Token) or OIDC protocols.

**Key concepts**: Mint authentication, access tokens, protected operations

### [BIP-353 Human Readable Payments](./bip353.md)
Use human-readable addresses like `alice@example.com` instead of complex payment codes for better user experience.

**Key concepts**: DNS-based payments, user-friendly addresses, BOLT12 integration

## Example Categories

### By Use Case
- **Wallet Development**: Basic Wallet, Mint Token, Proof Selection
- **Payment Processing**: Melt Token, BOLT12 examples, BIP-353
- **Security Features**: P2PK, Authentication Wallet
- **High Performance**: Streaming, Custom HTTP, Batch Processing

### By Complexity Level
- **Beginner**: Basic Wallet, Mint Token
- **Intermediate**: P2PK, Melt Token, BOLT12 Mint Token
- **Advanced**: Authentication, Streaming, Custom HTTP, BIP-353

### By Network Features
- **Lightning Integration**: Melt Token, BOLT12 examples
- **Privacy Features**: P2PK, BOLT12, BIP-353
- **Scaling Solutions**: Streaming, Proof Selection

## Running the Examples

### Prerequisites
```bash
# Install Rust if you haven't already
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Create a new project
cargo new my-cashu-app
cd my-cashu-app
```

### Basic Dependencies
Add these to your `Cargo.toml` for most examples:

```toml
[dependencies]
cdk = { version = "*", default-features = false, features = ["wallet"] }
cdk-sqlite = { version = "*", features = ["wallet"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"
```

### Feature Flags
Some examples require additional features:

```toml
# For BOLT12 examples
cdk = { version = "*", features = ["wallet", "bolt12"] }

# For BIP-353 examples  
cdk = { version = "*", features = ["wallet", "bip353"] }

# For authentication examples
cdk = { version = "*", features = ["wallet", "auth"] }
```

## Testing with Mints

### Development Mints
Most examples use test mints like `https://fake.thesimplekid.dev` for demonstration purposes.
