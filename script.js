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

    // --- Page-Specific Logic ---
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
        setupExpensePage();
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
// ... (This section remains unchanged)

// --- DAILY EXPENSES LOGIC ---
function setupExpensePage() {
    document.getElementById('expense-form').addEventListener('submit', handleExpenseFormSubmit);
    document.getElementById('download-expenses-pdf').addEventListener('click', downloadExpenseReport);
    loadExpenses();
}

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
    loadExpenses();
}

function loadExpenses() {
    const expenses = getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
    const tableBody = document.getElementById('expense-list-body');
    tableBody.innerHTML = '';

    if (expenses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No expenses recorded yet.</td></tr>';
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
    if (confirm('Are you sure you want to delete this expense?')) {
        let expenses = getExpenses();
        expenses = expenses.filter(exp => exp.id !== id);
        saveExpenses(expenses);
        loadExpenses();
    }
}

function downloadExpenseReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const expenses = getExpenses();
    doc.text("Daily Expense Report", 14, 16);
    
    const tableColumn = ["Date", "Description", "Amount (Rs)"];
    const tableRows = [];
    
    expenses.forEach(exp => {
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
    
    doc.save('expense_report.pdf');
}


// --- HOME PAGE LOGIC (UPDATED) ---
function loadHomePageData() {
    const works = getWorks();
    const notes = getNotes();
    const paymentHistory = getPaymentHistory();
    const currentPayments = getMonthlyPayments();
    const expenses = getExpenses();

    // Work Summary
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

    // Expense Summary
    const todayExpenses = expenses
        .filter(exp => exp.date === today)
        .reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('today-expenses').textContent = `₹${todayExpenses.toFixed(2)}`;

    // Notes Summary
    const notesSummaryContainer = document.getElementById('notes-summary');
    const newestNotes = getNotes().sort((a, b) => b.id - a.id).slice(0, 3);
    notesSummaryContainer.innerHTML = '';
    if (newestNotes.length > 0) {
        newestNotes.forEach(note => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'summary-item-note';
            noteDiv.innerHTML = `<h4>${note.title}</h4><p>${note.content.substring(0, 70)}...</p>`;
            notesSummaryContainer.appendChild(noteDiv);
        });
    } else {
        notesSummaryContainer.innerHTML = '<div class="summary-item-note"><p>No notes found.</p></div>';
    }

    // Monthly Payments Summary
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

    renderWorkChart(works, paymentHistory, currentPayments, expenses);
}

function renderWorkChart(works, paymentHistory, currentPayments, expenses) {
    const ctx = document.getElementById('workChart').getContext('2d');
    const monthlyEarnings = {};
    const monthlyExpenses = {};

    // Process earnings from 'works'
    const paidWorks = works.filter(work => work.status === 'paid' && work.paidDate);
    paidWorks.forEach(work => {
        const dateToUse = new Date(work.paidDate);
        const month = dateToUse.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyEarnings[month]) { monthlyEarnings[month] = 0; }
        monthlyEarnings[month] += parseFloat(work.amount);
    });
    
    // Process earnings from all payments
    const now = new Date();
    const currentMonthYear = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    const allPayments = [...paymentHistory, { date: currentMonthYear, data: currentPayments }];
    allPayments.forEach(archive => {
        const month = archive.date;
        archive.data.forEach(payer => {
            if (payer.isPaid) {
                if (!monthlyEarnings[month]) { monthlyEarnings[month] = 0; }
                monthlyEarnings[month] += parseFloat(payer.amount);
            }
        });
    });

    // Process expenses
    expenses.forEach(exp => {
        const dateToUse = new Date(exp.date);
        const month = dateToUse.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyExpenses[month]) { monthlyExpenses[month] = 0; }
        monthlyExpenses[month] += exp.amount;
    });

    // Combine all months from both datasets
    const allMonths = [...new Set([...Object.keys(monthlyEarnings), ...Object.keys(monthlyExpenses)])];
    const sortedMonths = allMonths.sort((a, b) => new Date(a) - new Date(b));
    
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
                    borderRadius: 5
                },
                {
                    label: 'Total Monthly Expenses (₹)',
                    data: expensesData,
                    backgroundColor: 'rgba(220, 53, 69, 0.6)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1,
                    borderRadius: 5
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
                    display: false // Turned off by default to avoid clutter with two bars
                }
            }
        }
    });
}

// --- The rest of the file (work update, work list, notes logic) remains the same ---
// ...