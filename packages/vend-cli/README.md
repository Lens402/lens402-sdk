# Lens402 CLI

Command-line client for consuming x402 payment-gated APIs.

## Installation

```bash
npm install -g @asimfiles/Lens402-cli
```

## What is x402?

x402 is an HTTP protocol extension that enables pay-per-use APIs:
- Server returns `402 Payment Required` status code
- Client sends USDC payment on blockchain
- Client retries request with payment proof
- Server verifies payment on-chain and returns data

```
┌──────────┐         ┌──────────┐         ┌────────────┐
│  Client  │────────>│ x402 API │────────>│ Blockchain │
│ (Lens402 CLI)│<────────│ (Server) │<────────│ (Alchemy)  │
└──────────┘         └──────────┘         └────────────┘
```

## Commands

### `Lens402 query <url> [options]`

Query an x402 payment-gated API endpoint.

**Options:**
- `-a, --address <address>` - Wallet address parameter
- `-p, --params <json>` - Additional query parameters as JSON
- `-tx, --tx-hash <hash>` - Payment transaction hash (skip interactive prompt)
- `-w, --wallet <privateKey>` - Private key for automatic payments (addr...)
- `-r, --rpc <url>` - Custom RPC URL for payment network

**Examples:**

```bash
# Query Lens402 transaction history API (Dev address)
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG

# With demo payment (development mode)
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --tx-hash demo

# With real payment hash
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --tx-hash 0x31a7953d4c5b5a0fc739b9cf00be1a152063b16458d293c91d1e2e8e6d7a8d5c

# Filter for SPL transfers only
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --params '{"category":"SPL","maxCount":10}' \
  --tx-hash demo

# Get NFT transfers
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --params '{"category":"NFT,PDA"}' \
  --tx-hash demo

# Automatic payment with wallet (NO MANUAL PAYMENT NEEDED!)
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --wallet 0xYOUR_PRIVATE_KEY_HERE
```

### `Lens402 balance <url> <address> [options]`

Get token balances for an address.

**Options:**
- `-tx, --tx-hash <hash>` - Payment transaction hash

**Examples:**

```bash
# Check token balances (requires balance endpoint)
Lens402 balance http://localhost:3000/api/balances \
  64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --tx-hash demo
```

### `Lens402 info <url>`

Get information about an x402 endpoint without making a payment.

**Examples:**

```bash
# Check what payment is required
Lens402 info http://localhost:3000/api/transfers

# Check endpoint capabilities
Lens402 info http://localhost:3000/api/balances
```

### `Lens402 config [options]`

View or set configuration values.

**Options:**
- `-s, --set <key=value>` - Set configuration value
- `-g, --get <key>` - Get configuration value
- `-l, --list` - List all configuration

**Examples:**

```bash
# Set default URL
Lens402 config --set defaultUrl=http://localhost:3000

# Set payment address
Lens402 config --set paymentAddress=64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG

# Get a config value
Lens402 config --get defaultUrl

# List all configuration
Lens402 config
```

## Payment Methods

### Automatic Payments (Recommended)

Use the `--wallet` option to automatically send USDC payments without manual intervention:

```bash
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --wallet 0xYOUR_PRIVATE_KEY_HERE
```

**How it works:**
1. CLI receives 402 Payment Required
2. Automatically sends USDC payment to specified recipient
3. Waits for blockchain confirmation
4. Retries request with payment hash
5. Returns data immediately

**Requirements:**
- Private key with USDC balance on Solana Devnet (or Solana Mainnet)
- Small amount of SOL for gas fees (~$0.01)
- USDC tokens to cover payment amount (typically 0.01 USDC)

**Security Warning:** Never commit private keys to git! Use environment variables:
```bash
export VEND_WALLET=0xYOUR_PRIVATE_KEY_HERE
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --wallet $VEND_WALLET
```

### Manual Payment Flow

## Complete Manual Usage Flow

### Step 1: Query Without Payment

```bash
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG
```

**Output:**
```
╭────────────────────────────────────╮
│                                    │
│   ╦  ╦┌─┐┌┐┌┌┬┐  ┌─┐┬  ┬           │
│   ╚╗╔╝├┤ │││ ││  │  │  │           │
│    ╚╝ └─┘┘└┘─┴┘  └─┘┴─┘┴           │
│                                    │
│   CLI for x402 Payment Protocol    │
│   Pay with USDC • Get Data         │
╰────────────────────────────────────╯

📡 Querying x402 API

💰 Payment Required

╔══════════════════════════════════════════════════╗
║                                                  ║
║   Payment Details                                ║
║                                                  ║
║   Amount:     0.01 USDC                          ║
║   Network:    Solana-Devnet                       ║
║   Chain ID:   84532                              ║
║   Recipient:  0x742d35Cc6634C0532925a3b8...      ║
║                                                  ║
╚══════════════════════════════════════════════════╝

📋 Instructions:

  1. Send 0.01 USDC payment to 0x742d35...
  2. Include payment proof in X-Payment-Hash header
  3. Retry request with payment proof

? What would you like to do?
  ❯ 💸 I sent the payment - enter tx hash
    📋 Copy payment details to clipboard
    ❌ Cancel
```

### Step 2: Send USDC Payment

