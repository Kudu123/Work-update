document.addEventListener('DOMContentLoaded', () => {
    // Determine which page is currently loaded and run the appropriate functions
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
    
    // Logic for the ADD note page
    if (document.getElementById('note-form')) {
        setupNoteForm();
    }

    // Logic for the VIEW notes page
    if (document.getElementById('notes-container')) {
        loadNotes();
        // Add listener for the new "Download All" button
        document.getElementById('download-all-notes-btn').addEventListener('click', downloadAllNotes);
    }
});

// --- DATA STORAGE FUNCTIONS ---
const getWorks = () => JSON.parse(localStorage.getItem('works')) || [];
const saveWorks = (works) => localStorage.setItem('works', JSON.stringify(works));
const getNotes = () => JSON.parse(localStorage.getItem('notes')) || [];
const saveNotes = (notes) => localStorage.setItem('notes', JSON.stringify(notes));

// --- HOME PAGE LOGIC ---
function loadHomePageData() {
    const works = getWorks();
    const notes = getNotes();
    
    // Work Summary (No changes needed here)
    const totalAmount = works
        .filter(work => work.status === 'paid')
        .reduce((sum, work) => sum + parseFloat(work.amount), 0);
    document.getElementById('total-amount').textContent = `₹${totalAmount.toFixed(2)}`;
    
    const upcomingWorkList = document.getElementById('upcoming-work-list');
    const today = new Date().toISOString().split('T')[0];
    const upcomingWorks = works.filter(work => work.date > today).sort((a, b) => new Date(a.date) - new Date(b.date));
    upcomingWorkList.innerHTML = '';
    if (upcomingWorks.length > 0) {
        upcomingWorks.forEach(work => {
            const li = document.createElement('li');
            li.textContent = `${work.date}: ${work.type}`;
            upcomingWorkList.appendChild(li);
        });
    } else {
        upcomingWorkList.innerHTML = '<li>No upcoming work scheduled.</li>';
    }
    
    // UPDATED NOTES SUMMARY LOGIC
    const notesSummaryContainer = document.getElementById('notes-summary');
    const newestNotes = getNotes().sort((a, b) => b.id - a.id).slice(0, 3);
    notesSummaryContainer.innerHTML = ''; // Clear previous content
    if (newestNotes.length > 0) {
        newestNotes.forEach(note => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'summary-item-note';
            noteDiv.innerHTML = `
                <h4>${note.title}</h4>
                <p>${note.content.substring(0, 70)}...</p>
            `;
            notesSummaryContainer.appendChild(noteDiv);
        });
    } else {
        notesSummaryContainer.innerHTML = '<div class="summary-item-note"><p>No notes found.</p></div>';
    }

    renderWorkChart(works);
}

function renderWorkChart(works) {
    // (This function remains unchanged)
    const ctx = document.getElementById('workChart').getContext('2d');
    const paidWorks = works.filter(work => work.status === 'paid');
    const monthlyData = {};
    paidWorks.forEach(work => {
        const month = new Date(work.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) { monthlyData[month] = 0; }
        monthlyData[month] += parseFloat(work.amount);
    });
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));
    const labels = sortedMonths;
    const data = sortedMonths.map(month => monthlyData[month]);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Paid Amount (₹)',
                data: data,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { callback: value => '₹' + value } } }
        }
    });
}

