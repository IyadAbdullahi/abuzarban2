// Enhanced School Management System JavaScript
// Complete implementation with all modules connected to backend APIs

// Global configuration
const API_BASE_URL = 'http://localhost:8001';

// Global state management
let currentStudents = [];
let currentClasses = [];
let currentSessions = [];
let currentPaymentCategories = [];
let currentExpenses = [];
let selectedStudent = null;
let sortState = {};

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
    }).format(amount || 0);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// API helper functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showNotification(`API Error: ${error.message}`, 'error');
        throw error;
    }
}

// Navigation and section management
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active menu item
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'students':
            loadStudents();
            break;
        case 'classes':
            loadClasses();
            break;
        case 'sessions':
            loadSessions();
            break;
        case 'payments':
            loadPaymentCategories();
            clearPaymentForm();
            break;
        case 'billing':
            loadBillingData();
            break;
        case 'expenses':
            loadExpenses();
            break;
        case 'payment-categories':
            loadPaymentCategories();
            break;
        case 'reports':
            initializeReports();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Dashboard functionality
async function loadDashboardData() {
    try {
        // Load students count
        const students = await apiCall('/api/students/all');
        document.getElementById('activeStudents').textContent = students.length;
        
        // Load payment summary
        const paymentSummary = await apiCall('/api/student-payments/summary-all');
        document.getElementById('totalRevenue').textContent = formatCurrency(paymentSummary.total_paid);
        document.getElementById('outstandingFees').textContent = formatCurrency(paymentSummary.total_outstanding);
        
        // Load today's payments
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        
        const todayPayments = await apiCall(`/api/student-payments/by-date?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
        const todayTotal = todayPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount_paid) || 0), 0);
        
        // Load expenses summary
        const expensesSummary = await apiCall(`/api/expenses/summary?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
        document.getElementById('totalExpenses').textContent = formatCurrency(expensesSummary.total);
        
        // Load recent transactions for table
        loadRecentTransactions();
        
        // Initialize charts
        initializeDashboardCharts();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

async function loadRecentTransactions() {
    try {
        const payments = await apiCall('/api/student-payments/all');
        const recentPayments = payments.slice(-10).reverse();
        
        const tableBody = document.querySelector('#recentTransactionsTable tbody');
        tableBody.innerHTML = '';
        
        for (const payment of recentPayments) {
            const student = await apiCall(`/api/students/student/${payment.student_id}`);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(payment.date)}</td>
                <td>${student ? student.name : 'Unknown'}</td>
                <td>${payment.payment_type}</td>
                <td>${formatCurrency(payment.amount_paid)}</td>
                <td><span class="badge ${payment.status === 'paid' ? 'success' : payment.status === 'partial' ? 'warning' : 'danger'}">${payment.status}</span></td>
                <td>${payment.payment_method || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Failed to load recent transactions:', error);
    }
}

function initializeDashboardCharts() {
    // Revenue vs Expenses Chart
    const revenueCtx = document.getElementById('revenueExpenseChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [65000, 59000, 80000, 81000, 56000, 55000],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Expenses',
                    data: [28000, 48000, 40000, 19000, 86000, 27000],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }
    
    // Payment Status Chart
    const statusCtx = document.getElementById('paymentStatusChart');
    if (statusCtx) {
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Paid', 'Partial', 'Outstanding'],
                datasets: [{
                    data: [65, 20, 15],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }
}

// Students functionality (existing - keeping as reference)
async function loadStudents() {
    try {
        const students = await apiCall('/api/students/all');
        const classes = await apiCall('/api/classes/');
        
        currentStudents = students;
        currentClasses = classes;
        
        // Populate class filter
        const classFilter = document.getElementById('studentClassFilter');
        classFilter.innerHTML = '<option value="">All Classes</option>';
        classes.forEach(cls => {
            classFilter.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
        });
        
        renderStudents(students);
    } catch (error) {
        console.error('Failed to load students:', error);
    }
}

function renderStudents(students) {
    const container = document.getElementById('studentsGrid');
    container.innerHTML = '';
    
    students.forEach(student => {
        const studentClass = currentClasses.find(c => c.id == student.classId);
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        studentCard.innerHTML = `
            <div class="student-info">
                <div class="student-avatar">${student.name.charAt(0).toUpperCase()}</div>
                <div class="student-details">
                    <h4>${student.name}</h4>
                    <p>ID: ${student.id}</p>
                    <p>Class: ${studentClass ? studentClass.name : 'Not Assigned'}</p>
                    <p>Guardian: ${student.guardian || 'N/A'}</p>
                </div>
            </div>
            <div class="student-balance">
                <span class="text-muted">Balance:</span>
                <span class="${student.balance < 0 ? 'text-danger' : 'text-success'}">${formatCurrency(student.balance)}</span>
            </div>
            <div class="student-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-ghost" onclick="deleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        container.appendChild(studentCard);
    });
}

// Classes functionality (existing - keeping as reference)
async function loadClasses() {
    try {
        const classes = await apiCall('/api/classes/');
        currentClasses = classes;
        renderClasses(classes);
    } catch (error) {
        console.error('Failed to load classes:', error);
    }
}

function renderClasses(classes) {
    const tableBody = document.getElementById('classesTableBody');
    tableBody.innerHTML = '';
    
    classes.forEach(cls => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cls.name}</td>
            <td>${cls.level}</td>
            <td>${cls.studentCount || 0}</td>
            <td>${cls.teacher || 'Not Assigned'}</td>
            <td>
                <button class="btn btn-primary" onclick="editClass(${cls.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-ghost" onclick="deleteClass(${cls.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Sessions functionality
async function loadSessions() {
    try {
        const sessions = await apiCall('/api/sessions/all');
        currentSessions = sessions;
        renderSessions(sessions);
    } catch (error) {
        console.error('Failed to load sessions:', error);
        showNotification('Failed to load sessions', 'error');
    }
}

function renderSessions(sessions) {
    const tableBody = document.getElementById('sessionsTableBody');
    tableBody.innerHTML = '';
    
    sessions.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${session.name}</td>
            <td>${formatDate(session.startDate)}</td>
            <td>${formatDate(session.endDate)}</td>
            <td><span class="badge ${session.status === 'active' ? 'success' : session.status === 'upcoming' ? 'info' : 'warning'}">${session.status}</span></td>
            <td>
                <button class="btn btn-primary" onclick="editSession(${session._id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-ghost" onclick="deleteSession(${session._id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function addSession() {
    // Populate session modal with classes
    await loadClassesForModal();
    document.getElementById('sessionModal').classList.add('active');
}

async function saveSession() {
    const form = document.getElementById('addSessionForm');
    const formData = new FormData(form);
    
    const sessionData = {
        name: formData.get('sessionName') || document.getElementById('sessionName').value,
        startDate: formData.get('sessionStartDate') || document.getElementById('sessionStartDate').value,
        endDate: formData.get('sessionEndDate') || document.getElementById('sessionEndDate').value,
        status: formData.get('sessionStatus') || document.getElementById('sessionStatus').value
    };
    
    if (!sessionData.name || !sessionData.startDate || !sessionData.endDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        await apiCall('/api/sessions/session', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
        
        showNotification('Session added successfully', 'success');
        closeModal();
        loadSessions();
    } catch (error) {
        console.error('Failed to save session:', error);
        showNotification('Failed to save session', 'error');
    }
}

async function editSession(sessionId) {
    try {
        const session = await apiCall(`/api/sessions/session/${sessionId}`);
        
        document.getElementById('sessionName').value = session.name;
        document.getElementById('sessionStartDate').value = session.startDate.split('T')[0];
        document.getElementById('sessionEndDate').value = session.endDate.split('T')[0];
        document.getElementById('sessionStatus').value = session.status;
        
        // Change form to edit mode
        const form = document.getElementById('addSessionForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await updateSession(sessionId);
        };
        
        document.getElementById('sessionModal').classList.add('active');
    } catch (error) {
        console.error('Failed to load session:', error);
        showNotification('Failed to load session', 'error');
    }
}

async function updateSession(sessionId) {
    const sessionData = {
        _id: sessionId,
        name: document.getElementById('sessionName').value,
        startDate: document.getElementById('sessionStartDate').value,
        endDate: document.getElementById('sessionEndDate').value,
        status: document.getElementById('sessionStatus').value
    };
    
    try {
        await apiCall('/api/sessions/session', {
            method: 'PUT',
            body: JSON.stringify(sessionData)
        });
        
        showNotification('Session updated successfully', 'success');
        closeModal();
        loadSessions();
    } catch (error) {
        console.error('Failed to update session:', error);
        showNotification('Failed to update session', 'error');
    }
}

async function deleteSession(sessionId) {
    if (await showConfirm('Are you sure you want to delete this session?', 'Delete Session')) {
        try {
            await apiCall(`/api/sessions/session/${sessionId}`, {
                method: 'DELETE'
            });
            
            showNotification('Session deleted successfully', 'success');
            loadSessions();
        } catch (error) {
            console.error('Failed to delete session:', error);
            showNotification('Failed to delete session', 'error');
        }
    }
}

// Payment recording functionality
async function loadPaymentCategories() {
    try {
        const categories = await apiCall('/api/payment-categories/all');
        currentPaymentCategories = categories;
        
        // Populate payment type dropdown
        const paymentTypeSelect = document.getElementById('paymentType');
        if (paymentTypeSelect) {
            paymentTypeSelect.innerHTML = '<option value="">Select Payment Type</option>';
            categories.forEach(category => {
                paymentTypeSelect.innerHTML += `<option value="${category._id}" data-amount="${category.amount}">${category.name} (${formatCurrency(category.amount)})</option>`;
            });
        }
        
        // If we're on payment categories section, render the table
        if (document.getElementById('categoriesTableBody')) {
            renderPaymentCategories(categories);
        }
    } catch (error) {
        console.error('Failed to load payment categories:', error);
        showNotification('Failed to load payment categories', 'error');
    }
}

function clearPaymentForm() {
    document.getElementById('paymentStudentSearch').value = '';
    document.getElementById('paymentType').value = '';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentMethod').value = 'cash';
    document.getElementById('selectedStudentInfo').innerHTML = '';
    document.getElementById('studentBalance').innerHTML = 'Select a student to view balance';
    document.getElementById('paymentHistory').innerHTML = 'Select a student to view history';
    selectedStudent = null;
}

// Setup payment student search
function setupPaymentStudentSearch() {
    const searchInput = document.getElementById('paymentStudentSearch');
    const resultsContainer = document.getElementById('studentSearchResults');
    
    if (!searchInput || !resultsContainer) return;
    
    const debouncedSearch = debounce(async (query) => {
        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }
        
        try {
            const students = await apiCall(`/api/students/search/${encodeURIComponent(query)}`);
            
            resultsContainer.innerHTML = '';
            students.slice(0, 5).forEach(student => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <strong>${student.name}</strong><br>
                    <small>ID: ${student.id} | Guardian: ${student.guardian || 'N/A'}</small>
                `;
                resultItem.onclick = () => selectStudentForPayment(student);
                resultsContainer.appendChild(resultItem);
            });
        } catch (error) {
            console.error('Student search failed:', error);
        }
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

async function selectStudentForPayment(student) {
    selectedStudent = student;
    
    // Clear search results
    document.getElementById('studentSearchResults').innerHTML = '';
    document.getElementById('paymentStudentSearch').value = student.name;
    
    // Show selected student info
    const studentInfo = document.getElementById('selectedStudentInfo');
    studentInfo.innerHTML = `
        <div class="card" style="padding: 1rem; margin: 1rem 0;">
            <h5>${student.name}</h5>
            <p><strong>ID:</strong> ${student.id}</p>
            <p><strong>Guardian:</strong> ${student.guardian || 'N/A'}</p>
            <p><strong>Class:</strong> ${student.classId || 'Not Assigned'}</p>
        </div>
    `;
    
    // Load student balance and payment history
    await loadStudentBalance(student.id);
    await loadStudentPaymentHistory(student.id);
}

async function loadStudentBalance(studentId) {
    try {
        const summary = await apiCall(`/api/student-payments/summary/${studentId}`);
        
        const balanceContainer = document.getElementById('studentBalance');
        balanceContainer.innerHTML = `
            <div class="balance-summary">
                <div class="balance-item">
                    <span class="label">Total Paid:</span>
                    <span class="value text-success">${formatCurrency(summary.total_paid)}</span>
                </div>
                <div class="balance-item">
                    <span class="label">Outstanding:</span>
                    <span class="value text-danger">${formatCurrency(summary.total_outstanding)}</span>
                </div>
                <div class="balance-item">
                    <span class="label">Compulsory Outstanding:</span>
                    <span class="value text-warning">${formatCurrency(summary.compulsory_outstanding)}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load student balance:', error);
    }
}

async function loadStudentPaymentHistory(studentId) {
    try {
        const payments = await apiCall(`/api/student-payments/student/${studentId}`);
        
        const historyContainer = document.getElementById('paymentHistory');
        if (payments.length === 0) {
            historyContainer.innerHTML = '<p class="text-muted">No payment history found</p>';
            return;
        }
        
        let historyHTML = '<div class="payment-history">';
        payments.slice(-5).reverse().forEach(payment => {
            historyHTML += `
                <div class="payment-item" style="padding: 0.5rem; border-bottom: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>${payment.payment_type}</span>
                        <span class="text-success">${formatCurrency(payment.amount_paid)}</span>
                    </div>
                    <small class="text-muted">${formatDate(payment.date)} - ${payment.payment_method || 'N/A'}</small>
                </div>
            `;
        });
        historyHTML += '</div>';
        
        historyContainer.innerHTML = historyHTML;
    } catch (error) {
        console.error('Failed to load payment history:', error);
    }
}

// Payment type selection handler
function setupPaymentTypeHandler() {
    const paymentTypeSelect = document.getElementById('paymentType');
    const amountInput = document.getElementById('paymentAmount');
    
    if (paymentTypeSelect && amountInput) {
        paymentTypeSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            if (selectedOption && selectedOption.dataset.amount) {
                amountInput.value = selectedOption.dataset.amount;
            }
        });
    }
}

async function recordPayment() {
    if (!selectedStudent) {
        showNotification('Please select a student first', 'error');
        return;
    }
    
    const paymentData = {
        student_id: parseInt(selectedStudent.id),
        payment_category_id: parseInt(document.getElementById('paymentType').value),
        amount: parseFloat(document.getElementById('paymentAmount').value),
        amount_paid: parseFloat(document.getElementById('paymentAmount').value),
        payment_method: document.getElementById('paymentMethod').value,
        payment_type: currentPaymentCategories.find(c => c._id == document.getElementById('paymentType').value)?.type || 'optional'
    };
    
    if (!paymentData.payment_category_id || !paymentData.amount || paymentData.amount <= 0) {
        showNotification('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    try {
        await apiCall('/api/student-payments/payment', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
        
        showNotification('Payment recorded successfully', 'success');
        
        // Refresh student balance and history
        await loadStudentBalance(selectedStudent.id);
        await loadStudentPaymentHistory(selectedStudent.id);
        
        // Clear form
        document.getElementById('paymentType').value = '';
        document.getElementById('paymentAmount').value = '';
        
    } catch (error) {
        console.error('Failed to record payment:', error);
        showNotification('Failed to record payment', 'error');
    }
}

// Billing functionality
async function loadBillingData() {
    try {
        // Load classes for bulk actions
        const classes = await apiCall('/api/classes/');
        const bulkActionSelect = document.getElementById('bulkActionClass');
        const enrollClassSelect = document.getElementById('enrollClass');
        
        if (bulkActionSelect) {
            bulkActionSelect.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(cls => {
                bulkActionSelect.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
            });
        }
        
        if (enrollClassSelect) {
            enrollClassSelect.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(cls => {
                enrollClassSelect.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
            });
        }
        
        // Load sessions for enrollment
        const sessions = await apiCall('/api/sessions/all');
        const enrollSessionSelect = document.getElementById('enrollSession');
        if (enrollSessionSelect) {
            enrollSessionSelect.innerHTML = '<option value="">Select Session</option>';
            sessions.forEach(session => {
                enrollSessionSelect.innerHTML += `<option value="${session.name}">${session.name}</option>`;
            });
        }
        
    } catch (error) {
        console.error('Failed to load billing data:', error);
        showNotification('Failed to load billing data', 'error');
    }
}

function openEnrollmentModal() {
    loadBillingData();
    document.getElementById('enrollmentModal').classList.add('active');
}

async function loadClassStudents() {
    const classId = document.getElementById('enrollClass').value;
    const studentsListContainer = document.getElementById('enrollStudentsList');
    
    if (!classId) {
        studentsListContainer.innerHTML = '<p class="text-muted">Select a class to view students</p>';
        return;
    }
    
    try {
        const students = await apiCall(`/api/students/by-class/${classId}`);
        
        if (students.length === 0) {
            studentsListContainer.innerHTML = '<p class="text-muted">No students found in this class</p>';
            return;
        }
        
        let studentsHTML = '';
        students.forEach(student => {
            studentsHTML += `
                <div class="student-checkbox-item">
                    <input type="checkbox" id="student_${student.id}" value="${student.id}">
                    <label for="student_${student.id}">
                        <strong>${student.name}</strong><br>
                        <small>ID: ${student.id} | Guardian: ${student.guardian || 'N/A'}</small>
                    </label>
                </div>
            `;
        });
        
        studentsListContainer.innerHTML = studentsHTML;
    } catch (error) {
        console.error('Failed to load class students:', error);
        showNotification('Failed to load students', 'error');
    }
}

async function enrollSelectedStudents() {
    const session = document.getElementById('enrollSession').value;
    const term = document.getElementById('enrollTerm').value;
    const classId = document.getElementById('enrollClass').value;
    
    if (!session || !term || !classId) {
        showNotification('Please fill in all enrollment details', 'error');
        return;
    }
    
    const selectedStudents = Array.from(document.querySelectorAll('#enrollStudentsList input[type="checkbox"]:checked'))
        .map(checkbox => parseInt(checkbox.value));
    
    if (selectedStudents.length === 0) {
        showNotification('Please select at least one student', 'error');
        return;
    }
    
    try {
        const enrollmentPromises = selectedStudents.map(studentId => 
            apiCall('/api/enrollment/enrollment?generateInvoices=1', {
                method: 'POST',
                body: JSON.stringify({
                    student_id: studentId,
                    session: session,
                    term: term,
                    class_id: classId
                })
            })
        );
        
        await Promise.all(enrollmentPromises);
        
        showNotification(`Successfully enrolled ${selectedStudents.length} students`, 'success');
        closeModal();
        
    } catch (error) {
        console.error('Failed to enroll students:', error);
        showNotification('Failed to enroll students', 'error');
    }
}

async function loadInvoices() {
    const searchTerm = document.getElementById('invoiceStudentSearch').value;
    
    if (!searchTerm) {
        showNotification('Please enter a student name or ID', 'error');
        return;
    }
    
    try {
        // Search for student first
        const students = await apiCall(`/api/students/search/${encodeURIComponent(searchTerm)}`);
        
        if (students.length === 0) {
            showNotification('No students found', 'error');
            return;
        }
        
        const student = students[0]; // Take first match
        const invoices = await apiCall(`/api/enrollment/invoices/by-student/${student.id}`);
        
        const tableBody = document.getElementById('invoicesTableBody');
        tableBody.innerHTML = '';
        
        invoices.forEach(invoice => {
            const category = currentPaymentCategories.find(c => c._id === invoice.payment_category_id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(invoice.date)}</td>
                <td>${category ? category.name : 'Unknown'}</td>
                <td>${formatCurrency(invoice.amount)}</td>
                <td><span class="badge ${invoice.status === 'paid' ? 'success' : invoice.status === 'partial' ? 'warning' : 'danger'}">${invoice.status}</span></td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Failed to load invoices:', error);
        showNotification('Failed to load invoices', 'error');
    }
}

async function generateClassInvoices() {
    const classId = document.getElementById('bulkActionClass').value;
    
    if (!classId) {
        showNotification('Please select a class', 'error');
        return;
    }
    
    if (await showConfirm('Generate invoices for all students in this class?', 'Generate Invoices')) {
        try {
            const students = await apiCall(`/api/students/by-class/${classId}`);
            const compulsoryCategories = await apiCall('/api/payment-categories/compulsory');
            
            const invoicePromises = [];
            students.forEach(student => {
                compulsoryCategories.forEach(category => {
                    invoicePromises.push(
                        apiCall('/api/enrollment/invoices/invoice', {
                            method: 'POST',
                            body: JSON.stringify({
                                student_id: parseInt(student.id),
                                payment_category_id: category._id,
                                amount: category.amount,
                                amount_paid: 0,
                                status: 'unpaid',
                                payment_type: 'compulsory'
                            })
                        })
                    );
                });
            });
            
            await Promise.all(invoicePromises);
            showNotification('Invoices generated successfully', 'success');
            
        } catch (error) {
            console.error('Failed to generate invoices:', error);
            showNotification('Failed to generate invoices', 'error');
        }
    }
}

// Expenses functionality
async function loadExpenses() {
    try {
        const expenses = await apiCall('/api/expenses/all');
        currentExpenses = expenses;
        renderExpenses(expenses);
        
        // Set default date range to current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        document.getElementById('expenseStart').value = startOfMonth.toISOString().split('T')[0];
        document.getElementById('expenseEnd').value = now.toISOString().split('T')[0];
        document.getElementById('expenseDate').value = now.toISOString().split('T')[0];
        
    } catch (error) {
        console.error('Failed to load expenses:', error);
        showNotification('Failed to load expenses', 'error');
    }
}

function renderExpenses(expenses) {
    const tableBody = document.getElementById('expensesTableBody');
    tableBody.innerHTML = '';
    
    expenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expense.category}</td>
            <td>${expense.description || 'N/A'}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>
                <button class="btn btn-primary" onclick="editExpense(${expense._id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-ghost" onclick="deleteExpense(${expense._id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function saveExpense() {
    const expenseData = {
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value
    };
    
    if (!expenseData.category || !expenseData.amount || expenseData.amount <= 0) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        await apiCall('/api/expenses/expense', {
            method: 'POST',
            body: JSON.stringify(expenseData)
        });
        
        showNotification('Expense saved successfully', 'success');
        
        // Clear form
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        
        // Reload expenses
        loadExpenses();
        
    } catch (error) {
        console.error('Failed to save expense:', error);
        showNotification('Failed to save expense', 'error');
    }
}

async function editExpense(expenseId) {
    try {
        const expense = currentExpenses.find(e => e._id === expenseId);
        if (!expense) {
            showNotification('Expense not found', 'error');
            return;
        }
        
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseDescription').value = expense.description || '';
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseDate').value = expense.date.split('T')[0];
        
        // Change save button to update
        const saveBtn = document.querySelector('#expenseForm button');
        saveBtn.textContent = 'Update Expense';
        saveBtn.onclick = () => updateExpense(expenseId);
        
    } catch (error) {
        console.error('Failed to load expense:', error);
        showNotification('Failed to load expense', 'error');
    }
}

async function updateExpense(expenseId) {
    const expenseData = {
        _id: expenseId,
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value
    };
    
    try {
        await apiCall('/api/expenses/expense', {
            method: 'PUT',
            body: JSON.stringify(expenseData)
        });
        
        showNotification('Expense updated successfully', 'success');
        
        // Reset form
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        
        // Reset save button
        const saveBtn = document.querySelector('#expenseForm button');
        saveBtn.textContent = 'Save Expense';
        saveBtn.onclick = saveExpense;
        
        loadExpenses();
        
    } catch (error) {
        console.error('Failed to update expense:', error);
        showNotification('Failed to update expense', 'error');
    }
}

async function deleteExpense(expenseId) {
    if (await showConfirm('Are you sure you want to delete this expense?', 'Delete Expense')) {
        try {
            await apiCall(`/api/expenses/expense/${expenseId}`, {
                method: 'DELETE'
            });
            
            showNotification('Expense deleted successfully', 'success');
            loadExpenses();
            
        } catch (error) {
            console.error('Failed to delete expense:', error);
            showNotification('Failed to delete expense', 'error');
        }
    }
}

async function filterExpenses() {
    const startDate = document.getElementById('expenseStart').value;
    const endDate = document.getElementById('expenseEnd').value;
    const category = document.getElementById('expenseFilterCategory').value;
    
    try {
        let url = '/api/expenses/by-date';
        const params = new URLSearchParams();
        
        if (startDate) params.append('start', new Date(startDate).toISOString());
        if (endDate) params.append('end', new Date(endDate).toISOString());
        if (category && category !== 'all') params.append('category', category);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const expenses = await apiCall(url);
        renderExpenses(expenses);
        
        // Update total
        const total = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
        const totalElement = document.getElementById('expensesTotal');
        if (totalElement) {
            totalElement.textContent = formatCurrency(total);
        }
        
    } catch (error) {
        console.error('Failed to filter expenses:', error);
        showNotification('Failed to filter expenses', 'error');
    }
}

// Payment Categories functionality
function renderPaymentCategories(categories) {
    const tableBody = document.getElementById('categoriesTableBody');
    tableBody.innerHTML = '';
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td><span class="badge ${category.type === 'compulsory' ? 'danger' : 'info'}">${category.type}</span></td>
            <td>${formatCurrency(category.amount)}</td>
            <td><span class="badge ${category.is_active !== false ? 'success' : 'warning'}">${category.is_active !== false ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-primary" onclick="editPaymentCategory(${category._id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-ghost" onclick="deletePaymentCategory(${category._id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function addPaymentCategory() {
    document.getElementById('categoryModal').classList.add('active');
}

async function saveCategory() {
    const categoryData = {
        name: document.getElementById('categoryName').value,
        type: document.getElementById('categoryType').value,
        amount: parseFloat(document.getElementById('categoryAmount').value) || 0,
        is_active: true
    };
    
    if (!categoryData.name) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    try {
        await apiCall('/api/payment-categories/category', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
        
        showNotification('Payment category added successfully', 'success');
        closeModal();
        loadPaymentCategories();
        
    } catch (error) {
        console.error('Failed to save category:', error);
        showNotification('Failed to save category', 'error');
    }
}

async function editPaymentCategory(categoryId) {
    try {
        const category = currentPaymentCategories.find(c => c._id === categoryId);
        if (!category) {
            showNotification('Category not found', 'error');
            return;
        }
        
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryType').value = category.type;
        document.getElementById('categoryAmount').value = category.amount;
        
        // Change form to edit mode
        const form = document.getElementById('addCategoryForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await updatePaymentCategory(categoryId);
        };
        
        document.getElementById('categoryModal').classList.add('active');
        
    } catch (error) {
        console.error('Failed to load category:', error);
        showNotification('Failed to load category', 'error');
    }
}

async function updatePaymentCategory(categoryId) {
    const categoryData = {
        _id: categoryId,
        name: document.getElementById('categoryName').value,
        type: document.getElementById('categoryType').value,
        amount: parseFloat(document.getElementById('categoryAmount').value) || 0,
        is_active: true
    };
    
    try {
        await apiCall('/api/payment-categories/category', {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
        
        showNotification('Payment category updated successfully', 'success');
        closeModal();
        loadPaymentCategories();
        
    } catch (error) {
        console.error('Failed to update category:', error);
        showNotification('Failed to update category', 'error');
    }
}

async function deletePaymentCategory(categoryId) {
    if (await showConfirm('Are you sure you want to delete this payment category?', 'Delete Category')) {
        try {
            await apiCall(`/api/payment-categories/category/${categoryId}`, {
                method: 'DELETE'
            });
            
            showNotification('Payment category deleted successfully', 'success');
            loadPaymentCategories();
            
        } catch (error) {
            console.error('Failed to delete category:', error);
            showNotification('Failed to delete category', 'error');
        }
    }
}

// Reports functionality
function initializeReports() {
    // Load payment categories for filter
    loadPaymentCategories();
    
    // Load classes for filter
    loadClasses().then(() => {
        const classFilter = document.getElementById('reportClassFilter');
        if (classFilter) {
            classFilter.innerHTML = '<option value="all">All Classes</option>';
            currentClasses.forEach(cls => {
                classFilter.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
            });
        }
    });
    
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const dateRangeInput = document.getElementById('reportDateRange');
    if (dateRangeInput) {
        dateRangeInput.value = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
    }
}

async function generateReport() {
    const dateRange = document.getElementById('reportDateRange').value;
    const paymentType = document.getElementById('reportPaymentType').value;
    const classFilter = document.getElementById('reportClassFilter').value;
    
    if (!dateRange) {
        showNotification('Please select a date range', 'error');
        return;
    }
    
    try {
        // Parse date range
        const [startDateStr, endDateStr] = dateRange.split(' to ');
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        // Build query parameters
        const params = new URLSearchParams({
            start: startDate.toISOString(),
            end: endDate.toISOString()
        });
        
        if (paymentType && paymentType !== 'all') {
            params.append('payment_type', paymentType);
        }
        
        // Get payments data
        const payments = await apiCall(`/api/student-payments/by-date?${params.toString()}`);
        
        // Filter by class if specified
        let filteredPayments = payments;
        if (classFilter && classFilter !== 'all') {
            const classStudents = await apiCall(`/api/students/by-class/${classFilter}`);
            const studentIds = classStudents.map(s => parseInt(s.id));
            filteredPayments = payments.filter(p => studentIds.includes(p.student_id));
        }
        
        // Generate report
        const reportData = generateReportData(filteredPayments);
        renderReport(reportData);
        
    } catch (error) {
        console.error('Failed to generate report:', error);
        showNotification('Failed to generate report', 'error');
    }
}

function generateReportData(payments) {
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
    const totalOutstanding = payments.reduce((sum, p) => sum + Math.max(0, (parseFloat(p.amount) || 0) - (parseFloat(p.amount_paid) || 0)), 0);
    
    const byType = payments.reduce((acc, p) => {
        const type = p.payment_type || 'unknown';
        if (!acc[type]) {
            acc[type] = { count: 0, paid: 0, outstanding: 0 };
        }
        acc[type].count++;
        acc[type].paid += parseFloat(p.amount_paid) || 0;
        acc[type].outstanding += Math.max(0, (parseFloat(p.amount) || 0) - (parseFloat(p.amount_paid) || 0));
        return acc;
    }, {});
    
    const byMethod = payments.reduce((acc, p) => {
        const method = p.payment_method || 'unknown';
        if (!acc[method]) {
            acc[method] = { count: 0, amount: 0 };
        }
        acc[method].count++;
        acc[method].amount += parseFloat(p.amount_paid) || 0;
        return acc;
    }, {});
    
    return {
        totalPaid,
        totalOutstanding,
        totalTransactions: payments.length,
        byType,
        byMethod,
        payments
    };
}

function renderReport(reportData) {
    const resultsContainer = document.getElementById('reportResults');
    
    resultsContainer.innerHTML = `
        <div class="report-summary">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">Total Paid</div>
                    <div class="stat-value">${formatCurrency(reportData.totalPaid)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Outstanding</div>
                    <div class="stat-value">${formatCurrency(reportData.totalOutstanding)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Transactions</div>
                    <div class="stat-value">${reportData.totalTransactions}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="card">
                    <div class="card-header">
                        <h5>By Payment Type</h5>
                    </div>
                    <div class="card-content">
                        ${Object.entries(reportData.byType).map(([type, data]) => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>${type}</span>
                                <span>${formatCurrency(data.paid)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5>By Payment Method</h5>
                    </div>
                    <div class="card-content">
                        ${Object.entries(reportData.byMethod).map(([method, data]) => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>${method}</span>
                                <span>${formatCurrency(data.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Settings functionality
async function loadSettings() {
    // Settings are typically stored in a configuration file or database
    // For now, we'll use localStorage as a fallback
    const settings = JSON.parse(localStorage.getItem('schoolSettings') || '{}');
    
    document.getElementById('schoolName').value = settings.schoolName || 'Abuzarban School';
    document.getElementById('schoolAddress').value = settings.schoolAddress || '';
    document.getElementById('schoolPhone').value = settings.schoolPhone || '';
    document.getElementById('schoolEmail').value = settings.schoolEmail || '';
}

async function saveSettings() {
    const settings = {
        schoolName: document.getElementById('schoolName').value,
        schoolAddress: document.getElementById('schoolAddress').value,
        schoolPhone: document.getElementById('schoolPhone').value,
        schoolEmail: document.getElementById('schoolEmail').value
    };
    
    try {
        // Save to localStorage (in a real app, this would be saved to the backend)
        localStorage.setItem('schoolSettings', JSON.stringify(settings));
        
        showNotification('Settings saved successfully', 'success');
        
    } catch (error) {
        console.error('Failed to save settings:', error);
        showNotification('Failed to save settings', 'error');
    }
}

// Student management functions (existing functionality)
async function addStudent() {
    await loadClassesForModal();
    document.getElementById('studentModal').classList.add('active');
}

async function loadClassesForModal() {
    try {
        const classes = await apiCall('/api/classes/');
        const studentClassSelect = document.getElementById('studentClass');
        
        if (studentClassSelect) {
            studentClassSelect.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(cls => {
                studentClassSelect.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Failed to load classes for modal:', error);
    }
}

async function saveStudent() {
    const studentData = {
        name: document.getElementById('studentName').value,
        guardian: document.getElementById('guardianName').value,
        phone: document.getElementById('studentPhone').value,
        email: document.getElementById('studentEmail').value,
        classId: document.getElementById('studentClass').value,
        balance: 0
    };
    
    if (!studentData.name || !studentData.classId) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        await apiCall('/api/students/add', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
        
        showNotification('Student added successfully', 'success');
        closeModal();
        loadStudents();
        
    } catch (error) {
        console.error('Failed to save student:', error);
        showNotification('Failed to save student', 'error');
    }
}

async function editStudent(studentId) {
    try {
        const student = await apiCall(`/api/students/student/${studentId}`);
        await loadClassesForModal();
        
        document.getElementById('studentName').value = student.name;
        document.getElementById('guardianName').value = student.guardian || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentClass').value = student.classId || '';
        
        // Change form to edit mode
        const form = document.getElementById('addStudentForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await updateStudent(studentId);
        };
        
        document.getElementById('studentModal').classList.add('active');
        
    } catch (error) {
        console.error('Failed to load student:', error);
        showNotification('Failed to load student', 'error');
    }
}

async function updateStudent(studentId) {
    const studentData = {
        name: document.getElementById('studentName').value,
        guardian: document.getElementById('guardianName').value,
        phone: document.getElementById('studentPhone').value,
        email: document.getElementById('studentEmail').value,
        classId: document.getElementById('studentClass').value
    };
    
    try {
        await apiCall(`/api/students/update/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(studentData)
        });
        
        showNotification('Student updated successfully', 'success');
        closeModal();
        loadStudents();
        
    } catch (error) {
        console.error('Failed to update student:', error);
        showNotification('Failed to update student', 'error');
    }
}

async function deleteStudent(studentId) {
    if (await showConfirm('Are you sure you want to delete this student?', 'Delete Student')) {
        try {
            await apiCall(`/api/students/student/${studentId}`, {
                method: 'DELETE'
            });
            
            showNotification('Student deleted successfully', 'success');
            loadStudents();
            
        } catch (error) {
            console.error('Failed to delete student:', error);
            showNotification('Failed to delete student', 'error');
        }
    }
}

// Class management functions (existing functionality)
async function addClass() {
    document.getElementById('classModal').classList.add('active');
}

async function saveClass() {
    const classData = {
        name: document.getElementById('className').value,
        level: document.getElementById('classLevel').value,
        teacher: document.getElementById('classTeacher').value,
        capacity: parseInt(document.getElementById('classCapacity').value) || 30
    };
    
    if (!classData.name || !classData.level) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        await apiCall('/api/classes/', {
            method: 'POST',
            body: JSON.stringify(classData)
        });
        
        showNotification('Class added successfully', 'success');
        closeModal();
        loadClasses();
        
    } catch (error) {
        console.error('Failed to save class:', error);
        showNotification('Failed to save class', 'error');
    }
}

async function editClass(classId) {
    try {
        const classData = await apiCall(`/api/classes/${classId}`);
        
        document.getElementById('className').value = classData.name;
        document.getElementById('classLevel').value = classData.level;
        document.getElementById('classTeacher').value = classData.teacher || '';
        document.getElementById('classCapacity').value = classData.capacity || 30;
        
        // Change form to edit mode
        const form = document.getElementById('addClassForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await updateClass(classId);
        };
        
        document.getElementById('classModal').classList.add('active');
        
    } catch (error) {
        console.error('Failed to load class:', error);
        showNotification('Failed to load class', 'error');
    }
}

async function updateClass(classId) {
    const classData = {
        name: document.getElementById('className').value,
        level: document.getElementById('classLevel').value,
        teacher: document.getElementById('classTeacher').value,
        capacity: parseInt(document.getElementById('classCapacity').value) || 30
    };
    
    try {
        await apiCall(`/api/classes/${classId}`, {
            method: 'PUT',
            body: JSON.stringify(classData)
        });
        
        showNotification('Class updated successfully', 'success');
        closeModal();
        loadClasses();
        
    } catch (error) {
        console.error('Failed to update class:', error);
        showNotification('Failed to update class', 'error');
    }
}

async function deleteClass(classId) {
    if (await showConfirm('Are you sure you want to delete this class?', 'Delete Class')) {
        try {
            await apiCall(`/api/classes/${classId}`, {
                method: 'DELETE'
            });
            
            showNotification('Class deleted successfully', 'success');
            loadClasses();
            
        } catch (error) {
            console.error('Failed to delete class:', error);
            showNotification('Failed to delete class', 'error');
        }
    }
}

// Search and filter functionality
function setupStudentSearch() {
    const searchInput = document.getElementById('studentSearch');
    if (!searchInput) return;
    
    const debouncedSearch = debounce((query) => {
        if (query.length === 0) {
            renderStudents(currentStudents);
            return;
        }
        
        const filteredStudents = currentStudents.filter(student => 
            student.name.toLowerCase().includes(query.toLowerCase()) ||
            student.id.toString().includes(query) ||
            (student.guardian && student.guardian.toLowerCase().includes(query.toLowerCase()))
        );
        
        renderStudents(filteredStudents);
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

function filterStudents() {
    const classFilter = document.getElementById('studentClassFilter').value;
    const searchQuery = document.getElementById('studentSearch').value.toLowerCase();
    
    let filteredStudents = currentStudents;
    
    if (classFilter) {
        filteredStudents = filteredStudents.filter(student => student.classId == classFilter);
    }
    
    if (searchQuery) {
        filteredStudents = filteredStudents.filter(student => 
            student.name.toLowerCase().includes(searchQuery) ||
            student.id.toString().includes(searchQuery) ||
            (student.guardian && student.guardian.toLowerCase().includes(searchQuery))
        );
    }
    
    renderStudents(filteredStudents);
}

function sortStudents() {
    const sortBy = prompt('Sort by: name, id, class, balance');
    if (!sortBy) return;
    
    const sortedStudents = [...currentStudents].sort((a, b) => {
        switch(sortBy.toLowerCase()) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'id':
                return a.id.localeCompare(b.id);
            case 'class':
                const classA = currentClasses.find(c => c.id == a.classId)?.name || '';
                const classB = currentClasses.find(c => c.id == b.classId)?.name || '';
                return classA.localeCompare(classB);
            case 'balance':
                return (b.balance || 0) - (a.balance || 0);
            default:
                return 0;
        }
    });
    
    renderStudents(sortedStudents);
}

// Modal management
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    // Reset forms
    document.querySelectorAll('form').forEach(form => {
        form.reset();
        form.onsubmit = null;
    });
}

// Theme management
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Custom popup system for confirmations
async function showConfirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                    <button class="btn btn-ghost" onclick="this.closest('.modal').remove(); resolve(false)">Cancel</button>
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); resolve(true)">Confirm</button>
                </div>
            </div>
        `;
        
        // Add event listeners to buttons
        const buttons = modal.querySelectorAll('button');
        buttons[0].onclick = () => { modal.remove(); resolve(false); };
        buttons[1].onclick = () => { modal.remove(); resolve(true); };
        
        document.body.appendChild(modal);
    });
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Setup navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Setup modal close buttons
    document.querySelectorAll('.btn-ghost').forEach(btn => {
        if (btn.textContent.trim() === 'Cancel') {
            btn.addEventListener('click', closeModal);
        }
    });
    
    // Setup form submissions
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveStudent();
        });
    }
    
    const addClassForm = document.getElementById('addClassForm');
    if (addClassForm) {
        addClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveClass();
        });
    }
    
    const addSessionForm = document.getElementById('addSessionForm');
    if (addSessionForm) {
        addSessionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSession();
        });
    }
    
    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveCategory();
        });
    }
    
    // Setup search functionality
    setupStudentSearch();
    setupPaymentStudentSearch();
    setupPaymentTypeHandler();
    
    // Setup modal overlay clicks
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
    
    // Setup keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Initialize with dashboard
    showSection('dashboard');
});

// Make functions globally available
window.showSection = showSection;
window.addStudent = addStudent;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.addClass = addClass;
window.editClass = editClass;
window.deleteClass = deleteClass;
window.addSession = addSession;
window.saveSession = saveSession;
window.editSession = editSession;
window.deleteSession = deleteSession;
window.recordPayment = recordPayment;
window.openEnrollmentModal = openEnrollmentModal;
window.loadClassStudents = loadClassStudents;
window.enrollSelectedStudents = enrollSelectedStudents;
window.loadInvoices = loadInvoices;
window.generateClassInvoices = generateClassInvoices;
window.saveExpense = saveExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.filterExpenses = filterExpenses;
window.addPaymentCategory = addPaymentCategory;
window.saveCategory = saveCategory;
window.editPaymentCategory = editPaymentCategory;
window.deletePaymentCategory = deletePaymentCategory;
window.generateReport = generateReport;
window.saveSettings = saveSettings;
window.closeModal = closeModal;
window.toggleTheme = toggleTheme;
window.filterStudents = filterStudents;
window.sortStudents = sortStudents;
window.showConfirm = showConfirm;