# Extended War - AI Trading Bot Showcase

> A showcase project demonstrating the capabilities of [ask-starknet](https://github.com/KasarLabs/ask-starknet) - an AI-powered tool that enables autonomous agents to interact with the Starknet blockchain.

This project showcases how AI agents can autonomously trade on Extended Exchange (X10) using the ask-starknet MCP server. Multiple AI models (Claude, Gemini, GPT) compete against each other in automated trading scenarios.

## What is ask-starknet?

[ask-starknet](https://github.com/KasarLabs/ask-starknet) is a Model Context Protocol (MCP) server that allows AI agents to interact with the Starknet blockchain. It provides:

- Natural language interaction with Starknet
- Smart contract querying and execution
- Real-time blockchain data access
- AI-powered transaction analysis

**Extended War** demonstrates these capabilities by creating autonomous trading agents that use ask-starknet to:
- Query market data from Extended Exchange
- Analyze trading opportunities
- Execute trades on Starknet
- Monitor positions and balances

## Features

- **Multi-Agent Trading**: Run multiple AI agents simultaneously with different models
- **AI Model Support**: Anthropic Claude, Google Gemini, and OpenAI GPT
- **Starknet Integration**: Full integration via ask-starknet MCP server
- **RESTful API**: Simple HTTP API to control and monitor the bots
- **Docker Support**: Production-ready containerized deployment
- **Real-time Monitoring**: Track agent performance and trading history

## Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **Docker** (optional)
- **Extended Exchange Account** with API credentials
- **AI Model API Keys** (at least one: Anthropic, Google, or OpenAI)
- **ask-starknet** - Clone and set up from [github.com/KasarLabs/ask-starknet](https://github.com/KasarLabs/ask-starknet)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/KasarLabs/extended-war.git
cd extended-war
corepack enable pnpm
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server
PORT=5050
NODE_ENV=development
API_SECRET=your_secure_secret_here

# Starknet
STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io

# AI Provider (choose one)
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

See [.env.example](.env.example) for all configuration options.

### 3. Configure Trading Accounts

```bash
cp config/extended-war.config.example.json config/extended-war.config.json
```

Edit `config/extended-war.config.json`:

```json
{
  "accounts": [
    {
      "name": "Claude Agent",
      "extended": {
        "apiUrl": "https://api.x10.exchange",
        "apiKey": "YOUR_EXTENDED_API_KEY",
        "privateKey": "0xYOUR_STARKNET_PRIVATE_KEY"
      },
      "model": {
        "provider": "anthropic",
        "name": "claude-3-5-sonnet-20241022",
        "apiKey": "sk-ant-api03-..."
      }
    }
  ]
}
```

### 4. Set Up ask-starknet

Clone and configure ask-starknet:

```bash
cd ..
git clone https://github.com/KasarLabs/ask-starknet.git
cd ask-starknet
# Follow ask-starknet setup instructions
```

Update the path in Extended War if needed (default: `../ask-starknet/packages/mcp/build/index.js`)

### 5. Build and Run

```bash
# Development mode (with hot reload)
pnpm run dev

# Production mode
pnpm run build
pnpm start
```

The server runs on `http://localhost:5050` by default.

## API Endpoints

### Public Endpoints (No Authentication)

#### Health Check
```bash
GET /health
```

#### Check War Status
```bash
GET /is-war-running
```

### Protected Endpoints (Requires API Secret)

All protected endpoints require the `X-API-Secret` header:

```bash
X-API-Secret: your_secure_secret_here
```

#### Start Trading Bots
```bash
POST /api/start-war
```

#### Stop Trading Bots
```bash
POST /api/end-war
```

#### Get Trading History
```bash
GET /api/trade-history
```

### Using Postman

Import [postman_collection.json](postman_collection.json) into Postman:

1. Open Postman
2. Click **Import**
3. Select `postman_collection.json`
4. Update the `api_secret` variable with your API secret
5. Update `base_url` if not using default port

## Docker Deployment

### Using Docker Compose

```bash
# Production
docker-compose up -d extended-war

# Development (with hot reload)
docker-compose up -d extended-war-dev

# View logs
docker-compose logs -f extended-war

# Stop
docker-compose down
```

### Using Docker CLI

```bash
# Build
docker build -t extended-war:latest .

# Run
docker run -d \
  --name extended-war \
  -p 5050:5050 \
  --env-file .env \
  -v $(pwd)/config:/app/config:ro \
  extended-war:latest
```

## Project Structure

```
extended-war/
├── src/
│   ├── prompt/              # AI agent prompts
│   ├── tools/               # Trading tools for agents
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Utilities and Extended SDK
│   ├── war/                 # Trading bot core logic
│   │   ├── war.graph.ts     # LangGraph agent workflow
│   │   ├── war.manager.ts   # Bot orchestration
│   │   └── war.types.ts     # Type definitions
│   ├── middleware/          # Express middleware
│   ├── index.ts             # Entry point
│   └── server.ts            # API server
├── config/
│   ├── extended-war.config.json         # Your config (git-ignored)
│   └── extended-war.config.example.json # Template
├── postman_collection.json  # API collection
├── Dockerfile               # Production image
├── Dockerfile.dev           # Development image
└── docker-compose.yml       # Docker Compose config
```

## Development

### Available Scripts

```bash
pnpm run dev          # Start with hot reload
pnpm run build        # Build TypeScript
pnpm start            # Start production server
pnpm run check-types  # Type check
pnpm run lint         # Lint code
pnpm run format       # Format code
pnpm run test         # Run tests
pnpm run clean        # Clean build artifacts
```

### Supported AI Providers

- **Anthropic**: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, etc.
- **Google**: `gemini-2.0-flash-exp`, `gemini-1.5-pro`, etc.
- **OpenAI**: `gpt-4-turbo-preview`, `gpt-4o`, etc.

## How It Works

1. **Initialization**: Each agent connects to Extended Exchange and ask-starknet MCP server
2. **Market Analysis**: Agents use ask-starknet to query market data and blockchain state
3. **Decision Making**: AI models analyze data and decide on trading actions
4. **Trade Execution**: Agents execute trades through Extended Exchange via Starknet
5. **Monitoring**: Real-time tracking of positions, balances, and performance

The project uses [LangGraph](https://github.com/langchain-ai/langgraph) to orchestrate agent workflows and [ask-starknet](https://github.com/KasarLabs/ask-starknet) for blockchain interactions.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | API server port | Yes |
| `API_SECRET` | Authentication secret | Yes |
| `STARKNET_RPC_URL` | Starknet RPC endpoint | Yes |
| `CORS_ORIGIN` | CORS allowed origins | No |
| `CACHE_TTL` | Trade history cache TTL (ms) | No |
| `WAR_CYCLE_TIMEOUT_MS` | Delay between trading cycles | No |
| `ANTHROPIC_API_KEY` | Anthropic API key | No* |
| `GOOGLE_API_KEY` | Google API key | No* |
| `OPENAI_API_KEY` | OpenAI API key | No* |

*At least one AI provider API key is required

## Security

- Never commit `.env` or `config/extended-war.config.json`
- Use strong API secrets in production (generate with: `openssl rand -hex 32`)
- Store private keys securely
- Review trading strategies before deploying to production
- This is a showcase project - use with caution in production

## Troubleshooting

### ask-starknet Connection Issues

Ensure ask-starknet is properly set up and the path is correct:

```typescript
// Check war.manager.ts
// Default path: '../ask-starknet/packages/mcp/build/index.js'
```

### Port Already in Use

```bash
# Find and kill process
lsof -i :5050
kill -9 <PID>

# Or use different port
PORT=5051 pnpm run dev
```

### Docker Build Fails

```bash
# Clean and rebuild
pnpm run clean
pnpm install
pnpm run build
docker build -t extended-war:latest .
```

## Learn More

- [ask-starknet Documentation](https://github.com/KasarLabs/ask-starknet)
- [Extended Exchange (X10)](https://x10.exchange/)
- [Starknet Documentation](https://docs.starknet.io/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

MIT

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a Pull Request

## Support

- Issues: [GitHub Issues](https://github.com/KasarLabs/extended-war/issues)
- ask-starknet: [GitHub Issues](https://github.com/KasarLabs/ask-starknet/issues)

---

**Built with** ❤️ **by [Kasar Labs](https://kasar.io) to showcase the power of [ask-starknet](https://github.com/KasarLabs/ask-starknet)**
