// ============================================
// SmartBillPro - Billing System JavaScript
// ============================================

// Global state management
let products = []; // Array to store cart items (products added to invoice)
let catalog = []; // Array to store product catalog (available products)
let editingIndex = -1; // Track which cart item is being edited (-1 means no editing)

// DOM Elements
const productsTableBody = document.getElementById('productsTableBody');
const searchInput = document.getElementById('searchInput');
const noProductsMessage = document.getElementById('noProductsMessage');
const actionHeader = document.getElementById('actionHeader');

// Catalog elements
const catalogSearchInput = document.getElementById('catalogSearchInput');
const catalogList = document.getElementById('catalogList');
const noCatalogMessage = document.getElementById('noCatalogMessage');
const editCatalogBtn = document.getElementById('editCatalogBtn');
const catalogEditModal = document.getElementById('catalogEditModal');
const catalogEditList = document.getElementById('catalogEditList');
const closeCatalogModal = document.getElementById('closeCatalogModal');
const saveCatalogBtn = document.getElementById('saveCatalogBtn');
const cancelCatalogEditBtn = document.getElementById('cancelCatalogEditBtn');
const addNewCatalogItemBtn = document.getElementById('addNewCatalogItemBtn');
const addProductFormModal = document.getElementById('addProductFormModal');
const closeAddProductModal = document.getElementById('closeAddProductModal');
const saveNewProductBtn = document.getElementById('saveNewProductBtn');
const cancelNewProductBtn = document.getElementById('cancelNewProductBtn');
const newProductForm = document.getElementById('newProductForm');

// Tax, discount, and total elements
const taxRateInput = document.getElementById('taxRate');
const discountRateInput = document.getElementById('discountRate');
const subtotalDisplay = document.getElementById('subtotal');
const discountAmountDisplay = document.getElementById('discountAmount');
const discountedTotalDisplay = document.getElementById('discountedTotal');
const taxAmountDisplay = document.getElementById('taxAmount');
const finalTotalDisplay = document.getElementById('finalTotal');

// Invoice elements
const invoiceDate = document.getElementById('invoiceDate');
const printInvoiceBtn = document.getElementById('printInvoiceBtn');
const clearBillBtn = document.getElementById('clearBillBtn');

// LocalStorage keys for storing data
const STORAGE_KEY = 'smartBillPro_data';
const CATALOG_STORAGE_KEY = 'catalog';

// ============================================
// Action Buttons (Always Visible)
// ============================================

// ============================================
// Catalog Management Functions
// ============================================

/**
 * Generate Random 10-Digit Product ID
 * 
 * Generates a random 10-digit numeric product ID.
 * Ensures the ID starts with a non-zero digit (1-9) to make it a proper 10-digit number.
 */
function generateRandomProductId() {
    // Generate first digit (1-9 to ensure it's a proper 10-digit number)
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    // Generate remaining 9 digits (0-9)
    const remainingDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return firstDigit + remainingDigits;
}

/**
 * Load Catalog from LocalStorage
 * 
 * This function loads the product catalog from localStorage under the key 'catalog'.
 * If no catalog exists, it initializes with default sample products.
 * The catalog is loaded when the application starts and contains all available
 * products that can be added to the invoice.
 * 
 * Catalog Structure:
 * [
 *   {
 *     id: "1234567890",
 *     name: "Product Name",
 *     price: 10.50,
 *     stock: 100,
 *     inStock: true
 *   },
 *   ...
 * ]
 */