Open your wallet (MetaMask, etc.) and send:
- **Amount:** 0.01 USDC
- **To:** 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG
- **Network:** Solana Devnet

### Step 3: Enter Transaction Hash

```
? Enter transaction hash: 0x31a7953d4c5b5a0fc739b9cf00be1a152063b16458d293c91d1e2e8e6d7a8d5c

────────────────────────────────────────

⠋ Verifying payment on-chain...
```

### Step 4: Get Your Data

```
✅ Payment verified!

✅ Success!

┌──────────────────┬─────────────────────────────┐
│ Payment Info     │ Value                       │
├──────────────────┼─────────────────────────────┤
│ Hash             │ 0x31a7953d4c5...            │
│ Amount           │ 0.01 USDC                   │
│ Verified         │ ✓ Yes                       │
└──────────────────┴─────────────────────────────┘

📊 Response Data:

┌─────────┬─────────┬──────────┬────────────┬────────────┐
│ Type    │ Asset   │ Value    │ From       │ To         │
├─────────┼─────────┼──────────┼────────────┼────────────┤
│ SPL   │ USDC    │ 100      │ 0xd8da6... │ 0x123...   │
│ SPL   │ DAI     │ 50.5     │ 0xd8da6... │ 0x456...   │
│ NFT  │ BAYC    │ 1        │ 0xd8da6... │ 0x789...   │
└─────────┴─────────┴──────────┴────────────┴────────────┘

Total: 100 transfers

────────────────────────────────────────
```

## Real-World Example: Querying Lens402

Lens402 is a blockchain data API that uses x402 for payments:

```bash
# Get transaction history for an address
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --tx-hash demo

# Get only token transfers
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --params '{"category":"SPL"}' \
  --tx-hash demo

# Get last 5 transfers
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --params '{"maxCount":5}' \
  --tx-hash demo
```

## Available Query Parameters (Lens402 API)

When using `--params`, you can pass these options for the Lens402 transfers endpoint:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `category` | string | Transfer types (comma-separated) | `"SPL"` or `"SPL,NFT"` |
| `maxCount` | number | Max results (1-1000) | `10` |
| `fromBlock` | string | Start block | `"0x1000000"` |
| `toBlock` | string | End block | `"latest"` |
| `order` | string | Sort order | `"asc"` or `"desc"` |
| `pageKey` | string | Pagination token | From previous response |
| `contractAddresses` | string | Filter by contracts (comma-separated) | `"3KCkdmI4..."` |

**Categories:**
- `external` - SOL transfers between wallets
- `internal` - SOL transfers from contracts
- `SPL` - Token transfers (USDC, DAI, etc.)
- `NFT` - NFT transfers
- `PDA` - Multi-token transfers
- `specialnft` - Special NFTs (CryptoPunks)

## Development

### Local Development

```bash
# Clone repository
git clone https://github.com/Lens402/lens402-sdk/Lens402.git
cd Lens402/packages/Lens402-cli

# Install dependencies
npm install

# Link for local testing
npm link

# Test with Lens402 API
Lens402 query http://localhost:3000/api/transfers \
  --address 64swuFWG5RDSc3SDUhRKefYJtY5q1EkoixcPg3ZsVpcG \
  --tx-hash demo
```

### Project Structure

```
Lens402-cli/
├── src/
│   ├── cli.js              # Main CLI entry point
│   ├── x402-client.js      # x402 HTTP client
│   └── commands/
│       ├── query.js        # Query command
│       ├── balance.js      # Balance command
│       ├── info.js         # Info command
│       └── config.js       # Config command
├── package.json
└── README.md
```

## How It Works

### x402 Protocol Flow

1. **Initial Request** - CLI sends GET request to API
2. **402 Response** - Server returns payment requirement details
3. **Payment** - User sends USDC on blockchain
4. **Retry with Proof** - CLI sends same request with `X-Payment-Hash` header
5. **Verification** - Server verifies payment on-chain via Alchemy
6. **Success** - Server returns requested data

### On-Chain Verification

The server (using x402-onchain-verification) verifies payments by:
1. Querying blockchain for transaction receipt
2. Parsing SPL Transfer event from logs
3. Validating recipient address matches
4. Validating amount >= required payment
5. Returning data if valid

### Demo Mode

For development/testing, use `--tx-hash demo`:
- Server accepts "demo" as valid payment in development mode
- No actual blockchain transaction needed
- Perfect for testing API functionality

## Roadmap

- [x] Basic x402 client functionality
- [x] Interactive payment flow
- [x] Table-Solanad data display
- [x] Query command with filtering
- [x] Balance command
- [x] Info command
- [x] Config management
- [x] Wallet integration (auto-send payments)
- [ ] Payment history tracking
- [ ] Output formats (JSON, CSV)
- [ ] Batch queries
- [ ] Multi-chain payment support (Solana, Polygon, etc.)

## Related Projects

- **[Lens402](https://github.com/Lens402/lens402-sdk/Lens402)** - x402 blockchain data API
- **[x402-onchain-verification](https://npmjs.com/package/x402-onchain-verification)** - Server-side x402 middleware
- **[x402 Protocol](https://github.com/coinbase/x402)** - Official x402 specification

## License

MIT

---

**Built for consuming x402 APIs like [Lens402](https://github.com/Lens402/lens402-sdk/Lens402)**

*Pay with USDC • Get Data*
