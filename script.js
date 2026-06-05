// Dom Element Elements
const invoiceForm = document.getElementById('invoice-form');
const formContainer = document.getElementById('form-container');
const actionButtons = document.getElementById('action-buttons');
const invoiceWrapper = document.getElementById('invoice-wrapper');
const itemInputsContainer = document.getElementById('item-inputs-container');
const addItemBtn = document.getElementById('add-item-btn');

// PDF & Excel Button Event Listeners
const btnDownload = document.getElementById('btn-download');
const btnDownloadExcel = document.getElementById('btn-download-excel');
const btnMenu = document.getElementById('btn-menu');

let invoiceItems = []; // Store multiple items

// Add initial item row - REMOVED TO PREVENT DUPLICATE
addItemRow();

addItemBtn.addEventListener('click', addItemRow);

function addItemRow() {
    const itemRowDiv = document.createElement('div');
    itemRowDiv.classList.add('item-row');
    itemRowDiv.innerHTML = `
        <div class="form-group">
            <label>Item Description:</label>
            <input type="text" class="input-item" placeholder="e.g., Web Development Services" required>
        </div>
        <div class="form-group">
            <label>Quantity:</label>
            <input type="number" class="input-qty" min="1" step="any" placeholder="0" required>
        </div>
        <div class="form-group">
            <label>Rate (PKR):</label>
            <input type="number" class="input-rate" min="0" step="any" placeholder="0" required>
        </div>
        <button type="button" class="btn-remove-item">Remove</button>
    `;
    itemInputsContainer.appendChild(itemRowDiv);

    itemRowDiv.querySelector('.btn-remove-item').addEventListener('click', function() {
        itemInputsContainer.removeChild(itemRowDiv);
    });
}

// Form Submitting Engine
invoiceForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Stop standard page refreshing

    invoiceItems = [];
    let totalAmount = 0;

    const itemRows = document.querySelectorAll('.item-row');
    itemRows.forEach(row => {
        const itemVal = row.querySelector('.input-item').value;
        const qtyVal = parseFloat(row.querySelector('.input-qty').value);
        const rateVal = parseFloat(row.querySelector('.input-rate').value);

        const calculatedAmount = qtyVal * rateVal;
        totalAmount += calculatedAmount;

        invoiceItems.push({
            item: itemVal,
            quantity: qtyVal,
            rate: rateVal,
            amount: calculatedAmount
        });
    });

    // Inject data inside preview spreadsheet slots
    document.getElementById('inv-date').innerText = formatDate(document.getElementById('input-date').value);

    const invoiceTableBody = document.getElementById('invoice-table-body');
    invoiceTableBody.innerHTML = ''; // Clear previous items

    invoiceItems.forEach(item => {
        const row = invoiceTableBody.insertRow();
        row.innerHTML = `
            <td class="text-left col-desc">${item.item}</td>
            <td class="text-center col-qty">${item.quantity}</td>
            <td class="text-right col-rate">${'PKR ' + item.rate.toLocaleString('en-PK', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
            <td class="text-right font-bold col-amount">${'PKR ' + item.amount.toLocaleString('en-PK', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
        `;
    });

    document.getElementById('inv-total').innerText = 'PKR ' + totalAmount.toLocaleString('en-PK', {minimumFractionDigits: 0, maximumFractionDigits: 0});

    // Adjust visibility screens
    formContainer.classList.add('hidden');
    actionButtons.classList.remove('hidden');
    invoiceWrapper.classList.remove('hidden');
});

// Download PDF Action Logic
btnDownload.addEventListener('click', function() {
    const element = document.getElementById('invoice-capture');

    const options = {
        margin:       0,
        filename:     `Invoice_${document.getElementById('inv-date').innerText.replace(/\//g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(element).save();
});

// Download Excel Action Logic
btnDownloadExcel.addEventListener('click', function() {
    if (invoiceItems.length === 0) {
        alert('Please generate an invoice first.');
        return;
    }
    const csvRows = [];
    const headers = ['Date', 'Item Description', 'Quantity', 'Rate (PKR)', 'Amount (PKR)'];
    csvRows.push(headers.join(','));

    const invoiceDate = formatDate(document.getElementById('input-date').value);

    invoiceItems.forEach(item => {
        const data = [
            invoiceDate,
            item.item,
            item.quantity,
            item.rate.toFixed(0), // Format rate to 0 decimal places
            item.amount.toFixed(0) // Format amount to 0 decimal places
        ];
        csvRows.push(data.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Invoice_${document.getElementById('inv-date').innerText.replace(/\//g, '-')}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Reset Menu Loop Logic
btnMenu.addEventListener('click', function() {
    invoiceForm.reset();
    itemInputsContainer.innerHTML = ''; // Clear all dynamic item rows
    addItemRow(); // Add back one empty item row
    formContainer.classList.remove('hidden');
    actionButtons.classList.add('hidden');
    invoiceWrapper.classList.add('hidden');
    invoiceItems = []; // Clear stored data
});

// Helper Function for parsing generic HTML Date components cleanly
function formatDate(dateString) {
    if(!dateString) return "";
    const parts = dateString.split('-');
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
}
