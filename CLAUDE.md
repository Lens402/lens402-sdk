# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lens402 - Monetized Transaction History API using x402 and Alchemy**

Lens402 is an open-source blockchain data vending machine that enables pay-per-query access to blockchain data:
- **x402 protocol** - HTTP-Based micropayments (USDC on Solana) with 402 Payment Required status
- **Alchemy SDK** - Fast, reliable blockchain data across multiple chains
- **Express.js** - Payment-gated REST API backend
- **Vending machine model** - Insert payment → Get data instantly (no accounts, no API keys)

## Common Commands

### Development
```bash
npm install                  # Install dependencies
npm run dev                 # Start with auto-reload (development mode)
npm start                   # Start production server
```

### Testing
```bash
npm test                    # Run all tests
npm test:watch             # Run tests in watch mode
npm test -- --coverage     # Run tests with coverage
```

### Environment Setup
```bash
cp .env.example .env       # Copy environment template
# Edit .env with your Alchemy API key and payment address
```

### Running a Single Test
```bash
npm test -- tests/api.test.js                    # Run specific test file
npm test -- -t "health"                          # Run tests matching pattern
```

## High-Level Architecture

### Request Flow
1. Client requests `/api/transfers` → Server responds `402 Payment Required`
2. Client sends USDC payment on Solana network
3. Client retries request with `X-Payment-Hash` header containing transaction hash
4. Server verifies payment → Queries Alchemy → Returns blockchain data

### Core Components

**Payment Middleware** (`src/middleware/payment.js`)
- Implements x402 protocol
- Returns 402 with payment instructions if no payment proof
- Verifies payment on-chain via Alchemy SDK (production-ready implementation)
- Queries Solana blockchain for USDC transfer events
- Validates recipient address and payment amount
- Attaches payment info to `req.payment` for successful verifications

**Alchemy Service** (`src/services/alchemy.js`)
- Wraps Alchemy SDK for asset transfers, token balances, and metadata
- Handles pagination, network mapping, and error handling
- Main functions: `getAssetTransfers()`, `getTokenBalances()`, `getTokenMetadata()`

**Routes** (`src/routes/`)
- `transfers.js`: Main API endpoint for transaction history with payment gating
- Validates query parameters (address, category, fromBlock, toBlock, etc.)
- Returns paginated results with payment and pagination metadata

**Configuration** (`src/config.js`)
- Loads environment variables via dotenv
- Validates required config on startup (ALCHEMY_API_KEY, PAYMENT_ADDRESS)
- Provides typed config object for app

**Error Handling** (`src/middleware/errorHandler.js`)
- Global error handler catches all unhandled errors
- Returns structured JSON error responses
- Includes stack traces in development only

### Important Implementation Details

