# BOLT12 with Custom HTTP Client Example

This example demonstrates how to use a custom HTTP client with CDK for BOLT12 operations. Custom HTTP clients allow you to implement specific networking requirements like custom timeouts, proxy support, authentication headers, or alternative HTTP libraries.

## What This Example Does

1. **Implements a custom HTTP transport** using the `ureq` library
2. **Configures custom networking settings** like timeouts and user agents
3. **Creates a wallet with the custom client** using WalletBuilder
4. **Processes BOLT12 payments** using streaming with the custom transport
5. **Demonstrates production-ready networking** configurations

## Key Concepts

- **Custom HTTP transport**: Implementing the `HttpTransport` trait
- **WalletBuilder pattern**: Configuring wallets with custom components
- **ureq HTTP client**: Alternative to reqwest with different features
- **Production networking**: Timeouts, retries, and connection management

## Code Example

```rust
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;

use cdk::error::Error;
use cdk::nuts::nut00::ProofsMethods;
use cdk::nuts::CurrencyUnit;
use cdk::wallet::{BaseHttpClient, HttpTransport, SendOptions, WalletBuilder};
use cdk::{Amount, StreamExt};
use cdk_common::mint_url::MintUrl;
use cdk_common::AuthToken;
use cdk_sqlite::wallet::memory;
use rand::random;
use serde::de::DeserializeOwned;
use serde::Serialize;
use tracing_subscriber::EnvFilter;
use ureq::config::Config;
use ureq::Agent;
use url::Url;

#[derive(Debug, Clone)]
pub struct CustomHttp {
    agent: Agent,
}

impl Default for CustomHttp {
    fn default() -> Self {
        Self {
            agent: Agent::new_with_config(
                Config::builder()
                    .timeout_global(Some(Duration::from_secs(5)))
                    .no_delay(true)
                    .user_agent("Custom HTTP Transport")
                    .build(),
            ),
        }
    }
}

#[cfg_attr(target_arch = "wasm32", async_trait::async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait::async_trait)]
impl HttpTransport for CustomHttp {
    fn with_proxy(
        &mut self,
        _proxy: Url,
        _host_matcher: Option<&str>,
        _accept_invalid_certs: bool,
    ) -> Result<(), Error> {
        panic!("Not supported");
    }

    async fn http_get<R>(&self, url: Url, _auth: Option<AuthToken>) -> Result<R, Error>
    where
        R: DeserializeOwned,
    {
        self.agent
            .get(url.as_str())
            .call()
            .map_err(|e| Error::HttpError(None, e.to_string()))?
            .body_mut()
            .read_json()
            .map_err(|e| Error::HttpError(None, e.to_string()))
    }

    /// HTTP Post request
    async fn http_post<P, R>(
        &self,
        url: Url,
        _auth_token: Option<AuthToken>,
        payload: &P,
    ) -> Result<R, Error>
    where
        P: Serialize + ?Sized + Send + Sync,
        R: DeserializeOwned,
    {
        self.agent
            .post(url.as_str())
            .send_json(payload)
            .map_err(|e| Error::HttpError(None, e.to_string()))?
            .body_mut()
            .read_json()
            .map_err(|e| Error::HttpError(None, e.to_string()))
    }
}

type CustomConnector = BaseHttpClient<CustomHttp>;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let default_filter = "debug";

    let sqlx_filter = "sqlx=warn,hyper_util=warn,reqwest=warn,rustls=warn";

    let env_filter = EnvFilter::new(format!("{},{}", default_filter, sqlx_filter));

    // Parse input
    tracing_subscriber::fmt().with_env_filter(env_filter).init();

    // Initialize the memory store for the wallet
    let localstore = Arc::new(memory::empty().await?);

    // Generate a random seed for the wallet
    let seed = random::<[u8; 64]>();

    // Define the mint URL and currency unit
    let mint_url = "https://fake.thesimplekid.dev";
    let unit = CurrencyUnit::Sat;
    let amount = Amount::from(10);

    let mint_url = MintUrl::from_str(mint_url)?;
    #[cfg(feature = "auth")]
    let http_client = CustomConnector::new(mint_url.clone(), None);

    #[cfg(not(feature = "auth"))]
    let http_client = CustomConnector::new(mint_url.clone());

    // Create a new wallet
    let wallet = WalletBuilder::new()
        .mint_url(mint_url)
        .unit(unit)
        .localstore(localstore)
        .seed(seed)
        .target_proof_count(3)
        .client(http_client)
        .build()?;

    let quotes = vec![
        wallet.mint_bolt12_quote(None, None).await?,
        wallet.mint_bolt12_quote(None, None).await?,
        wallet.mint_bolt12_quote(None, None).await?,
    ];

    let mut stream = wallet.mints_proof_stream(quotes, Default::default(), None);

    let stop = stream.get_cancel_token();

    let mut processed = 0;

    while let Some(proofs) = stream.next().await {
        let (mint_quote, proofs) = proofs?;

        // Mint the received amount
        let receive_amount = proofs.total_amount()?;
        tracing::info!("Received {} from mint {}", receive_amount, mint_quote.id);

        // Send a token with the specified amount
        let prepared_send = wallet.prepare_send(amount, SendOptions::default()).await?;
        let token = prepared_send.confirm(None).await?;
        tracing::info!("Token: {}", token);

        processed += 1;

        if processed == 3 {
            stop.cancel()
        }
    }

    tracing::info!("Stopped the loop after {} quotes being minted", processed);

    Ok(())
}
```

