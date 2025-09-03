// Global variables
let currentStudents = [];
let currentClasses = [];
let currentSessions = [];
let currentPaymentCategories = [];
let currentExpenses = [];
let selectedStudentId = null;
let sortDirection = {};

// API Base URL
const API_BASE_URL = 'http://localhost:8001';

// Theme management
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-icon').className = 'fas fa-sun';
    }
    
    initializeApp();
});

// Navigation handling
function initializeApp() {
    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Initialize dashboard
    showSection('dashboard');
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active nav item
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
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
            loadPaymentForm();
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
            loadReports();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        // Load students count
        const studentsResponse = await fetch(`${API_BASE_URL}/api/students/all`);
        const students = await studentsResponse.json();
        document.getElementById('activeStudents').textContent = students.length;
        
        // Load payment summary
        const paymentsResponse = await fetch(`${API_BASE_URL}/api/student-payments/summary-all`);
        const paymentSummary = await paymentsResponse.json();
        document.getElementById('totalRevenue').textContent = `₦${Number(paymentSummary.total_paid || 0).toFixed(2)}`;
        document.getElementById('outstandingFees').textContent = `₦${Number(paymentSummary.total_outstanding || 0).toFixed(2)}`;
        
        // Load expenses summary
        const expensesResponse = await fetch(`${API_BASE_URL}/api/expenses/summary`);
        const expensesSummary = await expensesResponse.json();
        document.getElementById('totalExpenses').textContent = `₦${Number(expensesSummary.total || 0).toFixed(2)}`;
        
        // Load recent transactions
        await loadRecentTransactions();
        
        // Initialize charts
        initializeCharts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

async function loadRecentTransactions() {
    try {
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const response = await fetch(`${API_BASE_URL}/api/student-payments/by-date?start=${lastWeek.toISOString()}&end=${today.toISOString()}`);
        const transactions = await response.json();
        
        const tbody = document.querySelector('#recentTransactionsTable tbody');
        tbody.innerHTML = '';
        
        transactions.slice(-10).reverse().forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>Student ${transaction.student_id}</td>
                <td>${transaction.payment_type || 'N/A'}</td>
                <td>₦${Number(transaction.amount_paid || 0).toFixed(2)}</td>
                <td><span class="badge ${getStatusBadgeClass(transaction.status)}">${transaction.status}</span></td>
                <td>${transaction.payment_method || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

function initializeCharts() {
    // Revenue vs Expenses Chart
    const revenueCtx = document.getElementById('revenueExpenseChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 15000, 13000, 18000, 16000, 20000],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Expenses',
                    data: [8000, 9000, 7500, 11000, 9500, 12000],
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

// Students module (existing implementation)
async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/all`);
        currentStudents = await response.json();
        
        // Load classes for filter
        await loadClassesForFilter();
        
        renderStudents(currentStudents);
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification('Error loading students', 'error');
    }
}

async function loadClassesForFilter() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/classes/`);
        const classes = await response.json();
        
        const classFilter = document.getElementById('studentClassFilter');
        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            classFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading classes for filter:', error);
    }
}

function renderStudents(students) {
    const grid = document.getElementById('studentsGrid');
    grid.innerHTML = '';
    
    students.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        studentCard.innerHTML = `
            <div class="student-info">
                <div class="student-avatar">
                    ${student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div class="student-details">
                    <h4>${student.name || 'Unknown'}</h4>
                    <p>ID: ${student.id}</p>
                    <p>Guardian: ${student.guardian || 'N/A'}</p>
                    <p>Phone: ${student.phone || 'N/A'}</p>
                </div>
            </div>
            <div class="student-balance">
                <span class="text-muted">Balance:</span>
                <span class="${student.balance >= 0 ? 'text-success' : 'text-danger'}">
                    ₦${Number(student.balance || 0).toFixed(2)}
                </span>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-ghost" onclick="deleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        grid.appendChild(studentCard);
    });
}

function addStudent() {
    document.getElementById('studentModal').classList.add('active');
    document.getElementById('addStudentForm').reset();
    
    // Load classes for dropdown
    loadClassesForStudentForm();
}

async function loadClassesForStudentForm() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/classes/`);
        const classes = await response.json();
        
        const classSelect = document.getElementById('studentClass');
        classSelect.innerHTML = '<option value="">Select Class</option>';
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            classSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function editStudent(studentId) {
    try {
        const student = currentStudents.find(s => s.id === studentId);
        if (!student) return;
        
        document.getElementById('studentName').value = student.name || '';
        document.getElementById('guardianName').value = student.guardian || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentClass').value = student.classId || '';
        
        await loadClassesForStudentForm();
        document.getElementById('studentModal').classList.add('active');
        
        // Store the student ID for updating
        document.getElementById('addStudentForm').setAttribute('data-student-id', studentId);
        
    } catch (error) {
        console.error('Error editing student:', error);
        showNotification('Error loading student data', 'error');
    }
}

async function deleteStudent(studentId) {
    const confirmed = await window.customPopup.confirm(
        'Are you sure you want to delete this student? This action cannot be undone.',
        'Delete Student'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/student/${studentId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Student deleted successfully', 'success');
            loadStudents();
        } else {
            throw new Error('Failed to delete student');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showNotification('Error deleting student', 'error');
    }
}

// Classes module (existing implementation)
async function loadClasses() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/classes/`);
        currentClasses = await response.json();
        renderClasses(currentClasses);
    } catch (error) {
        console.error('Error loading classes:', error);
        showNotification('Error loading classes', 'error');
    }
}

function renderClasses(classes) {
    const tbody = document.getElementById('classesTableBody');
    tbody.innerHTML = '';
    
    classes.forEach(cls => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cls.name}</td>
            <td>${cls.level}</td>
            <td>${cls.studentCount || 0}</td>
            <td>${cls.teacher || 'N/A'}</td>
            <td>
                <button class="btn btn-primary" onclick="editClass(${cls.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-ghost" onclick="deleteClass(${cls.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addClass() {
    document.getElementById('classModal').classList.add('active');
    document.getElementById('addClassForm').reset();
}

async function editClass(classId) {
    try {
        const cls = currentClasses.find(c => c.id === classId);
        if (!cls) return;
        
        document.getElementById('className').value = cls.name || '';
        document.getElementById('classLevel').value = cls.level || '';
        document.getElementById('classTeacher').value = cls.teacher || '';
        document.getElementById('classCapacity').value = cls.capacity || '';
        
        document.getElementById('classModal').classList.add('active');
        document.getElementById('addClassForm').setAttribute('data-class-id', classId);
        
    } catch (error) {
        console.error('Error editing class:', error);
        showNotification('Error loading class data', 'error');
    }
}

async function deleteClass(classId) {
    const confirmed = await window.customPopup.confirm(
        'Are you sure you want to delete this class? This action cannot be undone.',
        'Delete Class'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Class deleted successfully', 'success');
            loadClasses();
        } else {
            throw new Error('Failed to delete class');
        }
    } catch (error) {
        console.error('Error deleting class:', error);
        showNotification('Error deleting class', 'error');
    }
}

// Sessions module
async function loadSessions() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/all`);
        currentSessions = await response.json();
        renderSessions(currentSessions);
    } catch (error) {
        console.error('Error loading sessions:', error);
        showNotification('Error loading sessions', 'error');
        // Fallback to empty array if API doesn't exist yet
        currentSessions = [];
        renderSessions(currentSessions);
    }
}

function renderSessions(sessions) {
    const tbody = document.getElementById('sessionsTableBody');
    tbody.innerHTML = '';
    
    sessions.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${session.name}</td>
            <td>${new Date(session.startDate).toLocaleDateString()}</td>
            <td>${new Date(session.endDate).toLocaleDateString()}</td>
            <td><span class="badge ${getStatusBadgeClass(session.status)}">${session.status}</span></td>
            <td>
                <button class="btn btn-primary" onclick="editSession(${session._id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-ghost" onclick="deleteSession(${session._id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addSession() {
    document.getElementById('sessionModal').classList.add('active');
    document.getElementById('addSessionForm').reset();
}

async function editSession(sessionId) {
    try {
        const session = currentSessions.find(s => s._id === sessionId);
        if (!session) return;
        
        document.getElementById('sessionName').value = session.name || '';
        document.getElementById('sessionStartDate').value = session.startDate ? session.startDate.split('T')[0] : '';
        document.getElementById('sessionEndDate').value = session.endDate ? session.endDate.split('T')[0] : '';
        document.getElementById('sessionStatus').value = session.status || 'upcoming';
        
        document.getElementById('sessionModal').classList.add('active');
        document.getElementById('addSessionForm').setAttribute('data-session-id', sessionId);
        
    } catch (error) {
        console.error('Error editing session:', error);
        showNotification('Error loading session data', 'error');
    }
}

async function saveSession() {
    const form = document.getElementById('addSessionForm');
    const sessionId = form.getAttribute('data-session-id');
    
    const sessionData = {
        name: document.getElementById('sessionName').value,
        startDate: document.getElementById('sessionStartDate').value,
        endDate: document.getElementById('sessionEndDate').value,
        status: document.getElementById('sessionStatus').value
    };
    
    try {
        let response;
        if (sessionId) {
            // Update existing session
            sessionData._id = parseInt(sessionId);
            response = await fetch(`${API_BASE_URL}/api/sessions/session`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });
        } else {
            // Create new session
            response = await fetch(`${API_BASE_URL}/api/sessions/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });
        }
        
        if (response.ok) {
            showNotification('Session saved successfully', 'success');
            closeModal();
            loadSessions();
        } else {
            throw new Error('Failed to save session');
        }
    } catch (error) {
        console.error('Error saving session:', error);
        showNotification('Error saving session', 'error');
    }
}

async function deleteSession(sessionId) {
    const confirmed = await window.customPopup.confirm(
        'Are you sure you want to delete this session? This action cannot be undone.',
        'Delete Session'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Session deleted successfully', 'success');
            loadSessions();
        } else {
            throw new Error('Failed to delete session');
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        showNotification('Error deleting session', 'error');
    }
}


// Payment Recording module
async function loadPaymentForm() {
    try {
        // Load payment categories
        const response = await fetch(`${API_BASE_URL}/api/payment-categories/all`);
        const categories = await response.json();
        
        const paymentTypeSelect = document.getElementById('paymentType');
        paymentTypeSelect.innerHTML = '<option value="">Select Payment Type</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = `${category.name} - ₦${Number(category.amount || 0).toFixed(2)}`;
            option.setAttribute('data-amount', category.amount || 0);
            paymentTypeSelect.appendChild(option);
        });
        
        // Set up student search
        setupStudentSearch();
        
    } catch (error) {
        console.error('Error loading payment form:', error);
        showNotification('Error loading payment form', 'error');
    }
}

function setupStudentSearch() {
    const searchInput = document.getElementById('paymentStudentSearch');
    const resultsDiv = document.getElementById('studentSearchResults');
    
    searchInput.addEventListener('input', async function() {
        const query = this.value.trim();
        if (query.length < 2) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/students/search/${encodeURIComponent(query)}`);
            const students = await response.json();
            
            resultsDiv.innerHTML = '';
            students.slice(0, 5).forEach(student => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <strong>${student.name}</strong><br>
                    <small>ID: ${student.id} | Guardian: ${student.guardian || 'N/A'}</small>
                `;
                resultItem.addEventListener('click', () => selectStudent(student));
                resultsDiv.appendChild(resultItem);
            });
        } catch (error) {
            console.error('Error searching students:', error);
        }
    });
}

async function selectStudent(student) {
    selectedStudentId = student.id;
    
    // Clear search results
    document.getElementById('studentSearchResults').innerHTML = '';
    document.getElementById('paymentStudentSearch').value = student.name;
    
    // Show selected student info
    const infoDiv = document.getElementById('selectedStudentInfo');
    infoDiv.innerHTML = `
        <div class="card" style="padding: 1rem; margin: 1rem 0;">
            <h5>${student.name}</h5>
            <p>ID: ${student.id}</p>
            <p>Guardian: ${student.guardian || 'N/A'}</p>
        </div>
    `;
    
    // Load student balance and payment history
    await loadStudentBalance(student.id);
    await loadStudentPaymentHistory(student.id);
}

async function loadStudentBalance(studentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/student-payments/summary/${studentId}`);
        const summary = await response.json();
        
        const balanceDiv = document.getElementById('studentBalance');
        balanceDiv.innerHTML = `
            <div class="card" style="padding: 1rem;">
                <h6>Payment Summary</h6>
                <p>Total Paid: <span class="text-success">₦${Number(summary.total_paid || 0).toFixed(2)}</span></p>
                <p>Outstanding: <span class="text-warning">₦${Number(summary.total_outstanding || 0).toFixed(2)}</span></p>
                <p>Compulsory Outstanding: <span class="text-danger">₦${Number(summary.compulsory_outstanding || 0).toFixed(2)}</span></p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading student balance:', error);
        document.getElementById('studentBalance').innerHTML = '<p class="text-muted">Error loading balance</p>';
    }
}

async function loadStudentPaymentHistory(studentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/student-payments/student/${studentId}`);
        const payments = await response.json();
        
        const historyDiv = document.getElementById('paymentHistory');
        if (payments.length === 0) {
            historyDiv.innerHTML = '<p class="text-muted">No payment history</p>';
            return;
        }
        
        let historyHtml = '<div class="table-container"><table class="table"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
        
        payments.slice(-5).reverse().forEach(payment => {
            historyHtml += `
                <tr>
                    <td>${new Date(payment.date).toLocaleDateString()}</td>
                    <td>${payment.payment_type || 'N/A'}</td>
                    <td>₦${Number(payment.amount_paid || 0).toFixed(2)}</td>
                    <td><span class="badge ${getStatusBadgeClass(payment.status)}">${payment.status}</span></td>
                </tr>
            `;
        });
        
        historyHtml += '</tbody></table></div>';
        historyDiv.innerHTML = historyHtml;
        
    } catch (error) {
        console.error('Error loading payment history:', error);
        document.getElementById('paymentHistory').innerHTML = '<p class="text-muted">Error loading payment history</p>';
    }
}

