import bodyParser from 'body-parser';
const { json, urlencoded } = bodyParser;
import express, { type Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import war from './war/war.manager';

export const createServer = (): Express => {
  const app = express();
  app
    .disable('x-powered-by')
    .use(morgan('dev'))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .get('/start-war', async (req, res) => {
      await war.init();
      await war.execute().catch((err) => {
        console.error('Error executing war:', err);
        return res.status(500).json({ message: 'Error starting war' });
      });
      return res.json({ message: `war started` });
    })
    .get('/end-war', (_, res) => {
      war.stop();
      return res.json({ message: 'war ended' });
    })
    .get('/trade-history', async (req, res) => {
      const history = war.getTradesHistory();
      return res.json({ trade_history: history });
    });

  return app;
};
