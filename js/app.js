// Expense & Budget Visualizer
// Requirement 12.2: Single JavaScript file in js directory

/**
 * Application initialization
 * This file will contain all application logic including:
 * - Storage Manager
 * - Transaction Manager
 * - UI Manager
 * - Chart Component
 * - Event handlers
 */

/**
 * Escape HTML special characters to prevent XSS when inserting user data into the DOM.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * StorageManager - Handles all Local Storage operations
 * Requirements: 2.1, 2.2, 2.3
 * 
 * Responsibilities:
 * - Serialize and deserialize transaction data
 * - Persist data to Local Storage
 * - Retrieve data from Local Storage
 * - Handle storage errors gracefully
 */
class StorageManager {
    constructor() {
        this.TRANSACTIONS_KEY = 'expense-tracker-transactions';
        this.LIMIT_KEY = 'expense-tracker-limit';
    }

    /**
     * Save all transactions to Local Storage
     * Requirement 2.1: Persist transactions to browser Local Storage
     * @param {Array} transactions - Array of transaction objects
     */
    saveTransactions(transactions) {
        try {
            const serialized = JSON.stringify(transactions);
            localStorage.setItem(this.TRANSACTIONS_KEY, serialized);
        } catch (error) {
            console.error('Failed to save transactions:', error);
            throw new Error('Unable to save data. Storage may be full or unavailable.');
        }
    }

    /**
     * Load all transactions from Local Storage
     * Requirement 2.3: Retrieve stored transactions from browser Local Storage
     * @returns {Array} Array of transaction objects, or empty array if none exist
     */
    loadTransactions() {
        try {
            const serialized = localStorage.getItem(this.TRANSACTIONS_KEY);
            if (serialized === null) {
                return [];
            }
            const transactions = JSON.parse(serialized);
            return Array.isArray(transactions) ? transactions : [];
        } catch (error) {
            console.error('Failed to load transactions:', error);
            return [];
        }
    }

    /**
     * Save spending limit to Local Storage
     * Requirement 9.4: Persist spending limit value to browser Local Storage
     * @param {number} limit - The spending limit value
     */
    saveSpendingLimit(limit) {
        try {
            localStorage.setItem(this.LIMIT_KEY, JSON.stringify(limit));
        } catch (error) {
            console.error('Failed to save spending limit:', error);
            throw new Error('Unable to save spending limit.');
        }
    }

    /**
     * Load spending limit from Local Storage
     * Requirement 9.4: Retrieve spending limit from browser Local Storage
     * @returns {number|null} The spending limit value, or null if not set
     */
    loadSpendingLimit() {
        try {
            const serialized = localStorage.getItem(this.LIMIT_KEY);
            if (serialized === null) {
                return null;
            }
            const limit = JSON.parse(serialized);
            return typeof limit === 'number' ? limit : null;
        } catch (error) {
            console.error('Failed to load spending limit:', error);
            return null;
        }
    }

    /**
     * Clear all data from Local Storage
     * Useful for testing and data reset scenarios
     */
    clearAll() {
        try {
            localStorage.removeItem(this.TRANSACTIONS_KEY);
            localStorage.removeItem(this.LIMIT_KEY);
        } catch (error) {
            console.error('Failed to clear storage:', error);
        }
    }
}

/**
 * TransactionManager - Manages transaction business logic
 * Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 7.2, 7.5, 13.1, 13.2, 13.3, 13.4, 13.5
 * 
 * Responsibilities:
 * - Create, read, update, and delete transactions
 * - Validate transaction data
 * - Generate unique transaction IDs
 * - Integrate with StorageManager for persistence
 */
class TransactionManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.transactions = [];
        this.loadTransactions();
    }

    /**
     * Load transactions from storage
     * Requirement 2.3: Retrieve stored transactions
     */
    loadTransactions() {
        this.transactions = this.storageManager.loadTransactions();
    }

    /**
     * Validate transaction data
     * Requirements: 1.3, 1.4, 13.1, 13.2, 13.3, 13.4, 13.5
     * @param {string} itemName - The item name
     * @param {number} amount - The transaction amount
     * @param {string} category - The category (Food, Transport, Fun)
     * @returns {Object} Validation result with isValid flag and error message
     */
    validateTransaction(itemName, amount, category) {
        // Validate itemName
        // Requirement 13.4: Trim whitespace from Item Name
        const trimmedItemName = typeof itemName === 'string' ? itemName.trim() : '';
        
        if (trimmedItemName === '') {
            return { isValid: false, error: 'Please enter an item name' };
        }
        
        // Requirement 13.5: Item name must be ≤100 characters
        if (trimmedItemName.length > 100) {
            return { isValid: false, error: 'Item name must be 100 characters or less' };
        }

        // Validate amount
        // Requirement 13.1: Amount must be numeric
        if (typeof amount !== 'number' || isNaN(amount)) {
            return { isValid: false, error: 'Amount must be a number' };
        }

        // Requirement 13.2: Amount must be positive
        if (amount <= 0) {
            return { isValid: false, error: 'Amount must be positive' };
        }

        // Requirement 13.3: Amount must not exceed 1000000
        if (amount > 1000000) {
            return { isValid: false, error: 'Amount must be less than 1,000,000' };
        }

        // Requirement 1.3: Amount must be at least 0.01
        if (amount < 0.01) {
            return { isValid: false, error: 'Amount must be at least 0.01' };
        }

        // Validate category
        const validCategories = ['Food', 'Transport', 'Fun'];
        if (!validCategories.includes(category)) {
            return { isValid: false, error: 'Please select a category' };
        }

        return { isValid: true, error: null };
    }

    /**
     * Add a new transaction
     * Requirements: 1.5, 2.1, 7.2
     * @param {string} itemName - The item name
     * @param {number} amount - The transaction amount
     * @param {string} category - The category (Food, Transport, Fun)
     * @returns {Object} The created transaction object
     * @throws {Error} If validation fails
     */
    addTransaction(itemName, amount, category) {
        // Validate transaction data
        const validation = this.validateTransaction(itemName, amount, category);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Trim itemName for storage
        const trimmedItemName = itemName.trim();

        // Generate unique ID using timestamp + random number + counter for uniqueness
        // Requirement 7.2: ID generation for uniqueness
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        TransactionManager._idCounter = (TransactionManager._idCounter || 0) + 1;
        const id = `${timestamp}-${random}-${TransactionManager._idCounter}`;

        // Create transaction object
        const transaction = {
            id: id,
            itemName: trimmedItemName,
            amount: amount,
            category: category,
            timestamp: timestamp
        };

        // Add to transactions array
        this.transactions.push(transaction);

        // Persist to storage
        // Requirement 2.1: Persist transaction to Local Storage
        this.storageManager.saveTransactions(this.transactions);

        return transaction;
    }

    /**
     * Delete a transaction by ID
     * Requirement 2.2: Remove transaction from storage
     * @param {string} id - The transaction ID to delete
     * @returns {boolean} True if transaction was deleted, false if not found
     */
    deleteTransaction(id) {
        const initialLength = this.transactions.length;
        this.transactions = this.transactions.filter(t => t.id !== id);
        
        if (this.transactions.length < initialLength) {
            // Transaction was found and removed
            this.storageManager.saveTransactions(this.transactions);
            return true;
        }
        
        return false;
    }

    /**
     * Get all transactions
     * @returns {Array} Array of all transaction objects
     */
    getAllTransactions() {
        return [...this.transactions];
    }

    /**
     * Get transactions filtered by month and year
     * Requirements: 7.2, 7.5
     * @param {number} month - Month (1-12)
     * @param {number} year - Full year (e.g., 2024)
     * @returns {Array} Array of transactions for the specified month
     */
    getTransactionsByMonth(month, year) {
        return this.transactions.filter(transaction => {
            const date = new Date(transaction.timestamp);
            return date.getMonth() + 1 === month && date.getFullYear() === year;
        });
    }

    /**
     * Calculate total spending across all transactions
     * Requirements: 5.1, 6.2, 7.3, 7.4
     * @returns {number} Sum of all transaction amounts
     */
    calculateTotal() {
        return this.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    }

    /**
     * Calculate spending by category
     * Requirements: 6.2, 7.4
     * @returns {Object} Object with Food, Transport, Fun keys and their spending totals
     */
    calculateByCategory() {
        const categoryTotals = {
            Food: 0,
            Transport: 0,
            Fun: 0
        };

        this.transactions.forEach(transaction => {
            if (categoryTotals.hasOwnProperty(transaction.category)) {
                categoryTotals[transaction.category] += transaction.amount;
            }
        });

        return categoryTotals;
    }

    /**
     * Set spending limit
     * Requirements: 9.1, 9.4
     * @param {number|null} limit - The spending limit value, or null to clear
     * @throws {Error} If limit is invalid (not numeric or not positive)
     */
    setSpendingLimit(limit) {
        // Allow null to clear the limit
        if (limit === null) {
            this.storageManager.saveSpendingLimit(null);
            return;
        }

        // Validate limit must be numeric and positive
        if (typeof limit !== 'number' || isNaN(limit)) {
            throw new Error('Spending limit must be a number');
        }

        if (limit <= 0) {
            throw new Error('Spending limit must be positive');
        }

        // Persist to storage
        // Requirement 9.4: Persist spending limit to Local Storage
        this.storageManager.saveSpendingLimit(limit);
    }

    /**
     * Get spending limit
     * @returns {number|null} The spending limit value, or null if not set
     */
    getSpendingLimit() {
        return this.storageManager.loadSpendingLimit();
    }

    /**
     * Check if total spending exceeds the spending limit
     * Requirements: 9.2
     * @returns {boolean} True if spending exceeds limit, false otherwise
     */
    isOverLimit() {
        const limit = this.getSpendingLimit();
        
        // If no limit is set, we're not over limit
        if (limit === null) {
            return false;
        }

        const total = this.calculateTotal();
        return total > limit;
    }
}