## Dependencies

Add these dependencies to your `Cargo.toml`:

```toml
[dependencies]
cdk = { version = "*", default-features = false, features = ["wallet", "bolt12"] }
cdk-sqlite = { version = "*", features = ["wallet"] }
cdk-common = "*"
tokio = { version = "1", features = ["full"] }
rand = "0.8"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
ureq = { version = "2.10", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
url = "2.5"
async-trait = "0.1"
```

## Running This Example

```bash
cargo run --features="bolt12"
```

## Expected Output

```
INFO Received 10 from mint 8f2c1a3b4d5e6f7a...
INFO Token: cashuAeyJ0eXAiOiJib2x0MTEi...
INFO Received 10 from mint 9a3d2f4e5b6c7d8e...
INFO Token: cashuAeyJ0eXAiOiJib2x0MTEi...
INFO Received 10 from mint 1b4e7a8d2f5c9e6f...
INFO Token: cashuAeyJ0eXAiOiJib2x0MTEi...
INFO Stopped the loop after 3 quotes being minted
```

## Understanding Custom HTTP Transport

### 1. HttpTransport Trait
```rust
#[async_trait]
impl HttpTransport for CustomHttp {
    async fn http_get<R>(&self, url: Url, auth: Option<AuthToken>) -> Result<R, Error>
    where R: DeserializeOwned;
    
    async fn http_post<P, R>(&self, url: Url, auth_token: Option<AuthToken>, payload: &P) -> Result<R, Error>
    where P: Serialize + ?Sized + Send + Sync, R: DeserializeOwned;
    
    fn with_proxy(&mut self, proxy: Url, host_matcher: Option<&str>, accept_invalid_certs: bool) -> Result<(), Error>;
}
```

### 2. Custom Configuration
```rust
let agent = Agent::new_with_config(
    Config::builder()
        .timeout_global(Some(Duration::from_secs(5)))    // 5-second timeout
        .no_delay(true)                                   // Disable Nagle algorithm
        .user_agent("Custom HTTP Transport")              // Custom user agent
        .build(),
);
```

### 3. WalletBuilder Integration
```rust
let wallet = WalletBuilder::new()
    .mint_url(mint_url)
    .unit(unit)
    .localstore(localstore)
    .seed(seed)
    .target_proof_count(3)
    .client(http_client)  // Custom HTTP client
    .build()?;
```

## Advanced HTTP Client Configurations

### 1. Proxy Support
```rust
impl HttpTransport for CustomHttp {
    fn with_proxy(&mut self, proxy: Url, _host_matcher: Option<&str>, _accept_invalid_certs: bool) -> Result<(), Error> {
        let proxy_config = ureq::Proxy::new(proxy.as_str())
            .map_err(|e| Error::HttpError(None, e.to_string()))?;
        
        self.agent = Agent::new_with_config(
            Config::builder()
                .proxy(Some(proxy_config))
                .build(),
        );
        
        Ok(())
    }
}
```

### 2. Authentication Headers
```rust
async fn http_get<R>(&self, url: Url, auth: Option<AuthToken>) -> Result<R, Error>
where R: DeserializeOwned,
{
    let mut request = self.agent.get(url.as_str());
    
    if let Some(token) = auth {
        request = request.set("Authorization", &format!("Bearer {}", token));
    }
    
    request
        .call()
        .map_err(|e| Error::HttpError(None, e.to_string()))?
        .body_mut()
        .read_json()
        .map_err(|e| Error::HttpError(None, e.to_string()))
}
```

### 3. Retry Logic
```rust
async fn http_post_with_retry<P, R>(&self, url: Url, auth_token: Option<AuthToken>, payload: &P) -> Result<R, Error>
where
    P: Serialize + ?Sized + Send + Sync,
    R: DeserializeOwned,
{
    let max_retries = 3;
    let mut last_error = None;
    
    for attempt in 0..max_retries {
        match self.http_post(url.clone(), auth_token.clone(), payload).await {
            Ok(result) => return Ok(result),
            Err(e) => {
                last_error = Some(e);
                if attempt < max_retries - 1 {
                    tokio::time::sleep(Duration::from_millis(100 * (1 << attempt))).await;
                }
            }
        }
    }
    
    Err(last_error.unwrap())
}
```

