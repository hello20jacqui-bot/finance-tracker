// Firebase Configuration (already initialized in HTML)
let currentUser = null;
let transactions = [];
let holdings = { shares: [], properties: [], super: [], cash: [] };
let budgets = {};
let rules = [];
let allocationChart = null;

const categories = ['Groceries', 'Dining', 'Fuel', 'Utilities', 'Insurance', 'Shopping', 'Travel', 'Entertainment', 'Medical', 'Education', 'Subscriptions', 'Transport', 'Other'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to load
    let firebaseRetries = 0;
    const waitForFirebase = setInterval(() => {
        if (window.firebase && window.firebase.auth) {
            clearInterval(waitForFirebase);
            console.log('Firebase loaded successfully');
            checkAuthState();
            loadFromLocalStorage();
            render();
        } else if (firebaseRetries++ > 50) {
            clearInterval(waitForFirebase);
            console.error('Firebase failed to load after 50 retries');
            showStatus('Firebase failed to load. Check your internet connection.', 'error');
            loadFromLocalStorage();
            render();
        }
    }, 100);
});

// ============ FIREBASE AUTH ============

function checkAuthState() {
    if (!window.firebase) {
        console.error('Firebase not loaded');
        showStatus('Firebase not loaded. Refresh page.', 'error');
        return;
    }
    
    firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI();
        if (user) {
            loadFromFirestore();
        } else {
            loadFromLocalStorage();
        }
        render();
    });
}

function loginFirebase() {
    if (currentUser) {
        logout();
        return;
    }
    
    showStatus('Signing in...', 'info');
    
    firebase.auth().signInAnonymously()
        .then(result => {
            currentUser = result.user;
            showStatus('✓ Signed in to Firebase', 'success');
            updateAuthUI();
            loadFromFirestore();
        })
        .catch(err => {
            console.error('Auth error:', err);
            showStatus('Authentication failed: ' + err.message, 'error');
        });
}

function updateAuthUI() {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('firebase-login');
    const syncStatus = document.getElementById('sync-status');
    
    if (currentUser) {
        userInfo.innerHTML = `<div class="user-badge">
            <i class="fas fa-user-circle"></i> Signed in
        </div>`;
        loginBtn.textContent = 'Sign Out';
        syncStatus.innerHTML = '<div class="sync-dot"></div><span>Synced</span>';
    } else {
        userInfo.innerHTML = '';
        loginBtn.textContent = 'Sign In';
        syncStatus.innerHTML = '<div class="sync-dot"></div><span>Offline</span>';
    }
}

function logout() {
    firebase.auth().signOut()
        .then(() => {
            currentUser = null;
            updateAuthUI();
            loadFromLocalStorage();
            render();
            showStatus('Signed out', 'success');
        })
        .catch(err => console.error('Logout error:', err));
}

// ============ FIRESTORE OPERATIONS ============

async function saveToFirestore() {
    if (!currentUser) {
        saveToLocalStorage();
        return;
    }
    
    try {
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(currentUser.uid);
        
        await userRef.set({
            transactions: transactions,
            holdings: holdings,
            budgets: budgets,
            rules: rules,
            lastUpdated: new Date()
        }, { merge: true });
        
        showStatus('✓ Saved to Firebase', 'success');
    } catch (err) {
        console.error('Firestore save error:', err);
        showStatus('Error saving to Firebase', 'error');
        saveToLocalStorage();
    }
}

async function loadFromFirestore() {
    if (!currentUser) return;
    
    try {
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(currentUser.uid);
        const doc = await userRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            transactions = data.transactions || [];
            holdings = data.holdings || { shares: [], properties: [], super: [], cash: [] };
            budgets = data.budgets || {};
            rules = data.rules || [];
            
            saveToLocalStorage();
            render();
        }
        
        setupRealtimeListener();
    } catch (err) {
        console.error('Firestore load error:', err);
        loadFromLocalStorage();
    }
}

function setupRealtimeListener() {
    if (!currentUser) return;
    
    try {
        const db = firebase.firestore();
        db.collection('users').doc(currentUser.uid)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    transactions = data.transactions || [];
                    holdings = data.holdings || { shares: [], properties: [], super: [], cash: [] };
                    budgets = data.budgets || {};
                    rules = data.rules || [];
                    saveToLocalStorage();
                    render();
                }
            }, err => {
                console.error('Realtime listener error:', err);
            });
    } catch (err) {
        console.error('Setup listener error:', err);
    }
}

