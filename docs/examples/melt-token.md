# Melt Token Example

This example demonstrates how to "melt" Cashu tokens back into Lightning payments. Melting is the process of converting ecash tokens back to Lightning Network payments, effectively spending your Cashu tokens to pay Lightning invoices.

## What This Example Does

1. **Creates and funds a wallet** with tokens
2. **Generates a Lightning invoice** for demonstration purposes
3. **Creates a melt quote** to pay the Lightning invoice
4. **Executes the melt operation** to complete the payment

## Key Concepts

- **Melting**: Converting Cashu tokens back to Lightning payments
- **Melt quotes**: Getting fee estimates and payment details before melting
- **Lightning invoice generation**: Creating invoices for testing purposes
- **Payment execution**: Completing Lightning payments using Cashu tokens

## Code Example

```rust
use std::sync::Arc;
use std::time::Duration;

use bitcoin::hashes::{sha256, Hash};
use bitcoin::hex::prelude::FromHex;
use bitcoin::secp256k1::Secp256k1;
use cdk::error::Error;
use cdk::nuts::nut00::ProofsMethods;
use cdk::nuts::{CurrencyUnit, SecretKey};
use cdk::wallet::Wallet;
use cdk::Amount;
use cdk_sqlite::wallet::memory;
use lightning_invoice::{Currency, InvoiceBuilder, PaymentSecret};
use rand::Rng;

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Initialize the memory store for the wallet
    let localstore = memory::empty().await?;

    // Generate a random seed for the wallet
    let seed = rand::rng().random::<[u8; 64]>();

    // Define the mint URL and currency unit
    let mint_url = "https://fake.thesimplekid.dev";
    let unit = CurrencyUnit::Sat;
    let amount = Amount::from(10);

    // Create a new wallet
    let wallet = Wallet::new(mint_url, unit, Arc::new(localstore), seed, None)?;

    let quote = wallet.mint_quote(amount, None).await?;
    let proofs = wallet
        .wait_and_mint_quote(
            quote,
            Default::default(),
            Default::default(),
            Duration::from_secs(10),
        )
        .await?;

    let receive_amount = proofs.total_amount()?;
    println!("Received {} from mint {}", receive_amount, mint_url);

    // Now melt what we have
    // We need to prepare a lightning invoice
    let private_key = SecretKey::from_slice(
        &<[u8; 32]>::from_hex("e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734")
            .unwrap(),
    )
    .unwrap();
    let random_bytes = rand::rng().random::<[u8; 32]>();
    let payment_hash = sha256::Hash::from_slice(&random_bytes).unwrap();
    let payment_secret = PaymentSecret([42u8; 32]);
    let invoice_to_be_paid = InvoiceBuilder::new(Currency::Bitcoin)
        .amount_milli_satoshis(5 * 1000)
        .description("Pay me".into())
        .payment_hash(payment_hash)
        .payment_secret(payment_secret)
        .current_timestamp()
        .min_final_cltv_expiry_delta(144)
        .build_signed(|hash| Secp256k1::new().sign_ecdsa_recoverable(hash, &private_key))
        .unwrap()
        .to_string();
    println!("Invoice to be paid: {}", invoice_to_be_paid);

    let melt_quote = wallet.melt_quote(invoice_to_be_paid, None).await?;
    println!(
        "Melt quote: {} {} {:?}",
        melt_quote.amount, melt_quote.state, melt_quote,
    );

    let melted = wallet.melt(&melt_quote.id).await?;
    println!("Melted: {:?}", melted);

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
bitcoin = "0.32"
lightning-invoice = "0.32"
```

## Running This Example

```bash
cargo run
```

## Expected Output

```
Received 10 from mint https://fake.thesimplekid.dev
Invoice to be paid: lnbc5u1p... [Lightning invoice]
Melt quote: 5 Unpaid MeltQuote { id: "...", amount: 5, ... }
Melted: MeltResult { state: Paid, amount: 5, fee_paid: 0, ... }
```

## Understanding the Process

### 1. Initial Setup
The example first creates a wallet and mints tokens to have something to melt.

### 2. Invoice Generation
For demonstration purposes, the example generates a test Lightning invoice:
- **Amount**: 5,000 millisatoshis (5 sats)
- **Description**: "Pay me"
- **Payment hash**: Randomly generated
- **Signature**: Created using a test private key

### 3. Melt Quote
Before melting, the wallet requests a quote that includes:
- **Amount to be paid**: The invoice amount
- **Fee estimate**: Network fees for the Lightning payment
- **Quote ID**: Reference for executing the payment

### 4. Melt Execution
The final step executes the melt operation, which:
- Sends the specified tokens to the mint
- Instructs the mint to pay the Lightning invoice
- Returns payment confirmation and fee details

## Real-World Usage

In production applications, you would:

1. **Receive a real Lightning invoice** from another user or service
2. **Get a melt quote** to understand fees before proceeding
3. **Execute the melt** to complete the payment
4. **Handle errors** for failed payments or insufficient funds

## Error Scenarios

Common errors include:
- **Insufficient funds**: Not enough tokens to cover the invoice amount plus fees
- **Invalid invoice**: Malformed or expired Lightning invoices
- **Payment failures**: Lightning network routing issues
- **Mint connectivity**: Network issues with the mint

## Security Notes

- **Private keys**: Never use hardcoded private keys in production
- **Invoice validation**: Always validate Lightning invoices before paying
- **Fee awareness**: Check melt quotes to understand payment costs
- **Amount verification**: Confirm invoice amounts match expectations

## Next Steps

- Learn about [BOLT12 offers](./mint-token-bolt12.md) for recurring payments
- Explore [P2PK tokens](./p2pk.md) for advanced spending conditions
- Try [BIP-353](./bip353.md) for human-readable payment addresses
