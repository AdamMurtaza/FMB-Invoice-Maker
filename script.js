// Dom Element Elements
const invoiceForm = document.getElementById('invoice-form');
const formContainer = document.getElementById('form-container');
const actionButtons = document.getElementById('action-buttons');
const invoiceWrapper = document.getElementById('invoice-wrapper');

// PDF Button Event Listeners
const btnDownload = document.getElementById('btn-download');
const btnMenu = document.getElementById('btn-menu');

// Form Submitting Engine
invoiceForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Stop standard page refreshing

    // Grab Input values
    const dateVal = document.getElementById('input-date').value;
    const itemVal = document.getElementById('input-item').value;
    const qtyVal = parseFloat(document.getElementById('input-qty').value);
    const rateVal = parseFloat(document.getElementById('input-rate').value);

    // Run Calculations ($ Amount = Qty * Rate)
    const calculatedAmount = qtyVal * rateVal;

    // Inject data inside preview spreadsheet slots
    document.getElementById('inv-date').innerText = formatDate(dateVal);
    document.getElementById('inv-item').innerText = itemVal;
    document.getElementById('inv-qty').innerText = qtyVal;
    document.getElementById('inv-rate').innerText = '$' + rateVal.toFixed(2);
    document.getElementById('inv-amount').innerText = '$' + calculatedAmount.toFixed(2);
    document.getElementById('inv-total').innerText = '$' + calculatedAmount.toFixed(2);

    // Adjust visibility screens
    formContainer.classList.add('hidden');
    actionButtons.classList.remove('hidden');
    invoiceWrapper.classList.remove('hidden');
});

// Download Action Logic
btnDownload.addEventListener('click', function() {
    const element = document.getElementById('invoice-capture');
    
    // Set custom rendering configurations for clean PDF framing
    const options = {
        margin:       0,
        filename:     `Invoice_${document.getElementById('inv-date').innerText}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Execute generation pipeline
    html2pdf().set(options).from(element).save();
});

// Reset Menu Loop Logic
btnMenu.addEventListener('click', function() {
    // Reset structural HTML forms
    invoiceForm.reset();

    // Toggle screen configurations back 
    formContainer.classList.remove('hidden');
    actionButtons.classList.add('hidden');
    invoiceWrapper.classList.add('hidden');
});

// Helper Function for parsing generic HTML Date components cleanly
function formatDate(dateString) {
    if(!dateString) return "";
    const parts = dateString.split('-');
    return `${parts[1]}/${parts[2]}/${parts[0]}`; // Formats to MM/DD/YYYY
}
