import bodyParser from 'body-parser';
const { json, urlencoded } = bodyParser;
import express, { type Express, type Request, type Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import war, { START_PRICE } from './war/war.manager.js';
import type {
  ApiResponse,
  StartWarResponseData,
  EndWarResponseData,
  TradeHistoryResponseData,
  HealthCheckResponseData,
  WarRunningStatusResponseData,
} from './types/api.types.js';
import rateLimit from 'express-rate-limit';
import type { HistoryTradeAccount } from './war/war.types.js';
import helmet from 'helmet';
import { authRateLimiter, validateSecret } from './middleware/app.middleware.js';

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const CACHE_TTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 60000; // 10 seconds cache (adjust based on how fresh data needs to be)

// General rate limiter for all endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: 'Too many requests from this API key, please try again later.',
});

let tradeHistoryCache: {
  data: TradeHistoryResponseData | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// Stricter rate limiter for expensive read operations (trade history)
// This prevents DDoS while ensuring legitimate requests always work
const readTradeHistoryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  limit: 20, // 20 requests per minute per IP (one every 3 seconds)
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: 'Too many requests for trade history, please try again in a moment.',
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count failed requests too
});

export const createServer = (): Express => {
  const app = express();
  app
    .use(
      helmet({
        contentSecurityPolicy: isDevelopment ? false : undefined,
        crossOriginEmbedderPolicy: false,
      })
    )
    .use(morgan(isDevelopment ? 'dev' : 'combined'))
    .use(urlencoded({ extended: true }))
    .use(json({ limit: '1mb' }))
    .use(
      cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-API-Secret'],
      })
    )
    .use(limiter)
    .get('/health', (_req: Request, res: Response<ApiResponse<HealthCheckResponseData>>) => {
      return res.status(200).json({
        success: true,
        message: 'Service is healthy',
        data: {
          status: 'ok',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      });
    })
    .get(
      '/is-war-running',
      (_req: Request, res: Response<ApiResponse<WarRunningStatusResponseData>>) => {
        return res.status(200).json({
          success: true,
          message: 'War running status retrieved successfully',
          data: {
            isRunning: war.isRunning(),
            timestamp: new Date().toISOString(),
          },
        });
      }
    )
    .use('/api', authRateLimiter, validateSecret)
    .post(
      '/api//start-war',
      async (_req: Request, res: Response<ApiResponse<StartWarResponseData>>) => {
        try {
          await war.init();
          // Execute war in background without waiting
          war.execute().catch((err) => {
            console.error('Error during war execution:', err);
          });

          return res.status(200).json({
            success: true,
            message: 'War started successfully',
            data: {
              status: 'started',
              startedAt: new Date().toISOString(),
            },
          });
        } catch (err) {
          console.error('Error starting war:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to start war',
            error: {
              code: 'WAR_START_FAILED',
              message: err instanceof Error ? err.message : 'Unknown error',
              details: err,
            },
          });
        }
      }
    )
    .post('/api/end-war', (_req: Request, res: Response<ApiResponse<EndWarResponseData>>) => {
      try {
        war.stop();
        return res.status(200).json({
          success: true,
          message: 'War stopped successfully',
          data: {
            status: 'stopped',
            stoppedAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error('Error stopping war:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to stop war',
          error: {
            code: 'WAR_STOP_FAILED',
            message: err instanceof Error ? err.message : 'Unknown error',
            details: err,
          },
        });
      }
    })
    .get(
      '/api/trade-history',
      readTradeHistoryLimiter,
      async (req: Request, res: Response<ApiResponse<TradeHistoryResponseData>>) => {
        try {
          const now = Date.now();
          const cacheAge = now - tradeHistoryCache.timestamp;

          // Return cached data if it's still fresh (within TTL)
          if (tradeHistoryCache.data && cacheAge < CACHE_TTL) {
            console.log(`Serving cached trade history (age: ${cacheAge}ms)`);
            return res.status(200).json({
              success: true,
              message: 'Trade history retrieved successfully (cached)',
              data: tradeHistoryCache.data,
            });
          }

          // Cache expired or doesn't exist, fetch fresh data
          console.log('Fetching fresh trade history...');

          const history = await war.getTradesHistory();
          // Clean up circular references (model and mcpClient)
          const cleanHistory = history.map((item) => ({
            account: {
              name: item.account.name,
              extended: item.account.extended,
            },
            balance: item.balance,
            openOrders: item.openOrders,
            positions: item.positions,
            trade: item.trade,
          }));

          const responseData: TradeHistoryResponseData = {
            accounts: cleanHistory,
            startPrice: START_PRICE,
            timestamp: new Date().toISOString(),
          };

          // Update cache
          tradeHistoryCache = {
            data: responseData,
            timestamp: now,
          };
          return res.status(200).json({
            success: true,
            message: 'Trade history retrieved successfully',
            data: {
              accounts: cleanHistory,
              startPrice: START_PRICE,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (err) {
          console.error('Error retrieving trade history:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to retrieve trade history',
            error: {
              code: 'TRADE_HISTORY_FAILED',
              message: err instanceof Error ? err.message : 'Unknown error',
              details: err,
            },
          });
        }
      }
    );

  return app;
};
