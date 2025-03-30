# Sending and Receiving Cashu Tokens

This tutorial shows how to send and receive Cashu tokens between wallets using the Cashu Dev Kit.

## Prerequisites

- A basic understanding of Cashu concepts
- Cashu Dev Kit installed in your project
- Access to a Cashu mint (for testing, you can use a public mint)

## Setting Up Your Wallet

First, we need to initialize a wallet that connects to a Cashu mint:

```rust
use cashu::mint::MintClient;
use cashu::wallet::Wallet;

// Connect to a Cashu mint
let mint_url = "https://example-mint.com";
let mint_client = MintClient::new(mint_url);

// Create a new wallet
let wallet = Wallet::new(mint_client);
```

## Minting New Tokens

To mint new tokens, we first need to fund our wallet with Bitcoin or Lightning:

```rust
// Generate a Lightning invoice to fund our wallet
let amount_sats = 10000; // 10,000 satoshis
let invoice = wallet.mint_request_lightning(amount_sats).await?;

// The user pays this invoice using a Lightning wallet
println!("Pay this Lightning invoice: {}", invoice.bolt11);

// After payment, we can mint the tokens
let tokens = wallet.mint_complete(invoice.id).await?;
println!("Successfully minted {} sats worth of tokens", amount_sats);
```

## Sending Tokens

To send tokens to another user:

```rust
// Specify the amount to send
let send_amount = 5000; // 5,000 satoshis

// Create a token to send
let token = wallet.create_send_token(send_amount).await?;

// This token can be shared as a string, QR code, or other means
let token_string = token.to_string();
println!("Send this token to the recipient: {}", token_string);
```

## Receiving Tokens

When receiving a token from someone else:

```rust
// Receive token from sender (as a string)
let received_token_string = "cashuABC123..."; // example token received from sender

// Verify and receive the token
let (amount, _) = wallet.receive_token(received_token_string).await?;
println!("Successfully received {} sats", amount);
```

## Checking Wallet Balance

To check your wallet balance:

```rust
let balance = wallet.get_balance().await?;
println!("Current wallet balance: {} sats", balance);
```

## Redeeming Tokens for Lightning

To withdraw your tokens back to Lightning:

```rust
// Lightning invoice to pay
let invoice = "lnbc500n1..."; // Lightning invoice from recipient

// Pay the invoice using your Cashu tokens
let payment_result = wallet.pay_lightning_invoice(invoice).await?;
if payment_result.success {
    println!("Successfully paid Lightning invoice!");
} else {
    println!("Payment failed: {}", payment_result.error.unwrap_or_default());
}
```

## Conclusion

This tutorial covered the basic operations of sending and receiving Cashu tokens using the Cashu Dev Kit. Cashu's privacy features mean that none of these transactions appear on the blockchain, and the mint cannot track which tokens belong to whom due to the use of blind signatures.

For more advanced topics, explore our other tutorials on:
- Running your own Cashu mint
- Implementing Cashu in web applications
- Using Cashu with hardware wallets