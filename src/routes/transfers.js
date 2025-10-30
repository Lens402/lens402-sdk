import express from 'express';
import { getAssetTransfers } from '../services/alchemy.js';
import { paymentRequired } from '../middleware/payment.js';
import { logger } from '../logger.js';

const router = express.Router();

/**
 * GET /api/transfers
 *
 * Fetch transaction history for a wallet address
 * Requires x402 payment to access
 *
 * Query Parameters:
 * - address: Wallet address (required, can be fromAddress or toAddress)
 * - fromAddress: Source address filter
 * - toAddress: Destination address filter
 * - category: Transfer types (comma-separated: external,internal,SPL,NFT,PDA)
 * - fromBlock: Start block (hex or number)
 * - toBlock: End block (hex or "latest")
 * - maxCount: Max results (1-1000, default: 100)
 * - pageKey: Pagination key from previous response
 * - order: Sort order (asc or desc, default: desc)
 * - contractAddresses: Token contract addresses (comma-separated)
 *
 * Headers:
 * - X-Payment-Hash: Transaction hash of payment (required)
 * - X-Payment-Amount: Amount paid (optional)
 *
 * Example:
 * GET /api/transfers?address=addr...&category=external,SPL&maxCount=50
 * Headers: X-Payment-Hash: 0xabc123...
 */
router.get('/', paymentRequired({ price: '0.01' }), async (req, res, next) => {
  try {
    const {
      address,
      fromAddress,
      toAddress,
      category,
      fromBlock,
      toBlock,
      maxCount,
      pageKey,
      order,
      contractAddresses,
    } = req.query;

    // Validate required parameters
    if (!address && !fromAddress && !toAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        status: 400,
        message: 'At least one of: address, fromAddress, or toAddress is required',
        example: '/api/transfers?address=addr...',
      });
    }

    // Build query parameters
    const queryParams = {
      fromAddress: fromAddress || (address && address),
      toAddress: toAddress || (address && address),
    };

    // Parse category (comma-separated string to array)
    if (category) {
      queryParams.category = category.split(',').map(c => c.trim());
    }

    // Parse contract addresses
    if (contractAddresses) {
      queryParams.contractAddresses = contractAddresses.split(',').map(a => a.trim());
    }

    // Add optional parameters
    if (fromBlock) queryParams.fromBlock = fromBlock;
    if (toBlock) queryParams.toBlock = toBlock;
    if (maxCount) queryParams.maxCount = parseInt(maxCount, 10);
    if (pageKey) queryParams.pageKey = pageKey;
    if (order) queryParams.order = order;

    logger.info({
      query: queryParams,
      payment: req.payment,
    }, 'Processing transfers request');

    // Fetch transfers from Alchemy
    const result = await getAssetTransfers(queryParams);

    // Return response with payment info
    res.json({
      success: true,
      data: result,
      payment: {
        hash: req.payment?.hash,
        amount: req.payment?.amount,
        timestamp: req.payment?.timestamp,
      },
      pagination: {
        hasMore: !!result.pageKey,
        pageKey: result.pageKey,
        count: result.totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transfers/info
 *
 * Get information about the transfers endpoint
 * Free endpoint (no payment required)
 */
router.get('/info', (req, res) => {
  res.json({
    endpoint: '/api/transfers',
    description: 'Fetch blockchain transaction history for any wallet address',
    payment: {
      required: true,
      price: '0.01 USDC',
      network: 'Solana-Devnet',
      currency: 'USDC',
    },
    parameters: {
      address: 'Wallet address to query (can be from or to)',
      fromAddress: 'Filter by sender address',
      toAddress: 'Filter by recipient address',
      category: 'Transfer types: external, internal, SPL, NFT, PDA',
      fromBlock: 'Start block (hex or number)',
      toBlock: 'End block (hex, number, or "latest")',
      maxCount: 'Max results per page (1-1000, default: 100)',
      pageKey: 'Pagination key from previous response',
      order: 'Sort order: asc or desc (default: desc)',
      contractAddresses: 'Token contract addresses (comma-separated)',
    },
    headers: {
      'X-Payment-Hash': 'Transaction hash of your payment (required)',
      'X-Payment-Amount': 'Amount paid (optional)',
    },
    example: {
      curl: 'curl -H "X-Payment-Hash: addr..." "https://api.txpay.xyz/api/transfers?address=addr..."',
      payment: 'Send 0.01 USDC on Solana Devnet to receive access',
    },
    documentation: 'https://github.com/yourusername/txpay/docs',
  });
});

export default router;
