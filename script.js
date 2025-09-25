// Function to create and append the confirmation modal to the body
const modal = document.createElement('div');
modal.id = 'confirmation-modal';
modal.className = 'modal';
modal.innerHTML = `
    <div class="modal-content">
        <p id="modal-message"></p>
        <div class="modal-buttons">
            <button class="btn btn-danger" id="modal-confirm-btn">Yes</button>
            <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(modal);

// Create the monthly expenses modal dynamically
const expensesModal = document.createElement('div');
expensesModal.id = 'expenses-modal';
expensesModal.className = 'modal';
expensesModal.innerHTML = `
    <div class="modal-content">
        <h3 id="expenses-modal-title"></h3>
        <div class="table-container">
            <table id="monthly-expense-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody id="monthly-expense-body">
                </tbody>
            </table>
        </div>
        <div class="modal-buttons" style="margin-top: 2rem;">
            <button class="btn btn-secondary" id="expenses-modal-close-btn">Close</button>
        </div>
    </div>
`;
document.body.appendChild(expensesModal);

const modalMessage = document.getElementById('modal-message');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
let confirmCallback = null;

function showCustomConfirmation(message, callback) {
    modalMessage.textContent = message;
    modal.classList.add('active');
    confirmCallback = callback;
    modalConfirmBtn.style.display = 'inline-flex';
    modalCancelBtn.style.display = 'inline-flex';
}

function showCustomAlert(message) {
    modalMessage.textContent = message;
    modal.classList.add('active');
    modalConfirmBtn.style.display = 'none';
    modalCancelBtn.style.display = 'none';
    const okBtn = document.createElement('button');
    okBtn.className = 'btn';
    okBtn.textContent = 'OK';
    okBtn.onclick = () => {
        modal.classList.remove('active');
        okBtn.remove();
    };
    document.querySelector('.modal-buttons').appendChild(okBtn);
}

modalConfirmBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    if (confirmCallback) {
        confirmCallback(true);
        confirmCallback = null;
    }
});

modalCancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    if (confirmCallback) {
        confirmCallback(false);
        confirmCallback = null;
    }
});

// Close expenses modal
document.getElementById('expenses-modal-close-btn').addEventListener('click', () => {
    expensesModal.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar Navigation Logic ---
    const hamburger = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('content-overlay');
    const dropdownLinks = document.querySelectorAll('.sidebar .dropdown > .nav-link');

    function closeMenu() {
        hamburger.classList.remove('active');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', closeMenu);

    dropdownLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = link.parentElement;
            dropdown.classList.toggle('open');
        });
    });

    // --- Page-Specific Logic (Corrected) ---
    if (document.getElementById('workChart')) {
        loadHomePageData();
    }
    if (document.getElementById('work-form')) {
        setupWorkForm();
    }
    if (document.getElementById('work-list-body')) {
        loadWorkList();
        document.getElementById('download-pdf').addEventListener('click', downloadWorkReport);
        document.getElementById('delete-selected-btn').addEventListener('click', deleteSelectedWorks);
        document.getElementById('select-all-checkbox').addEventListener('change', toggleSelectAll);
    }
    if (document.getElementById('note-form')) {
        setupNoteForm();
    }
    if (document.getElementById('notes-container')) {
        loadNotes();
        document.getElementById('download-all-notes-btn').addEventListener('click', downloadAllNotes);
    }
    if (document.getElementById('payment-list-container')) {
        loadPaymentsPage();
        loadPaymentHistory();
        document.getElementById('reset-payments-btn').addEventListener('click', manualResetMonthlyPayments);
    }
    if (document.getElementById('expense-form')) {
        document.getElementById('expense-form').addEventListener('submit', handleExpenseFormSubmit);
    }
    if (document.getElementById('expense-list-body')) {
        loadExpenses();
        document.getElementById('download-expenses-pdf').addEventListener('click', downloadExpenseReport);
        document.getElementById('filter-btn').addEventListener('click', filterExpenses);
        document.getElementById('clear-filter-btn').addEventListener('click', clearFilter);
    }
});

// --- DATA STORAGE FUNCTIONS ---
const getWorks = () => JSON.parse(localStorage.getItem('works')) || [];
const saveWorks = (works) => localStorage.setItem('works', JSON.stringify(works));
const getNotes = () => JSON.parse(localStorage.getItem('notes')) || [];
const saveNotes = (notes) => localStorage.setItem('notes', JSON.stringify(notes));
const getExpenses = () => JSON.parse(localStorage.getItem('expenses')) || [];
const saveExpenses = (expenses) => localStorage.setItem('expenses', JSON.stringify(expenses));

// --- MONTHLY PAYMENTS LOGIC ---
const initialPayers = [
    { name: 'Swaminath', amount: 500 },
    { name: 'Ryan', amount: 500 },
    { name: 'Daheem', amount: 500 },
    { name: 'Nikhil', amount: 500 },
    { name: 'Edwin', amount: 500 },
    { name: 'Amarjith', amount: 500 }
];

const getPayers = () => JSON.parse(localStorage.getItem('payers')) || initialPayers;
const savePayers = (payers) => localStorage.setItem('payers', JSON.stringify(payers));

const getMonthlyPayments = () => {
    let payments = JSON.parse(localStorage.getItem('monthlyPayments'));
    const payers = getPayers();
    if (!payments || payments.length !== payers.length) {
        return payers.map(p => ({ ...p, isPaid: false, paidDate: null }));
    }
    return payments;
};
const saveMonthlyPayments = (payments) => localStorage.setItem('monthlyPayments', JSON.stringify(payments));
const getPaymentHistory = () => JSON.parse(localStorage.getItem('paymentHistory')) || [];
const savePaymentHistory = (history) => localStorage.setItem('paymentHistory', JSON.stringify(history));

function loadPaymentsPage() {
    const payments = getMonthlyPayments();
    const container = document.getElementById('payment-list-container');
    container.innerHTML = '';

    payments.forEach((payer, index) => {
        const li = document.createElement('li');
        li.className = 'payment-list-item';
        const statusClass = payer.isPaid ? 'paid' : 'unpaid';
        let statusText = payer.isPaid ? 'Paid' : 'Unpaid';
        
        if (payer.isPaid && payer.paidDate) {
            statusText += ` on ${new Date(payer.paidDate).toLocaleDateString()}`;
        }
        
        let actionButtons = '';
        if (!payer.isPaid) {
            actionButtons += `<button class="btn btn-paid" onclick="markPersonAsPaid('${payer.name}')">Mark Paid</button>`;
        }

        li.innerHTML = `
            <div class="payment-info">
                <span class="payment-name">${payer.name}</span>
                <span class="payment-amount">Premium: ₹${payer.amount}</span>
            </div>
            <div class="payment-actions">
                <span class="payment-status ${statusClass}">${statusText}</span>
                ${actionButtons}
            </div>
        `;
        container.appendChild(li);
    });
}

function markPersonAsPaid(name) {
    let payments = getMonthlyPayments();
    const personIndex = payments.findIndex(p => p.name === name);
    if (personIndex > -1) {
        payments[personIndex].isPaid = true;
        payments[personIndex].paidDate = new Date().toISOString();
        saveMonthlyPayments(payments);

        const allPaid = payments.every(p => p.isPaid);
        if (allPaid) {
            showCustomAlert('All payments for the month are complete! Archiving and resetting for the new month.');
            archiveAndResetPayments(false);
        } else {
            loadPaymentsPage();
        }
    }
}

function manualResetMonthlyPayments() {
    showCustomConfirmation('Are you sure you want to reset for a new month? This will archive the current data and mark everyone as unpaid.', (result) => {
        if (result) {
            archiveAndResetPayments(true);
        }
    });
}

function archiveAndResetPayments(isManualReset) {
    const currentPayments = getMonthlyPayments();
    const history = getPaymentHistory();
    const archiveDate = new Date();
    const monthYear = `${archiveDate.toLocaleString('default', { month: 'long' })} ${archiveDate.getFullYear()}`;
    
    history.push({ date: monthYear, data: currentPayments });
    savePaymentHistory(history);

    const payers = getPayers();
    const newPayments = payers.map(p => ({ ...p, isPaid: false, paidDate: null }));
    saveMonthlyPayments(newPayments);

    if (isManualReset) {
        showCustomAlert(`Payments for ${monthYear} have been archived. The list is now reset for the new month.`);
    }
    
    loadPaymentsPage();
    loadPaymentHistory();
}

function loadPaymentHistory() {
    const history = getPaymentHistory().reverse();
    const container = document.getElementById('payment-history-container');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = '<p>No payment history has been archived yet.</p>';
        return;
    }

    history.forEach((archive, index) => {
        const detailsElement = document.createElement('details');
        detailsElement.className = 'payment-history-item';
        const summaryElement = document.createElement('summary');
        
        const summaryText = document.createElement('span');
        summaryText.textContent = archive.date;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete-history';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        const originalIndex = history.length - 1 - index;
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            showCustomConfirmation('Are you sure you want to permanently delete this history entry?', (result) => {
                if (result) {
                    deletePaymentHistory(originalIndex);
                }
            });
        };

        summaryElement.appendChild(summaryText);
        summaryElement.appendChild(deleteBtn);
        
        const ul = document.createElement('ul');
        ul.className = 'payment-history-details';

        archive.data.forEach(payer => {
            const li = document.createElement('li');
            const iconClass = payer.isPaid ? 'fas fa-check-circle paid' : 'fas fa-times-circle unpaid';
            
            let paidDateText = '';
            if (payer.isPaid && payer.paidDate) {
                paidDateText = `<span class="paid-date">(${new Date(payer.paidDate).toLocaleDateString()})</span>`;
            }

            li.innerHTML = `
                <span class="name">${payer.name}</span>
                <div class="history-status">
                    <span class="status-icon ${iconClass}"></span>
                    ${paidDateText}
                </div>
            `;
            ul.appendChild(li);
        });

        detailsElement.appendChild(summaryElement);
        detailsElement.appendChild(ul);
        container.appendChild(detailsElement);
    });
}

function deletePaymentHistory(index) {
    let history = getPaymentHistory();
    history.splice(index, 1);
    savePaymentHistory(history);
    loadPaymentHistory();
}


// --- HOME PAGE LOGIC ---
function loadHomePageData() {
    const works = getWorks();
    const notes = getNotes();
    const paymentHistory = getPaymentHistory();
    const currentPayments = getMonthlyPayments();
    const expenses = getExpenses();

    const totalAmount = works.filter(work => work.status === 'paid').reduce((sum, work) => sum + parseFloat(work.amount), 0);
    document.getElementById('total-amount').textContent = `₹${totalAmount.toFixed(2)}`;
    const upcomingWorkList = document.getElementById('upcoming-work-list');
    const today = new Date().toISOString().split('T')[0];
    const upcomingWorks = works.filter(work => work.date > today).sort((a, b) => new Date(a.date) - new Date(b.date));
    upcomingWorkList.innerHTML = '';
    if (upcomingWorks.length > 0) {
        upcomingWorks.forEach(work => {
            const li = document.createElement('li');
            li.textContent = `${work.date}: ${work.type} at ${work.location}`;
            upcomingWorkList.appendChild(li);
        });
    } else {
        upcomingWorkList.innerHTML = '<li>No upcoming work scheduled.</li>';
    }
    
    const todayExpenses = expenses
        .filter(exp => exp.date === today)
        .reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('today-expenses').textContent = `₹${todayExpenses.toFixed(2)}`;

    loadRecentExpenses();

    const payments = getMonthlyPayments();
    const paymentSummaryContainer = document.getElementById('monthly-payments-summary');
    paymentSummaryContainer.innerHTML = '';
    payments.forEach(payer => {
        const li = document.createElement('li');
        li.className = 'payment-summary-item';
        const iconClass = payer.isPaid ? 'fas fa-check-circle paid' : 'fas fa-times-circle unpaid';
        li.innerHTML = `<span class="name">${payer.name}</span><span class="status-icon ${iconClass}"></span>`;
        paymentSummaryContainer.appendChild(li);
    });

    const monthlyData = getMonthlyData(works, paymentHistory, currentPayments, expenses);
    renderWorkChart(monthlyData.sortedMonths, monthlyData.monthlyEarnings, monthlyData.monthlyExpenses);
    displayMonthlySummary(monthlyData.sortedMonths, monthlyData.monthlyEarnings, monthlyData.monthlyExpenses);
}

function loadRecentExpenses() {
    const expenses = getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentExpensesList = document.getElementById('recent-expenses-list');
    recentExpensesList.innerHTML = '';
    const recent = expenses.slice(0, 5);

    if (recent.length > 0) {
        recent.forEach(exp => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="expense-item-info">
                    <span class="expense-date">${exp.date}</span>
                    <span class="expense-description">${exp.description}</span>
                </div>
                <span class="expense-amount">₹${exp.amount.toFixed(2)}</span>
            `;
            recentExpensesList.appendChild(li);
        });
    } else {
        recentExpensesList.innerHTML = '<li>No recent expenses found.</li>';
    }
}

