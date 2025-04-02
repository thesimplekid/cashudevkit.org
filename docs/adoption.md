# Adoption

Here are several implementations that showcase the Cashu Development Kit's capabilities in real-world applications:

## [Mint Implementation](https://github.com/cashubtc/cdk/tree/main/crates/cdk-mintd)
A reference implementation of a Cashu mint server built with the CDK. Demonstrates how to create a fully functioning Cashu mint supporting token issuance, redemption, and state management.

## [Wallet Implementation](https://github.com/cashubtc/cdk/tree/main/crates/cdk-cli)
A reference implementation of a Cashu wallet built with the CDK. Demonstrates client-side operations including token management, mint queries, and wallet functionality.

## [Athenut](https://github.com/thesimplekid/athenut-mint)
An open-source Cashu mint implementation built on the CDK with additional features for production use. Shows how to extend the core CDK functionality with custom requirements.

## [Cashu Payment Backend](https://github.com/thesimplekid/cashu-payment-backend)
A backend service that provides a simple HTTP API for merchants to generate and process Cashu token payments. It implements NUT-18 payment protocol and supports multiple mints and currencies (SAT and USD), making it flexible for various use cases.

## [Cashu-LSP](https://github.com/thesimplekid/cashu-lsp)
A modular Lightning Service Provider (LSP) implementation that uses CDK to create NUT-18 payment requests for accepting Lightning Network channel payments, integrated with Lightning Development Kit (LDK) for node functionality.

## [Cashu Proxy](https://github.com/thesimplekid/cashu-proxy)
A HTTP proxy service that requires Cashu tokens for access, enabling pay-per-request APIs and services. Cashu Proxy sits between clients and your HTTP services, requiring payment in the form of Cashu tokens in the X-Cashu header of the request before forwarding requests. This enables monetization of APIs and web services on a per-request basis with minimal integration effort.

## [CDK Payment Processor](https://github.com/cashubtc/cdk/tree/main/crates/cdk-payment-processor)
A payment processing library built on top of the CDK that implements the NUT-18 payment protocol. It provides a standardized way to handle Cashu token payments, making it easier to integrate Cashu payments into applications and services.