async function recordPayment() {
    if (!selectedStudentId) {
        showNotification('Please select a student first', 'warning');
        return;
    }
    
    const paymentData = {
        student_id: parseInt(selectedStudentId),
        payment_category_id: parseInt(document.getElementById('paymentType').value),
        amount_paid: parseFloat(document.getElementById('paymentAmount').value),
        payment_method: document.getElementById('paymentMethod').value,
        payment_type: document.getElementById('paymentType').selectedOptions[0]?.textContent.split(' - ')[0] || 'payment'
    };
    
    // Get the category amount for total amount
    const selectedOption = document.getElementById('paymentType').selectedOptions[0];
    if (selectedOption) {
        paymentData.amount = parseFloat(selectedOption.getAttribute('data-amount') || paymentData.amount_paid);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/student-payments/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        if (response.ok) {
            showNotification('Payment recorded successfully', 'success');
            document.getElementById('paymentForm').reset();
            
            // Refresh student balance and history
            if (selectedStudentId) {
                await loadStudentBalance(selectedStudentId);
                await loadStudentPaymentHistory(selectedStudentId);
            }
        } else {
            throw new Error('Failed to record payment');
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        showNotification('Error recording payment', 'error');
    }
}

// Billing module
async function loadBillingData() {
    try {
        // Load sessions for enrollment
        await loadSessionsForBilling();
        
        // Load classes for enrollment and bulk actions
        await loadClassesForBilling();
        
    } catch (error) {
        console.error('Error loading billing data:', error);
        showNotification('Error loading billing data', 'error');
    }
}

async function loadSessionsForBilling() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/all`);
        const sessions = await response.json();
        
        const sessionSelect = document.getElementById('enrollSession');
        sessionSelect.innerHTML = '<option value="">Select Session</option>';
        
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.name;
            option.textContent = session.name;
            sessionSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading sessions for billing:', error);
    }
}

async function loadClassesForBilling() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/classes/`);
        const classes = await response.json();
        
        // Load for enrollment modal
        const enrollClassSelect = document.getElementById('enrollClass');
        enrollClassSelect.innerHTML = '<option value="">Select Class</option>';
        
        // Load for bulk actions
        const bulkActionSelect = document.getElementById('bulkActionClass');
        bulkActionSelect.innerHTML = '<option value="">Select Class</option>';
        
        classes.forEach(cls => {
            const option1 = document.createElement('option');
            option1.value = cls.id;
            option1.textContent = cls.name;
            enrollClassSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = cls.id;
            option2.textContent = cls.name;
            bulkActionSelect.appendChild(option2);
        });
    } catch (error) {
        console.error('Error loading classes for billing:', error);
    }
}