function getMonthlyData(works, paymentHistory, currentPayments, expenses) {
    const monthlyEarnings = {};
    const monthlyExpenses = {};

    const paidWorks = works.filter(work => work.status === 'paid' && work.paidDate);
    paidWorks.forEach(work => {
        const dateToUse = new Date(work.paidDate);
        const month = dateToUse.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyEarnings[month]) {
            monthlyEarnings[month] = 0;
        }
        monthlyEarnings[month] += parseFloat(work.amount);
    });
    
    const now = new Date();
    const currentMonthYear = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    const allPayments = [...paymentHistory, { date: currentMonthYear, data: currentPayments }];

    allPayments.forEach(archive => {
        const month = archive.date;
        archive.data.forEach(payer => {
            if (payer.isPaid) {
                if (!monthlyEarnings[month]) {
                    monthlyEarnings[month] = 0;
                }
                monthlyEarnings[month] += parseFloat(payer.amount);
            }
        });
    });

    expenses.forEach(exp => {
        const dateToUse = new Date(exp.date);
        const month = dateToUse.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyExpenses[month]) { monthlyExpenses[month] = 0; }
        monthlyExpenses[month] += exp.amount;
    });

    const allMonths = [...new Set([...Object.keys(monthlyEarnings), ...Object.keys(monthlyExpenses)])];
    const sortedMonths = allMonths.sort((a, b) => new Date(a) - new Date(b));
    
    return { sortedMonths, monthlyEarnings, monthlyExpenses };
}