// --- WORK UPDATE PAGE (FORM) LOGIC ---
function setupWorkForm() { const form = document.getElementById('work-form'); form.addEventListener('submit', handleWorkFormSubmit); const numEmployeesInput = document.getElementById('num-employees'); const rateInput = document.getElementById('rate-per-employee'); const totalAmountDisplay = document.getElementById('total-amount'); function calculateTotal() { const num = parseFloat(numEmployeesInput.value) || 0; const rate = parseFloat(rateInput.value) || 0; const total = num * rate; totalAmountDisplay.value = total.toFixed(2); } numEmployeesInput.addEventListener('input', calculateTotal); rateInput.addEventListener('input', calculateTotal); const workToEdit = JSON.parse(localStorage.getItem('editWorkId')); if (workToEdit) { document.getElementById('work-id').value = workToEdit.id; document.getElementById('work-date').value = workToEdit.date; document.getElementById('work-type').value = workToEdit.type; document.getElementById('num-employees').value = workToEdit.numEmployees; document.getElementById('rate-per-employee').value = workToEdit.ratePerEmployee; document.getElementById('employee-names').value = workToEdit.employeeNames; document.getElementById('location').value = workToEdit.location; document.getElementById('description').value = workToEdit.description; document.querySelector(`input[name="status"][value="${workToEdit.status}"]`).checked = true; calculateTotal(); localStorage.removeItem('editWorkId'); } }
function handleWorkFormSubmit(e) { e.preventDefault(); const works = getWorks(); const workId = document.getElementById('work-id').value; const num = parseFloat(document.getElementById('num-employees').value) || 0; const rate = parseFloat(document.getElementById('rate-per-employee').value) || 0; const workData = { date: document.getElementById('work-date').value, type: document.getElementById('work-type').value, numEmployees: num, ratePerEmployee: rate, amount: (num * rate).toFixed(2), employeeNames: document.getElementById('employee-names').value, location: document.getElementById('location').value, description: document.getElementById('description').value, status: document.querySelector('input[name="status"]:checked').value, }; if (workId) { const workIndex = works.findIndex(w => w.id == workId); works[workIndex] = { ...works[workIndex], ...workData }; } else { workData.id = Date.now(); workData.entryDate = new Date().toISOString(); works.push(workData); } saveWorks(works); e.target.reset(); document.getElementById('work-id').value = ''; alert('Work entry saved successfully!'); window.location.href = 'work-list.html'; }

// --- WORK LIST PAGE (TABLE) LOGIC ---
function loadWorkList() { const works = getWorks().sort((a, b) => b.id - a.id); const tableBody = document.getElementById('work-list-body'); tableBody.innerHTML = ''; if (works.length === 0) { tableBody.innerHTML = '<tr><td colspan="12">No work entries found. Add one!</td></tr>'; return; } works.forEach(work => { const rowClass = work.status === 'paid' ? 'status-paid' : ''; const row = document.createElement('tr'); row.className = rowClass; let actionButtons = `<button class="btn btn-edit" onclick="editWork(${work.id})">Edit</button> <button class="btn btn-danger" onclick="deleteWork(${work.id})">Delete</button>`; if (work.status === 'unpaid') { actionButtons += `<button class="btn btn-paid" onclick="markAsPaid(${work.id})">Mark Paid</button>`; } const entryDateTime = new Date(work.entryDate).toLocaleString(); row.innerHTML = `<td><input type="checkbox" class="row-checkbox" value="${work.id}"></td><td>${work.date}</td><td>${work.type}</td><td>₹${parseFloat(work.amount).toFixed(2)}</td><td>${work.location}</td><td>${work.numEmployees}</td><td>${work.employeeNames}</td><td>${work.description}</td><td>${work.status}</td><td>${work.paidDate ? new Date(work.paidDate).toLocaleDateString() : 'N/A'}</td><td>${entryDateTime}</td><td class="action-buttons">${actionButtons}</td>`; tableBody.appendChild(row); }); document.getElementById('select-all-checkbox').checked = false; }
function markAsPaid(id) { let works = getWorks(); const workIndex = works.findIndex(w => w.id === id); if (workIndex > -1) { works[workIndex].status = 'paid'; works[workIndex].paidDate = new Date().toISOString(); saveWorks(works); loadWorkList(); } }
function editWork(id) { const work = getWorks().find(w => w.id === id); localStorage.setItem('editWorkId', JSON.stringify(work)); window.location.href = 'work-update.html'; }
function deleteWork(id) { if (confirm('Are you sure you want to delete this work entry?')) { let works = getWorks().filter(w => w.id !== id); saveWorks(works); loadWorkList(); } }
function deleteSelectedWorks() { const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked'); if (selectedCheckboxes.length === 0) { alert('Please select at least one row to delete.'); return; } if (confirm(`Are you sure you want to delete the ${selectedCheckboxes.length} selected entries?`)) { const idsToDelete = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value)); let works = getWorks().filter(work => !idsToDelete.includes(work.id)); saveWorks(works); loadWorkList(); } }
function toggleSelectAll() { const masterCheckbox = document.getElementById('select-all-checkbox'); const rowCheckboxes = document.querySelectorAll('.row-checkbox'); rowCheckboxes.forEach(checkbox => { checkbox.checked = masterCheckbox.checked; }); }
function downloadWorkReport() { const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation: 'landscape' }); const works = getWorks(); doc.text("Work Update Report", 14, 16); const tableColumn = ["Date", "Type", "Amount", "Location", "Employees", "Names", "Description", "Status", "Paid On"]; const tableRows = []; works.forEach(work => { const workData = [work.date, work.type, `Rs. ${work.amount}`, work.location, work.numEmployees, work.employeeNames, work.description, work.status, work.paidDate ? new Date(work.paidDate).toLocaleDateString() : 'N/A']; tableRows.push(workData); }); doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20, }); doc.save('work_report.pdf'); }