function openEnrollmentModal() {
    document.getElementById('enrollmentModal').classList.add('active');
    loadSessionsForBilling();
    loadClassesForBilling();
}

async function loadClassStudents() {
    const classId = document.getElementById('enrollClass').value;
    const studentsList = document.getElementById('enrollStudentsList');
    
    if (!classId) {
        studentsList.innerHTML = '<p class="text-muted">Select a class to view students</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/by-class/${classId}`);
        const students = await response.json();
        
        if (students.length === 0) {
            studentsList.innerHTML = '<p class="text-muted">No students found in this class</p>';
            return;
        }
        
        let studentsHtml = '';
        students.forEach(student => {
            studentsHtml += `
                <div class="student-checkbox-item">
                    <input type="checkbox" id="student_${student.id}" value="${student.id}">
                    <label for="student_${student.id}">
                        <strong>${student.name}</strong><br>
                        <small>ID: ${student.id} | Guardian: ${student.guardian || 'N/A'}</small>
                    </label>
                </div>
            `;
        });
        
        studentsList.innerHTML = studentsHtml;
        
    } catch (error) {
        console.error('Error loading class students:', error);
        studentsList.innerHTML = '<p class="text-muted">Error loading students</p>';
    }
}

async function enrollSelectedStudents() {
    const session = document.getElementById('enrollSession').value;
    const term = document.getElementById('enrollTerm').value;
    const classId = document.getElementById('enrollClass').value;
    
    if (!session || !term || !classId) {
        showNotification('Please fill in all enrollment details', 'warning');
        return;
    }
    
    const selectedStudents = [];
    const checkboxes = document.querySelectorAll('#enrollStudentsList input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedStudents.push(parseInt(checkbox.value));
    });
    
    if (selectedStudents.length === 0) {
        showNotification('Please select at least one student', 'warning');
        return;
    }
    
    try {
        const enrollmentPromises = selectedStudents.map(studentId => {
            return fetch(`${API_BASE_URL}/api/enrollment/enrollment?generateInvoices=1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    session: session,
                    term: term,
                    class_id: classId
                })
            });
        });
        
        await Promise.all(enrollmentPromises);
        
        showNotification(`Successfully enrolled ${selectedStudents.length} students`, 'success');
        closeModal();
        
    } catch (error) {
        console.error('Error enrolling students:', error);
        showNotification('Error enrolling students', 'error');
    }
}

async function loadInvoices() {
    const searchQuery = document.getElementById('invoiceStudentSearch').value.trim();
    if (!searchQuery) {
        showNotification('Please enter a student name or ID', 'warning');
        return;
    }
    
    try {
        // First, search for the student
        const studentsResponse = await fetch(`${API_BASE_URL}/api/students/search/${encodeURIComponent(searchQuery)}`);
        const students = await studentsResponse.json();
        
        if (students.length === 0) {
            showNotification('No students found', 'warning');
            return;
        }
        
        const student = students[0]; // Take the first match
        
        // Load invoices for this student
        const invoicesResponse = await fetch(`${API_BASE_URL}/api/enrollment/invoices/by-student/${student.id}`);
        const invoices = await invoicesResponse.json();
        
        const tbody = document.getElementById('invoicesTableBody');
        tbody.innerHTML = '';
        
        invoices.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(invoice.date).toLocaleDateString()}</td>
                <td>${invoice.payment_type || 'N/A'}</td>
                <td>₦${Number(invoice.amount || 0).toFixed(2)}</td>
                <td><span class="badge ${getStatusBadgeClass(invoice.status)}">${invoice.status}</span></td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading invoices:', error);
        showNotification('Error loading invoices', 'error');
    }
}

async function generateClassInvoices() {
    const classId = document.getElementById('bulkActionClass').value;
    if (!classId) {
        showNotification('Please select a class', 'warning');
        return;
    }
    
    try {
        // Get students in the class
        const studentsResponse = await fetch(`${API_BASE_URL}/api/students/by-class/${classId}`);
        const students = await studentsResponse.json();
        
        if (students.length === 0) {
            showNotification('No students found in this class', 'warning');
            return;
        }
        
        // Generate invoices for all students in the class
        const currentSession = '2024/2025'; // You might want to make this dynamic
        const currentTerm = 'First';
        
        const enrollmentPromises = students.map(student => {
            return fetch(`${API_BASE_URL}/api/enrollment/enrollment?generateInvoices=1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: student.id,
                    session: currentSession,
                    term: currentTerm,
                    class_id: classId
                })
            });
        });
        
        await Promise.all(enrollmentPromises);
        
        showNotification(`Generated invoices for ${students.length} students`, 'success');
        
    } catch (error) {
        console.error('Error generating class invoices:', error);
        showNotification('Error generating class invoices', 'error');
    }
}

