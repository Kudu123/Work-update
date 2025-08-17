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
});

// --- DATA STORAGE FUNCTIONS ---
const getWorks = () => JSON.parse(localStorage.getItem('works')) || [];
const saveWorks = (works) => localStorage.setItem('works', JSON.stringify(works));
const getNotes = () => JSON.parse(localStorage.getItem('notes')) || [];
const saveNotes = (notes) => localStorage.setItem('notes', JSON.stringify(notes));

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
            alert('All payments for the month are complete! Archiving and resetting for the new month.');
            archiveAndResetPayments(false);
        } else {
            loadPaymentsPage();
        }
    }
}

function manualResetMonthlyPayments() {
    if (confirm('Are you sure you want to reset for a new month? This will archive the current data and mark everyone as unpaid.')) {
        archiveAndResetPayments(true);
    }
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
        alert(`Payments for ${monthYear} have been archived. The list is now reset for the new month.`);
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
            deletePaymentHistory(originalIndex);
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
    if (!confirm('Are you sure you want to permanently delete this history entry?')) {
        return;
    }

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

    renderWorkChart(works, paymentHistory, currentPayments);
}

function renderWorkChart(works, paymentHistory, currentPayments) {
    const ctx = document.getElementById('workChart').getContext('2d');
    const monthlyData = {};

    const paidWorks = works.filter(work => work.status === 'paid' && work.paidDate);
    paidWorks.forEach(work => {
        const dateToUse = new Date(work.paidDate);
        const month = dateToUse.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyData[month]) {
            monthlyData[month] = 0;
        }
        monthlyData[month] += parseFloat(work.amount);
    });
    
    const now = new Date();
    const currentMonthYear = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    const allPayments = [...paymentHistory, { date: currentMonthYear, data: currentPayments }];

    allPayments.forEach(archive => {
        const month = archive.date;
        archive.data.forEach(payer => {
            if (payer.isPaid) {
                if (!monthlyData[month]) {
                    monthlyData[month] = 0;
                }
                monthlyData[month] += parseFloat(payer.amount);
            }
        });
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));
    const labels = sortedMonths;
    const data = sortedMonths.map(month => monthlyData[month]);

    const existingChart = Chart.getChart('workChart');
    if (existingChart) {
        existingChart.destroy();
    }
    
    Chart.register(ChartDataLabels);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Monthly Earnings (₹)',
                data: data,
                backgroundColor: 'rgba(74, 144, 226, 0.6)',
                borderColor: 'rgba(74, 144, 226, 1)',
                borderWidth: 1,
                borderRadius: 5
            }]
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
                    display: false
                },
                tooltip: {
                    enabled: true
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => '₹' + value.toFixed(0),
                    font: {
                        weight: 'bold',
                        family: 'Poppins'
                    },
                    color: '#333'
                }
            }
        }
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
    alert('Work entry saved successfully!');
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

function markAsPaid(id) { let works = getWorks(); const workIndex = works.findIndex(w => w.id === id); if (workIndex > -1) { works[workIndex].status = 'paid'; works[workIndex].paidDate = new Date().toISOString(); saveWorks(works); loadWorkList(); } }
function editWork(id) { const work = getWorks().find(w => w.id === id); localStorage.setItem('editWorkId', JSON.stringify(work)); window.location.href = 'work-update.html'; }
function deleteWork(id) { if (confirm('Are you sure you want to delete this work entry?')) { let works = getWorks().filter(w => w.id !== id); saveWorks(works); loadWorkList(); } }
function deleteSelectedWorks() { const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked'); if (selectedCheckboxes.length === 0) { alert('Please select at least one row to delete.'); return; } if (confirm(`Are you sure you want to delete the ${selectedCheckboxes.length} selected entries?`)) { const idsToDelete = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value)); let works = getWorks().filter(work => !idsToDelete.includes(work.id)); saveWorks(works); loadWorkList(); } }

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
            `Rs. ${work.amount}`,
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
function handleNoteFormSubmit(e) { e.preventDefault(); const notes = getNotes(); const noteId = document.getElementById('note-id').value; const noteData = { title: document.getElementById('note-title').value, content: document.getElementById('note-content').value }; if (noteId) { const noteIndex = notes.findIndex(n => n.id == noteId); notes[noteIndex] = { ...notes[noteIndex], ...noteData }; } else { noteData.id = Date.now(); notes.push(noteData); } saveNotes(notes); e.target.reset(); document.getElementById('note-id').value = ''; alert('Note saved successfully!'); window.location.href = 'notes.html'; }
function loadNotes() { const notes = getNotes().sort((a, b) => b.id - a.id); const container = document.getElementById('notes-container'); container.innerHTML = ''; if (notes.length === 0) { container.innerHTML = '<p>You have no notes. Go ahead and add one!</p>'; return; } notes.forEach(note => { const noteCard = document.createElement('div'); noteCard.className = 'note-card'; noteCard.innerHTML = `<div><h3>${note.title}</h3><p>${note.content.replace(/\n/g, '<br>')}</p></div><div class="note-card-actions"><button class="btn btn-edit" onclick="editNote(${note.id})">Edit</button><button class="btn btn-danger" onclick="deleteNote(${note.id})">Delete</button><button class="btn btn-secondary" onclick="downloadNote(${note.id})">Download</button><button class="btn btn-share" onclick="shareNote(${note.id})">Share</button></div>`; container.appendChild(noteCard); }); }
function editNote(id) { const note = getNotes().find(n => n.id === id); localStorage.setItem('editNoteId', JSON.stringify(note)); window.location.href = 'add-note.html'; }
function deleteNote(id) { if (confirm('Are you sure you want to delete this note?')) { let notes = getNotes().filter(n => n.id !== id); saveNotes(notes); loadNotes(); } }
function downloadNote(id) { const { jsPDF } = window.jspdf; const doc = new jsPDF(); const note = getNotes().find(n => n.id === id); doc.setFontSize(18); doc.text(note.title, 14, 22); doc.setFontSize(12); const splitContent = doc.splitTextToSize(note.content, 180); doc.text(splitContent, 14, 32); doc.save(`${note.title.replace(/\s/g, '_')}.pdf`); }
async function shareNote(id) { const note = getNotes().find(n => n.id === id); if (!note) return; const shareData = { title: note.title, text: note.content, }; if (navigator.share) { try { await navigator.share(shareData); } catch (err) { console.error('Error sharing:', err); } } else { alert('Web Share is not supported in your browser.'); } }
function downloadAllNotes() { const notes = getNotes().sort((a, b) => b.id - a.id); if (notes.length === 0) { alert('There are no notes to download.'); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF(); const margin = 14; const pageHeight = doc.internal.pageSize.height; let yPosition = 22; doc.setFontSize(22); doc.text("All Notes Report", margin, yPosition); yPosition += 15; notes.forEach((note) => { const titleHeight = doc.getTextDimensions(note.title, { fontSize: 18 }).h; const splitContent = doc.splitTextToSize(note.content, doc.internal.pageSize.width - margin * 2); const contentHeight = doc.getTextDimensions(splitContent, { fontSize: 12 }).h; const totalNoteHeight = titleHeight + contentHeight + 15; if (yPosition + totalNoteHeight > pageHeight - margin) { doc.addPage(); yPosition = margin; } doc.setFontSize(18); doc.text(note.title, margin, yPosition); yPosition += 10; doc.setFontSize(12); doc.text(splitContent, margin, yPosition); yPosition += contentHeight + 10; }); doc.save('all_notes_report.pdf'); }