// --- NOTES LOGIC ---
function setupNoteForm() {
    document.getElementById('note-form').addEventListener('submit', handleNoteFormSubmit);
    const noteToEdit = JSON.parse(localStorage.getItem('editNoteId'));
    if (noteToEdit) {
        document.getElementById('note-id').value = noteToEdit.id;
        document.getElementById('note-title').value = noteToEdit.title;
        document.getElementById('note-content').value = noteToEdit.content;
        localStorage.removeItem('editNoteId');
    }
}
function handleNoteFormSubmit(e) {
    e.preventDefault();
    const notes = getNotes();
    const noteId = document.getElementById('note-id').value;
    const noteData = { title: document.getElementById('note-title').value, content: document.getElementById('note-content').value };
    if (noteId) {
        const noteIndex = notes.findIndex(n => n.id == noteId);
        notes[noteIndex] = { ...notes[noteIndex], ...noteData };
    } else {
        noteData.id = Date.now();
        notes.push(noteData);
    }
    saveNotes(notes);
    e.target.reset();
    document.getElementById('note-id').value = '';
    alert('Note saved successfully!');
    window.location.href = 'notes.html'; // Redirect to the view notes page
}
function loadNotes() {
    const notes = getNotes().sort((a, b) => b.id - a.id);
    const container = document.getElementById('notes-container');
    container.innerHTML = '';
    if (notes.length === 0) { container.innerHTML = '<p>You have no notes. Go ahead and add one!</p>'; return; }
    notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        // UPDATED: Added a "Share" button
        noteCard.innerHTML = `
            <div>
                <h3>${note.title}</h3>
                <p>${note.content.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="note-card-actions">
                <button class="btn btn-edit" onclick="editNote(${note.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteNote(${note.id})">Delete</button>
                <button class="btn btn-secondary" onclick="downloadNote(${note.id})">Download</button>
                <button class="btn btn-share" onclick="shareNote(${note.id})">Share</button>
            </div>`;
        container.appendChild(noteCard);
    });
}
function editNote(id) {
    const note = getNotes().find(n => n.id === id);
    localStorage.setItem('editNoteId', JSON.stringify(note));
    window.location.href = 'add-note.html'; // Redirect to the add/edit form
}
function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) { let notes = getNotes().filter(n => n.id !== id); saveNotes(notes); loadNotes(); }
}
function downloadNote(id) { const { jsPDF } = window.jspdf; const doc = new jsPDF(); const note = getNotes().find(n => n.id === id); doc.setFontSize(18); doc.text(note.title, 14, 22); doc.setFontSize(12); const splitContent = doc.splitTextToSize(note.content, 180); doc.text(splitContent, 14, 32); doc.save(`${note.title.replace(/\s/g, '_')}.pdf`); }

// NEW: Function to share a single note
async function shareNote(id) {
    const note = getNotes().find(n => n.id === id);
    if (!note) return;

    const shareData = {
        title: note.title,
        text: note.content,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        alert('Web Share is not supported in your browser.');
    }
}

// NEW: Function to download all notes as a single PDF
function downloadAllNotes() {
    const notes = getNotes().sort((a, b) => b.id - a.id);
    if (notes.length === 0) {
        alert('There are no notes to download.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 14;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 22;

    doc.setFontSize(22);
    doc.text("All Notes Report", margin, yPosition);
    yPosition += 15;

    notes.forEach((note) => {
        const titleHeight = doc.getTextDimensions(note.title, { fontSize: 18 }).h;
        const splitContent = doc.splitTextToSize(note.content, doc.internal.pageSize.width - margin * 2);
        const contentHeight = doc.getTextDimensions(splitContent, { fontSize: 12 }).h;
        const totalNoteHeight = titleHeight + contentHeight + 15; // with spacing

        if (yPosition + totalNoteHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }

        doc.setFontSize(18);
        doc.text(note.title, margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.text(splitContent, margin, yPosition);
        yPosition += contentHeight + 10; // Move y down for the next note
    });

    doc.save('all_notes_report.pdf');
}