// Expenses module
async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses/all`);
        currentExpenses = await response.json();
        renderExpenses(currentExpenses);
        
        // Set default date range to current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        document.getElementById('expenseStart').value = firstDay.toISOString().split('T')[0];
        document.getElementById('expenseEnd').value = now.toISOString().split('T')[0];
        
    } catch (error) {
        console.error('Error loading expenses:', error);
        showNotification('Error loading expenses', 'error');
    }
}

function renderExpenses(expenses) {
    const tbody = document.getElementById('expensesTableBody');
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(expense.date).toLocaleDateString()}</td>
            <td>${expense.category}</td>
            <td>${expense.description || 'N/A'}</td>
            <td>₦${Number(expense.amount || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-primary" onclick="editExpense(${expense._id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-ghost" onclick="deleteExpense(${expense._id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function saveExpense() {
    const expenseData = {
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value || new Date().toISOString()
    };
    
    if (!expenseData.category || !expenseData.amount) {
        showNotification('Please fill in required fields', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses/expense`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });
        
        if (response.ok) {
            showNotification('Expense saved successfully', 'success');
            document.getElementById('expenseForm').reset();
            loadExpenses();
        } else {
            throw new Error('Failed to save expense');
        }
    } catch (error) {
        console.error('Error saving expense:', error);
        showNotification('Error saving expense', 'error');
    }
}