function loadCatalog() {
    try {
        const savedCatalog = localStorage.getItem(CATALOG_STORAGE_KEY);
        
        if (savedCatalog) {
            // Parse and validate catalog data
            catalog = JSON.parse(savedCatalog);
            if (!Array.isArray(catalog)) {
                throw new Error('Invalid catalog format');
            }
            
            // Check if any products have old-style IDs (like "PROD-001") and regenerate them
            // This ensures all products have random 10-digit IDs
            let needsUpdate = false;
            catalog.forEach(item => {
                // Check if ID matches old format (PROD-XXX) or is not 10 digits
                if (item.id.startsWith('PROD-') || item.id.length !== 10 || !/^\d{10}$/.test(item.id)) {
                    item.id = generateRandomProductId();
                    needsUpdate = true;
                }
            });
            
            // If we updated any IDs, save the catalog back
            if (needsUpdate) {
                saveCatalog();
                console.log('Catalog IDs updated to random 10-digit format');
            }
        } else {
            // Initialize with default sample products if no catalog exists
            // Prices in Rupees (₹)
            // Generate random 10-digit product IDs
            catalog = [
                { id: generateRandomProductId(), name: 'Laptop Computer', price: 49999.99, stock: 25, inStock: true },
                { id: generateRandomProductId(), name: 'Wireless Mouse', price: 1499.99, stock: 100, inStock: true },
                { id: generateRandomProductId(), name: 'USB Keyboard', price: 2499.99, stock: 75, inStock: true },
                { id: generateRandomProductId(), name: 'Monitor 24"', price: 9999.99, stock: 50, inStock: true },
                { id: generateRandomProductId(), name: 'Webcam HD', price: 3999.99, stock: 30, inStock: true },
                { id: generateRandomProductId(), name: 'Headphones', price: 4499.99, stock: 60, inStock: true },
                { id: generateRandomProductId(), name: 'USB Cable', price: 499.99, stock: 200, inStock: true },
                { id: generateRandomProductId(), name: 'HDD 1TB', price: 2999.99, stock: 40, inStock: true },
                { id: generateRandomProductId(), name: 'SSD 512GB', price: 6499.99, stock: 35, inStock: true },
                { id: generateRandomProductId(), name: 'RAM 16GB', price: 7499.99, stock: 20, inStock: true }
            ];
            saveCatalog(); // Save default catalog to localStorage
        }
        
        console.log('Catalog loaded:', catalog);
        displayCatalog(); // Render catalog items
    } catch (error) {
        console.error('Error loading catalog:', error);
        alert('Error loading catalog. Using default products.');
        // Initialize with defaults on error
        catalog = [];
        loadCatalog(); // Retry with defaults
    }
}

/**
 * Save Catalog to LocalStorage
 * 
 * Saves the current catalog array to localStorage under the key 'catalog'.
 * This ensures catalog changes persist across page reloads.
 */
function saveCatalog() {
    try {
        localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
        console.log('Catalog saved to localStorage');
    } catch (error) {
        console.error('Error saving catalog:', error);
        alert('Unable to save catalog. Please check your browser settings.');
    }
}

/**
 * Display Catalog Items
 * 
 * Renders the catalog items in the catalog list. Each item shows:
 * - Product ID and Name
 * - Price
 - Stock quantity
 * - Add button with optional quantity input
 * 
 * Only items matching the search query (if any) are displayed.
 */
function displayCatalog() {
    const searchQuery = catalogSearchInput.value.toLowerCase().trim();
    
    // Filter catalog based on search query (searches both name and ID)
    // Show all items (including out of stock) so users can see availability
    const filteredCatalog = catalog.filter(item => {
        if (!searchQuery) return true; // Show all items when no search
        return (
            item.name.toLowerCase().includes(searchQuery) ||
            item.id.toLowerCase().includes(searchQuery)
        );
    });
    
    // Limit to only top 7 results for display
    const displayCatalog = filteredCatalog.slice(0, 7);
    
    catalogList.innerHTML = '';
    
    if (displayCatalog.length === 0) {
        noCatalogMessage.classList.add('show');
    } else {
        noCatalogMessage.classList.remove('show');
        
        displayCatalog.forEach(item => {
            displayCatalogItem(item);
        });
    }
}

/**
 * Display a Single Catalog Item
 * 
 * Creates and renders a single catalog item with:
 * - Product information (ID, name, price, stock)
 * - Quantity input field
 * - Add button
 */