// ============ LOCAL STORAGE ============

function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('holdings', JSON.stringify(holdings));
    localStorage.setItem('budgets', JSON.stringify(budgets));
    localStorage.setItem('rules', JSON.stringify(rules));
}

function loadFromLocalStorage() {
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    holdings = JSON.parse(localStorage.getItem('holdings')) || { shares: [], properties: [], super: [], cash: [] };
    budgets = JSON.parse(localStorage.getItem('budgets')) || {};
    rules = JSON.parse(localStorage.getItem('rules')) || [];
}

// ============ FILE UPLOAD ============

function uploadFile() {
    const file = document.getElementById('file-input').files[0];
    const accountName = document.getElementById('account-name').value;
    
    if (!file || !accountName) {
        showStatus('Select file and account name', 'error');
        return;
    }
    
    showStatus('Processing file...', 'info');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        parseCSV(text, accountName);
        saveToFirestore();
        document.getElementById('file-input').value = '';
        document.getElementById('account-name').value = '';
        showStatus('✓ File uploaded and saved', 'success');
        render();
    };
    reader.readAsText(file);
}

function parseCSV(text, accountName) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;
    
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 3) continue;
        
        const [date, merchant, amtStr] = cols;
        let amount = parseFloat(amtStr.replace(/[^\d.]/g, ''));
        if (isNaN(amount)) continue;
        
        const trans = {
            id: Date.now() + Math.random(),
            date, merchant, amount,
            account: accountName,
            category: 'Other',
            type: 'expense'
        };
        
        const rule = rules.find(r => merchant.toLowerCase().includes(r.merchant.toLowerCase()));
        if (rule) trans.category = rule.category;
        
        if (!transactions.find(t => t.date === date && t.merchant === merchant && t.amount === amount)) {
            transactions.push(trans);
        }
    }
}

// ============ SAMPLE DATA ============

function deleteAllData() {
    const confirmed = confirm('⚠️ WARNING: This will permanently delete ALL your financial data (transactions, holdings, budgets, rules) from both your device and Firebase.\n\nThis action CANNOT be undone.\n\nClick OK to confirm deletion.');
    
    if (!confirmed) {
        showStatus('Deletion cancelled', 'info');
        return;
    }
    
    // Clear browser data
    transactions = [];
    holdings = { shares: [], properties: [], super: [], cash: [] };
    budgets = {};
    rules = [];
    
    // Clear localStorage
    localStorage.removeItem('transactions');
    localStorage.removeItem('holdings');
    localStorage.removeItem('budgets');
    localStorage.removeItem('rules');
    
    // Delete from Firebase if signed in
    if (currentUser) {
        try {
            const db = firebase.firestore();
            db.collection('users').doc(currentUser.uid)
                .delete()
                .then(() => {
                    showStatus('✓ All data deleted successfully from Firebase and your device', 'success');
                    render();
                })
                .catch(err => {
                    console.error('Firebase delete error:', err);
                    showStatus('Data deleted from device. Firebase delete failed: ' + err.message, 'error');
                    render();
                });
        } catch (err) {
            console.error('Delete error:', err);
            showStatus('All data deleted from device', 'success');
            render();
        }
    } else {
        showStatus('✓ All data deleted from your device (not signed in to Firebase)', 'success');
        render();
    }
}