async function editExpense(expenseId) {
    try {
        const expense = currentExpenses.find(e => e._id === expenseId);
        if (!expense) return;
        
        document.getElementById('expenseCategory').value = expense.category || '';
        document.getElementById('expenseDescription').value = expense.description || '';
        document.getElementById('expenseAmount').value = expense.amount || '';
        document.getElementById('expenseDate').value = expense.date ? expense.date.split('T')[0] : '';
        
        // Store expense ID for updating
        document.getElementById('expenseForm').setAttribute('data-expense-id', expenseId);
        
    } catch (error) {
        console.error('Error editing expense:', error);
        showNotification('Error loading expense data', 'error');
    }
}

async function deleteExpense(expenseId) {
    const confirmed = await window.customPopup.confirm(
        'Are you sure you want to delete this expense? This action cannot be undone.',
        'Delete Expense'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses/expense/${expenseId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Expense deleted successfully', 'success');
            loadExpenses();
        } else {
            throw new Error('Failed to delete expense');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        showNotification('Error deleting expense', 'error');
    }
}

async function filterExpenses() {
    const startDate = document.getElementById('expenseStart').value;
    const endDate = document.getElementById('expenseEnd').value;
    const category = document.getElementById('expenseFilterCategory').value;
    
    try {
        let url = `${API_BASE_URL}/api/expenses/by-date?start=${startDate}&end=${endDate}`;
        if (category && category !== 'all') {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetch(url);
        const expenses = await response.json();
        
        renderExpenses(expenses);
        
        // Update total
        const total = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
        // Note: You might want to add a total display element to the HTML
        
    } catch (error) {
        console.error('Error filtering expenses:', error);
        showNotification('Error filtering expenses', 'error');
    }
}

// Payment Categories module
async function loadPaymentCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/payment-categories/all`);
        currentPaymentCategories = await response.json();
        renderPaymentCategories(currentPaymentCategories);
    } catch (error) {
        console.error('Error loading payment categories:', error);
        showNotification('Error loading payment categories', 'error');
    }
}

function renderPaymentCategories(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = '';
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td><span class="badge ${category.type === 'compulsory' ? 'danger' : 'info'}">${category.type}</span></td>
            <td>₦${Number(category.amount || 0).toFixed(2)}</td>
            <td><span class="badge ${category.is_active !== false ? 'success' : 'warning'}">${category.is_active !== false ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-primary" onclick="editPaymentCategory(${category._id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-ghost" onclick="deletePaymentCategory(${category._id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addPaymentCategory() {
    document.getElementById('categoryModal').classList.add('active');
    document.getElementById('addCategoryForm').reset();
}

async function editPaymentCategory(categoryId) {
    try {
        const category = currentPaymentCategories.find(c => c._id === categoryId);
        if (!category) return;
        
        document.getElementById('categoryName').value = category.name || '';
        document.getElementById('categoryType').value = category.type || 'compulsory';
        document.getElementById('categoryAmount').value = category.amount || '';
        
        document.getElementById('categoryModal').classList.add('active');
        document.getElementById('addCategoryForm').setAttribute('data-category-id', categoryId);
        
    } catch (error) {
        console.error('Error editing payment category:', error);
        showNotification('Error loading category data', 'error');
    }
}

async function saveCategory() {
    const form = document.getElementById('addCategoryForm');
    const categoryId = form.getAttribute('data-category-id');
    
    const categoryData = {
        name: document.getElementById('categoryName').value,
        type: document.getElementById('categoryType').value,
        amount: parseFloat(document.getElementById('categoryAmount').value) || 0
    };
    
    if (!categoryData.name) {
        showNotification('Please enter a category name', 'warning');
        return;
    }
    
    try {
        let response;
        if (categoryId) {
            // Update existing category
            categoryData._id = parseInt(categoryId);
            response = await fetch(`${API_BASE_URL}/api/payment-categories/category`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });
        } else {
            // Create new category
            response = await fetch(`${API_BASE_URL}/api/payment-categories/category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });
        }
        
        if (response.ok) {
            showNotification('Payment category saved successfully', 'success');
            closeModal();
            loadPaymentCategories();
        } else {
            throw new Error('Failed to save payment category');
        }
    } catch (error) {
        console.error('Error saving payment category:', error);
        showNotification('Error saving payment category', 'error');
    }
}

