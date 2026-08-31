// ============================================
// DOM ELEMENT SELECTORS
// ============================================

const invoiceForm = document.getElementById('invoice-form');
const formContainer = document.getElementById('form-container');
const actionButtons = document.getElementById('action-buttons');
const invoiceWrapper = document.getElementById('invoice-wrapper');
const itemInputsContainer = document.getElementById('item-inputs-container');
const addItemBtn = document.getElementById('add-item-btn');

// PDF & CSV Button Event Listeners
const btnDownload = document.getElementById('btn-download');
const btnDownloadCsv = document.getElementById('btn-download-csv');
const btnMenu = document.getElementById('btn-menu');

const inputDateField = document.getElementById('input-date');

// ============================================
// STATE MANAGEMENT
// ============================================

let invoiceItems = [];
let currentInvoiceDate = '';

// ============================================
// INITIALIZATION
// ============================================

// Set today's date as default
function setDefaultDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    inputDateField.value = `${year}-${month}-${day}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDate();
    addItemRow();
});

// ============================================
// DATE HANDLING (FIXED)
// ============================================

/**
 * Format date from YYYY-MM-DD to MM/DD/YYYY
 * This fixes the date bug by properly handling the date conversion
 */
function formatDate(dateString) {
    if (!dateString || dateString.trim() === '') {
        return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    try {
        // Parse the date string
        const [year, month, day] = dateString.split('-');
        
        // Validate that we have all parts
        if (!year || !month || !day) {
            throw new Error('Invalid date format');
        }
        
        // Validate date values
        const parsedMonth = parseInt(month, 10);
        const parsedDay = parseInt(day, 10);
        const parsedYear = parseInt(year, 10);
        
        if (parsedMonth < 1 || parsedMonth > 12 || parsedDay < 1 || parsedDay > 31) {
            throw new Error('Invalid date values');
        }
        
        // Create date object to validate
        const dateObj = new Date(parsedYear, parsedMonth - 1, parsedDay);
        
        // Format as MM/DD/YYYY
        const formattedMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
        const formattedDay = String(dateObj.getDate()).padStart(2, '0');
        const formattedYear = dateObj.getFullYear();
        
        return `${formattedMonth}/${formattedDay}/${formattedYear}`;
    } catch (error) {
        console.error('Date formatting error:', error);
        return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
}

/**
 * Sanitize filename to remove special characters
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
}

// ============================================
// ITEM ROW MANAGEMENT
// ============================================

addItemBtn.addEventListener('click', addItemRow);

function addItemRow() {
    const itemRowDiv = document.createElement('div');
    itemRowDiv.classList.add('item-row');
    
    const itemId = Date.now(); // Unique ID for this row
    
    itemRowDiv.innerHTML = `
        <div class="form-group">
            <label>Item Description *</label>
            <input type="text" class="input-item" placeholder="e.g., Web Development" required>
        </div>
        <div class="form-group">
            <label>Quantity *</label>
            <input type="number" class="input-qty" min="1" step="0.01" placeholder="1" value="1" required>
        </div>
        <div class="form-group">
            <label>Rate (PKR) *</label>
            <input type="number" class="input-rate" min="0" step="0.01" placeholder="0" required>
        </div>
        <button type="button" class="btn-remove-item" aria-label="Remove this item">✕</button>
    `;
    
    itemInputsContainer.appendChild(itemRowDiv);

    // Remove button event listener
    itemRowDiv.querySelector('.btn-remove-item').addEventListener('click', function(e) {
        e.preventDefault();
        const totalRows = document.querySelectorAll('.item-row').length;
        
        if (totalRows > 1) {
            itemRowDiv.style.animation = 'slideInUp 0.3s ease-out reverse';
            setTimeout(() => {
                itemInputsContainer.removeChild(itemRowDiv);
            }, 300);
        } else {
            alert('❗ An invoice must have at least one item.');
        }
    });

    // Animate new row
    itemRowDiv.style.animation = 'slideInUp 0.3s ease-out';
}

// ============================================
// FORM SUBMISSION & INVOICE GENERATION
// ============================================

invoiceForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Reset state
    invoiceItems = [];
    let totalAmount = 0;
    let hasError = false;

    // Get the date
    const dateValue = inputDateField.value;
    if (!dateValue) {
        alert('❗ Please select a date.');
        return;
    }

    currentInvoiceDate = formatDate(dateValue);

    // Collect items
    const itemRows = document.querySelectorAll('.item-row');
    
    if (itemRows.length === 0) {
        alert('❗ Please add at least one item.');
        return;
    }

    itemRows.forEach((row, index) => {
        try {
            const itemVal = row.querySelector('.input-item').value.trim();
            const qtyVal = parseFloat(row.querySelector('.input-qty').value) || 0;
            const rateVal = parseFloat(row.querySelector('.input-rate').value) || 0;

            // Validate
            if (!itemVal) {
                alert(`❗ Item ${index + 1}: Please enter a description.`);
                hasError = true;
                return;
            }

            if (qtyVal <= 0) {
                alert(`❗ Item ${index + 1}: Quantity must be greater than 0.`);
                hasError = true;
                return;
            }

            if (rateVal < 0) {
                alert(`❗ Item ${index + 1}: Rate cannot be negative.`);
                hasError = true;
                return;
            }

            const calculatedAmount = qtyVal * rateVal;
            totalAmount += calculatedAmount;

            invoiceItems.push({
                item: itemVal,
                quantity: qtyVal,
                rate: rateVal,
                amount: calculatedAmount
            });
        } catch (error) {
            console.error('Error processing item:', error);
            alert(`❗ Error processing item ${index + 1}. Please check your input.`);
            hasError = true;
        }
    });

    if (hasError) return;

    // Update invoice preview
    updateInvoicePreview(totalAmount);

    // Show preview and action buttons
    formContainer.classList.add('hidden');
    actionButtons.classList.remove('hidden');
    invoiceWrapper.classList.remove('hidden');

    // Scroll to preview (smooth scroll for better UX)
    setTimeout(() => {
        invoiceWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
});

/**
 * Update the invoice preview with current data
 */
function updateInvoicePreview(totalAmount) {
    // Update date display
    const dateSpan = document.getElementById('inv-date');
    dateSpan.textContent = currentInvoiceDate;

    // Update invoice table
    const invoiceTableBody = document.getElementById('invoice-table-body');
    invoiceTableBody.innerHTML = '';

    invoiceItems.forEach((item, index) => {
        const row = invoiceTableBody.insertRow();
        row.style.animation = `slideInUp 0.3s ease-out ${index * 0.05}s both`;
        
        const formattedRate = formatCurrency(item.rate);
        const formattedAmount = formatCurrency(item.amount);

        row.innerHTML = `
            <td class="text-left col-desc">${escapeHtml(item.item)}</td>
            <td class="text-center col-qty">${formatNumber(item.quantity)}</td>
            <td class="text-right col-rate">${formattedRate}</td>
            <td class="text-right font-bold col-amount">${formattedAmount}</td>
        `;
    });

    // Update total
    const totalSpan = document.getElementById('inv-total');
    totalSpan.textContent = formatCurrency(totalAmount);
}

// ============================================
// NUMBER & CURRENCY FORMATTING
// ============================================

/**
 * Format number for display (handles decimals properly)
 */
function formatNumber(num) {
    if (typeof num !== 'number') {
        num = parseFloat(num) || 0;
    }
    
    // Show decimals only if necessary
    if (Number.isInteger(num)) {
        return num.toLocaleString('en-PK');
    }
    return num.toLocaleString('en-PK', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

/**
 * Format as Pakistani currency (PKR)
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    
    return 'PKR ' + amount.toLocaleString('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// PDF DOWNLOAD
// ============================================

btnDownload.addEventListener('click', downloadPDF);

function downloadPDF() {
    try {
        if (invoiceItems.length === 0) {
            alert('❗ No invoice to download. Please generate one first.');
            return;
        }

        // Disable button during download
        btnDownload.disabled = true;
        btnDownload.textContent = '⏳ Generating...';

        const element = document.getElementById('invoice-capture');
        const filename = `Invoice_${sanitizeFilename(currentInvoiceDate)}.pdf`;

        // Enhanced options for better PDF quality
        const options = {
            margin: 0,
            filename: filename,
            image: { 
                type: 'jpeg', 
                quality: 1.0 
            },
            html2canvas: { 
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { 
                mode: ['avoid-all', 'css'] 
            }
        };

        // Generate and save PDF
        html2pdf()
            .set(options)
            .from(element)
            .save()
            .then(() => {
                btnDownload.disabled = false;
                btnDownload.innerHTML = '<span class="btn-icon">⬇</span> Download PDF';
                showNotification('✓ PDF downloaded successfully!');
            })
            .catch((error) => {
                console.error('PDF generation error:', error);
                btnDownload.disabled = false;
                btnDownload.innerHTML = '<span class="btn-icon">⬇</span> Download PDF';
                alert('❗ Error generating PDF. Please try again.');
            });

    } catch (error) {
        console.error('Download error:', error);
        alert('❗ An error occurred while downloading the PDF.');
        btnDownload.disabled = false;
        btnDownload.innerHTML = '<span class="btn-icon">⬇</span> Download PDF';
    }
}

// ============================================
// CSV DOWNLOAD
// ============================================

btnDownloadCsv.addEventListener('click', downloadCSV);

function downloadCSV() {
    try {
        if (invoiceItems.length === 0) {
            alert('❗ No invoice to download. Please generate one first.');
            return;
        }

        const csvRows = [];
        
        // Add header
        const headers = ['Date', 'Item Description', 'Quantity', 'Rate (PKR)', 'Amount (PKR)'];
        csvRows.push(headers.map(h => `"${h}"`).join(','));

        // Add items
        invoiceItems.forEach(item => {
            const row = [
                `"${currentInvoiceDate}"`,
                `"${item.item.replace(/"/g, '""')}"`, // Escape quotes in CSV
                item.quantity.toString(),
                item.rate.toFixed(2),
                item.amount.toFixed(2)
            ];
            csvRows.push(row.join(','));
        });

        // Add total row
        const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
        csvRows.push(['', '', '', 'TOTAL', totalAmount.toFixed(2)]);

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `Invoice_${sanitizeFilename(currentInvoiceDate)}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('✓ CSV downloaded successfully!');

    } catch (error) {
        console.error('CSV download error:', error);
        alert('❗ Error downloading CSV. Please try again.');
    }
}

// ============================================
// RESET / MENU BUTTON
// ============================================

btnMenu.addEventListener('click', returnToMenu);

function returnToMenu() {
    // Reset form
    invoiceForm.reset();
    setDefaultDate();
    
    // Clear items
    itemInputsContainer.innerHTML = '';
    invoiceItems = [];
    currentInvoiceDate = '';
    
    // Add one empty item row
    addItemRow();
    
    // Update visibility
    formContainer.classList.remove('hidden');
    actionButtons.classList.add('hidden');
    invoiceWrapper.classList.add('hidden');
    
    // Reset buttons
    btnDownload.disabled = false;
    btnDownloadCsv.disabled = false;
    btnDownload.innerHTML = '<span class="btn-icon">⬇</span> Download PDF';
    
    // Scroll to top
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show a temporary notification
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #90ee90 0%, #32cd32 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(50, 205, 50, 0.4);
        z-index: 9999;
        animation: slideInUp 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInUp 0.3s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!formContainer.classList.contains('hidden')) {
            invoiceForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to return to menu
    if (e.key === 'Escape' && !actionButtons.classList.contains('hidden')) {
        returnToMenu();
    }
});

// ============================================
// CONSOLE MESSAGE
// ============================================

console.log('%cInvoice Generator Loaded! 📄', 'font-size: 16px; color: #6495ed; font-weight: bold;');
console.log('%cVersion: 2.0 - Mobile Optimized', 'color: #ff69b4;');