function loadSampleData() {
    transactions = [
        { id: 1, date: '2026-09-01', merchant: 'Woolworths', amount: 125.45, account: 'CBA', category: 'Groceries', type: 'expense' },
        { id: 2, date: '2026-09-05', merchant: 'Salary', amount: 5000, account: 'CBA', category: 'Income', type: 'income' },
        { id: 3, date: '2026-09-10', merchant: 'Electricity', amount: 180, account: 'CBA', category: 'Utilities', type: 'expense' },
        { id: 4, date: '2026-09-12', merchant: 'Coles', amount: 95.30, account: 'CBA', category: 'Groceries', type: 'expense' },
        { id: 5, date: '2026-09-15', merchant: 'Ampol', amount: 65.00, account: 'CBA', category: 'Fuel', type: 'expense' },
    ];
    
    holdings = {
        shares: [
            { id: 1, symbol: 'VAS', name: 'Vanguard All-Share', qty: 150, costBasis: 15375, currentPrice: 102.50, sector: 'ETF' },
            { id: 2, symbol: 'VGS', name: 'Vanguard Global Shares', qty: 100, costBasis: 10200, currentPrice: 104.20, sector: 'ETF' },
            { id: 3, symbol: 'NAB', name: 'NAB', qty: 50, costBasis: 1450, currentPrice: 34.60, sector: 'Banks' },
        ],
        properties: [
            { id: 1, address: 'Edgeworth, NSW', purchasePrice: 580000, currentValue: 625000, mortgage: 380000, rentalIncome: 450, rentalFreq: 'weekly' },
            { id: 2, address: 'Brisbane, QLD', purchasePrice: 420000, currentValue: 465000, mortgage: 280000, rentalIncome: 320, rentalFreq: 'weekly' },
        ],
        super: [
            { id: 1, name: 'Industry Fund', balance: 250000, contribution: 2750, freq: 'monthly' },
            { id: 2, name: 'Self-Managed SMSF', balance: 180000, contribution: 0, freq: 'monthly' },
        ],
        cash: [
            { id: 1, name: 'High-Yield Savings', balance: 45000, rate: 4.2 },
            { id: 2, name: 'Emergency Fund', balance: 25000, rate: 1.5 },
        ]
    };
    
    budgets = { 'Groceries': 400, 'Utilities': 250, 'Fuel': 200, 'Entertainment': 300 };
    rules = [{ id: 1, merchant: 'Woolworths', category: 'Groceries' }, { id: 2, merchant: 'Ampol', category: 'Fuel' }];
    
    saveToFirestore();
    render();
    showStatus('✓ Sample data loaded', 'success');
}

function showStatus(msg, type) {
    const el = document.getElementById('upload-status');
    if (!el) return;
    el.className = `status-message status-${type}`;
    el.textContent = msg;
}

// ============ UI INTERACTION ============

function switchTab(tab) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(tab);
    if (section) section.classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) {
        const btn = event.target.closest('.tab-btn');
        if (btn) btn.classList.add('active');
    }
    
    render();
    if (tab === 'portfolio') setTimeout(renderAllocationChart, 100);
}

function openShareForm() {
    const symbol = prompt('Ticker (e.g., VAS):');
    if (!symbol) return;
    const name = prompt('Company name:');
    const qty = parseInt(prompt('Quantity:'));
    const costBasis = parseFloat(prompt('Total cost basis ($):'));
    const currentPrice = parseFloat(prompt('Current price per share ($):'));
    
    if (symbol && qty && costBasis && currentPrice) {
        holdings.shares.push({ id: Date.now(), symbol, name, qty, costBasis, currentPrice });
        saveToFirestore();
        render();
    }
}

function openPropertyForm() {
    const address = prompt('Address:');
    if (!address) return;
    const purchasePrice = parseFloat(prompt('Purchase price ($):'));
    const currentValue = parseFloat(prompt('Current valuation ($):'));
    const mortgage = parseFloat(prompt('Mortgage balance ($):'));
    const rentalIncome = parseFloat(prompt('Weekly/monthly rental income ($):'));
    const rentalFreq = prompt('Rental frequency (weekly/monthly):') || 'weekly';
    
    if (address && purchasePrice && currentValue && mortgage !== undefined && rentalIncome) {
        holdings.properties.push({ id: Date.now(), address, purchasePrice, currentValue, mortgage, rentalIncome, rentalFreq });
        saveToFirestore();
        render();
    }
}

function openSuperForm() {
    const name = prompt('Fund name (e.g., Self-Managed SMSF):');
    if (!name) return;
    const balance = parseFloat(prompt('Current balance ($):'));
    const contribution = parseFloat(prompt('Monthly contribution ($):') || '0');
    
    if (name && balance !== undefined) {
        holdings.super.push({ id: Date.now(), name, balance, contribution, freq: 'monthly' });
        saveToFirestore();
        render();
    }
}

function openCashForm() {
    const name = prompt('Account name:');
    if (!name) return;
    const balance = parseFloat(prompt('Balance ($):'));
    const rate = parseFloat(prompt('Interest rate (%) (optional):') || '0');
    
    if (name && balance !== undefined) {
        holdings.cash.push({ id: Date.now(), name, balance, rate });
        saveToFirestore();
        render();
    }
}