/**
 * ChartComponent - Renders pie chart visualization using Canvas API
 * Requirements: 6.1, 6.2, 6.5, 6.6, 14.5
 */
class ChartComponent {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement ? canvasElement.getContext('2d') : null;

        // Predefined category colors per design spec
        this.COLORS = {
            Food: '#FF6B6B',
            Transport: '#4ECDC4',
            Fun: '#FFE66D'
        };
    }

    /**
     * Draw pie chart with category spending data
     * Requirements: 6.1, 6.2, 6.6
     * @param {Object} categoryData - { Food: number, Transport: number, Fun: number }
     */
    draw(categoryData) {
        if (!this.canvas || !this.ctx) {
            console.warn('Canvas not available for chart rendering');
            return;
        }

        this.clear();

        // Filter out zero-spend categories (Requirement 6.6)
        const activeCategories = Object.entries(categoryData)
            .filter(([, amount]) => amount > 0);

        const total = activeCategories.reduce((sum, [, amount]) => sum + amount, 0);

        // Handle empty state (Requirement 6.5)
        if (total === 0 || activeCategories.length === 0) {
            this._drawEmptyState();
            return;
        }

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const radius = Math.min(cx, cy) - 20;

        let startAngle = -Math.PI / 2; // Start from top

        // Draw each segment (Requirements 6.1, 6.2)
        activeCategories.forEach(([category, amount]) => {
            const sliceAngle = (amount / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.arc(cx, cy, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = this.COLORS[category];
            this.ctx.fill();

            // Thin white border between segments for clarity
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            startAngle = endAngle;
        });

        // Draw legend
        this._drawLegend(activeCategories, total);

        // Update accessibility text description (Requirement 14.5)
        this._updateDescription(categoryData);
    }

    /**
     * Draw legend below the chart with category names and amounts
     * @param {Array} activeCategories - [[category, amount], ...]
     * @param {number} total - Total spending
     */
    _drawLegend(activeCategories, total) {
        const legendEl = document.getElementById('chartLegend');
        if (!legendEl) return;

        legendEl.innerHTML = '';
        activeCategories.forEach(([category, amount]) => {
            const pct = ((amount / total) * 100).toFixed(1);
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <span class="legend-color" style="background:${this.COLORS[category]}"></span>
                <span class="legend-label">${category}: $${amount.toFixed(2)} (${pct}%)</span>
            `;
            legendEl.appendChild(item);
        });
    }

    /**
     * Draw empty state message on canvas (Requirement 6.5)
     */
    _drawEmptyState() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#888888';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No spending data to display', w / 2, h / 2);

        // Clear legend
        const legendEl = document.getElementById('chartLegend');
        if (legendEl) legendEl.innerHTML = '';

        // Clear description
        const descEl = document.getElementById('chartDescription');
        if (descEl) descEl.textContent = 'No spending data available.';
    }

    /**
     * Clear the canvas
     */
    clear() {
        if (!this.canvas || !this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Update the accessible text description element (Requirement 14.5)
     * @param {Object} categoryData
     */
    _updateDescription(categoryData) {
        const descEl = document.getElementById('chartDescription');
        if (descEl) {
            descEl.textContent = this.getTextDescription(categoryData);
        }
    }

    /**
     * Get text description of spending distribution for accessibility
     * Requirement 14.5
     * @param {Object} categoryData - { Food: number, Transport: number, Fun: number }
     * @returns {string} Human-readable description of spending distribution
     */
    getTextDescription(categoryData) {
        const total = Object.values(categoryData).reduce((sum, v) => sum + v, 0);

        if (total === 0) {
            return 'No spending data available.';
        }

        const parts = Object.entries(categoryData)
            .filter(([, amount]) => amount > 0)
            .map(([category, amount]) => {
                const pct = ((amount / total) * 100).toFixed(1);
                return `${category}: $${amount.toFixed(2)} (${pct}%)`;
            });

        return `Spending distribution — ${parts.join(', ')}.`;
    }
}

/**
 * UIManager - Handles all UI rendering and updates
 * Requirements: 5.1, 5.4, 5.5, 9.2, 12.3
 */
class UIManager {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.balanceAmountEl = null;
        this.transactionListEl = null;
        this.emptyStateEl = null;
        this.formEl = null;
        this.itemNameEl = null;
        this.amountEl = null;
        this.categoryEl = null;
        this.submitBtnEl = null;
        this.itemNameErrorEl = null;
        this.amountErrorEl = null;
        this.categoryErrorEl = null;
        this.chartComponent = null;
        this._chartDebounceTimer = null;
        this._notificationTimer = null;
        // Sort state: sortBy = 'date' | 'amount' | 'category', direction = 'asc' | 'desc'
        this.sortState = { sortBy: 'date', direction: 'desc' };
    }

    /**
     * Initialize UI component references
     * Requirement 5.4: Balance display positioned at top of interface
     */
    init() {
        this.balanceAmountEl = document.getElementById('balanceAmount');
        this.transactionListEl = document.getElementById('transactionList');
        this.emptyStateEl = document.getElementById('emptyState');

        this.formEl = document.getElementById('transactionForm');
        this.itemNameEl = document.getElementById('itemName');
        this.amountEl = document.getElementById('amount');
        this.categoryEl = document.getElementById('category');
        this.submitBtnEl = this.formEl ? this.formEl.querySelector('button[type="submit"]') : null;
        this.itemNameErrorEl = document.getElementById('itemNameError');
        this.amountErrorEl = document.getElementById('amountError');
        this.categoryErrorEl = document.getElementById('categoryError');

        const canvasEl = document.getElementById('spendingChart');
        this.chartComponent = new ChartComponent(canvasEl);

        this._initFormHandlers();
        this._initSortHandlers();
    }

    /**
     * Attach sort button event listeners
     * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
     */
    _initSortHandlers() {
        const sortByDate = document.getElementById('sortByDate');
        const sortByAmount = document.getElementById('sortByAmount');
        const sortByCategory = document.getElementById('sortByCategory');

        if (sortByDate) sortByDate.addEventListener('click', () => this.handleSort('date'));
        if (sortByAmount) sortByAmount.addEventListener('click', () => this.handleSort('amount'));
        if (sortByCategory) sortByCategory.addEventListener('click', () => this.handleSort('category'));
    }

    /**
     * Handle sort button activation.
     * - 'date': always sorts newest-first (desc)
     * - 'amount': first click = descending, second click = ascending (toggle)
     * - 'category': groups transactions by category
     * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 14.2, 14.3
     * @param {'date'|'amount'|'category'} sortType
     */
    handleSort(sortType) {
        if (sortType === 'amount' && this.sortState.sortBy === 'amount') {
            // Requirement 8.3: toggle direction on second click
            this.sortState.direction = this.sortState.direction === 'desc' ? 'asc' : 'desc';
        } else {
            // Requirement 8.2: amount defaults to descending on first click
            this.sortState.sortBy = sortType;
            this.sortState.direction = sortType === 'amount' ? 'desc' : 'desc';
        }

        // Update active button styling and aria-pressed state (Requirement 14.2)
        const sortButtonMap = { date: 'sortByDate', amount: 'sortByAmount', category: 'sortByCategory' };
        Object.entries(sortButtonMap).forEach(([type, id]) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const isActive = type === sortType;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });

        const activeId = sortButtonMap[sortType];
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) {
            // Show direction indicator on amount button; update aria-label for screen readers
            if (sortType === 'amount') {
                const dirLabel = this.sortState.direction === 'desc' ? 'descending' : 'ascending';
                activeBtn.textContent = `Amount ${this.sortState.direction === 'desc' ? '↓' : '↑'}`;
                activeBtn.setAttribute('aria-label', `Sort by amount ${dirLabel}, currently active`);
            } else if (sortType === 'date') {
                activeBtn.textContent = 'Date';
                activeBtn.setAttribute('aria-label', 'Sort by date, currently active');
            } else {
                activeBtn.textContent = 'Category';
                activeBtn.setAttribute('aria-label', 'Sort by category, currently active');
            }
        }

        this.renderTransactionList(this.transactionManager.getAllTransactions());
    }

    /**
     * Attach form event listeners
     * Requirements: 1.1, 1.2, 1.3, 1.4, 14.1
     */
    _initFormHandlers() {
        if (!this.formEl) return;

        this.formEl.addEventListener('submit', (e) => this._handleFormSubmit(e));
        this.itemNameEl.addEventListener('input', () => this._validateField('itemName'));
        this.amountEl.addEventListener('input', () => this._validateField('amount'));
        this.categoryEl.addEventListener('change', () => this._validateField('category'));

        // Disable submit until form is valid (Requirement 1.6)
        if (this.submitBtnEl) this.submitBtnEl.disabled = true;
    }

    /**
     * Validate a single field and update its error display and submit button state
     * @param {'itemName'|'amount'|'category'} fieldName
     */
    _validateField(fieldName) {
        const itemName = this.itemNameEl ? this.itemNameEl.value : '';
        const amountRaw = this.amountEl ? this.amountEl.value : '';
        const category = this.categoryEl ? this.categoryEl.value : '';

        let error = null;

        if (fieldName === 'itemName') {
            const trimmed = itemName.trim();
            if (trimmed === '') {
                error = 'Please enter an item name';
            } else if (trimmed.length > 100) {
                error = 'Item name must be 100 characters or less';
            }
        } else if (fieldName === 'amount') {
            if (amountRaw === '') {
                error = 'Please enter an amount';
            } else {
                const num = parseFloat(amountRaw);
                if (isNaN(num) || num <= 0) {
                    error = 'Amount must be positive';
                } else if (num < 0.01) {
                    error = 'Amount must be at least 0.01';
                } else if (num > 1000000) {
                    error = 'Amount must be less than 1,000,000';
                }
            }
        } else if (fieldName === 'category') {
            const validCategories = ['Food', 'Transport', 'Fun'];
            if (!validCategories.includes(category)) {
                error = 'Please select a category';
            }
        }

        if (error) {
            this._showFieldError(fieldName, error);
        } else {
            this._clearFieldError(fieldName);
        }

        this._updateSubmitButton();
    }

    /**
     * Show an inline error for a field
     * @param {'itemName'|'amount'|'category'} fieldName
     * @param {string} message
     */
    _showFieldError(fieldName, message) {
        const inputEl = this[`${fieldName}El`];
        const errorEl = this[`${fieldName}ErrorEl`];
        if (inputEl) {
            inputEl.classList.add('error');
            inputEl.setAttribute('aria-invalid', 'true');
        }
        if (errorEl) errorEl.textContent = message;
    }

    /**
     * Clear the inline error for a field
     * @param {'itemName'|'amount'|'category'} fieldName
     */
    _clearFieldError(fieldName) {
        const inputEl = this[`${fieldName}El`];
        const errorEl = this[`${fieldName}ErrorEl`];
        if (inputEl) {
            inputEl.classList.remove('error');
            inputEl.removeAttribute('aria-invalid');
        }
        if (errorEl) errorEl.textContent = '';
    }

    /**
     * Handle form submission
     * Requirements: 1.1, 1.2, 1.3, 1.4, 14.1
     * @param {Event} event
     */
    _handleFormSubmit(event) {
        event.preventDefault();

        const itemName = this.itemNameEl ? this.itemNameEl.value : '';
        const amountRaw = this.amountEl ? this.amountEl.value : '';
        const category = this.categoryEl ? this.categoryEl.value : '';
        const amount = amountRaw !== '' ? parseFloat(amountRaw) : NaN;

        const validation = this.transactionManager.validateTransaction(itemName, isNaN(amount) ? amountRaw : amount, category);

        if (!validation.isValid) {
            // Show errors for all fields
            ['itemName', 'amount', 'category'].forEach(field => this._validateField(field));
            return;
        }

        // Check limit status before adding (Requirement 9.3)
        const wasOverLimit = this.transactionManager.isOverLimit();

        this.transactionManager.addTransaction(itemName, amount, category);
        this.clearForm();

        // Re-render after adding transaction, preserving current sort order (Requirement 8.5)
        this.renderTransactionList(this.transactionManager.getAllTransactions());
        const nowOverLimit = this.transactionManager.isOverLimit();
        this.updateBalance(this.transactionManager.calculateTotal(), nowOverLimit);
        this.updateChart(this.transactionManager.calculateByCategory());

        // Requirement 9.3: Notify when a transaction causes spending to exceed the limit
        if (!wasOverLimit && nowOverLimit) {
            this.showNotification('Warning: You have exceeded your spending limit!');
        }

        // Requirement 14.1: Return focus to first field after successful submission
        if (this.itemNameEl) this.itemNameEl.focus();
    }

    /**
     * Reset the form and clear all validation state
     * Requirement 1.6
     */
    clearForm() {
        if (this.formEl) this.formEl.reset();
        ['itemName', 'amount', 'category'].forEach(field => this._clearFieldError(field));
        if (this.submitBtnEl) this.submitBtnEl.disabled = true;
    }

    /**
     * Enable or disable the submit button based on whether all required fields have values
     */
    _updateSubmitButton() {
        if (!this.submitBtnEl) return;
        const itemName = this.itemNameEl ? this.itemNameEl.value.trim() : '';
        const amount = this.amountEl ? this.amountEl.value : '';
        const category = this.categoryEl ? this.categoryEl.value : '';
        const hasErrors = [
            this.itemNameErrorEl,
            this.amountErrorEl,
            this.categoryErrorEl
        ].some(el => el && el.textContent !== '');

        this.submitBtnEl.disabled = itemName === '' || amount === '' || category === '' || hasErrors;
    }

    /**
     * Update the balance display element
     * Requirements: 5.1, 5.5, 9.2
     * @param {number} total - The total spending amount
     * @param {boolean} isOverLimit - Whether spending exceeds the limit
     */
    updateBalance(total, isOverLimit) {
        if (!this.balanceAmountEl) return;

        // Requirement 5.1: Display sum of all transaction amounts
        // Requirement 5.5: Show $0.00 when no transactions exist
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(total || 0);

        this.balanceAmountEl.textContent = formatted;

        // Requirement 9.2: Highlight in warning color when over spending limit
        if (isOverLimit) {
            this.balanceAmountEl.classList.add('over-limit');
        } else {
            this.balanceAmountEl.classList.remove('over-limit');
        }
    }

    /**
     * Update the chart with debouncing (200ms)
     * Requirements: 6.3, 6.4
     * @param {Object} categoryData - { Food: number, Transport: number, Fun: number }
     */
    updateChart(categoryData) {
        if (this._chartDebounceTimer) clearTimeout(this._chartDebounceTimer);
        this._chartDebounceTimer = setTimeout(() => {
            if (this.chartComponent) {
                this.chartComponent.draw(categoryData);
            }
        }, 200);
    }

    /**
     * Render the transaction list applying current sort state
     * Requirements: 3.1, 3.2, 3.5, 4.1, 8.1, 8.2, 8.3, 8.4, 8.5
     * @param {Array} transactions - Array of transaction objects to display
     */
    renderTransactionList(transactions) {
        if (!this.transactionListEl) return;

        // Clear existing list items
        this.transactionListEl.innerHTML = '';

        const { sortBy, direction } = this.sortState;

        // Apply sort based on current sort state
        let sorted;
        if (sortBy === 'amount') {
            // Requirements 8.2, 8.3: sort by amount descending or ascending
            sorted = [...transactions].sort((a, b) =>
                direction === 'desc' ? b.amount - a.amount : a.amount - b.amount
            );
        } else if (sortBy === 'category') {
            // Requirement 8.4: group by category (alphabetical category order, then by timestamp within group)
            sorted = [...transactions].sort((a, b) => {
                const catCompare = a.category.localeCompare(b.category);
                return catCompare !== 0 ? catCompare : b.timestamp - a.timestamp;
            });
        } else {
            // Requirement 3.5: default date sort — most recently added at top
            sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
        }

        if (sorted.length === 0) {
            // Show empty state, hide list border
            this.transactionListEl.style.display = 'none';
            if (this.emptyStateEl) this.emptyStateEl.style.display = 'block';
            return;
        }

        // Hide empty state, show list
        this.transactionListEl.style.display = '';
        if (this.emptyStateEl) this.emptyStateEl.style.display = 'none';

        // Requirement 3.1: Display itemName, amount, and category for each transaction
        sorted.forEach(transaction => {
            const li = document.createElement('li');
            li.className = 'transaction-item';
            li.dataset.id = transaction.id;

            const formattedAmount = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(transaction.amount);

            li.innerHTML = `
                <div class="transaction-info">
                    <span class="transaction-name">${escapeHtml(transaction.itemName)}</span>
                    <span class="transaction-amount">${formattedAmount}</span>
                    <span class="transaction-category ${transaction.category}">${transaction.category}</span>
                </div>
                <button
                    type="button"
                    class="btn-delete"
                    data-id="${transaction.id}"
                    aria-label="Delete ${escapeHtml(transaction.itemName)}"
                >Delete</button>
            `;

            this.transactionListEl.appendChild(li);
        });
    }

    /**
     * Build monthly summary data from all transactions.
     * Groups transactions by month/year and computes totals and category breakdowns.
     * Requirements: 7.2, 7.3, 7.4
     * @returns {Array} Array of monthly summary objects sorted newest-first
     */
    _buildMonthlySummaryData() {
        const all = this.transactionManager.getAllTransactions();
        const map = new Map(); // key: "YYYY-MM"

        all.forEach(t => {
            const d = new Date(t.timestamp);
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            const key = `${year}-${String(month).padStart(2, '0')}`;

            if (!map.has(key)) {
                map.set(key, {
                    month,
                    year,
                    total: 0,
                    byCategory: { Food: 0, Transport: 0, Fun: 0 },
                    transactions: []
                });
            }

            const entry = map.get(key);
            entry.total += t.amount;
            if (entry.byCategory.hasOwnProperty(t.category)) {
                entry.byCategory[t.category] += t.amount;
            }
            entry.transactions.push(t);
        });

        // Sort newest month first
        return Array.from(map.values()).sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.month - a.month;
        });
    }

    /**
     * Render the monthly summary section.
     * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
     */
    renderMonthlySummary() {
        const summarySection = document.getElementById('monthlySummary');
        const summaryContent = document.getElementById('monthlySummaryContent');
        if (!summarySection || !summaryContent) return;

        const monthlyData = this._buildMonthlySummaryData();

        summaryContent.innerHTML = '';

        if (monthlyData.length === 0) {
            summaryContent.innerHTML = '<p class="empty-state" style="display:block;">No transactions to summarize.</p>';
            return;
        }

        const MONTH_NAMES = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const fmt = (n) => new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: 2, maximumFractionDigits: 2
        }).format(n);

        monthlyData.forEach(entry => {
            const monthLabel = `${MONTH_NAMES[entry.month - 1]} ${entry.year}`;
            const key = `${entry.year}-${String(entry.month).padStart(2, '0')}`;

            const div = document.createElement('div');
            div.className = 'month-group';
            div.dataset.monthKey = key;

            // Category breakdown HTML
            const catParts = Object.entries(entry.byCategory)
                .filter(([, amt]) => amt > 0)
                .map(([cat, amt]) => `
                    <span class="category-amount">
                        <span class="transaction-category ${cat}" style="font-size:12px;padding:2px 8px;">${cat}</span>
                        ${fmt(amt)}
                    </span>
                `).join('');

            div.innerHTML = `
                <div class="month-header">${escapeHtml(monthLabel)}</div>
                <div class="month-total">Total: ${fmt(entry.total)}</div>
                <div class="month-categories">${catParts || '<span style="color:#999;font-size:14px;">No spending</span>'}</div>
                <button
                    type="button"
                    class="btn-sort month-filter-btn"
                    data-month="${entry.month}"
                    data-year="${entry.year}"
                    aria-label="Filter transactions for ${escapeHtml(monthLabel)}"
                >View ${escapeHtml(monthLabel)} Transactions</button>
            `;

            summaryContent.appendChild(div);
        });

        // Attach click handlers for month filter buttons
        summaryContent.querySelectorAll('.month-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const month = parseInt(btn.dataset.month, 10);
                const year = parseInt(btn.dataset.year, 10);
                this._filterByMonth(month, year);
            });
        });
    }

    /**
     * Filter the transaction list, balance, and chart to show only a specific month.
     * Requirement 7.5
     * @param {number} month - 1-12
     * @param {number} year - Full year
     */
    _filterByMonth(month, year) {
        const filtered = this.transactionManager.getTransactionsByMonth(month, year);

        // Update transaction list
        this.renderTransactionList(filtered);

        // Update balance to show only this month's total
        const monthTotal = filtered.reduce((sum, t) => sum + t.amount, 0);
        const limit = this.transactionManager.getSpendingLimit();
        const isOver = limit !== null && monthTotal > limit;
        this.updateBalance(monthTotal, isOver);

        // Update chart to show only this month's category data
        const byCategory = { Food: 0, Transport: 0, Fun: 0 };
        filtered.forEach(t => {
            if (byCategory.hasOwnProperty(t.category)) {
                byCategory[t.category] += t.amount;
            }
        });
        this.updateChart(byCategory);

        // Highlight the active month button
        const summaryContent = document.getElementById('monthlySummaryContent');
        if (summaryContent) {
            summaryContent.querySelectorAll('.month-filter-btn').forEach(b => b.classList.remove('active'));
            const key = `${year}-${String(month).padStart(2, '0')}`;
            const activeGroup = summaryContent.querySelector(`[data-month-key="${key}"]`);
            if (activeGroup) {
                const btn = activeGroup.querySelector('.month-filter-btn');
                if (btn) btn.classList.add('active');
            }
        }

        // Show a "back to all" button in the transaction section header if not already present
        this._showBackToAllButton();
    }

    /**
     * Show a "Back to All Transactions" button so the user can clear the month filter.
     * Requirement 7.5
     */
    _showBackToAllButton() {
        const transactionSection = document.querySelector('.transaction-section h2');
        if (!transactionSection) return;

        // Remove existing back button if present
        const existing = document.getElementById('backToAllBtn');
        if (existing) existing.remove();

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'backToAllBtn';
        btn.className = 'btn-sort';
        btn.style.marginLeft = '15px';
        btn.style.fontSize = '14px';
        btn.textContent = '← All Transactions';
        btn.setAttribute('aria-label', 'Show all transactions');

        btn.addEventListener('click', () => {
            this._clearMonthFilter();
        });

        transactionSection.appendChild(btn);
    }

    /**
     * Clear the month filter and restore the full transaction view.
     */
    _clearMonthFilter() {
        // Remove back button
        const backBtn = document.getElementById('backToAllBtn');
        if (backBtn) backBtn.remove();

        // Clear active state on month buttons
        const summaryContent = document.getElementById('monthlySummaryContent');
        if (summaryContent) {
            summaryContent.querySelectorAll('.month-filter-btn').forEach(b => b.classList.remove('active'));
        }

        // Restore full view
        this.renderTransactionList(this.transactionManager.getAllTransactions());
        this.updateBalance(
            this.transactionManager.calculateTotal(),
            this.transactionManager.isOverLimit()
        );
        this.updateChart(this.transactionManager.calculateByCategory());
    }

    /**
     * Show an error notification banner
     * Requirement 9.3
     * @param {string} message - The error message to display
     */
    showError(message) {
        const el = document.getElementById('notification');
        if (!el) return;
        el.textContent = message;
        el.className = 'notification error show';
        if (this._notificationTimer) clearTimeout(this._notificationTimer);
        this._notificationTimer = setTimeout(() => {
            el.className = 'notification';
            el.textContent = '';
        }, 3000);
    }

    /**
     * Show a success/alert notification banner
     * Requirement 9.3
     * @param {string} message - The notification message to display
     */
    showNotification(message) {
        const el = document.getElementById('notification');
        if (!el) return;
        el.textContent = message;
        el.className = 'notification warning show';
        if (this._notificationTimer) clearTimeout(this._notificationTimer);
        this._notificationTimer = setTimeout(() => {
            el.className = 'notification';
            el.textContent = '';
        }, 3000);
    }

    /**
     * Initialize view toggle controls (All Transactions / Monthly Summary).
     * Requirement 7.1, 14.2
     */
    _initViewControls() {
        const viewAllBtn = document.getElementById('viewAll');
        const viewMonthlyBtn = document.getElementById('viewMonthly');
        const monthlySummarySection = document.getElementById('monthlySummary');

        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                // Switch to all-transactions view
                viewAllBtn.classList.add('active');
                viewAllBtn.setAttribute('aria-pressed', 'true');
                viewAllBtn.setAttribute('aria-label', 'View all transactions, currently active');
                if (viewMonthlyBtn) {
                    viewMonthlyBtn.classList.remove('active');
                    viewMonthlyBtn.setAttribute('aria-pressed', 'false');
                    viewMonthlyBtn.setAttribute('aria-label', 'View monthly summary');
                }
                if (monthlySummarySection) monthlySummarySection.style.display = 'none';
                this._clearMonthFilter();
            });
        }

        if (viewMonthlyBtn) {
            viewMonthlyBtn.addEventListener('click', () => {
                // Switch to monthly summary view
                viewMonthlyBtn.classList.add('active');
                viewMonthlyBtn.setAttribute('aria-pressed', 'true');
                viewMonthlyBtn.setAttribute('aria-label', 'View monthly summary, currently active');
                if (viewAllBtn) {
                    viewAllBtn.classList.remove('active');
                    viewAllBtn.setAttribute('aria-pressed', 'false');
                    viewAllBtn.setAttribute('aria-label', 'View all transactions');
                }
                if (monthlySummarySection) monthlySummarySection.style.display = 'block';
                this.renderMonthlySummary();
            });
        }
    }
}

/**
 * AppController - Coordinates all application components
 * Requirements: 2.3, 7.1
 */
class AppController {
    constructor() {
        this.storageManager = new StorageManager();
        this.transactionManager = new TransactionManager(this.storageManager);
        this.uiManager = new UIManager(this.transactionManager);
    }

    /**
     * Initialize the application
     */
    init() {
        this.uiManager.init();
        this.uiManager._initViewControls();

        // Initial render with all transactions
        const transactions = this.transactionManager.getAllTransactions();
        this.uiManager.renderTransactionList(transactions);
        this.uiManager.updateBalance(
            this.transactionManager.calculateTotal(),
            this.transactionManager.isOverLimit()
        );
        this.uiManager.updateChart(this.transactionManager.calculateByCategory());

        // Wire up spending limit input
        const limitInput = document.getElementById('spendingLimit');
        if (limitInput) {
            // Pre-fill saved limit
            const savedLimit = this.transactionManager.getSpendingLimit();
            if (savedLimit !== null) limitInput.value = savedLimit;

            limitInput.addEventListener('change', () => {
                const val = limitInput.value.trim();
                if (val === '') {
                    this.transactionManager.setSpendingLimit(null);
                } else {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num > 0) {
                        this.transactionManager.setSpendingLimit(num);
                    }
                }
                this.uiManager.updateBalance(
                    this.transactionManager.calculateTotal(),
                    this.transactionManager.isOverLimit()
                );
            });
        }

        // Wire up delete buttons via event delegation on the transaction list
        const listEl = document.getElementById('transactionList');
        if (listEl) {
            listEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-delete');
                if (!btn) return;
                const id = btn.dataset.id;
                if (!id) return;
                this.transactionManager.deleteTransaction(id);
                this.uiManager.renderTransactionList(this.transactionManager.getAllTransactions());
                this.uiManager.updateBalance(
                    this.transactionManager.calculateTotal(),
                    this.transactionManager.isOverLimit()
                );
                this.uiManager.updateChart(this.transactionManager.calculateByCategory());
                // Refresh monthly summary if visible
                const monthlySummarySection = document.getElementById('monthlySummary');
                if (monthlySummarySection && monthlySummarySection.style.display !== 'none') {
                    this.uiManager.renderMonthlySummary();
                }
            });
        }

        // Override form submit handler to also refresh monthly summary
        const formEl = document.getElementById('transactionForm');
        if (formEl) {
            formEl.addEventListener('submit', () => {
                // After UIManager's own submit handler runs, refresh monthly summary if visible
                setTimeout(() => {
                    const monthlySummarySection = document.getElementById('monthlySummary');
                    if (monthlySummarySection && monthlySummarySection.style.display !== 'none') {
                        this.uiManager.renderMonthlySummary();
                    }
                }, 0);
            });
        }
    }
}

// Application will be initialized when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Expense & Budget Visualizer loaded');
    const app = new AppController();
    app.init();
});
