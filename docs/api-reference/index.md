# API Reference

This section provides links to the API documentation for the Cashu Development Kit and related libraries.

## Rust Crates

The Cashu Development Kit (CDK) is broken into a collection of modular crates, each with a specific purpose. This modular approach allows developers to use only the components they need for their specific implementation.

### Core Libraries

#### [Cashu](https://docs.rs/cashu/latest/cashu/)
This crate implements the core Cashu protocol as defined in the [Cashu NUTs (Notation, Usage, and Terminology)](https://github.com/cashubtc/nuts/). It provides utilities and types for working with the Cashu protocol and offers functionality for Cashu applications.

#### [CDK-Common](https://docs.rs/cdk-common/latest/cdk_common/)
This crate is the base foundation to build things that can interact with the CDK (Cashu Development Kit) and their internal crates. It contains the shared types, traits and common functions that are used across the internal crates.

#### [CDK](https://docs.rs/cdk/latest/cdk/)
The Cashu Development Kit (CDK) is the core library that implements the Cashu protocol. It provides the building blocks for creating Cashu mints, wallets, and other applications.

### Storage Backends

#### [CDK-REDB](https://docs.rs/cdk-redb/latest/cdk_redb/)
A redb storage backend for CDK. This crate provides a persistent storage implementation using the redb database.

#### [CDK-SQLite](https://docs.rs/cdk-sqlite/latest/cdk_sqlite/)
A SQLite storage backend for CDK. This crate provides a persistent storage implementation using the SQLite database.

### Lightning Backends

#### [CDK-CLN](https://docs.rs/cdk-cln/latest/cdk_cln/)
A Core Lightning (CLN) backend for CDK. This crate provides integration with Core Lightning nodes for processing Lightning Network payments.

#### [CDK-LND](https://docs.rs/cdk-lnd/latest/cdk_lnd/)
A Lightning Network Daemon (LND) backend for CDK. This crate provides integration with LND nodes for processing Lightning Network payments.

### RPC Libraries

#### [CDK-Mint-RPC](https://docs.rs/cdk-mint-rpc/latest/cdk_mint_rpc/)
A library for managing Cashu mints through RPC interfaces. This crate provides tools for remote mint management and administration.

### Binary Implementations

#### [CDK-CLI](https://docs.rs/crate/cdk-cli/latest)
A command-line wallet implementation built with the CDK. This binary provides a complete Cashu wallet with support for token management, mint interactions, and other wallet operations.

#### [CDK-Mintd](https://docs.rs/cdk-mintd/latest/cdk_mintd/)
A complete mint server implementation built with the CDK. This binary provides a production-ready Cashu mint with support for token issuance, redemption, and state management.

## Using the API

For developers looking to integrate Cashu into their applications, these documentation resources provide detailed information about available functions, types, and modules.

Each crate's documentation includes examples and usage patterns to help you get started with implementing Cashu functionality in your projects.