function deleteHolding(type, id) {
    holdings[type] = holdings[type].filter(h => h.id !== id);
    saveToFirestore();
    render();
}

function openBudgetForm() {
    const cat = prompt('Category:');
    if (!cat) return;
    const amount = prompt('Monthly budget ($):');
    if (amount) {
        budgets[cat] = parseFloat(amount);
        saveToFirestore();
        render();
    }
}

function openRuleForm() {
    const merchant = prompt('Merchant keyword:');
    if (!merchant) return;
    const cat = prompt('Category:');
    if (cat) {
        rules.push({ id: Date.now(), merchant, category: cat });
        saveToFirestore();
        render();
    }
}

function deleteRule(id) {
    rules = rules.filter(r => r.id !== id);
    saveToFirestore();
    render();
}

// ============ CALCULATIONS & RENDERING ============

function calculateMetrics() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let bankBalance = 0, monthSpend = 0;
    transactions.forEach(t => {
        if (t.type === 'income') bankBalance += t.amount;
        if (t.type === 'expense') bankBalance -= t.amount;
        const d = new Date(t.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense') {
            monthSpend += t.amount;
        }
    });

    let investmentValue = 0, investmentCost = 0, investmentGain = 0;
    holdings.shares.forEach(s => {
        const value = s.qty * s.currentPrice;
        investmentValue += value;
        investmentCost += s.costBasis;
        investmentGain += (value - s.costBasis);
    });

    let propertyEquity = 0, propertyValue = 0, monthlyRental = 0;
    holdings.properties.forEach(p => {
        propertyEquity += (p.currentValue - p.mortgage);
        propertyValue += p.currentValue;
        const monthly = p.rentalFreq === 'weekly' ? p.rentalIncome * 4.33 : p.rentalIncome;
        monthlyRental += monthly;
    });

    let superTotal = 0, superContribution = 0;
    holdings.super.forEach(s => {
        superTotal += s.balance;
        superContribution += s.contribution;
    });

    let cashTotal = 0;
    holdings.cash.forEach(c => {
        cashTotal += c.balance;
    });

    const netWorth = bankBalance + investmentValue + propertyEquity + superTotal + cashTotal;
    const totalInvestments = investmentValue + propertyValue + superTotal;

    return {
        bankBalance, monthSpend, investmentValue, investmentCost, investmentGain,
        propertyEquity, propertyValue, monthlyRental,
        superTotal, superContribution, cashTotal, netWorth, totalInvestments
    };
}