async function deletePaymentCategory(categoryId) {
     const confirmed = await window.customPopup.confirm(
        'Are you sure you want to delete this payment category?'
    );
    if(!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/payment-categories/category/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Payment category deleted successfully', 'success');
            loadPaymentCategories();
        } else {
            throw new Error('Failed to delete payment category');
        }
    } catch (error) {
        console.error('Error deleting payment category:', error);
        showNotification('Error deleting payment category', 'error');
    }
}

// Reports module
async function loadReports() {
    try {
        // Load payment categories for filter
        const categoriesResponse = await fetch(`${API_BASE_URL}/api/payment-categories/all`);
        const categories = await categoriesResponse.json();
        
        const paymentTypeSelect = document.getElementById('reportPaymentType');
        paymentTypeSelect.innerHTML = '<option value="all">All Types</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.type;
            option.textContent = category.type.charAt(0).toUpperCase() + category.type.slice(1);
            paymentTypeSelect.appendChild(option);
        });
        
        // Load classes for filter
        const classesResponse = await fetch(`${API_BASE_URL}/api/classes/`);
        const classes = await classesResponse.json();
        
        const classFilter = document.getElementById('reportClassFilter');
        classFilter.innerHTML = '<option value="all">All Classes</option>';
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            classFilter.appendChild(option);
        });
        
        // Initialize date range picker (simplified)
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        document.getElementById('reportDateRange').value = `${lastMonth.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`;
        
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error loading reports', 'error');
    }
}

async function generateReport() {
    const dateRange = document.getElementById('reportDateRange').value;
    const paymentType = document.getElementById('reportPaymentType').value;
    const classFilter = document.getElementById('reportClassFilter').value;
    
    if (!dateRange) {
        showNotification('Please select a date range', 'warning');
        return;
    }
    
    try {
        // Parse date range (simplified - assumes "YYYY-MM-DD to YYYY-MM-DD" format)
        const dates = dateRange.split(' to ');
        const startDate = dates[0];
        const endDate = dates[1] || dates[0];
        
        // Build query parameters
        let url = `${API_BASE_URL}/api/student-payments/by-date?start=${startDate}&end=${endDate}`;
        if (paymentType && paymentType !== 'all') {
            url += `&payment_type=${paymentType}`;
        }
        
        const response = await fetch(url);
        const payments = await response.json();
        
        // Generate report
        const reportResults = document.getElementById('reportResults');
        
        if (payments.length === 0) {
            reportResults.innerHTML = '<p class="text-muted text-center">No payments found for the selected criteria</p>';
            return;
        }
        
        // Calculate totals
        const totalAmount = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount_paid) || 0), 0);
        const totalTransactions = payments.length;
        
        // Group by payment type
        const byType = payments.reduce((acc, payment) => {
            const type = payment.payment_type || 'Unknown';
            if (!acc[type]) acc[type] = { count: 0, amount: 0 };
            acc[type].count++;
            acc[type].amount += parseFloat(payment.amount_paid) || 0;
            return acc;
        }, {});
        
        let reportHtml = `
            <div class="card" style="margin-bottom: 1rem;">
                <div class="card-content">
                    <h5>Report Summary</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <strong>Total Amount:</strong><br>
                            <span class="text-success">₦${totalAmount.toFixed(2)}</span>
                        </div>
                        <div>
                            <strong>Total Transactions:</strong><br>
                            <span class="text-info">${totalTransactions}</span>
                        </div>
                        <div>
                            <strong>Average Transaction:</strong><br>
                            <span class="text-primary">₦${(totalAmount / totalTransactions).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5>Payment Breakdown by Type</h5>
                </div>
                <div class="card-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Payment Type</th>
                                    <th>Count</th>
                                    <th>Total Amount</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        Object.entries(byType).forEach(([type, data]) => {
            const percentage = ((data.amount / totalAmount) * 100).toFixed(1);
            reportHtml += `
                <tr>
                    <td>${type}</td>
                    <td>${data.count}</td>
                    <td>₦${data.amount.toFixed(2)}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });
        
        reportHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        reportResults.innerHTML = reportHtml;
        
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error generating report', 'error');
    }
}