## Production HTTP Client Features

### 1. Connection Pooling
```rust
use ureq::config::Config;

let agent = Agent::new_with_config(
    Config::builder()
        .pool_max_idle_per_host(10)
        .pool_idle_timeout(Duration::from_secs(30))
        .keep_alive(true)
        .build(),
);
```

### 2. SSL/TLS Configuration
```rust
use ureq::config::{Config, TlsConfig};

let tls_config = TlsConfig::builder()
    .verify_hostname(true)
    .verify_certs(true)
    .build();

let agent = Agent::new_with_config(
    Config::builder()
        .tls_config(Some(tls_config))
        .build(),
);
```

### 3. Request/Response Logging
```rust
async fn http_post<P, R>(&self, url: Url, auth_token: Option<AuthToken>, payload: &P) -> Result<R, Error>
where
    P: Serialize + ?Sized + Send + Sync,
    R: DeserializeOwned,
{
    tracing::debug!("HTTP POST to {}", url);
    
    let start = std::time::Instant::now();
    let result = self.agent
        .post(url.as_str())
        .send_json(payload)
        .map_err(|e| Error::HttpError(None, e.to_string()))?
        .body_mut()
        .read_json()
        .map_err(|e| Error::HttpError(None, e.to_string()));
    
    let duration = start.elapsed();
    tracing::debug!("HTTP POST completed in {:?}", duration);
    
    result
}
```

## Alternative HTTP Libraries

### 1. Using `reqwest` with Custom Config
```rust
use reqwest::Client;

#[derive(Debug, Clone)]
pub struct ReqwestHttp {
    client: Client,
}

impl ReqwestHttp {
    pub fn new() -> Result<Self, Error> {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .user_agent("CDK Custom Client")
            .pool_idle_timeout(Duration::from_secs(90))
            .pool_max_idle_per_host(10)
            .build()
            .map_err(|e| Error::HttpError(None, e.to_string()))?;
        
        Ok(Self { client })
    }
}
```

### 2. Using `curl` via FFI
```rust
// For specialized networking requirements
#[derive(Debug, Clone)]
pub struct CurlHttp {
    // Configuration for libcurl
}

impl HttpTransport for CurlHttp {
    // Implement using curl-rust crate
}
```

### 3. Platform-Specific Clients
```rust
#[cfg(target_os = "ios")]
type PlatformHttp = NsurlSessionHttp;

#[cfg(target_os = "android")]
type PlatformHttp = OkHttpHttp;

#[cfg(not(any(target_os = "ios", target_os = "android")))]
type PlatformHttp = CustomHttp;
```

## Testing Custom HTTP Clients

### 1. Mock HTTP Transport
```rust
#[derive(Debug, Clone)]
pub struct MockHttp {
    responses: Arc<Mutex<HashMap<String, String>>>,
}

impl MockHttp {
    pub fn new() -> Self {
        Self {
            responses: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    pub fn add_response(&self, url: &str, response: &str) {
        self.responses.lock().unwrap().insert(url.to_string(), response.to_string());
    }
}

#[async_trait]
impl HttpTransport for MockHttp {
    async fn http_get<R>(&self, url: Url, _auth: Option<AuthToken>) -> Result<R, Error>
    where R: DeserializeOwned,
    {
        let responses = self.responses.lock().unwrap();
        let response = responses.get(url.as_str())
            .ok_or_else(|| Error::HttpError(None, "Mock response not found".to_string()))?;
        
        serde_json::from_str(response)
            .map_err(|e| Error::HttpError(None, e.to_string()))
    }
}
```

### 2. Performance Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_http_client_performance() {
        let client = CustomHttp::default();
        let url = Url::parse("https://httpbin.org/get").unwrap();
        
        let start = std::time::Instant::now();
        let _result: serde_json::Value = client.http_get(url, None).await.unwrap();
        let duration = start.elapsed();
        
        assert!(duration < Duration::from_millis(1000), "Request took too long");
    }
}
```

## Troubleshooting

### Common Issues
1. **Timeout errors**: Adjust timeout settings for your network conditions
2. **SSL/TLS errors**: Verify certificate configuration
3. **Proxy configuration**: Ensure proxy settings are correct
4. **Connection limits**: Monitor connection pool usage

### Debug Configuration
```rust
RUST_LOG=debug,ureq=trace cargo run
```

## Next Steps

- Learn about [authentication](./auth-wallet.md) for secured mint operations
- Explore [BIP-353 integration](./bip353.md) for user-friendly payment addresses
- Try [proof selection](./proof-selection.md) for optimizing wallet performance