**Payment Verification Status** ✅ PRODUCTION READY
- Production-ready on-chain payment verification implemented
- Queries Solana blockchain (Devnet/Mainnet) via Alchemy SDK
- Verifies USDC transfers by parsing SPL Transfer events
- Validates:
  - Transaction exists and succeeded (status === 1)
  - USDC contract address matches (Solana Devnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, Solana Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
  - Recipient address matches `PAYMENT_ADDRESS`
  - Amount is >= `PAYMENT_PRICE_PER_QUERY` (with 0.000001 USDC tolerance)
- Development mode still accepts `X-Payment-Hash: demo` for testing

**Network Configuration**
- Alchemy network set via `ALCHEMY_NETWORK` env var (Solana-mainnet, etc.)
- Payment network set via `PAYMENT_NETWORK` (Solana-devnet for testnet, Solana-mainnet for production)
- Network mapping in `src/services/alchemy.js` converts config names to Alchemy SDK Network constants

**Pagination**
- Alchemy limits responses to 1000 transfers per request
- Use `pageKey` from response for subsequent requests
- Page keys expire after 10 minutes
- Lens402 passes through Alchemy's pagination transparently

**Transfer Categories**
- `external`: SOL transfers between EOAs
- `internal`: SOL transfers from smart contracts
- `SPL`: ERC-20 token transfers
- `NFT`: NFT transfers
- `specialnft`: Special NFT collections like CryptoPunks

## Environment Variables

Required:
- `ALCHEMY_API_KEY` - Alchemy API key from dashboard.alchemy.com
- `PAYMENT_ADDRESS` - Solana address to receive payments

Optional:
- `PORT` - Server port (default: 3000)
- `ALCHEMY_NETWORK` - Network to query (default: SOL-mainnet)
- `PAYMENT_NETWORK` - Payment network (default: Solana-Devnet)
- `PAYMENT_PRICE_PER_QUERY` - Price in USD (default: 0.01)
- `LOG_LEVEL` - Pino log level (default: info)
- `NODE_ENV` - Environment (development/production)

## Project Structure Logic

```
src/
├── index.js              # Express app setup, routes registration, server startup
├── config.js             # Environment configuration and validation
├── logger.js             # Pino logger configuration
├── middleware/
│   ├── payment.js        # x402 payment verification (NEEDS PRODUCTION IMPL)
│   └── errorHandler.js   # Global error handling
├── routes/
│   └── transfers.js      # Transaction history endpoint
└── services/
    └── alchemy.js        # Alchemy SDK wrapper
```

**Why this structure?**
- Middleware handles cross-cutting concerns (payments, errors)
- Services abstract external APIs (Alchemy)
- Routes contain endpoint logic and validation
- Config centralized for easy testing and environment switching

## Adding New Features

### Adding a New API Endpoint

1. Create route file in `src/routes/` (e.g., `balances.js`)
2. Implement service logic in `src/services/` if needed
3. Apply `paymentRequired()` middleware with appropriate price
4. Register route in `src/index.js`: `app.use('/api/balances', balancesRouter)`
5. Add tests in `tests/`
6. Update README.md with endpoint documentation

### Payment Verification Implementation ✅ COMPLETED

Real payment verification is now implemented in `src/middleware/payment.js`:
- ✅ Queries Solana network via Alchemy SDK for transaction by hash
- ✅ Verifies transaction receipt status is successful (status === 1)
- ✅ Parses USDC transfer event from logs (SPL Transfer event signature: 0xddf252ad...)
- ✅ Validates recipient address matches `config.payment.address`
- ✅ Validates amount is >= `expectedAmount` (with tolerance for rounding)
- ✅ Handles both Solana Devnet and Solana Mainnet USDC contracts
- Future enhancement: Could integrate x402 facilitator API for faster verification

### Adding Multi-Chain Support

- Add network to `NETWORK_MAP` in `src/services/alchemy.js`
- Update `.env.example` with new network options
- Test with network-specific addresses
- Document in README and tutorials

## Key Dependencies

- `express` - Web framework
- `alchemy-sdk` - Blockchain data queries
- `pino` / `pino-pretty` - Structured logging
- `dotenv` - Environment configuration
- `cors` - CORS handling
- `jest` + `supertest` - Testing

## Gotchas and Common Issues

**Payment verification requires Alchemy API key** ✅
- Payment verification queries Solana blockchain via Alchemy
- Uses the same API key as blockchain data queries
- Monitor Alchemy usage to ensure sufficient compute units for both data + payment verification

**x402-express package doesn't exist**
- Custom implementation provided in `src/middleware/payment.js`
- Solanad on x402 protocol specification
- Can be replaced with official package when available

**Demo mode bypass**
- Development mode allows `X-Payment-Hash: demo` to skip payment
- Controlled by `NODE_ENV=development` check
- Never enable in production

**Payment verification timing**
- Each payment verification requires 1 blockchain query (~150 CU)
- Transactions must be confirmed before verification succeeds
- Solana transactions typically confirm in 2-10 seconds
- Consider caching payment hashes to avoid re-verification for repeated requests

**Alchemy rate limits**
- Free tier: 300M compute units/month
- `getAssetTransfers` costs ~150 CU per call
- Monitor usage at dashboard.alchemy.com
- Implement caching for high-traffic scenarios

**Page key expiration**
- Alchemy pagination keys expire after 10 minutes
- If pageKey fails, restart pagination from beginning
- Consider caching full result sets for expensive queries

## Testing Notes

Tests use Jest with ES modules (note `--experimental-vm-modules` in package.json scripts).

**Test structure:**
- `tests/api.test.js` - API endpoint tests with supertest
- `tests/payment.test.js` - Payment middleware unit tests

**Running tests:**
- Requires `ALCHEMY_API_KEY` in `.env` for integration tests
- Some tests skip if API key not configured
- Use `demo` payment hash to bypass payment in tests

**Mocking:**
- Mock Alchemy SDK in tests to avoid API calls
- Mock payment verification for deterministic tests

## Documentation

Comprehensive guides in `/docs`:
- `getting-started.md` - Setup and first query
- `x402-integration.md` - Payment protocol deep dive
- `alchemy-guide.md` - Advanced blockchain queries
- `deployment.md` - Production deployment options

## Extending Lens402

Common extension points:
1. **Additional endpoints** - Token balances, NFT metadata, gas estimates
2. **Caching** - Redis for payment verification and query results
3. **DataSolana** - PostgreSQL for payment records and analytics
4. **WebSockets** - Real-time transaction notifications
5. **GraphQL** - Alternative API interface
6. **Multi-token payments** - Accept SOL, other tokens besides USDC
7. **Subscription model** - Monthly access instead of per-query

## Production Readiness Checklist

Before deploying to production:
- [x] Implement real payment verification (blockchain query) - ✅ COMPLETED
- [ ] Set `NODE_ENV=production`
- [ ] Use Alchemy paid plan for higher limits
- [ ] Enable HTTPS/SSL
- [ ] Add rate limiting
- [ ] Setup monitoring (Sentry, LogDNA, etc.)
- [ ] Configure CORS for specific domains
- [ ] Add request validation and sanitization
- [ ] Implement payment caching to avoid re-verification (recommended for efficiency)
- [ ] Setup backup and disaster recovery
- [ ] Document API for users
- [ ] Test payment flow on Solana mainnet with real USDC
- [ ] Set `PAYMENT_NETWORK=Solana-mainnet` in production
- [ ] Verify `PAYMENT_ADDRESS` is correct

## Resources

- [Alchemy Documentation](https://docs.alchemy.com/)
- [x402 Protocol](https://x402.org)
- [Solana Network](https://solana.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