// Settings module
async function loadSettings() {
    try {
        // Load existing settings if available
        const response = await fetch(`${API_BASE_URL}/api/settings/school`);
        if (response.ok) {
            const settings = await response.json();
            
            document.getElementById('schoolName').value = settings.name || 'Abuzarban School';
            document.getElementById('schoolAddress').value = settings.address || '';
            document.getElementById('schoolPhone').value = settings.phone || '';
            document.getElementById('schoolEmail').value = settings.email || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        // Continue with default values if settings API doesn't exist
    }
}

async function saveSettings() {
    const settingsData = {
        name: document.getElementById('schoolName').value,
        address: document.getElementById('schoolAddress').value,
        phone: document.getElementById('schoolPhone').value,
        email: document.getElementById('schoolEmail').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/settings/school`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
        });
        
        if (response.ok) {
            showNotification('Settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Settings saved locally', 'info');
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Student form submission
    const studentForm = document.getElementById('addStudentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const studentId = this.getAttribute('data-student-id');
            const studentData = {
                name: document.getElementById('studentName').value,
                guardian: document.getElementById('guardianName').value,
                phone: document.getElementById('studentPhone').value,
                email: document.getElementById('studentEmail').value,
                classId: document.getElementById('studentClass').value
            };
            
            try {
                let response;
                if (studentId) {
                    // Update existing student
                    response = await fetch(`${API_BASE_URL}/api/students/update/${studentId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(studentData)
                    });
                } else {
                    // Create new student
                    response = await fetch(`${API_BASE_URL}/api/students/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(studentData)
                    });
                }
                
                if (response.ok) {
                    showNotification('Student saved successfully', 'success');
                    closeModal();
                    loadStudents();
                } else {
                    throw new Error('Failed to save student');
                }
            } catch (error) {
                console.error('Error saving student:', error);
                showNotification('Error saving student', 'error');
            }
        });
    }
    
    // Class form submission
    const classForm = document.getElementById('addClassForm');
    if (classForm) {
        classForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const classId = this.getAttribute('data-class-id');
            const classData = {
                name: document.getElementById('className').value,
                level: document.getElementById('classLevel').value,
                teacher: document.getElementById('classTeacher').value,
                capacity: parseInt(document.getElementById('classCapacity').value) || 30
            };
            
            try {
                let response;
                if (classId) {
                    // Update existing class
                    response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(classData)
                    });
                } else {
                    // Create new class
                    response = await fetch(`${API_BASE_URL}/api/classes/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(classData)
                    });
                }
                
                if (response.ok) {
                    showNotification('Class saved successfully', 'success');
                    closeModal();
                    loadClasses();
                } else {
                    throw new Error('Failed to save class');
                }
            } catch (error) {
                console.error('Error saving class:', error);
                showNotification('Error saving class', 'error');
            }
        });
    }
    
    // Cancel button handlers
    const cancelButtons = document.querySelectorAll('[onclick="closeModal()"], #cancelClassBtn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
});

// Search and filter functions
function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const classFilter = document.getElementById('studentClassFilter').value;
    
    let filteredStudents = currentStudents;
    
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(student => 
            (student.name && student.name.toLowerCase().includes(searchTerm)) ||
            (student.id && student.id.toString().includes(searchTerm)) ||
            (student.guardian && student.guardian.toLowerCase().includes(searchTerm))
        );
    }
    
    if (classFilter) {
        filteredStudents = filteredStudents.filter(student => 
            student.classId === classFilter
        );
    }
    
    renderStudents(filteredStudents);
}

function sortStudents() {
    const sortBy = 'name'; // Default sort by name
    const direction = sortDirection[sortBy] === 'asc' ? 'desc' : 'asc';
    sortDirection[sortBy] = direction;
    
    currentStudents.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        
        if (direction === 'asc') {
            return aVal.localeCompare(bVal);
        } else {
            return bVal.localeCompare(aVal);
        }
    });
    
    renderStudents(currentStudents);
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.addEventListener('input', filterStudents);
    }
});

// Utility functions
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
        // Clear any stored IDs
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => {
            form.removeAttribute('data-student-id');
            form.removeAttribute('data-class-id');
            form.removeAttribute('data-session-id');
            form.removeAttribute('data-category-id');
            form.removeAttribute('data-expense-id');
        });
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'paid':
        case 'active':
        case 'completed':
            return 'success';
        case 'partial':
        case 'upcoming':
            return 'warning';
        case 'unpaid':
        case 'inactive':
        case 'overdue':
            return 'danger';
        default:
            return 'info';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f59e0b';
            break;
        default:
            notification.style.backgroundColor = '#3b82f6';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .search-results {
        position: absolute;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
        z-index: 100;
        width: 100%;
        margin-top: 2px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    [data-theme="dark"] .search-results {
        background: #1f2937;
        border-color: #374151;
    }
    
    .search-result-item {
        padding: 0.75rem;
        cursor: pointer;
        border-bottom: 1px solid #e5e7eb;
        transition: background-color 0.2s;
    }
    
    [data-theme="dark"] .search-result-item {
        border-bottom-color: #374151;
    }
    
    .search-result-item:hover {
        background-color: #f3f4f6;
    }
    
    [data-theme="dark"] .search-result-item:hover {
        background-color: #374151;
    }
    
    .search-result-item:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);

// Payment type change handler
document.addEventListener('DOMContentLoaded', function() {
    const paymentTypeSelect = document.getElementById('paymentType');
    if (paymentTypeSelect) {
        paymentTypeSelect.addEventListener('change', function() {
            const selectedOption = this.selectedOptions[0];
            if (selectedOption && selectedOption.getAttribute('data-amount')) {
                document.getElementById('paymentAmount').value = selectedOption.getAttribute('data-amount');
            }
        });
    }
});