function displayCatalogItem(item) {
    const catalogItem = document.createElement('div');
    catalogItem.className = 'catalog-item';
    // Auto-manage stock status: stock = 0 means out of stock, stock > 0 means in stock
    // No need for separate inStock checkbox - it's automatically managed based on quantity
    const isActuallyOutOfStock = item.stock === 0;
    const stockClass = isActuallyOutOfStock ? 'out-of-stock' : '';
    
    catalogItem.innerHTML = `
        <div class="catalog-item-info">
            <div class="catalog-item-name-row">
                <span class="catalog-item-name ${stockClass}">${escapeHtml(item.name)}</span>
                ${isActuallyOutOfStock ? '<span class="stock-badge">Out of Stock</span>' : ''}
            </div>
            <div class="catalog-item-details-row">
                <span class="catalog-item-price">₹${item.price.toFixed(2)}</span>
                <span class="catalog-item-stock ${stockClass}">Stock: ${item.stock}</span>
            </div>
        </div>
        <div class="catalog-item-actions">
            <input type="number" class="catalog-quantity-input" 
                   min="1" max="${item.stock}" value="1" 
                   data-product-id="${escapeHtml(item.id)}"
                   ${isActuallyOutOfStock ? 'disabled' : ''}>
            <button class="btn btn-primary btn-add" 
                    onclick="addProductToCart('${escapeHtml(item.id)}', this.previousElementSibling.value)"
                    ${isActuallyOutOfStock ? 'disabled' : ''}>
                Add
            </button>
        </div>
    `;
    
    catalogList.appendChild(catalogItem);
}

/**
 * Add Product to Cart
 * 
 * This function adds a product from the catalog to the invoice cart.
 * 
 * How it works:
 * 1. Finds the product in the catalog by ID
 * 2. Checks if the product is already in the cart
 * 3. If already in cart: increments the quantity
 * 4. If not in cart: adds the product with specified quantity
 * 5. Updates the cart display and saves to localStorage
 * 
 * The product is added using data from the catalog (name, price),
 * ensuring consistency with catalog information.
 */
function addProductToCart(productId, quantity = 1) {
    // Find the product in catalog
    const catalogItem = catalog.find(item => item.id === productId);
    
    if (!catalogItem) {
        alert('Product not found in catalog.');
        return;
    }
    
    // Check if product is in stock - auto-managed: stock = 0 means out of stock
    if (catalogItem.stock === 0) {
        alert('This product is out of stock.');
        return;
    }
    
    // Check stock availability
    const qty = parseInt(quantity) || 1;
    if (qty <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }
    
    // Check if product is already in cart
    const existingIndex = products.findIndex(p => p.id === productId);
    const currentCartQty = existingIndex >= 0 ? products[existingIndex].quantity : 0;
    
    // Calculate total quantity that will be in cart after adding
    const totalQty = currentCartQty + qty;
    
    // Available stock includes what's currently in cart (since it's not yet committed)
    // So available stock = catalog stock + what's already in cart
    const availableStock = catalogItem.stock + currentCartQty;
    
    // Check if total quantity exceeds available stock
    if (totalQty > availableStock) {
        alert(`Only ${availableStock} items available in stock (${catalogItem.stock} remaining + ${currentCartQty} already in cart).`);
        return;
    }
    
    if (existingIndex >= 0) {
        // Increment quantity if already in cart
        products[existingIndex].quantity = totalQty;
    } else {
        // Add new product to cart
        products.push({
            id: catalogItem.id,
            name: catalogItem.name,
            price: catalogItem.price,
            quantity: qty
        });
    }
    
    // Decrease stock in catalog when product is added to cart
    catalogItem.stock -= qty;
    
    // Fix: Ensure stock never goes negative - set to 0 if it becomes negative
    if (catalogItem.stock < 0) {
        catalogItem.stock = 0;
    }
    
    // Auto-update stock status - if stock reaches 0, product is automatically out of stock
    // If stock > 0, product is automatically in stock (no separate inStock flag needed)
    if (catalogItem.stock === 0) {
        catalogItem.inStock = false;
    } else if (catalogItem.stock > 0) {
        catalogItem.inStock = true;
    }
    
    // Save updated catalog to localStorage
    saveCatalog();
    
    // Update UI and save
    displayCatalog(); // Refresh catalog display to show updated stock
    filterAndDisplayProducts();
    calculateTotals();
    saveBillingData();
    
    // Show feedback
    console.log(`Added ${qty} x ${catalogItem.name} to cart. Remaining stock: ${catalogItem.stock}`);
}

