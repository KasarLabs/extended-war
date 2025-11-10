// Configuration
const API_BASE_URL = 'http://localhost:5002';
const REFRESH_INTERVAL = 5000; // 5 seconds

// State
let refreshIntervalId = null;
let performanceChart = null;

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const startWarBtn = document.getElementById('startWarBtn');
const stopWarBtn = document.getElementById('stopWarBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statsGrid = document.getElementById('statsGrid');
const positionsContainer = document.getElementById('positionsContainer');
const ordersContainer = document.getElementById('ordersContainer');
const tradesContainer = document.getElementById('tradesContainer');
const notification = document.getElementById('notification');

// Utility Functions
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return 'N/A';
    return Number(num).toFixed(decimals);
}

function formatCurrency(num) {
    if (num === null || num === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).valueOf(num);
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error?.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

async function checkWarStatus() {
    try {
        const data = await fetchAPI('/is-war-running');
        updateStatus(data.data.isRunning);
        return data.data.isRunning;
    } catch (error) {
        showNotification('Failed to check war status', 'error');
        return false;
    }
}

async function startWar() {
    try {
        startWarBtn.disabled = true;
        const data = await fetchAPI('/start-war', { method: 'POST' });
        showNotification(data.message, 'success');
        await checkWarStatus();
        startAutoRefresh();
    } catch (error) {
        showNotification('Failed to start war: ' + error.message, 'error');
    } finally {
        startWarBtn.disabled = false;
    }
}

async function stopWar() {
    try {
        stopWarBtn.disabled = true;
        const data = await fetchAPI('/end-war', { method: 'POST' });
        showNotification(data.message, 'success');
        await checkWarStatus();
        stopAutoRefresh();
    } catch (error) {
        showNotification('Failed to stop war: ' + error.message, 'error');
    } finally {
        stopWarBtn.disabled = false;
    }
}

async function fetchTradeHistory() {
    try {
        const data = await fetchAPI('/trade-history');
        return data.data.accounts;
    } catch (error) {
        showNotification('Failed to fetch trade history', 'error');
        return [];
    }
}

// UI Update Functions
function updateStatus(isRunning) {
    if (isRunning) {
        statusIndicator.className = 'status-indicator running';
        statusText.textContent = 'War is Running';
        startWarBtn.disabled = true;
        stopWarBtn.disabled = false;
    } else {
        statusIndicator.className = 'status-indicator stopped';
        statusText.textContent = 'War is Stopped';
        startWarBtn.disabled = false;
        stopWarBtn.disabled = true;
    }
}

function updateStatistics(accounts) {
    if (!accounts || accounts.length === 0) {
        statsGrid.innerHTML = '<p class="no-data">No data available</p>';
        return;
    }

    statsGrid.innerHTML = '';

    accounts.forEach((account, index) => {
        // Balance fields: balance, equity, unrealisedPnl (all are strings)
        const equity = parseFloat(account.balance?.equity || '0');
        const balance = parseFloat(account.balance?.balance || '0');
        const unrealizedPnL = parseFloat(account.balance?.unrealisedPnl || '0');
        const leverage = parseFloat(account.balance?.leverage || '1');

        // Realized PnL from positions
        const realizedPnL = account.positions?.reduce((sum, pos) => sum + parseFloat(pos.realisedPnl || '0'), 0) || 0;

        const totalPnL = unrealizedPnL + realizedPnL;
        const pnlPercentage = balance > 0 ? (totalPnL / balance) * 100 : 0;

        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-label">${account.account.name || `Account ${index + 1}`}</div>
            <div class="stat-value">$${formatNumber(equity)}</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 5px;">
                Balance: $${formatNumber(balance)} | Leverage: ${formatNumber(leverage, 1)}x
            </div>
            <div class="stat-change ${pnlPercentage >= 0 ? 'positive' : 'negative'}">
                PnL: ${pnlPercentage >= 0 ? '+' : ''}${formatNumber(pnlPercentage)}%
                ($${formatNumber(totalPnL)})
            </div>
            <div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary);">
                <div>Positions: ${account.positions?.length || 0}</div>
                <div>Orders: ${account.openOrders?.length || 0}</div>
                <div>Trades: ${account.trade?.length || 0}</div>
            </div>
        `;
        statsGrid.appendChild(card);
    });
}

function updatePerformanceChart(accounts) {
    if (!accounts || accounts.length === 0) {
        return;
    }

    const ctx = document.getElementById('performanceChart').getContext('2d');

    if (performanceChart) {
        performanceChart.destroy();
    }

    const labels = accounts.map((acc, idx) => acc.account.name || `Account ${idx + 1}`);
    const balances = accounts.map(acc => parseFloat(acc.balance?.equity || '0'));
    const unrealizedPnL = accounts.map(acc => parseFloat(acc.balance?.unrealisedPnl || '0'));
    const realizedPnL = accounts.map(acc =>
        acc.positions?.reduce((sum, pos) => sum + parseFloat(pos.realisedPnl || '0'), 0) || 0
    );

    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Equity',
                    data: balances,
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                },
                {
                    label: 'Unrealized PnL',
                    data: unrealizedPnL,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                },
                {
                    label: 'Realized PnL',
                    data: realizedPnL,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#f1f5f9',
                        font: {
                            size: 12,
                        },
                    },
                },
                title: {
                    display: true,
                    text: 'Account Performance Comparison',
                    color: '#f1f5f9',
                    font: {
                        size: 16,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        },
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)',
                    },
                },
                x: {
                    ticks: {
                        color: '#94a3b8',
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)',
                    },
                },
            },
        },
    });
}

function updatePositions(accounts) {
    positionsContainer.innerHTML = '';

    let hasPositions = false;

    accounts.forEach(account => {
        if (account.positions && account.positions.length > 0) {
            hasPositions = true;

            account.positions.forEach(position => {
                const unrealisedPnl = parseFloat(position.unrealisedPnl || '0');
                const realisedPnl = parseFloat(position.realisedPnl || '0');
                const item = document.createElement('div');
                item.className = 'data-item';
                item.innerHTML = `
                    <div class="data-item-header">
                        <span class="data-item-title">${position.market || 'Unknown'}</span>
                        <span class="data-item-badge ${position.side === 'LONG' ? 'badge-long' : 'badge-short'}">
                            ${(position.side || 'N/A').toUpperCase()}
                        </span>
                    </div>
                    <div class="data-item-details">
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Size:</span>
                            <span class="data-item-detail-value">${formatNumber(position.size, 4)}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Leverage:</span>
                            <span class="data-item-detail-value">${formatNumber(position.leverage, 1)}x</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Open Price:</span>
                            <span class="data-item-detail-value">$${formatNumber(position.openPrice)}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Mark Price:</span>
                            <span class="data-item-detail-value">$${formatNumber(position.markPrice)}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Unrealised PnL:</span>
                            <span class="data-item-detail-value" style="color: ${unrealisedPnl >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                                $${formatNumber(unrealisedPnl)}
                            </span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Realised PnL:</span>
                            <span class="data-item-detail-value" style="color: ${realisedPnl >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                                $${formatNumber(realisedPnl)}
                            </span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Account:</span>
                            <span class="data-item-detail-value">${account.account.name || 'N/A'}</span>
                        </div>
                    </div>
                `;
                positionsContainer.appendChild(item);
            });
        }
    });

    if (!hasPositions) {
        positionsContainer.innerHTML = '<p class="no-data">No open positions</p>';
    }
}

function updateOrders(accounts) {
    ordersContainer.innerHTML = '';

    let hasOrders = false;

    accounts.forEach(account => {
        if (account.openOrders && account.openOrders.length > 0) {
            hasOrders = true;

            account.openOrders.forEach(order => {
                const item = document.createElement('div');
                item.className = 'data-item';
                item.innerHTML = `
                    <div class="data-item-header">
                        <span class="data-item-title">${order.market || 'Unknown'}</span>
                        <span class="data-item-badge ${order.side === 'BUY' ? 'badge-buy' : 'badge-sell'}">
                            ${(order.side || 'N/A').toUpperCase()}
                        </span>
                    </div>
                    <div class="data-item-details">
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Type:</span>
                            <span class="data-item-detail-value">${order.type || 'N/A'}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Qty:</span>
                            <span class="data-item-detail-value">${formatNumber(order.qty, 4)}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Filled:</span>
                            <span class="data-item-detail-value">${formatNumber(order.filledQty, 4)}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Price:</span>
                            <span class="data-item-detail-value">$${formatNumber(order.price)}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Status:</span>
                            <span class="data-item-detail-value">${order.status || 'N/A'}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Reduce Only:</span>
                            <span class="data-item-detail-value">${order.reduceOnly ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="data-item-detail">
                            <span class="data-item-detail-label">Account:</span>
                            <span class="data-item-detail-value">${account.account.name || 'N/A'}</span>
                        </div>
                    </div>
                `;
                ordersContainer.appendChild(item);
            });
        }
    });

    if (!hasOrders) {
        ordersContainer.innerHTML = '<p class="no-data">No open orders</p>';
    }
}

function updateTrades(accounts) {
    tradesContainer.innerHTML = '';

    let allTrades = [];

    accounts.forEach(account => {
        if (account.trade && account.trade.length > 0) {
            account.trade.forEach(trade => {
                allTrades.push({
                    ...trade,
                    accountName: account.account.name || 'N/A',
                });
            });
        }
    });

    // Sort by createdTime (most recent first)
    allTrades.sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0));

    // Show only last 10 trades
    allTrades = allTrades.slice(0, 10);

    if (allTrades.length === 0) {
        tradesContainer.innerHTML = '<p class="no-data">No trades available</p>';
        return;
    }

    allTrades.forEach(trade => {
        const item = document.createElement('div');
        item.className = 'data-item';
        const date = trade.createdTime ? new Date(trade.createdTime).toLocaleString() : 'N/A';

        item.innerHTML = `
            <div class="data-item-header">
                <span class="data-item-title">${trade.market || 'Unknown'}</span>
                <span class="data-item-badge ${trade.side === 'BUY' ? 'badge-buy' : 'badge-sell'}">
                    ${(trade.side || 'N/A').toUpperCase()}
                </span>
            </div>
            <div class="data-item-details">
                <div class="data-item-detail">
                    <span class="data-item-detail-label">Qty:</span>
                    <span class="data-item-detail-value">${formatNumber(trade.qty, 4)}</span>
                </div>
                <div class="data-item-detail">
                    <span class="data-item-detail-label">Price:</span>
                    <span class="data-item-detail-value">$${formatNumber(trade.price)}</span>
                </div>
                <div class="data-item-detail">
                    <span class="data-item-detail-label">Value:</span>
                    <span class="data-item-detail-value">$${formatNumber(trade.value)}</span>
                </div>
                <div class="data-item-detail">
                    <span class="data-item-detail-label">Fee:</span>
                    <span class="data-item-detail-value">$${formatNumber(trade.fee)}</span>
                </div>
                <div class="data-item-detail">
                    <span class="data-item-detail-label">Type:</span>
                    <span class="data-item-detail-value">${trade.tradeType || 'N/A'}</span>
                </div>
                <div class="data-item-detail">
                    <span class="data-item-detail-label">Taker:</span>
                    <span class="data-item-detail-value">${trade.isTaker ? 'Yes' : 'No'}</span>
                </div>
                <div class="data-item-detail">
                    <span class="data-item-detail-label">Time:</span>
                    <span class="data-item-detail-value">${date}</span>
                </div>
                <div class="data-item-detail">
                    <span class="data-item-detail-label">Account:</span>
                    <span class="data-item-detail-value">${trade.accountName}</span>
                </div>
            </div>
        `;
        tradesContainer.appendChild(item);
    });
}

async function refreshData() {
    try {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';

        const [isRunning, accounts] = await Promise.all([
            checkWarStatus(),
            fetchTradeHistory(),
        ]);

        updateStatistics(accounts);
        updatePerformanceChart(accounts);
        updatePositions(accounts);
        updateOrders(accounts);
        updateTrades(accounts);

        showNotification('Data refreshed successfully', 'success');
    } catch (error) {
        showNotification('Failed to refresh data', 'error');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Data';
    }
}

function startAutoRefresh() {
    if (!refreshIntervalId) {
        refreshIntervalId = setInterval(refreshData, REFRESH_INTERVAL);
        console.log('Auto-refresh started');
    }
}

function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
        console.log('Auto-refresh stopped');
    }
}

// Event Listeners
startWarBtn.addEventListener('click', startWar);
stopWarBtn.addEventListener('click', stopWar);
refreshBtn.addEventListener('click', refreshData);

// Initialize
async function initialize() {
    console.log('Initializing dashboard...');

    try {
        const isRunning = await checkWarStatus();
        await refreshData();

        // Always start auto-refresh to keep data updated
        startAutoRefresh();
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize dashboard', 'error');
    }
}

// Start the application
initialize();