function renderWorkChart(sortedMonths, monthlyEarnings, monthlyExpenses) {
    const ctx = document.getElementById('workChart').getContext('2d');
    const earningsData = sortedMonths.map(month => monthlyEarnings[month] || 0);
    const expensesData = sortedMonths.map(month => monthlyExpenses[month] || 0);

    const existingChart = Chart.getChart('workChart');
    if (existingChart) {
        existingChart.destroy();
    }
    
    Chart.register(ChartDataLabels);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [
                {
                    label: 'Total Monthly Earnings (₹)',
                    data: earningsData,
                    backgroundColor: 'rgba(74, 144, 226, 0.6)',
                    borderColor: 'rgba(74, 144, 226, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                    datalabels: {
                        color: 'white'
                    }
                },
                {
                    label: 'Total Monthly Expenses (₹)',
                    data: expensesData,
                    backgroundColor: 'rgba(220, 53, 69, 0.6)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                    datalabels: {
                        color: 'white'
                    }
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => '₹' + value }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    enabled: true
                },
                datalabels: {
                    display: true,
                    align: 'end',
                    anchor: 'end',
                    formatter: (value) => `₹${value.toFixed(2)}`,
                    font: {
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

function showMonthlyExpenses(month) {
    const allExpenses = getExpenses();
    const monthlyExpenses = allExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        const expMonth = expDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        return expMonth === month;
    });

    const tableBody = document.getElementById('monthly-expense-body');
    tableBody.innerHTML = '';
    
    if (monthlyExpenses.length > 0) {
        monthlyExpenses.forEach(exp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${exp.date}</td>
                <td>${exp.description}</td>
                <td>₹${exp.amount.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="3">No expenses for this month.</td></tr>';
    }

    document.getElementById('expenses-modal-title').textContent = `Expenses for ${month}`;
    expensesModal.classList.add('active');
}

function displayMonthlySummary(sortedMonths, monthlyEarnings, monthlyExpenses) {
    const container = document.getElementById('monthly-summary-container');
    if (!container) return; // Prevent errors if the element doesn't exist

    container.innerHTML = '';
    if (sortedMonths.length === 0) {
        container.innerHTML = '<p>No monthly data to display yet.</p>';
        return;
    }

    sortedMonths.forEach(month => {
        const earnings = monthlyEarnings[month] || 0;
        const expenses = monthlyExpenses[month] || 0;

        const summaryCard = document.createElement('div');
        summaryCard.className = 'card';
        summaryCard.innerHTML = `
            <h3>${month}</h3>
            <div class="grid-container" style="margin-top: 1rem;">
                <div class="summary-item">
                    <div class="summary-icon icon-paid"><i class="fas fa-indian-rupee-sign"></i></div>
                    <div class="summary-text">
                        <span class="summary-label">Earnings</span>
                        <span class="summary-value">₹${earnings.toFixed(2)}</span>
                    </div>
                </div>
                <div class="summary-item" onclick="showMonthlyExpenses('${month}')" style="cursor:pointer;">
                    <div class="summary-icon icon-expense"><i class="fas fa-arrow-down"></i></div>
                    <div class="summary-text">
                        <span class="summary-label">Expenses</span>
                        <span class="summary-value">₹${expenses.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(summaryCard);
    });
}

// --- WORK UPDATE PAGE (FORM) LOGIC ---
function setupWorkForm() {
    const form = document.getElementById('work-form');
    form.addEventListener('submit', handleWorkFormSubmit);
    const numEmployeesInput = document.getElementById('num-employees');
    const rateInput = document.getElementById('rate-per-employee');
    const totalAmountDisplay = document.getElementById('total-amount');
    function calculateTotal() {
        const num = parseFloat(numEmployeesInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const total = num * rate;
        totalAmountDisplay.value = total.toFixed(2);
    }
    numEmployeesInput.addEventListener('input', calculateTotal);
    rateInput.addEventListener('input', calculateTotal);
    
    const workToEdit = JSON.parse(localStorage.getItem('editWorkId'));
    if (workToEdit) {
        document.getElementById('work-id').value = workToEdit.id;
        document.getElementById('work-date').value = workToEdit.date;
        document.getElementById('work-type').value = workToEdit.type;
        document.getElementById('num-employees').value = workToEdit.numEmployees;
        document.getElementById('rate-per-employee').value = workToEdit.ratePerEmployee;
        document.getElementById('employee-names').value = workToEdit.employeeNames;
        document.getElementById('location').value = workToEdit.location;
        document.getElementById('description').value = workToEdit.description;
        document.querySelector(`input[name="status"][value="${workToEdit.status}"]`).checked = true;
        calculateTotal();
        localStorage.removeItem('editWorkId');
    }
}

function handleWorkFormSubmit(e) {
    e.preventDefault();
    const works = getWorks();
    const workId = document.getElementById('work-id').value;
    const num = parseFloat(document.getElementById('num-employees').value) || 0;
    const rate = parseFloat(document.getElementById('rate-per-employee').value) || 0;
    
    const workData = {
        date: document.getElementById('work-date').value,
        type: document.getElementById('work-type').value,
        numEmployees: num,
        ratePerEmployee: rate,
        amount: (num * rate).toFixed(2),
        employeeNames: document.getElementById('employee-names').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        status: document.querySelector('input[name="status"]:checked').value,
    };
    
    if (workId) {
        const workIndex = works.findIndex(w => w.id == workId);
        works[workIndex] = { ...works[workIndex], ...workData };
    } else {
        workData.id = Date.now();
        workData.entryDate = new Date().toISOString();
        works.push(workData);
    }
    
    saveWorks(works);
    e.target.reset();
    document.getElementById('work-id').value = '';
    showCustomAlert('Work entry saved successfully!');
    window.location.href = 'work-list.html';
}

// --- WORK LIST PAGE (TABLE) LOGIC ---
function loadWorkList() {
    const works = getWorks().sort((a, b) => b.id - a.id);
    document.getElementById('work-list-count').textContent = `(${works.length} Entries)`;
    const tableBody = document.getElementById('work-list-body');
    tableBody.innerHTML = '';
    
    if (works.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="12">No work entries found. Add one!</td></tr>';
        return;
    }
    
    works.forEach(work => {
        const rowClass = work.status === 'paid' ? 'status-paid' : '';
        const row = document.createElement('tr');
        row.className = rowClass;
        let actionButtons = `<button class="btn btn-edit" onclick="editWork(${work.id})">Edit</button> <button class="btn btn-danger" onclick="deleteWork(${work.id})">Delete</button>`;
        if (work.status === 'unpaid') {
            actionButtons += `<button class="btn btn-paid" onclick="markAsPaid(${work.id})">Mark Paid</button>`;
        }
        const entryDateTime = new Date(work.entryDate).toLocaleString();
        
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" value="${work.id}"></td>
            <td>${work.date}</td>
            <td>${work.type}</td>
            <td>₹${parseFloat(work.amount).toFixed(2)}</td>
            <td>${work.location}</td>
            <td>${work.numEmployees}</td>
            <td>${work.employeeNames}</td>
            <td>${work.description}</td>
            <td>${work.status}</td>
            <td>${work.paidDate ? new Date(work.paidDate).toLocaleDateString() : 'N/A'}</td>
            <td>${entryDateTime}</td>
            <td class="action-buttons">${actionButtons}</td>
        `;
        tableBody.appendChild(row);

        const checkbox = row.querySelector('.row-checkbox');
        checkbox.addEventListener('change', () => {
            row.classList.toggle('row-selected', checkbox.checked);
        });
    });
    
    document.getElementById('select-all-checkbox').checked = false;
}

function markAsPaid(id) {
    showCustomConfirmation('Are you sure you want to mark this entry as paid?', (result) => {
        if (result) {
            let works = getWorks();
            const workIndex = works.findIndex(w => w.id === id);
            if (workIndex > -1) {
                works[workIndex].status = 'paid';
                works[workIndex].paidDate = new Date().toISOString();
                saveWorks(works);
                loadWorkList();
            }
        }
    });
}

function editWork(id) { const work = getWorks().find(w => w.id === id); localStorage.setItem('editWorkId', JSON.stringify(work)); window.location.href = 'work-update.html'; }

function deleteWork(id) {
    showCustomConfirmation('Are you sure you want to delete this work entry?', (result) => {
        if (result) {
            let works = getWorks().filter(w => w.id !== id);
            saveWorks(works);
            loadWorkList();
        }
    });
}

function deleteSelectedWorks() {
    const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showCustomAlert('Please select at least one row to delete.');
        return;
    }
    showCustomConfirmation(`Are you sure you want to delete the ${selectedCheckboxes.length} selected entries?`, (result) => {
        if (result) {
            const idsToDelete = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
            let works = getWorks().filter(work => !idsToDelete.includes(work.id));
            saveWorks(works);
            loadWorkList();
        }
    });
}

function toggleSelectAll() {
    const masterCheckbox = document.getElementById('select-all-checkbox');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = masterCheckbox.checked;
        const row = checkbox.closest('tr');
        row.classList.toggle('row-selected', masterCheckbox.checked);
    });
}

function downloadWorkReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const works = getWorks();
    doc.text("Work Update Report", 14, 16);
    
    const tableColumn = [
        "Date", "Type", "Amount", "Location", "Employees", "Names", "Description", "Status", "Paid On"
    ];
    const tableRows = [];
    
    works.forEach(work => {
        const workData = [
            work.date,
            work.type,
            `₹${work.amount}`,
            work.location,
            work.numEmployees,
            work.employeeNames,
            work.description,
            work.status,
            work.paidDate ? new Date(work.paidDate).toLocaleDateString() : 'N/A'
        ];
        tableRows.push(workData);
    });
    
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });
    
    doc.save('work_report.pdf');
}

// --- NOTES LOGIC ---
function setupNoteForm() { document.getElementById('note-form').addEventListener('submit', handleNoteFormSubmit); const noteToEdit = JSON.parse(localStorage.getItem('editNoteId')); if (noteToEdit) { document.getElementById('note-id').value = noteToEdit.id; document.getElementById('note-title').value = noteToEdit.title; document.getElementById('note-content').value = noteToEdit.content; localStorage.removeItem('editNoteId'); } }
function handleNoteFormSubmit(e) { e.preventDefault(); const notes = getNotes(); const noteId = document.getElementById('note-id').value; const noteData = { title: document.getElementById('note-title').value, content: document.getElementById('note-content').value }; if (noteId) { const noteIndex = notes.findIndex(n => n.id == noteId); notes[noteIndex] = { ...notes[noteIndex], ...noteData }; } else { noteData.id = Date.now(); notes.push(noteData); } saveNotes(notes); e.target.reset(); document.getElementById('note-id').value = ''; showCustomAlert('Note saved successfully!'); window.location.href = 'notes.html'; }
function loadNotes() { const notes = getNotes().sort((a, b) => b.id - a.id); const container = document.getElementById('notes-container'); container.innerHTML = ''; if (notes.length === 0) { container.innerHTML = '<p>You have no notes. Go ahead and add one!</p>'; return; } notes.forEach(note => { const noteCard = document.createElement('div'); noteCard.className = 'note-card'; noteCard.innerHTML = `<div><h3>${note.title}</h3><p>${note.content.replace(/\n/g, '<br>')}</p></div><div class="note-card-actions"><button class="btn btn-edit" onclick="editNote(${note.id})">Edit</button><button class="btn btn-danger" onclick="deleteNote(${note.id})">Delete</button><button class="btn btn-secondary" onclick="downloadNote(${note.id})">Download</button><button class="btn btn-share" onclick="shareNote(${note.id})">Share</button></div>`; container.appendChild(noteCard); }); }
function editNote(id) { const note = getNotes().find(n => n.id === id); localStorage.setItem('editNoteId', JSON.stringify(note)); window.location.href = 'add-note.html'; }
function deleteNote(id) {
    showCustomConfirmation('Are you sure you want to delete this note?', (result) => {
        if (result) {
            let notes = getNotes().filter(n => n.id !== id);
            saveNotes(notes);
            loadNotes();
        }
    });
}
function downloadNote(id) { const { jsPDF } = window.jspdf; const doc = new jsPDF(); const note = getNotes().find(n => n.id === id); doc.setFontSize(18); doc.text(note.title, 14, 22); doc.setFontSize(12); const splitContent = doc.splitTextToSize(note.content, 180); doc.text(splitContent, 14, 32); doc.save(`${note.title.replace(/\s/g, '_')}.pdf`); }
async function shareNote(id) { const note = getNotes().find(n => n.id === id); if (!note) return; const shareData = { title: note.title, text: note.content, }; if (navigator.share) { try { await navigator.share(shareData); } catch (err) { console.error('Error sharing:', err); } } else { showCustomAlert('Web Share is not supported in your browser.'); } }
function downloadAllNotes() { const notes = getNotes().sort((a, b) => b.id - a.id); if (notes.length === 0) { showCustomAlert('There are no notes to download.'); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF(); const margin = 14; const pageHeight = doc.internal.pageSize.height; let yPosition = 22; doc.setFontSize(22); doc.text("All Notes Report", margin, yPosition); yPosition += 15; notes.forEach((note) => { const titleHeight = doc.getTextDimensions(note.title, { fontSize: 18 }).h; const splitContent = doc.splitTextToSize(note.content, doc.internal.pageSize.width - margin * 2); const contentHeight = doc.getTextDimensions(splitContent, { fontSize: 12 }).h; const totalNoteHeight = titleHeight + contentHeight + 10; if (yPosition + totalNoteHeight > pageHeight - margin) { doc.addPage(); yPosition = margin; } doc.setFontSize(18); doc.text(note.title, margin, yPosition); yPosition += 10; doc.setFontSize(12); doc.text(splitContent, margin, yPosition); yPosition += contentHeight + 10; }); doc.save('all_notes_report.pdf'); }

// --- Daily Expense Logic ---
function handleExpenseFormSubmit(e) {
    e.preventDefault();
    const expense = {
        id: Date.now(),
        date: document.getElementById('expense-date').value,
        description: document.getElementById('expense-description').value,
        amount: parseFloat(document.getElementById('expense-amount').value)
    };
    const expenses = getExpenses();
    expenses.push(expense);
    saveExpenses(expenses);
    e.target.reset();
    showCustomAlert('Expense added successfully!');
    window.location.href = 'expense-list.html';
}

function loadExpenses(filteredExpenses = null) {
    const expenses = filteredExpenses || getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
    const tableBody = document.getElementById('expense-list-body');
    tableBody.innerHTML = '';

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalRow = document.createElement('tr');
    totalRow.id = 'total-row';
    totalRow.innerHTML = `
        <td colspan="2" style="font-weight: bold; text-align: right;">Total Expenses:</td>
        <td style="font-weight: bold;">₹${totalExpenses.toFixed(2)}</td>
        <td></td>
    `;
    tableBody.appendChild(totalRow);

    if (expenses.length === 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.innerHTML = '<td colspan="4" class="no-results">No expenses recorded for this day.</td>';
        tableBody.appendChild(noResultsRow);
        document.getElementById('total-row').style.display = 'none';
        return;
    }

    expenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.description}</td>
            <td>₹${expense.amount.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function deleteExpense(id) {
    showCustomConfirmation('Are you sure you want to delete this expense?', (result) => {
        if (result) {
            let expenses = getExpenses();
            expenses = expenses.filter(exp => exp.id !== id);
            saveExpenses(expenses);
            loadExpenses();
        }
    });
}

function filterExpenses() {
    const selectedDate = document.getElementById('filter-date').value;
    if (!selectedDate) {
        showCustomAlert('Please select a date to filter.');
        return;
    }
    const allExpenses = getExpenses();
    const filtered = allExpenses.filter(exp => exp.date === selectedDate);
    loadExpenses(filtered);
}

function clearFilter() {
    document.getElementById('filter-date').value = '';
    loadExpenses();
}

function downloadExpenseReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get the filtered date from the input field
    const selectedDate = document.getElementById('filter-date').value;
    let expensesToDownload = getExpenses();

    // If a date is selected, filter the expenses
    if (selectedDate) {
        expensesToDownload = expensesToDownload.filter(exp => exp.date === selectedDate);
    }
    
    if (expensesToDownload.length === 0) {
        showCustomAlert('No expenses to download. Please add some expenses or choose a different filter.');
        return;
    }

    doc.text("Daily Expense Report", 14, 16);
    
    const tableColumn = ["Date", "Description", "Amount (Rs)"];
    const tableRows = [];
    
    expensesToDownload.forEach(exp => {
        const expenseData = [
            exp.date,
            exp.description,
            exp.amount.toFixed(2)
        ];
        tableRows.push(expenseData);
    });
    
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });
    
    const fileName = selectedDate ? `expense_report_${selectedDate}.pdf` : 'expense_report_all.pdf';
    doc.save(fileName);
}
function loadRecentExpenses() {
    // 1. Get all expenses and sort them in descending order by date.
    // This puts the newest expenses at the beginning of the array.
    const expenses = getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const recentExpensesList = document.getElementById('recent-expenses-list');
    recentExpensesList.innerHTML = '';
    
    // 2. Use .slice(0, 5) to get the first 5 elements from the sorted array.
    // This effectively gives you the 5 most recent expenses.
    const recent = expenses.slice(0, 5);

    if (recent.length > 0) {
        recent.forEach(exp => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="expense-item-info">
                    <span class="expense-date">${exp.date}</span>
                    <span class="expense-description">${exp.description}</span>
                </div>
                <span class="expense-amount">₹${exp.amount.toFixed(2)}</span>
            `;
            recentExpensesList.appendChild(li);
        });
    } else {
        recentExpensesList.innerHTML = '<li>No recent expenses found.</li>';
    }
}