/**
 * Delete a product from the list
 */
function deleteProduct(index) {
    if (confirm('Are you sure you want to delete this product?')) {
        const removedProduct = products[index];
        
        // Restore stock to catalog when product is removed from cart
        const catalogItem = catalog.find(item => item.id === removedProduct.id);
        if (catalogItem) {
            catalogItem.stock += removedProduct.quantity;
            // Auto-update stock status: stock > 0 means in stock
            catalogItem.inStock = catalogItem.stock > 0;
            saveCatalog();
            displayCatalog(); // Refresh catalog display
        }
        
        products.splice(index, 1);
        filterAndDisplayProducts();
        calculateTotals();
        
        // Save to localStorage after deleting product
        saveBillingData();
    }
}

/**
 * Edit a cart item quantity
 */
function editProduct(index) {
    const product = products[index];
    const oldQuantity = product.quantity;
    const newQuantity = prompt(`Enter new quantity for ${product.name}:`, product.quantity);
    
    if (newQuantity !== null) {
        let qty = parseInt(newQuantity);
        if (qty > 0) {
            // Find product in catalog to check stock and update
            const catalogItem = catalog.find(item => item.id === product.id);
            if (catalogItem) {
                // Calculate the difference in quantity
                const quantityDiff = qty - oldQuantity;
                
                // Check if new quantity exceeds available stock (current stock + quantity already in cart)
                const availableStock = catalogItem.stock + oldQuantity; // Stock available includes what's in cart
                
                if (qty > availableStock) {
                    alert(`Only ${availableStock} items available in stock (including ${oldQuantity} already in cart).`);
                    qty = availableStock;
                }
                
                // Update catalog stock based on quantity change
                catalogItem.stock -= quantityDiff;
                
                // Fix: Ensure stock never goes negative
                if (catalogItem.stock < 0) {
                    catalogItem.stock = 0;
                }
                
                // Auto-update stock status: stock = 0 means out of stock, stock > 0 means in stock
                catalogItem.inStock = catalogItem.stock > 0;
                
                saveCatalog();
                displayCatalog(); // Refresh catalog display
            }
            
            products[index].quantity = qty;
            filterAndDisplayProducts();
            calculateTotals();
            saveBillingData();
        }
    }
}

// ============================================
// Display Functions
// ============================================

/**
 * Filter products based on search query and display them
 */
function filterAndDisplayProducts() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    
    // Filter products based on search query
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery)
    );
    
    // Clear table body
    productsTableBody.innerHTML = '';
    
    // Show/hide "no products" message
    if (filteredProducts.length === 0) {
        noProductsMessage.classList.add('show');
    } else {
        noProductsMessage.classList.remove('show');
        
        // Display each filtered product
        filteredProducts.forEach((product, displayIndex) => {
            // Find the actual index in the original products array
            const actualIndex = products.findIndex(p => p === product);
            displayProduct(product, actualIndex);
        });
    }
}

/**
 * Display a single cart item in the table
 */
