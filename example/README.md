# Extended War Dashboard - Example Frontend

This is a simple, standalone frontend dashboard for monitoring and controlling the Extended War system.

## Features

- **Real-time Status Monitoring**: Check if the war is running or stopped
- **War Controls**: Start and stop war operations with a single click
- **Performance Visualization**: Interactive charts comparing account performances
- **Live Statistics**: View total balances, PnL, and key metrics for each account
- **Position Tracking**: Monitor all open positions with entry prices and unrealized PnL
- **Order Management**: View all pending orders across accounts
- **Trade History**: Display the most recent trades with detailed information
- **Auto-refresh**: Automatically updates data every 5 seconds when war is running

## Setup

### Prerequisites

1. Make sure the Extended War server is running on `http://localhost:3000`
2. The server must have CORS enabled (already configured in the main server)

### Running the Dashboard

There are multiple ways to run this dashboard:

#### Option 1: Using Python's HTTP Server (Recommended)

```bash
cd example
python3 -m http.server 8080
```

Then open your browser at: `http://localhost:8080`

#### Option 2: Using Node.js HTTP Server

```bash
# Install http-server globally if not already installed
npm install -g http-server

# Run from the example directory
cd example
http-server -p 8080
```

Then open your browser at: `http://localhost:8080`

#### Option 3: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"

#### Option 4: Direct File Access

Simply open the `index.html` file in your browser. However, this may have CORS restrictions depending on your browser.

## Usage

### Controls

- **Start War**: Initializes and starts the war execution. The system will begin trading based on the configured strategy.
- **Stop War**: Stops the ongoing war execution gracefully.
- **Refresh Data**: Manually fetches the latest data from the server.

### Dashboard Sections

#### 1. Status Bar
Shows the current state of the war (Running/Stopped) with a visual indicator.

#### 2. Performance Overview
Displays key statistics for each account:
- Total balance
- Profit/Loss percentage and amount
- Number of positions, orders, and trades

#### 3. Performance Comparison Chart
Interactive bar chart comparing:
- Total balance per account
- Unrealized PnL
- Realized PnL

#### 4. Open Positions
Lists all current positions with:
- Symbol and side (Long/Short)
- Position size
- Entry price and current price
- Unrealized PnL

#### 5. Open Orders
Shows pending orders with:
- Symbol and side (Buy/Sell)
- Order type and size
- Price and status

#### 6. Recent Trades
Displays the last 10 trades with:
- Symbol and side
- Trade size and price
- Fees and timestamp

### Auto-refresh Behavior

- When you start a war, the dashboard automatically begins refreshing data every 5 seconds
- When you stop the war, auto-refresh is disabled
- You can manually refresh at any time using the "Refresh Data" button

## Configuration

To change the API endpoint or refresh interval, edit the configuration at the top of `app.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000';
const REFRESH_INTERVAL = 5000; // 5 seconds
```

## API Endpoints Used

The dashboard communicates with the following endpoints:

- `GET /is-war-running` - Check war status
- `POST /start-war` - Start the war
- `POST /end-war` - Stop the war
- `GET /trade-history` - Fetch account data, positions, orders, and trades

## Troubleshooting

### Dashboard shows "Failed to check war status"

- Ensure the Extended War server is running on port 3000
- Check that CORS is enabled in the server configuration
- Verify your network connection

### Charts not displaying

- Make sure you have an internet connection (Chart.js is loaded from CDN)
- Check the browser console for any JavaScript errors

### Data not updating

- Click the "Refresh Data" button to manually update
- If auto-refresh is not working, stop and start the war again
- Check the browser console for any API errors

## Technologies Used

- **HTML5**: Structure and layout
- **CSS3**: Styling with modern dark theme
- **Vanilla JavaScript**: No frameworks, pure JS for maximum compatibility
- **Chart.js**: Interactive data visualization
- **Fetch API**: Modern HTTP requests

## Browser Compatibility

This dashboard works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Security Note

This is a development/example frontend. For production use:
- Add authentication
- Use environment variables for API endpoints
- Implement rate limiting
- Add input validation
- Use HTTPS

## Support

For issues or questions, please refer to the main Extended War documentation.
