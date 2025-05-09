# Introduction

Cashu Development Kit is a complete and standalone implementation of the [Cashu protocol](https://cashu.space/) for Bitcoin-backed ecash.

You can build Cashu-enabled applications without needing to worry about getting all of the cryptographic blinding, token management, and protocol details exactly correct. The Cashu Dev Kit is suitable for a wide range of use cases where privacy-preserving, off-chain payments are desired.

## What is Cashu?

Cashu is a free and open-source Chaumian ecash protocol built for Bitcoin that enables private, fast payments. Digital payments should be as natural as handing over cash in person, and Cashu brings this simplicity back to online payments.

At its core, Cashu works through blind signatures, where a mint signs a token without seeing it, allowing users to transact privately. These digital bearer tokens are stored on a user's device, very similar to physical cash.

Key features of Cashu include:
- **Privacy**: The mint can't link withdrawals to deposits or track user spending
- **Off-chain**: Transactions happen instantly without blockchain confirmation
- **Lightning-compatible**: Easily fund or redeem to Lightning wallets
- **Versatile**: Build applications such as wallets, web paywalls, or voucher systems

An ecash system consists of two parts: the mint and the wallet. Anyone can run a mint for their application, whether it's a wallet, paid streaming service, or a rewards system for a supermarket. Transactions between users or service providers are instant, nearly free, and respect the user's privacy.

## References

### [Cashu Specification (NUTS)](https://github.com/cashubtc/nuts)

The Cashu specification (NUTS) defines the protocol that enables interoperability between different Cashu implementations.

### [Cashu Website](https://cashu.space)

The official Cashu website includes information about the protocol, wallets, and mints.