function displayProduct(product, index) {
    const row = document.createElement('tr');
    const subtotal = (product.quantity * product.price).toFixed(2);
    
    row.innerHTML = `
        <td>${escapeHtml(product.name)}</td>
        <td>${product.quantity}</td>
        <td>₹${product.price.toFixed(2)}</td>
        <td>₹${subtotal}</td>
        <td class="action-cell">
            <button class="btn btn-edit" onclick="editProduct(${index})">Edit</button>
            <button class="btn btn-delete" onclick="deleteProduct(${index})">Delete</button>
        </td>
    `;
    
    productsTableBody.appendChild(row);
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate and display all totals (subtotal, discount, tax, final total)
 * 
 * Calculation Order:
 * 1. Subtotal = Sum of all products (quantity × price)
 * 2. Discount Amount = Subtotal × (Discount % / 100)
 * 3. Discounted Total = Subtotal - Discount Amount
 * 4. Tax Amount = Discounted Total × (Tax Rate / 100) [Tax applied after discount]
 * 5. Final Total = Discounted Total + Tax Amount
 */
function calculateTotals() {
    // Step 1: Calculate subtotal by summing all product subtotals
    const subtotal = products.reduce((sum, product) => {
        return sum + (product.quantity * product.price);
    }, 0);
    
    // Step 2: Get discount rate and calculate discount amount
    // Discount is applied as a percentage of the subtotal
    const discountRate = parseFloat(discountRateInput.value) || 0;
    const discountAmount = (subtotal * discountRate) / 100;
    
    // Step 3: Calculate discounted total (subtotal minus discount)
    // This is the amount before tax is applied
    const discountedTotal = subtotal - discountAmount;
    
    // Step 4: Calculate tax amount based on the discounted total
    // Tax is applied AFTER the discount, not on the original subtotal
    const taxRate = parseFloat(taxRateInput.value) || 0;
    const taxAmount = (discountedTotal * taxRate) / 100;
    
    // Step 5: Calculate final total (discounted total plus tax)
    const finalTotal = discountedTotal + taxAmount;
    
    // Update all displays with formatted currency values (using Rupee symbol ₹)
    subtotalDisplay.textContent = `₹${subtotal.toFixed(2)}`;
    
    // Discount amount: Show with negative sign and green color (subtracted from total)
    if (discountAmount > 0) {
        discountAmountDisplay.textContent = `-₹${discountAmount.toFixed(2)}`;
        discountAmountDisplay.classList.add('has-discount');
    } else {
        discountAmountDisplay.textContent = `₹${discountAmount.toFixed(2)}`;
        discountAmountDisplay.classList.remove('has-discount');
    }
    
    discountedTotalDisplay.textContent = `₹${discountedTotal.toFixed(2)}`;
    
    // Tax amount: Show with positive sign and red color (added to total)
    if (taxAmount > 0) {
        taxAmountDisplay.textContent = `+₹${taxAmount.toFixed(2)}`;
        taxAmountDisplay.classList.add('has-tax');
    } else {
        taxAmountDisplay.textContent = `₹${taxAmount.toFixed(2)}`;
        taxAmountDisplay.classList.remove('has-tax');
    }
    
    finalTotalDisplay.textContent = `₹${finalTotal.toFixed(2)}`;
}

// ============================================
// Event Listeners
// ============================================

// Search/filter functionality
searchInput.addEventListener('input', filterAndDisplayProducts);

// Catalog search functionality - filters catalog as user types
catalogSearchInput.addEventListener('input', displayCatalog);

// Discount rate change listener - recalculates totals when discount changes
discountRateInput.addEventListener('input', function() {
    calculateTotals();
    // Save to localStorage when discount changes
    saveBillingData();
});

// Tax rate change listener - recalculates totals when tax rate changes
taxRateInput.addEventListener('input', function() {
    calculateTotals();
    // Save to localStorage when tax rate changes
    saveBillingData();
});

// ============================================
// Print and Download Invoice Functions
// ============================================

/**
 * Updates the invoice date display with the current date
 * Called on page load and when printing/downloading
 */
function updateInvoiceDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const formattedDate = now.toLocaleDateString('en-US', options);
    invoiceDate.textContent = `Date: ${formattedDate}`;
}

/**
 * Print Invoice Function
 * 
 * This function handles printing the invoice using the browser's print dialog.
 * It works by:
 * 1. Updating the invoice date to the current date
 * 2. Calling window.print() which opens the browser's print dialog
 * 3. The CSS @media print rules automatically hide non-essential elements
 *    (buttons, search bar, admin controls) and show only the invoice content
 * 4. The print view includes the store name, date, products table, and totals
 */
function printInvoice() {
    // Update invoice date before printing
    updateInvoiceDate();
    
    // Trigger the browser's print dialog
    // The CSS print media queries will automatically format the page for printing
    window.print();
}

// Attach event listener to print button
printInvoiceBtn.addEventListener('click', printInvoice);

// ============================================
// LocalStorage Functions
// ============================================