function renderAllocationChart() {
    const m = calculateMetrics();
    const canvas = document.getElementById('allocation-chart');
    if (!canvas) return;
    
    if (allocationChart) allocationChart.destroy();
    
    const data = [
        m.bankBalance + m.cashTotal,
        m.investmentValue,
        m.propertyEquity,
        m.superTotal
    ];
    
    const labels = ['Cash & Savings', 'Shares & ETFs', 'Property (equity)', 'Superannuation'];
    const colors = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
    
    const ctx = canvas.getContext('2d');
    allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

function render() {
    const m = calculateMetrics();
    
    document.getElementById('net-worth').textContent = '$' + m.netWorth.toFixed(0);
    const nwDelta = (m.investmentGain + (m.propertyValue - holdings.properties.reduce((a, p) => a + p.purchasePrice, 0))).toFixed(0);
    const nwEl = document.getElementById('nw-delta');
    if (nwEl) nwEl.innerHTML = `${nwDelta >= 0 ? '+' : ''}$${nwDelta}`;
    
    document.getElementById('liquid').textContent = '$' + (m.bankBalance + m.cashTotal).toFixed(0);
    document.getElementById('inv-total').textContent = '$' + m.investmentValue.toFixed(0);
    const invEl = document.getElementById('inv-delta');
    if (invEl) invEl.innerHTML = `<span class="${m.investmentGain >= 0 ? 'positive' : 'negative'}">${m.investmentGain >= 0 ? '+' : ''}$${m.investmentGain.toFixed(0)}</span>`;
    document.getElementById('month-spend').textContent = '$' + m.monthSpend.toFixed(0);

    const allocHTML = `
        <div class="allocation-item">
            <div class="allocation-name">Cash & savings</div>
            <div class="allocation-value">$${(m.bankBalance + m.cashTotal).toFixed(0)}</div>
            <div class="allocation-pct">${m.netWorth > 0 ? ((m.bankBalance + m.cashTotal) / m.netWorth * 100).toFixed(0) : '0'}% of NW</div>
        </div>
        <div class="allocation-item">
            <div class="allocation-name">Shares & ETFs</div>
            <div class="allocation-value">$${m.investmentValue.toFixed(0)}</div>
            <div class="allocation-pct">${m.netWorth > 0 ? (m.investmentValue / m.netWorth * 100).toFixed(0) : '0'}% of NW</div>
        </div>
        <div class="allocation-item">
            <div class="allocation-name">Property (equity)</div>
            <div class="allocation-value">$${m.propertyEquity.toFixed(0)}</div>
            <div class="allocation-pct">${m.netWorth > 0 ? (m.propertyEquity / m.netWorth * 100).toFixed(0) : '0'}% of NW</div>
        </div>
        <div class="allocation-item">
            <div class="allocation-name">Superannuation</div>
            <div class="allocation-value">$${m.superTotal.toFixed(0)}</div>
            <div class="allocation-pct">${m.netWorth > 0 ? (m.superTotal / m.netWorth * 100).toFixed(0) : '0'}% of NW</div>
        </div>
    `;
    const allocEl = document.getElementById('alloc-summary');
    if (allocEl) allocEl.innerHTML = allocHTML;

    const portSum = document.getElementById('port-summary');
    if (portSum) {
        portSum.innerHTML = `
            <div class="metric">
                <div class="metric-label">Total investments</div>
                <div class="metric-value">$${m.investmentValue.toFixed(0)}</div>
                <div class="metric-delta ${m.investmentGain >= 0 ? 'positive' : 'negative'}">${m.investmentGain >= 0 ? '+' : ''}$${m.investmentGain.toFixed(0)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Property value</div>
                <div class="metric-value">$${m.propertyValue.toFixed(0)}</div>
                <div class="metric-delta">Equity: $${m.propertyEquity.toFixed(0)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Superannuation</div>
                <div class="metric-value">$${m.superTotal.toFixed(0)}</div>
                <div class="metric-delta">+$${(m.superContribution * 12).toFixed(0)}/yr</div>
            </div>
            <div class="metric">
                <div class="metric-label">Rental income</div>
                <div class="metric-value">$${(m.monthlyRental * 12).toFixed(0)}</div>
                <div class="metric-delta">${m.propertyValue > 0 ? (m.monthlyRental * 12 / m.propertyValue * 100).toFixed(1) : '0'}% yield</div>
            </div>
        `;
    }

    const recent = transactions.slice(-5).reverse().map(t => `
        <div style="padding: 10px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
            <div>
                <div style="font-weight: 500;">${t.merchant}</div>
                <div style="font-size: 12px; color: #666;">${t.date}</div>
            </div>
            <div style="text-align: right; font-weight: 500;">${t.type === 'expense' ? '-' : '+'}$${t.amount.toFixed(2)}</div>
        </div>
    `).join('') || '<div class="empty">No transactions</div>';
    const recentEl = document.getElementById('recent-activity');
    if (recentEl) recentEl.innerHTML = recent;

    renderHoldings();
    renderTransactions();
    renderBudgets();
}

function renderHoldings() {
    const sharesHTML = holdings.shares.length ? holdings.shares.map(s => {
        const value = s.qty * s.currentPrice;
        const gain = value - s.costBasis;
        return `
            <div class="holding-row">
                <div class="holding-info">
                    <div class="holding-name">${s.symbol} - ${s.name}</div>
                    <div class="holding-detail">${s.qty} @ $${s.currentPrice.toFixed(2)}</div>
                </div>
                <div class="holding-value">
                    <div class="holding-value-main">$${value.toFixed(0)}</div>
                    <div class="holding-gain ${gain >= 0 ? 'positive' : 'negative'}">${gain >= 0 ? '+' : ''}$${gain.toFixed(0)}</div>
                </div>
                <button class="btn btn-secondary btn-small" onclick="deleteHolding('shares', ${s.id})">Remove</button>
            </div>
        `;
    }).join('') : '<div class="empty">No holdings</div>';
    const sharesEl = document.getElementById('shares-list');
    if (sharesEl) sharesEl.innerHTML = sharesHTML;

    const propHTML = holdings.properties.length ? holdings.properties.map(p => {
        const equity = p.currentValue - p.mortgage;
        const annualRental = p.rentalFreq === 'weekly' ? p.rentalIncome * 52 : p.rentalIncome * 12;
        return `
            <div class="holding-row">
                <div class="holding-info">
                    <div class="holding-name">${p.address}</div>
                    <div class="holding-detail">Equity: $${equity.toFixed(0)} | Rental: $${annualRental.toFixed(0)}/yr</div>
                </div>
                <div class="holding-value">
                    <div class="holding-value-main">$${p.currentValue.toFixed(0)}</div>
                    <div class="holding-gain positive">+$${(p.currentValue - p.purchasePrice).toFixed(0)}</div>
                </div>
                <button class="btn btn-secondary btn-small" onclick="deleteHolding('properties', ${p.id})">Remove</button>
            </div>
        `;
    }).join('') : '<div class="empty">No properties</div>';
    const propEl = document.getElementById('properties-list');
    if (propEl) propEl.innerHTML = propHTML;

    const superHTML = holdings.super.length ? holdings.super.map(s => {
        const annualCont = s.contribution * 12;
        return `
            <div class="holding-row">
                <div class="holding-info">
                    <div class="holding-name">${s.name}</div>
                    <div class="holding-detail">Contribution: $${annualCont.toFixed(0)}/yr</div>
                </div>
                <div class="holding-value">
                    <div class="holding-value-main">$${s.balance.toFixed(0)}</div>
                </div>
                <button class="btn btn-secondary btn-small" onclick="deleteHolding('super', ${s.id})">Remove</button>
            </div>
        `;
    }).join('') : '<div class="empty">No super accounts</div>';
    const superEl = document.getElementById('super-list');
    if (superEl) superEl.innerHTML = superHTML;

    const cashHTML = holdings.cash.length ? holdings.cash.map(c => `
        <div class="holding-row">
            <div class="holding-info">
                <div class="holding-name">${c.name}</div>
                <div class="holding-detail">Rate: ${c.rate}%</div>
            </div>
            <div class="holding-value">
                <div class="holding-value-main">$${c.balance.toFixed(0)}</div>
            </div>
            <button class="btn btn-secondary btn-small" onclick="deleteHolding('cash', ${c.id})">Remove</button>
        </div>
    `).join('') : '<div class="empty">No cash accounts</div>';
    const cashEl = document.getElementById('cash-list');
    if (cashEl) cashEl.innerHTML = cashHTML;
}

function renderTransactions() {
    const transHTML = transactions.length ? '<table><tr><th>Date</th><th>Merchant</th><th>Amount</th><th>Account</th></tr>' + transactions.slice().reverse().map(t => `
        <tr>
            <td>${t.date}</td>
            <td>${t.merchant}</td>
            <td style="text-align: right;">${t.type === 'expense' ? '-' : '+'}$${t.amount.toFixed(2)}</td>
            <td>${t.account}</td>
        </tr>
    `).join('') + '</table>' : '<div class="empty">No transactions</div>';
    const transEl = document.getElementById('all-trans-table');
    if (transEl) transEl.innerHTML = transHTML;
}

function renderBudgets() {
    const budgetList = Object.keys(budgets).length ? Object.entries(budgets).map(([cat, amt]) => {
        const spent = transactions.filter(t => t.category === cat && t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        const pct = (spent / amt) * 100;
        const status = pct > 100 ? '❌ Over' : pct > 80 ? '⚠️ Near' : '✓ OK';
        return `
            <div style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>${cat}</strong>
                    <span style="font-size: 12px; color: #666;">${status}</span>
                </div>
                <div style="font-size: 13px; color: #666; margin-bottom: 8px;">$${spent.toFixed(0)} / $${amt}</div>
                <div style="width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${Math.min(100, pct)}%; height: 100%; background: ${pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981'};"></div>
                </div>
            </div>
        `;
    }).join('') : '<div class="empty">No budgets set</div>';
    const budgetEl = document.getElementById('budgets-list');
    if (budgetEl) budgetEl.innerHTML = budgetList;
}
