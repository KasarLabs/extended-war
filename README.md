# Extended War - AI Trading Bot

An AI-powered trading bot for Extended Exchange on Starknet, featuring multi-agent support with various AI models (Anthropic Claude, Google Gemini, OpenAI).

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Docker Deployment](#docker-deployment)
- [Development](#development)
- [Project Structure](#project-structure)
- [Testing](#testing)

## Features

- **Multi-Agent Support**: Run multiple trading agents simultaneously with different AI models
- **AI Model Flexibility**: Support for Anthropic Claude, Google Gemini, and OpenAI models
- **Extended Exchange Integration**: Full integration with Extended Exchange on Starknet
- **RESTful API**: Simple HTTP API to control the bot
- **Docker Support**: Production-ready Docker configuration
- **TypeScript**: Fully typed codebase for better DX and reliability
- **Real-time Trading**: Automated trading with configurable intervals

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.x
- **pnpm** >= 9.x (or use `corepack enable pnpm`)
- **Docker** (optional, for containerized deployment)
- **Extended Exchange Account** with API credentials
- **AI Model API Keys** (Anthropic, Google, or OpenAI)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/extended-war.git
cd extended-war
```

### Step 2: Install Dependencies

```bash
# Enable pnpm if not already available
corepack enable pnpm

# Install dependencies
pnpm install
```

### Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Starknet Configuration
STARKNET_RPC_URL="https://starknet-mainnet.public.blastapi.io"

# LangSmith Configuration (Optional - for tracing and monitoring)
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT="https://eu.api.smith.langchain.com/"
LANGSMITH_API_KEY="lsv2_pt_..."
LANGSMITH_PROJECT="your-project-name"
```

### Step 4: Configure Trading Accounts

Copy the example config file:

```bash
cp config/extended-war.config.example.json config/extended-war.config.json
```

Edit `config/extended-war.config.json`:

```json
{
  "accounts": [
    {
      "name": "Agent 1",
      "extended": {
        "apiUrl": "https://api.starknet.extended.exchange",
        "apiKey": "YOUR_EXTENDED_API_KEY",
        "privateKey": "0xYOUR_STARKNET_PRIVATE_KEY"
      },
      "model": {
        "provider": "anthropic",
        "name": "claude-sonnet-4-20250514",
        "apiKey": "sk-ant-api03-..."
      }
    }
  ]
}
```

**Supported AI Providers:**
- `anthropic`: Claude models (claude-sonnet-4, claude-opus-4, etc.)
- `gemini`: Google Gemini models (gemini-2.5-flash, gemini-2.0-pro, etc.)
- `openai`: OpenAI models (gpt-4-turbo, gpt-4o, etc.)

### Step 5: Build the Project

```bash
pnpm run build
```

## Running the Application

### Development Mode (with hot reload)

```bash
pnpm run dev
```

The server will start on `http://localhost:5004`.

### Production Mode

```bash
# Build first
pnpm run build

# Start the server
pnpm start
```

## API Endpoints

The bot exposes the following RESTful API endpoints:

### 1. Health Check

**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "uptime": 123.456,
    "timestamp": "2025-11-07T14:30:00.000Z"
  }
}
```

### 2. Start Trading Bot

**POST** `/start-war`

Initialize and start all trading agents.

**Response:**
```json
{
  "success": true,
  "message": "War started successfully",
  "data": {
    "status": "started",
    "startedAt": "2025-11-07T14:30:00.000Z"
  }
}
```

### 3. Stop Trading Bot

**POST** `/end-war`

Stop all trading agents.

**Response:**
```json
{
  "success": true,
  "message": "War stopped successfully",
  "data": {
    "status": "stopped",
    "stoppedAt": "2025-11-07T14:35:00.000Z"
  }
}
```

### 4. Get Trade History

**GET** `/trade-history`

Retrieve trading history for all configured accounts.

**Response:**
```json
{
  "success": true,
  "message": "Trade history retrieved successfully",
  "data": {
    "accounts": [
      {
        "account": { "name": "Agent 1", ... },
        "balance": { ... },
        "openOrders": [ ... ],
        "positions": [ ... ],
        "trade": [ ... ]
      }
    ],
    "timestamp": "2025-11-07T14:30:00.000Z"
  }
}
```

### Using Postman

A complete Postman collection is available in [`postman_collection.json`](postman_collection.json).

**Import Steps:**
1. Open Postman
2. Click **Import**
3. Select `postman_collection.json`
4. The collection includes all endpoints with example responses

## Docker Deployment

### Using Docker Compose (Recommended)

#### Production

```bash
# Build and start
docker-compose up -d extended-war

# View logs
docker-compose logs -f extended-war

# Stop
docker-compose down
```

#### Development (with hot reload)

```bash
# Start development container
docker-compose up -d extended-war-dev

# View logs
docker-compose logs -f extended-war-dev
```

### Using Docker CLI

#### Build the Image

```bash
docker build -t extended-war:latest .
```

#### Run the Container

```bash
docker run -d \
  --name extended-war \
  -p 5004:5004 \
  --env-file .env \
  -v $(pwd)/config:/app/config:ro \
  extended-war:latest
```

## Development

### Available Scripts

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build TypeScript to JavaScript
- `pnpm run start` - Start production server
- `pnpm run check-types` - Type check without emitting files
- `pnpm run lint` - Lint code with ESLint
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting
- `pnpm run test` - Run tests with Jest
- `pnpm run clean` - Remove dist and node_modules

### Code Quality

This project uses:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks
- **Jest** for testing

### Pre-commit Hooks

Husky runs the following before each commit:
- Type checking
- Linting
- Format checking

## Project Structure

```
extended-war/
├── src/
│   ├── prompt/              # AI prompts
│   ├── tools/               # Trading tools
│   ├── types/               # TypeScript type definitions
│   │   └── api.types.ts     # API response types
│   ├── utils/               # Utility functions
│   │   ├── config-loader.ts # Configuration management
│   │   ├── model.utils.ts   # AI model initialization
│   │   └── extended/        # Extended Exchange SDK
│   ├── war/                 # Trading bot core
│   │   ├── war.graph.ts     # LangGraph workflow
│   │   ├── war.manager.ts   # Bot manager
│   │   └── war.types.ts     # War-specific types
│   ├── index.ts             # Application entry point
│   └── server.ts            # Express server
├── config/
│   ├── extended-war.config.json         # Your config (gitignored)
│   └── extended-war.config.example.json # Config template
├── dist/                    # Compiled JavaScript (gitignored)
├── Dockerfile               # Production Docker image
├── Dockerfile.dev           # Development Docker image
├── docker-compose.yml       # Docker Compose configuration
├── postman_collection.json  # Postman API collection
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

### Run Tests

```bash
pnpm run test
```

### Run Tests in Watch Mode

```bash
pnpm run test -- --watch
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STARKNET_RPC_URL` | Starknet RPC endpoint | Yes |
| `LANGSMITH_TRACING` | Enable LangSmith tracing | No |
| `LANGSMITH_ENDPOINT` | LangSmith API endpoint | No |
| `LANGSMITH_API_KEY` | LangSmith API key | No |
| `LANGSMITH_PROJECT` | LangSmith project name | No |
| `NODE_ENV` | Environment (production/development) | No |

## Troubleshooting

### Port Already in Use

If port 5004 is already in use:

```bash
# Find the process
lsof -i :5004

# Kill it
kill -9 <PID>

# Or change the port in docker-compose.yml or when running
PORT=5004 pnpm run dev
```

### Docker Build Fails

If Docker build fails with TypeScript errors:

```bash
# Clean and rebuild locally first
pnpm run clean
pnpm install
pnpm run build

# Then try Docker build again
docker build -t extended-war:latest .
```

### MCP Server Connection Issues

Ensure the `ask-starknet` MCP server is available:

```bash
# Check the path in war.manager.ts line 101
# Default: '../ask-starknet/packages/mcp/build/index.js'
# Update to match your local setup
```

## Security

- **Never commit** `.env` or `config/extended-war.config.json` files
- Store API keys securely
- Use environment variables for sensitive data
- Review all trading decisions before deploying to production

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/extended-war/issues)
- Discord: [Join our community](#)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with** ❤️ **using TypeScript, LangChain, and Starknet**