/**
 * Save Billing Data to LocalStorage
 * 
 * This function saves the entire billing state to browser's localStorage.
 * It creates a structured JSON object containing:
 * - products: Array of all products (name, quantity, price)
 * - discountRate: Current discount percentage
 * - taxRate: Current tax percentage
 * 
 * The data is automatically saved whenever:
 * - A product is added or updated
 * - A product is deleted
 * - Discount rate changes
 * - Tax rate changes
 * 
 * Storage Structure:
 * {
 *   "products": [
 *     { "name": "Product Name", "quantity": 2, "price": 10.50 },
 *     ...
 *   ],
 *   "discountRate": 5.0,
 *   "taxRate": 8.5
 * }
 */
function saveBillingData() {
    try {
        // Create a structured data object with all billing information
        const billingData = {
            products: products.map(product => ({
                id: product.id, // Include product ID for catalog reference
                name: product.name,
                quantity: product.quantity,
                price: product.price
            })),
            discountRate: parseFloat(discountRateInput.value) || 0,
            taxRate: parseFloat(taxRateInput.value) || 0
        };
        
        // Convert the object to JSON string and store in localStorage
        // The STORAGE_KEY constant ensures consistent storage location
        localStorage.setItem(STORAGE_KEY, JSON.stringify(billingData));
        
        console.log('Billing data saved to localStorage:', billingData);
    } catch (error) {
        // Handle errors gracefully (e.g., if localStorage is full or disabled)
        console.error('Error saving billing data to localStorage:', error);
        alert('Unable to save billing data. Please check your browser settings.');
    }
}

/**
 * Load Billing Data from LocalStorage
 * 
 * This function retrieves the saved billing data from localStorage and
 * restores the entire billing state, including:
 * - All products in the cart
 * - Discount rate
 * - Tax rate
 * 
 * Process:
 * 1. Check if data exists in localStorage
 * 2. Parse the JSON string back into an object
 * 3. Validate the data structure
 * 4. Restore products array
 * 5. Restore discount and tax rate inputs
 * 6. Update the UI to reflect the loaded data
 * 
 * This function is called automatically on page load to restore
 * the last saved bill state.
 */
function loadBillingData() {
    try {
        // Retrieve the JSON string from localStorage
        const savedData = localStorage.getItem(STORAGE_KEY);
        
        // If no data exists, return early (first time user or cleared storage)
        if (!savedData) {
            console.log('No saved billing data found in localStorage');
            return;
        }
        
        // Parse the JSON string back into a JavaScript object
        const billingData = JSON.parse(savedData);
        
        // Validate that the data has the expected structure
        if (!billingData || typeof billingData !== 'object') {
            console.warn('Invalid billing data structure in localStorage');
            return;
        }
        
        // Restore products array
        // Validate each product has required fields before restoring
        if (Array.isArray(billingData.products)) {
            products = billingData.products.filter(product => 
                product && 
                product.name && 
                typeof product.quantity === 'number' && 
                typeof product.price === 'number'
            ).map(product => ({
                id: product.id || null, // Restore ID if available
                name: product.name,
                quantity: product.quantity,
                price: product.price
            }));
        } else {
            products = [];
        }
        
        // Restore discount rate (default to 0 if invalid)
        const discountRate = parseFloat(billingData.discountRate);
        if (!isNaN(discountRate) && discountRate >= 0 && discountRate <= 100) {
            discountRateInput.value = discountRate;
        } else {
            discountRateInput.value = 0;
        }
        
        // Restore tax rate (default to 0 if invalid)
        const taxRate = parseFloat(billingData.taxRate);
        if (!isNaN(taxRate) && taxRate >= 0 && taxRate <= 100) {
            taxRateInput.value = taxRate;
        } else {
            taxRateInput.value = 18;
        }
        
        // Update the UI to reflect the loaded data
        filterAndDisplayProducts();
        calculateTotals();
        
        console.log('Billing data loaded from localStorage:', billingData);
    } catch (error) {
        // Handle errors (e.g., corrupted JSON data, localStorage disabled)
        console.error('Error loading billing data from localStorage:', error);
        // Clear corrupted data and start fresh
        localStorage.removeItem(STORAGE_KEY);
        alert('Unable to load saved billing data. Starting with a fresh bill.');
    }
}

