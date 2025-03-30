# Getting started

Welcome to the Cashu Development Kit documentation.

If you have any questions about anything related to Cashu Dev Kit, feel free to ask our community on [GitHub Discussions](https://github.com/thesimplekid/cashudevkit.org/discussions). 

## System Requirements

MacOS, Windows and Linux are supported.

## Installation

To add Cashu Dev Kit to a project, run:

<CodeSwitcher :languages="{rust:'Rust', javascript:'JavaScript', python:'Python'}">
  <template v-slot:rust>
 
  ```toml
    # Add the following dependencies to your cargo.toml and replace {VERSION} with the version number you want to use.

    [dependencies]
    cashu = { version = {VERSION} }
  ```
  </template>
  
  <template v-slot:javascript>
 
  ```bash
    # Using npm
    npm install cashu

    # Using yarn
    yarn add cashu
  ```
  </template>
  
  <template v-slot:python>
 
  ```bash
    # Using pip
    pip install cashu
  ```
  </template>
</CodeSwitcher>

## Example Usage

Here's a basic example of initializing Cashu in your project:

<CodeSwitcher :languages="{rust:'Rust', javascript:'JavaScript', python:'Python'}">
  <template v-slot:rust>

  ```rust
  use cashu::mint::MintClient;
  use cashu::wallet::Wallet;
  
  // Connect to a Cashu mint
  let mint_url = "https://example-mint.com";
  let mint_client = MintClient::new(mint_url);
  
  // Create a new wallet
  let wallet = Wallet::new(mint_client);
  ```

  </template>
  
  <template v-slot:javascript>

  ```javascript
  import { MintClient, Wallet } from 'cashu';
  
  // Connect to a Cashu mint
  const mintUrl = 'https://example-mint.com';
  const mintClient = new MintClient(mintUrl);
  
  // Create a new wallet
  const wallet = new Wallet(mintClient);
  ```

  </template>
  
  <template v-slot:python>

  ```python
  from cashu import MintClient, Wallet
  
  # Connect to a Cashu mint
  mint_url = 'https://example-mint.com'
  mint_client = MintClient(mint_url)
  
  # Create a new wallet
  wallet = Wallet(mint_client)
  ```

  </template>
</CodeSwitcher>