// Click outside modal to close
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Expense form enhancement
document.addEventListener('DOMContentLoaded', function() {
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expenseDate').value = today;
        
        // Handle form submission for updates
        const saveExpenseBtn = document.querySelector('[onclick="saveExpense()"]');
        if (saveExpenseBtn) {
            saveExpenseBtn.addEventListener('click', async function() {
                const expenseId = expenseForm.getAttribute('data-expense-id');
                
                if (expenseId) {
                    // Update existing expense
                    const expenseData = {
                        _id: parseInt(expenseId),
                        category: document.getElementById('expenseCategory').value,
                        description: document.getElementById('expenseDescription').value,
                        amount: parseFloat(document.getElementById('expenseAmount').value),
                        date: document.getElementById('expenseDate').value
                    };
                    
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/expenses/expense`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(expenseData)
                        });
                        
                        if (response.ok) {
                            showNotification('Expense updated successfully', 'success');
                            expenseForm.reset();
                            expenseForm.removeAttribute('data-expense-id');
                            loadExpenses();
                        } else {
                            throw new Error('Failed to update expense');
                        }
                    } catch (error) {
                        console.error('Error updating expense:', error);
                        showNotification('Error updating expense', 'error');
                    }
                }
            });
        }
    }
});

// Enhanced search functionality for students
document.addEventListener('DOMContentLoaded', function() {
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        let searchTimeout;
        studentSearch.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterStudents();
            }, 300); // Debounce search
        });
    }
});

// Table sorting functionality
function setupTableSorting() {
    const sortIcons = document.querySelectorAll('.sort-icon');
    sortIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const sortBy = this.getAttribute('data-sort');
            const table = this.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            const direction = sortDirection[sortBy] === 'asc' ? 'desc' : 'asc';
            sortDirection[sortBy] = direction;
            
            // Update icon states
            sortIcons.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Sort rows
            rows.sort((a, b) => {
                const aVal = a.children[Array.from(table.querySelectorAll('th')).findIndex(th => th.querySelector(`[data-sort="${sortBy}"]`))].textContent;
                const bVal = b.children[Array.from(table.querySelectorAll('th')).findIndex(th => th.querySelector(`[data-sort="${sortBy}"]`))].textContent;
                
                if (direction === 'asc') {
                    return aVal.localeCompare(bVal, undefined, { numeric: true });
                } else {
                    return bVal.localeCompare(aVal, undefined, { numeric: true });
                }
            });
            
            // Re-append sorted rows
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

// Initialize table sorting when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupTableSorting, 1000); // Delay to ensure tables are rendered
});

// Auto-refresh dashboard data every 5 minutes
setInterval(() => {
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection && activeSection.id === 'dashboard-section') {
        loadDashboardData();
    }
}, 5 * 60 * 1000);

// Enhanced error handling for API calls
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Initialize payment method change handler
document.addEventListener('DOMContentLoaded', function() {
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', function() {
            // You can add specific logic for different payment methods here
            console.log('Payment method changed to:', this.value);
        });
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape key to close modals
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl+S to save forms (prevent default browser save)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            const submitBtn = activeModal.querySelector('button[type="submit"], .btn-primary');
            if (submitBtn) {
                submitBtn.click();
            }
        }
    }
});

// Enhanced student search with real-time results
async function performStudentSearch(query) {
    if (query.length < 2) return [];
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/search/${encodeURIComponent(query)}`);
        return await response.json();
    } catch (error) {
        console.error('Error searching students:', error);
        return [];
    }
}

// Initialize all event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Payment form validation
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        const recordBtn = document.querySelector('[onclick="recordPayment()"]');
        if (recordBtn) {
            recordBtn.addEventListener('click', function() {
                // Validate form before submission
                const studentId = selectedStudentId;
                const paymentType = document.getElementById('paymentType').value;
                const amount = document.getElementById('paymentAmount').value;
                const method = document.getElementById('paymentMethod').value;
                
                if (!studentId) {
                    showNotification('Please select a student', 'warning');
                    return;
                }
                
                if (!paymentType || !amount || !method) {
                    showNotification('Please fill in all required fields', 'warning');
                    return;
                }
                
                if (parseFloat(amount) <= 0) {
                    showNotification('Amount must be greater than 0', 'warning');
                    return;
                }
                
                // If validation passes, proceed with recording payment
                recordPayment();
            });
        }
    }
});

// Add loading states for better UX
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-spinner">Loading...</div>';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Enhanced form reset function
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        // Clear any stored data attributes
        const dataAttributes = ['data-student-id', 'data-class-id', 'data-session-id', 'data-category-id', 'data-expense-id'];
        dataAttributes.forEach(attr => {
            form.removeAttribute(attr);
        });
    }
}

// Export functions for global access
window.showSection = showSection;
window.addStudent = addStudent;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.addClass = addClass;
window.editClass = editClass;
window.deleteClass = deleteClass;
window.addSession = addSession;
window.editSession = editSession;
window.saveSession = saveSession;
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
window.editPaymentCategory = editPaymentCategory;
window.saveCategory = saveCategory;
window.deletePaymentCategory = deletePaymentCategory;
window.generateReport = generateReport;
window.saveSettings = saveSettings;
window.closeModal = closeModal;
window.filterStudents = filterStudents;
window.sortStudents = sortStudents;
window.toggleTheme = toggleTheme;