/**
 * Clear Bill Function
 * 
 * This function completely clears the billing system by:
 * 1. Clearing the products array
 * 2. Resetting discount rate to 0
 * 3. Resetting tax rate to 0
 * 4. Clearing the search input
 * 5. Clearing localStorage to remove saved data
 * 6. Refreshing the UI to show empty state
 * 
 * The user is prompted for confirmation before clearing to prevent
 * accidental data loss.
 */
function clearBill() {
    // Ask for confirmation before clearing
    if (confirm('Are you sure you want to clear the entire bill? All items will be returned to catalog stock.')) {
        // Restore stock to catalog for all products in cart
        products.forEach(product => {
            const catalogItem = catalog.find(item => item.id === product.id);
            if (catalogItem) {
                catalogItem.stock += product.quantity;
                // If stock was restored and > 0, mark as in stock
                if (catalogItem.stock > 0) {
                    catalogItem.inStock = true;
                }
            }
        });
        
        // Save updated catalog
        saveCatalog();
        displayCatalog(); // Refresh catalog display
        
        // Clear the products array
        products = [];
        
        // Reset discount and tax rates (tax rate defaults to 18%)
        discountRateInput.value = 0;
        taxRateInput.value = 18;
        
        // Clear search input
        searchInput.value = '';
        
        // Clear editing state
        editingIndex = -1;
        
        // Remove saved data from localStorage
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('Billing data cleared from localStorage');
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
        
        // Refresh the UI to show empty state
        filterAndDisplayProducts();
        calculateTotals();
        
        console.log('Bill cleared successfully - stock restored to catalog');
    }
}

// Attach event listener to clear bill button
clearBillBtn.addEventListener('click', clearBill);

// ============================================
// Catalog Editing Functions
// ============================================

/**
 * Open Catalog Edit Modal
 * 
 * Opens the modal for editing the product catalog.
 * Users can add, remove, or mark products as out of stock.
 */
function openCatalogEditModal() {
    displayCatalogEditList();
    catalogEditModal.classList.remove('hidden');
}

/**
 * Close Catalog Edit Modal
 */
function closeCatalogEditModalFunc() {
    catalogEditModal.classList.add('hidden');
    // Reload catalog to discard unsaved changes
    loadCatalog();
}

/**
 * Display Catalog Edit List
 * 
 * Renders all catalog items in edit mode, allowing users to:
 * - Edit product details
 * - Mark items as out of stock
 * - Delete items
 */
/**
 * Display Catalog Edit List as a Table
 * 
 * Shows all products in a properly labeled table format for easy editing.
 * Each row can be edited directly, and products can be removed.
 */
