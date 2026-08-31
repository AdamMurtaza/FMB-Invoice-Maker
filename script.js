document.addEventListener('DOMContentLoaded', () => {
    const itemContainer = document.getElementById('item-inputs-container');
    const addItemBtn = document.getElementById('add-item-btn');
    const invoiceForm = document.getElementById('invoice-form');
    const dateInput = document.getElementById('input-date');

    const formContainer = document.getElementById('form-container');
    const actionButtons = document.getElementById('action-buttons');
    const invoiceWrapper = document.getElementById('invoice-wrapper');

    const btnDownload = document.getElementById('btn-download');
    const btnDownloadCsv = document.getElementById('btn-download-csv');
    const btnMenu = document.getElementById('btn-menu');

    let itemCount = 0;

    // 1. Set Default Date to Today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;

    // Add initial item input row
    addItemRow();

    addItemBtn.addEventListener('click', () => addItemRow());

    function addItemRow() {
        itemCount++;
        const row = document.createElement('div');
        row.className = 'item-row';
        row.id = `item-row-${itemCount}`;
        row.innerHTML = `
            <div class="item-row-header">
                <strong>Item #${itemCount}</strong>
                ${itemCount > 1 ? `<button type="button" class="btn-remove-item" onclick="removeItemRow('item-row-${itemCount}')">Delete</button>` : ''}
            </div>
            <div class="form-group" style="margin-bottom:8px;">
                <input type="text" class="item-desc" placeholder="Item description / details" required>
            </div>
            <div class="item-row-grid">
                <div class="form-group" style="margin-bottom:0;">
                    <label>Qty</label>
                    <input type="number" class="item-qty" min="1" value="1" required>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label>Rate</label>
                    <input type="number" class="item-rate" min="0" step="0.01" placeholder="0.00" required>
                </div>
            </div>
        `;
        itemContainer.appendChild(row);
    }

    window.removeItemRow = function(rowId) {
        const row = document.getElementById(rowId);
        if (row) row.remove();
    };

    // 2. Fixed Date Formatting Logic
    function formatDateString(rawDateStr) {
        if (!rawDateStr) return '';
        // Handles input type="date" value directly (YYYY-MM-DD)
        const parts = rawDateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            return `${day}/${month}/${year}`;
        }
        return rawDateStr;
    }

    // 3. Form Submit -> Render Preview
    invoiceForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Fix & update Date
        const rawDate = dateInput.value;
        document.getElementById('inv-date').innerText = formatDateString(rawDate);

        // Gather Items
        const tableBody = document.getElementById('invoice-table-body');
        tableBody.innerHTML = '';

        let grandTotal = 0;
        const rows = itemContainer.querySelectorAll('.item-row');

        rows.forEach(row => {
            const desc = row.querySelector('.item-desc').value;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const amount = qty * rate;

            grandTotal += amount;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="col-desc">${desc}</td>
                <td class="col-qty text-center">${qty}</td>
                <td class="col-rate text-right">${rate.toFixed(2)}</td>
                <td class="col-amount text-right">${amount.toFixed(2)}</td>
            `;
            tableBody.appendChild(tr);
        });

        document.getElementById('inv-total').innerText = grandTotal.toFixed(2);

        // UI View Switch
        formContainer.classList.add('hidden');
        actionButtons.classList.remove('hidden');
        invoiceWrapper.classList.remove('hidden');

        // Scroll to action controls
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 4. Return to Menu
    btnMenu.addEventListener('click', () => {
        invoiceWrapper.classList.add('hidden');
        actionButtons.classList.add('hidden');
        formContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 5. Download PDF
    btnDownload.addEventListener('click', () => {
        const element = document.getElementById('invoice-capture');
        const opt = {
            margin:       0,
            filename:     `Invoice_${dateInput.value}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    });

    // 6. Download CSV
    btnDownloadCsv.addEventListener('click', () => {
        const rows = itemContainer.querySelectorAll('.item-row');
        let csvContent = "data:text/csv;charset=utf-8,Description,Quantity,Rate,Amount\n";

        rows.forEach(row => {
            const desc = `"${row.querySelector('.item-desc').value.replace(/"/g, '""')}"`;
            const qty = row.querySelector('.item-qty').value;
            const rate = row.querySelector('.item-rate').value;
            const amount = (parseFloat(qty) * parseFloat(rate)).toFixed(2);
            csvContent += `${desc},${qty},${rate},${amount}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Invoice_${dateInput.value}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
