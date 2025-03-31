# Introduction

Cashu Development Kit is a complete and standalone implementation of the [Cashu protocol](https://cashu.space/) for Bitcoin-backed ecash.

You can build Cashu-enabled applications without needing to worry about getting all of the cryptographic blinding, token management, and protocol details exactly correct. The Cashu Dev Kit is suitable for a wide range of use cases where privacy-preserving, off-chain payments are desired.

## What is Cashu?

Cashu is a free and open-source Chaumian ecash system that enables private, fast payments using Bitcoin and Lightning. It works based on blind signatures, where a mint signs a token without seeing it, allowing users to transact privately.

Key features of Cashu include:
- **Privacy**: The mint can't link withdrawals to deposits or track user spending
- **Off-chain**: Transactions happen instantly without blockchain confirmation
- **Lightning-compatible**: Easily fund or redeem to Lightning wallets

## WHAT'S CASHU
Digital payments should be as natural as handing over cash in person. Cashu brings simplicity back to online payments.

Cashu is a free and open-source Chaumian ecash protocol built for Bitcoin. A digital bearer token that is stored on a user's device, very similar to physical cash. The Cashu protocol allows you to build applications such as wallets or voucher systems. Transactions are instant and nearly free.

Cashu is an ecash protocol that is integrated with the Bitcoin protocol. An ecash system consists of two parts, the mint and the wallet. Anyone can run a mint for their application, be it a wallet, a web paywall, paid streaming services, or a voucher and rewards system for a super market.

Ecash transactions between users or service providers respect the user's privacy. A mint does not store a database of user accounts and their activity which protects users from leaks or hacks and can provide stronger censorship resistance than classical payment systems.

## References

### [Cashu Specification (NUTS)](https://github.com/cashubtc/nuts)

The Cashu specification (NUTS) defines the protocol that enables interoperability between different Cashu implementations.

### [Cashu Website](https://cashu.space)

The official Cashu website includes information about the protocol, wallets, and mints.