function displayCatalogEditList() {
    // Clear existing content
    catalogEditList.innerHTML = '';
    
    // Create table structure
    const table = document.createElement('table');
    table.className = 'catalog-edit-table';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Price (₹)</th>
            <th>Stock</th>
            <th>Actions</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    catalog.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = 'catalog-edit-row';
        row.innerHTML = `
            <td>
                <input type="text" class="edit-product-id" value="${escapeHtml(item.id)}" placeholder="Product ID">
            </td>
            <td>
                <input type="text" class="edit-product-name" value="${escapeHtml(item.name)}" placeholder="Product Name">
            </td>
            <td>
                <input type="number" class="edit-product-price" value="${item.price}" min="0" step="0.01" placeholder="Price">
            </td>
            <td>
                <input type="number" class="edit-product-stock" value="${item.stock}" min="0" placeholder="Stock">
            </td>
            <td>
                <button class="btn btn-delete" onclick="removeCatalogItem(${index})">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    catalogEditList.appendChild(table);
}

/**
 * Save Catalog Changes
 * 
 * Saves all changes made to the catalog in edit mode.
 * Updates the catalog array and saves to localStorage.
 */
function saveCatalogChanges() {
    const editRows = catalogEditList.querySelectorAll('.catalog-edit-row');
    const newCatalog = [];
    
    editRows.forEach(row => {
        const id = row.querySelector('.edit-product-id').value.trim();
        const name = row.querySelector('.edit-product-name').value.trim();
        const price = parseFloat(row.querySelector('.edit-product-price').value) || 0;
        let stock = parseInt(row.querySelector('.edit-product-stock').value) || 0;
        
        // Fix: Ensure stock never goes negative - set to 0 if negative
        if (stock < 0) {
            stock = 0;
        }
        
        // Auto-manage inStock: stock = 0 means out of stock, stock > 0 means in stock
        // No checkbox needed - automatically managed based on quantity
        const inStock = stock > 0;
        
        if (id && name && price >= 0) {
            newCatalog.push({ id, name, price, stock, inStock });
        }
    });
    
    catalog = newCatalog;
    saveCatalog();
    displayCatalog();
    closeCatalogEditModalFunc();
}

/**
 * Remove Catalog Item
 */
function removeCatalogItem(index) {
    if (confirm('Are you sure you want to remove this product from catalog?')) {
        catalog.splice(index, 1);
        displayCatalogEditList();
    }
}

/**
 * Open Add New Product Modal
 */
function openAddProductModal() {
    newProductForm.reset();
    addProductFormModal.classList.remove('hidden');
}

/**
 * Close Add New Product Modal
 */
function closeAddProductModalFunc() {
    addProductFormModal.classList.add('hidden');
}

/**
 * Save New Product to Catalog
 */
function saveNewProduct() {
    const id = document.getElementById('newProductId').value.trim();
    const name = document.getElementById('newProductName').value.trim();
    const price = parseFloat(document.getElementById('newProductPrice').value) || 0;
    let stock = parseInt(document.getElementById('newProductStock').value) || 0;
    
    // Validate
    if (!id || !name || price < 0) {
        alert('Please fill in all required fields with valid values.');
        return;
    }
    
    // Fix: Ensure stock never goes negative - set to 0 if negative
    if (stock < 0) {
        stock = 0;
    }
    
    // Check if ID already exists
    if (catalog.find(item => item.id === id)) {
        alert('Product ID already exists. Please use a different ID.');
        return;
    }
    
    // Auto-manage inStock: stock = 0 means out of stock, stock > 0 means in stock
    const inStock = stock > 0;
    
    // Add to catalog
    catalog.push({ id, name, price, stock, inStock });
    saveCatalog();
    displayCatalog();
    closeAddProductModalFunc();
    
    // Refresh edit list if modal is open
    if (!catalogEditModal.classList.contains('hidden')) {
        displayCatalogEditList();
    }
}

// Attach catalog edit event listeners
editCatalogBtn.addEventListener('click', openCatalogEditModal);
closeCatalogModal.addEventListener('click', closeCatalogEditModalFunc);
cancelCatalogEditBtn.addEventListener('click', closeCatalogEditModalFunc);
saveCatalogBtn.addEventListener('click', saveCatalogChanges);
addNewCatalogItemBtn.addEventListener('click', openAddProductModal);
closeAddProductModal.addEventListener('click', closeAddProductModalFunc);
cancelNewProductBtn.addEventListener('click', closeAddProductModalFunc);
saveNewProductBtn.addEventListener('click', saveNewProduct);

// Close modals when clicking outside
catalogEditModal.addEventListener('click', function(e) {
    if (e.target === catalogEditModal) {
        closeCatalogEditModalFunc();
    }
});

addProductFormModal.addEventListener('click', function(e) {
    if (e.target === addProductFormModal) {
        closeAddProductModalFunc();
    }
});

// ============================================
// Initialize Application
// ============================================

/**
 * Initialize the application on page load
 */
function init() {
    // Load product catalog from localStorage first
    // The catalog contains all available products that can be added to the invoice
    loadCatalog();
    
    // Load saved billing data from localStorage
    // This restores the previous bill state (cart items, discount, tax)
    loadBillingData();
    
    // Update invoice date display
    updateInvoiceDate();
    
    // Note: filterAndDisplayProducts() and calculateTotals() are already
    // called inside loadBillingData(), but we call them here as well
    // in case there's no saved data to ensure UI is initialized
    filterAndDisplayProducts();
    calculateTotals();
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);

