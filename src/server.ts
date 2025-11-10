import bodyParser from 'body-parser';
const { json, urlencoded } = bodyParser;
import express, { type Express, type Request, type Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import war from './war/war.manager';
import type {
  ApiResponse,
  StartWarResponseData,
  EndWarResponseData,
  TradeHistoryResponseData,
  HealthCheckResponseData,
  WarRunningStatusResponseData,
} from './types/api.types';

export const createServer = (): Express => {
  const app = express();
  app
    .disable('x-powered-by')
    .use(morgan('dev'))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
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
    .post('/start-war', async (_req: Request, res: Response<ApiResponse<StartWarResponseData>>) => {
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
    })
    .post('/end-war', (_req: Request, res: Response<ApiResponse<EndWarResponseData>>) => {
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
      '/trade-history',
      async (req: Request, res: Response<ApiResponse<TradeHistoryResponseData>>) => {
        try {
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
          return res.status(200).json({
            success: true,
            message: 'Trade history retrieved successfully',
            data: {
              accounts: cleanHistory,
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
