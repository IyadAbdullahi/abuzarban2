window.API_BASE_URL = 'http://localhost:8001';

// Application state
let classes = [
];

let sessions = [
    { id: 1, name: '2023/2024', startDate: '2023-09-01', endDate: '2024-07-31', status: 'completed' },
    { id: 2, name: '2024/2025', startDate: '2024-09-01', endDate: '2025-07-31', status: 'active' },
    { id: 3, name: '2025/2026', startDate: '2025-09-01', endDate: '2026-07-31', status: 'upcoming' }
];

let students = [];
let transactions = [
    { id: 1, date: '2024-08-28', studentId: 1, student: 'Amina Abdullahi', type: 'Tuition Fee', amount: 85000, status: 'Paid', method: 'Bank Transfer', classId: 1 },
    { id: 2, date: '2024-08-28', studentId: 2, student: 'Ibrahim Sani', type: 'Library Fee', amount: 2500, status: 'Paid', method: 'Cash', classId: 1 },
    { id: 3, date: '2024-08-27', studentId: 3, student: 'Fatima Musa', type: 'Sports Fee', amount: 12000, status: 'Pending', method: 'Mobile Money', classId: 2 },
    { id: 4, date: '2024-08-27', studentId: 4, student: 'Yusuf Ahmed', type: 'Exam Fee', amount: 7500, status: 'Paid', method: 'Card', classId: 2 },
    { id: 5, date: '2024-08-26', studentId: 5, student: 'Zainab Hassan', type: 'Transport Fee', amount: 20000, status: 'Overdue', method: '-', classId: 3 },
    { id: 6, date: '2024-08-25', studentId: 6, student: 'Ahmad Bello', type: 'Tuition Fee', amount: 85000, status: 'Paid', method: 'Bank Transfer', classId: 3 },
    { id: 7, date: '2024-08-24', studentId: 7, student: 'Hauwa Ali', type: 'Library Fee', amount: 2500, status: 'Paid', method: 'Cash', classId: 4 }
];

let expenses = [
    { id: 1, date: '2024-08-28', category: 'Utilities', description: 'Electricity bill', amount: 125000.00 },
    { id: 2, date: '2024-08-27', category: 'Supplies', description: 'Office supplies', amount: 35000.00 },
    { id: 3, date: '2024-08-26', category: 'Maintenance', description: 'Building repairs', amount: 280000.00 },
    { id: 4, date: '2024-08-25', category: 'Salaries', description: 'Teacher salaries', amount: 450000.00 },
    { id: 5, date: '2024-08-24', category: 'Transport', description: 'School bus maintenance', amount: 75000.00 }
];

let paymentCategories = [
    { id: 1, name: 'Tuition Fee', type: 'compulsory', amount: 85000.00, status: 'active' },
    { id: 2, name: 'Library Fee', type: 'optional', amount: 2500.00, status: 'active' },
    { id: 3, name: 'Sports Fee', type: 'optional', amount: 12000.00, status: 'active' },
    { id: 4, name: 'Exam Fee', type: 'compulsory', amount: 7500.00, status: 'active' },
    { id: 5, name: 'Transport Fee', type: 'optional', amount: 20000.00, status: 'active' },
    { id: 6, name: 'Computer Lab Fee', type: 'optional', amount: 15000.00, status: 'active' }
];

let enrollments = [];
let selectedStudentForPayment = null;
let currentSort = { field: null, direction: 'asc' };

// Logging utility
const Logger = {
    info: (action, details = {}) => {
        console.log(`[INFO] ${action}:`, details);
    },
    error: (action, error, details = {}) => {
        console.error(`[ERROR] ${action}:`, error, details);
    },
    warn: (action, details = {}) => {
        console.warn(`[WARN] ${action}:`, details);
    },
    success: (action, details = {}) => {
        console.log(`[SUCCESS] ${action}:`, details);
    }
};

// UI Notification System
const Notifications = {
    show: (message, type = 'info', duration = 5000) => {
        const notification = $(`
            <div class="notification notification-${type}" style="
                position: fixed; 
                top: 20px; 
                right: 20px; 
                z-index: 10000;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : type === 'warning' ? '#fef3c7' : '#dbeafe'};
                color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : type === 'warning' ? '#92400e' : '#1e40af'};
                border: 1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#a7f3d0' : type === 'warning' ? '#fde68a' : '#93c5fd'};
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                word-wrap: break-word;
            ">
                ${message}
            </div>
        `);
        
        $('body').append(notification);
        
        setTimeout(() => {
            notification.fadeOut(() => notification.remove());
        }, duration);
        
        Logger.info('Notification shown', { message, type });
    },
    
    error: (message) => Notifications.show(message, 'error'),
    success: (message) => Notifications.show(message, 'success'),
    warning: (message) => Notifications.show(message, 'warning'),
    info: (message) => Notifications.show(message, 'info')
};

// Loading state management
const LoadingState = {
    show: (element, text = 'Loading...') => {
        const $el = $(element);
        $el.data('original-text', $el.text());
        $el.text(text);
        Logger.info('Loading state shown', { element, text });
    },
    
    hide: (element) => {
        const $el = $(element);
        const originalText = $el.data('original-text');
        if (originalText) {
            $el.text(originalText);
            $el.removeData('original-text');
        }
        Logger.info('Loading state hidden', { element });
    }
};

// Utility functions
function getClassName(classId) {
    const classObj = classes.find(c => c.id === classId);
    return classObj ? classObj.name : 'Unknown Class';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(amount);
}

// Theme management
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    
    if (html.hasAttribute('data-theme') && html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
        Logger.info('Theme changed to light');
    } else {
        html.setAttribute('data-theme', 'dark');
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
        Logger.info('Theme changed to dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (icon) icon.className = 'fas fa-sun';
    }
    Logger.info('Theme loaded', { theme: savedTheme || 'light' });
}

// Navigation
function showSection(section) {
    Logger.info('Navigating to section', { section });
    
    $('.content-section').removeClass('active');
    $(`#${section}-section`).addClass('active');
    
    $('.nav-link').removeClass('active');
    $(`[data-section="${section}"]`).addClass('active');
    
    // Load section data
    const sectionLoaders = {
        'dashboard': loadDashboard,
        'students': loadStudents,
        'classes': loadClasses,
        'sessions': loadSessions,
        'payments': loadPayments,
        'billing': loadBilling,
        'expenses': loadExpenses,
        'payment-categories': loadPaymentCategories,
        'reports': loadReports,
        'settings': loadSettings
    };
    
    const loader = sectionLoaders[section];
    if (loader) {
        loader();
        Logger.success('Section loaded', { section });
    } else {
        Logger.warn('No loader found for section', { section });
    }
}

// Form initialization
function initializeForms() {
    Logger.info('Initializing forms');
    
    // Store original button texts
    $('button[type="submit"]').each(function() {
        $(this).data('original-text', $(this).text());
    });
    
    // Add form submit handlers
    $('#addStudentForm').off('submit').on('submit', function(e) {
        e.preventDefault();
        saveStudentEnhanced();
    });
    
    $('#addClassForm').off('submit').on('submit', function(e) {
        e.preventDefault();
        saveClassEnhanced();
    });
    
    Logger.success('Forms initialized');
}

function resetForm(formSelector) {
    const form = $(formSelector);
    form[0].reset();
    form.removeData('editing');
    
    const submitBtn = form.find('button[type="submit"]');
    const originalText = submitBtn.data('original-text') || 'Save';
    submitBtn.text(originalText);
    
    Logger.info('Form reset', { form: formSelector });
}

// Dropdown population
function populateClassDropdowns() {
    Logger.info('Populating class dropdowns');
    
    const dropdowns = ['#studentClass', '#studentClassFilter', '#enrollClass', '#bulkActionClass', '#reportClassFilter'];
    
    dropdowns.forEach(selector => {
        const dropdown = $(selector);
        if (dropdown.length) {
            const currentVal = dropdown.val();
            dropdown.empty();
            
            const isFilter = selector.includes('Filter') || selector.includes('report');
            dropdown.append(isFilter ? '<option value="">All Classes</option>' : '<option value="">Select Class</option>');
            
            classes.forEach(cls => {
                dropdown.append(`<option value="${cls.id}">${cls.name}</option>`);
            });
            
            if (currentVal) dropdown.val(currentVal);
        }
    });

    // Populate session dropdowns
    $('#enrollSession').each(function() {
        const dropdown = $(this);
        dropdown.empty().append('<option value="">Select Session</option>');
        sessions.forEach(session => {
            dropdown.append(`<option value="${session.id}">${session.name}</option>`);
        });
    });

    // Populate payment type dropdowns
    const paymentDropdowns = ['#paymentType', '#reportPaymentType'];
    paymentDropdowns.forEach(selector => {
        const dropdown = $(selector);
        if (dropdown.length) {
            const isReport = selector.includes('report');
            dropdown.empty();
            dropdown.append(isReport ? '<option value="all">All Types</option>' : '<option value="">Select Payment Type</option>');
            
            paymentCategories.forEach(cat => {
                dropdown.append(`<option value="${cat.name.toLowerCase().replace(' ', '_')}">${cat.name}</option>`);
            });
        }
    });
    
    Logger.success('Dropdowns populated');
}

// Dashboard functions
function loadDashboard() {
    Logger.info('Loading dashboard');
    loadRecentTransactions();
    updateDashboardStats();
    initializeCharts();
    loadStudents();
    Logger.success('Dashboard loaded');
}

function loadRecentTransactions() {
    const tbody = $('#recentTransactionsTable tbody');
    tbody.empty();
    
    const recentTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    
    recentTransactions.forEach(transaction => {
        const statusClass = transaction.status === 'Paid' ? 'success' : 
                          transaction.status === 'Pending' ? 'warning' : 'danger';
        
        const row = $(`
            <tr>
                <td>${transaction.date}</td>
                <td>${transaction.student}</td>
                <td>${transaction.type}</td>
                <td>${formatCurrency(transaction.amount)}</td>
                <td><span class="badge ${statusClass}">${transaction.status}</span></td>
                <td>${transaction.method}</td>
            </tr>
        `);
        tbody.append(row);
    });
    
    Logger.info('Recent transactions loaded', { count: recentTransactions.length });
}

function updateDashboardStats() {
    const totalRevenue = transactions
        .filter(t => t.status === 'Paid')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalOutstanding = students
        .reduce((sum, s) => sum + Math.max(0, -s.balance), 0);
    
    const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    $('#totalRevenue').text(formatCurrency(totalRevenue));
    $('#outstandingFees').text(formatCurrency(totalOutstanding));
    $('#activeStudents').text(students.length.toString());
    $('#totalExpenses').text(formatCurrency(totalExpenseAmount));
    
    Logger.info('Dashboard stats updated', {
        totalRevenue,
        totalOutstanding,
        studentCount: students.length,
        totalExpenses: totalExpenseAmount
    });
}

// Students management
async function loadStudents() {
    Logger.info('Loading students from API');
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/students/all`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apiStudents = await response.json();
        students = Array.isArray(apiStudents) ? apiStudents : [];
        
        populateClassDropdowns();
        displayStudents(students);
        updateDashboardStats();
        
        Logger.success('Students loaded from API', { count: students.length });
    } catch (err) {
        Logger.error('Failed to load students from API', err);
        Notifications.error(`Failed to load students: ${err.message}`);
        
        students = [];
        populateClassDropdowns();
        displayStudents([]);
        updateDashboardStats();
    }
}

function displayStudents(studentsToShow) {
    const grid = $('#studentsGrid');
    grid.empty();
    
    studentsToShow.forEach(student => {
        const className = getClassName(student.classId);
        const studentCard = $(`
            <div class="student-card">
                <div class="student-info">
                    <div class="student-avatar">
                        ${student.name.charAt(0)}
                    </div>
                    <div class="student-details">
                        <h4>${student.name}</h4>
                        <p>ID: ${student.id} • ${className}</p>
                        <p>Guardian: ${student.guardian}</p>
                        <p>Phone: ${student.phone}</p>
                    </div>
                    <div style="margin-left:auto;">
                        <button class="btn btn-ghost" title="Edit Student" onclick="editStudent('${student.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                <div class="student-balance">
                    <span>Balance:</span>
                    <span class="${student.balance < 0 ? 'text-danger' : student.balance > 0 ? 'text-warning' : 'text-success'}">
                        ${formatCurrency(Math.abs(student.balance))} ${student.balance < 0 ? 'Outstanding' : student.balance > 0 ? 'Credit' : 'Cleared'}
                    </span>
                </div>
            </div>
        `);
        grid.append(studentCard);
    });
    
    Logger.info('Students displayed', { count: studentsToShow.length });
}

function editStudent(id) {
    const student = students.find(s => String(s.id) === String(id));
    if (!student) {
        Logger.warn('Student not found for editing', { id });
        Notifications.warning('Student not found');
        return;
    }
    
    Logger.info('Opening student edit modal', { studentId: id, studentName: student.name });
    
    populateClassDropdowns();
    
    // Pre-fill form
    $('#studentName').val(student.name);
    $('#guardianName').val(student.guardian);
    $('#studentPhone').val(student.phone);
    $('#studentEmail').val(student.email);
    $('#studentClass').val(student.classId);
    $('#addStudentForm').data('editing', student.id);
    
    $('#studentModal').addClass('active');
}

function filterStudents() {
    const searchQuery = $('#studentSearch').val().toLowerCase();
    const classFilter = $('#studentClassFilter').val();
    
    let filteredStudents = students;
    
    if (searchQuery) {
        filteredStudents = filteredStudents.filter(student =>
            student.name.toLowerCase().includes(searchQuery) ||
            student.guardian.toLowerCase().includes(searchQuery) ||
            student.id.toString().includes(searchQuery) ||
            student.phone.includes(searchQuery)
        );
    }
    
    if (classFilter) {
        filteredStudents = filteredStudents.filter(student => student.classId == classFilter);
    }
    
    displayStudents(filteredStudents);
    Logger.info('Students filtered', { 
        searchQuery, 
        classFilter, 
        originalCount: students.length, 
        filteredCount: filteredStudents.length 
    });
}



// Validation functions
function validateStudent(studentData) {
    const errors = [];
    
    if (!studentData.name || studentData.name.trim().length < 2) {
        errors.push('Student name must be at least 2 characters');
    }
    
    if (!studentData.classId) {
        errors.push('Please select a class');
    }
    
    if (studentData.email && !isValidEmail(studentData.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (studentData.phone && !isValidPhone(studentData.phone)) {
        errors.push('Please enter a valid phone number');
    }
    
    return errors;
}

function validateClass(classData) {
    const errors = [];
    
    if (!classData.name || classData.name.trim().length < 2) {
        errors.push('Class name must be at least 2 characters');
    }
    
    if (!classData.level) {
        errors.push('Please select a level');
    }
    
    if (classData.capacity && (classData.capacity < 1 || classData.capacity > 100)) {
        errors.push('Capacity must be between 1 and 100');
    }
    
    const existingClass = classes.find(c => 
        c.name.toLowerCase() === classData.name.toLowerCase() && 
        c.id !== classData.id
    );
    if (existingClass) {
        errors.push('Class name already exists');
    }
    
    return errors;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Enhanced save functions
async function saveStudentEnhanced() {
    const form = $('#addStudentForm');
    const submitBtn = form.find('button[type="submit"]');
    
    Logger.info('Starting student save process');
    LoadingState.show(submitBtn, 'Saving...');
    
    
    const studentData = {
        name: $('#studentName').val().trim(),
        guardian: $('#guardianName').val().trim(),
        phone: $('#studentPhone').val().trim(),
        email: $('#studentEmail').val().trim(),
        classId: parseInt($('#studentClass').val())
    };
    console.log(`class id >>>>>> ${studentData.classId}`);
    const errors = validateStudent(studentData);
    if (errors.length > 0) {
        Logger.error('Student validation failed', null, { errors, studentData });
        Notifications.error('Please fix the following errors:\n' + errors.join('\n'));
        LoadingState.hide(submitBtn);
        return;
    }
   
    
    const editingId = form.data('editing');
    const url = editingId ? 
        `${window.API_BASE_URL}/api/students/update/${editingId}` : 
        `${window.API_BASE_URL}/api/students/add`;
    const method = editingId ? 'PUT' : 'POST';

     console.log(`edit Id >>>> ${editingId}`);

    try {
        Logger.info('Sending student data to API', { method, url, editingId });
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const savedStudent = await response.json();
        
        closeModal();
        await loadStudents();
        
        const action = editingId ? 'updated' : 'added';
        Notifications.success(`Student ${action} successfully!`);
        Logger.success(`Student ${action}`, { studentId: savedStudent.id, studentName: savedStudent.name });
        
    } catch (err) {
        Logger.error('Failed to save student', err, { studentData, editingId });
        Notifications.error(`Error saving student: ${err.message}`);
    } finally {
        LoadingState.hide(submitBtn);
    }
}

async function saveClassEnhanced() {
    const form = $('#addClassForm');
    const submitBtn = form.find('button[type="submit"]');
    
    Logger.info('Starting class save process');
    LoadingState.show(submitBtn, 'Saving...');
    
    const classData = {
        name: $('#className').val().trim(),
        level: $('#classLevel').val(),
        teacher: $('#classTeacher').val().trim() || 'Not Assigned',
        capacity: parseInt($('#classCapacity').val()) || 30
    };
    
    const editingId = form.data('editing');
    if (editingId) {
        classData.id = editingId;
    }
    
    const errors = validateClass(classData);
    if (errors.length > 0) {
        Logger.error('Class validation failed', null, { errors, classData });
        Notifications.error('Please fix the following errors:\n' + errors.join('\n'));
        LoadingState.hide(submitBtn);
        return;
    }
    
    const url = editingId ? 
        `${window.API_BASE_URL}/api/classes/${editingId}` : 
        `${window.API_BASE_URL}/api/classes`;
    const method = editingId ? 'PUT' : 'POST';
    
    try {
        Logger.info('Sending class data to API', { method, url, editingId });
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(classData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const savedClass = await response.json();
        
        if (editingId) {
            const idx = classes.findIndex(c => c.id === savedClass.id);
            if (idx !== -1) {
                classes[idx] = savedClass;
            }
        } else {
            classes.push(savedClass);
        }
        
        closeModal();
        loadClasses();
        populateClassDropdowns();
        
        const action = editingId ? 'updated' : 'added';
        Notifications.success(`Class ${action} successfully!`);
        Logger.success(`Class ${action}`, { classId: savedClass.id, className: savedClass.name });
        
    } catch (err) {
        Logger.error('Failed to save class', err, { classData, editingId });
        Notifications.error(`Error saving class: ${err.message}`);
    } finally {
        LoadingState.hide(submitBtn);
    }
}

// Classes management
function loadClasses() {
    Logger.info('Loading classes');
    displayClasses(classes);
    Logger.success('Classes loaded', { count: classes.length });
}

function displayClasses(classesToShow) {
    const tbody = $('#classesTableBody');
    tbody.empty();
    
    classesToShow.forEach(cls => {
        const row = $(`
            <tr>
                <td>${cls.name}</td>
                <td>${cls.level}</td>
                <td>${cls.studentCount}/${cls.capacity}</td>
                <td>${cls.teacher}</td>
                <td>
                    <button class="btn btn-ghost" onclick="editClass(${cls.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-ghost" onclick="deleteClass(${cls.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
        tbody.append(row);
    });
    
    Logger.info('Classes displayed', { count: classesToShow.length });
}

function addClass() {
    Logger.info('Opening add class modal');
    resetForm('#addClassForm');
    $('#classModal').addClass('active');
}

function editClass(id) {
    const cls = classes.find(c => c.id === id);
    if (!cls) {
        Logger.warn('Class not found for editing', { id });
        Notifications.warning('Class not found');
        return;
    }
    
    Logger.info('Opening class edit modal', { classId: id, className: cls.name });
    
    $('#className').val(cls.name);
    $('#classLevel').val(cls.level);
    $('#classTeacher').val(cls.teacher);
    $('#classCapacity').val(cls.capacity);
    $('#addClassForm').data('editing', id);
    
    $('#classModal').addClass('active');
}

function deleteClass(id) {
    const cls = classes.find(c => c.id === id);
    if (!cls) {
        Logger.warn('Class not found for deletion', { id });
        Notifications.warning('Class not found');
        return;
    }
    
    const hasStudents = students.some(s => s.classId === id);
    if (hasStudents) {
        Logger.warn('Cannot delete class with students', { classId: id, className: cls.name });
        Notifications.warning('Cannot delete class with enrolled students');
        return;
    }
    
    // Use confirmation modal instead of confirm()
    if (window.confirm && window.confirm(`Are you sure you want to delete ${cls.name}?`)) {
        classes = classes.filter(c => c.id !== id);
        loadClasses();
        populateClassDropdowns();
        
        Logger.success('Class deleted', { classId: id, className: cls.name });
        Notifications.success(`Class "${cls.name}" deleted successfully`);
    }
}

// Sessions management
function loadSessions() {
    Logger.info('Loading sessions');
    displaySessions(sessions);
    Logger.success('Sessions loaded', { count: sessions.length });
}

function displaySessions(sessionsToShow) {
    const tbody = $('#sessionsTableBody');
    tbody.empty();
    
    sessionsToShow.forEach(session => {
        const statusClass = session.status === 'active' ? 'success' : 
                          session.status === 'upcoming' ? 'warning' : 'info';
        
        const row = $(`
            <tr>
                <td>${session.name}</td>
                <td>${session.startDate}</td>
                <td>${session.endDate}</td>
                <td><span class="badge ${statusClass}">${session.status}</span></td>
                <td>
                    <button class="btn btn-ghost" onclick="editSession(${session.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-ghost" onclick="deleteSession(${session.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
        tbody.append(row);
    });
    
    Logger.info('Sessions displayed', { count: sessionsToShow.length });
}

function addSession() {
    Logger.info('Opening add session modal');
    resetForm('#addSessionForm');
    $('#sessionModal').addClass('active');
}

function saveSession() {
    const name = $('#sessionName').val().trim();
    const startDate = $('#sessionStartDate').val();
    const endDate = $('#sessionEndDate').val();
    const status = $('#sessionStatus').val();
    if (!name || !startDate || !endDate) {
        Logger.warn('Session validation failed - missing required fields');
        Notifications.warning('Please fill in all required fields');
        return;
    }
    
    const editingId = $('#addSessionForm').data('editing');
    
    if (editingId) {
        const session = sessions.find(s => s.id === editingId);
        if (session) {
            session.name = name;
            session.startDate = startDate;
            session.endDate = endDate;
            session.status = status;
            Logger.success('Session updated', { sessionId: editingId, sessionName: name });
        }
        $('#addSessionForm').removeData('editing');
    } else {
        const newSession = {
            id: Math.max(...sessions.map(s => s.id)) + 1,
            name,
            startDate,
            endDate,
            status
        };
        sessions.push(newSession);
        Logger.success('Session created', { sessionId: newSession.id, sessionName: name });
    }
    
    closeModal();
    loadSessions();
    populateClassDropdowns();
    Notifications.success(`Session ${editingId ? 'updated' : 'created'} successfully`);
}

function editSession(id) {
    const session = sessions.find(s => s.id === id);
    if (!session) {
        Logger.warn('Session not found for editing', { id });
        Notifications.warning('Session not found');
        return;
    }
    
    Logger.info('Opening session edit modal', { sessionId: id, sessionName: session.name });
    
    $('#sessionName').val(session.name);
    $('#sessionStartDate').val(session.startDate);
    $('#sessionEndDate').val(session.endDate);
    $('#sessionStatus').val(session.status);
    
    $('#sessionModal').addClass('active');
    $('#addSessionForm').data('editing', id);
}

function deleteSession(id) {
    const session = sessions.find(s => s.id === id);
    if (!session) {
        Logger.warn('Session not found for deletion', { id });
        Notifications.warning('Session not found');
        return;
    }
    
    if (window.confirm && window.confirm(`Are you sure you want to delete ${session.name}?`)) {
        sessions = sessions.filter(s => s.id !== id);
        loadSessions();
        populateClassDropdowns();
        
        Logger.success('Session deleted', { sessionId: id, sessionName: session.name });
        Notifications.success(`Session "${session.name}" deleted successfully`);
    }
}

// Payment functions
function loadPayments() {
    Logger.info('Loading payments section');
    populateClassDropdowns();
    setupPaymentSearch();
    Logger.success('Payments section loaded');
}

function setupPaymentSearch() {
    let searchTimeout;
    
    $('#paymentStudentSearch').off('input').on('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = $(this).val().toLowerCase().trim();
            
            if (query.length < 2) {
                $('#studentSearchResults').empty().hide();
                return;
            }
            
            const results = students.filter(student =>
                student.name.toLowerCase().includes(query) ||
                student.id.toString().includes(query)
            ).slice(0, 5);
            
            const resultsContainer = $('#studentSearchResults');
            resultsContainer.empty();
            
            if (results.length > 0) {
                results.forEach(student => {
                    const className = getClassName(student.classId);
                    const resultItem = $(`
                        <div class="search-result-item" data-student-id="${student.id}">
                            <strong>${student.name}</strong> (ID: ${student.id})<br>
                            <small>${className} • Balance: ${formatCurrency(student.balance)}</small>
                        </div>
                    `);
                    
                    resultItem.click(() => selectStudentForPayment(student));
                    resultsContainer.append(resultItem);
                });
                resultsContainer.show();
                Logger.info('Payment search results shown', { query, resultCount: results.length });
            } else {
                resultsContainer.hide();
                Logger.info('No payment search results', { query });
            }
        }, 300);
    });
}

function selectStudentForPayment(student) {
    selectedStudentForPayment = student;
    const className = getClassName(student.classId);
    
    $('#paymentStudentSearch').val(student.name);
    $('#studentSearchResults').hide();
    
    $('#selectedStudentInfo').html(`
        <div class="card" style="padding: 1rem; background: var(--background);">
            <h6>${student.name}</h6>
            <p>ID: ${student.id} • Class: ${className}</p>
            <p>Current Balance: <span class="${student.balance < 0 ? 'text-danger' : student.balance > 0 ? 'text-warning' : 'text-success'}">
                ${formatCurrency(student.balance)}
            </span></p>
        </div>
    `);
    
    loadStudentBalance(student.id);
    loadStudentPaymentHistory(student.id);
    
    Logger.success('Student selected for payment', { studentId: student.id, studentName: student.name });
}

function loadStudentBalance(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    $('#studentBalance').html(`
        <div class="card" style="padding: 1rem;">
            <h6>Current Balance</h6>
            <h4 class="${student.balance < 0 ? 'text-danger' : student.balance > 0 ? 'text-warning' : 'text-success'}">
                ${formatCurrency(student.balance)}
            </h4>
            ${student.balance < 0 ? '<p class="text-danger">Outstanding Amount</p>' : 
              student.balance > 0 ? '<p class="text-warning">Credit Balance</p>' : 
              '<p class="text-success">Account Cleared</p>'}
        </div>
    `);
}

function loadStudentPaymentHistory(studentId) {
    const studentTransactions = transactions.filter(t => t.studentId === studentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (studentTransactions.length === 0) {
        $('#paymentHistory').html('<p class="text-muted">No payment history</p>');
        return;
    }
    
    let historyHtml = '<div class="table-container"><table class="table"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
    
    studentTransactions.slice(0, 5).forEach(transaction => {
        const statusClass = transaction.status === 'Paid' ? 'success' : 
                          transaction.status === 'Pending' ? 'warning' : 'danger';
        
        historyHtml += `
            <tr>
                <td>${transaction.date}</td>
                <td>${transaction.type}</td>
                <td>${formatCurrency(transaction.amount)}</td>
                <td><span class="badge ${statusClass}">${transaction.status}</span></td>
            </tr>
        `;
    });
    
    historyHtml += '</tbody></table></div>';
    $('#paymentHistory').html(historyHtml);
    
    Logger.info('Student payment history loaded', { studentId, transactionCount: studentTransactions.length });
}

function recordPayment() {
    if (!selectedStudentForPayment) {
        Logger.warn('Payment attempted without selected student');
        Notifications.warning('Please select a student first');
        return;
    }
    
    const type = $('#paymentType').val();
    const amount = parseFloat($('#paymentAmount').val());
    const method = $('#paymentMethod').val();
    
    if (!type || !amount || amount <= 0) {
        Logger.warn('Payment validation failed', { type, amount, method });
        Notifications.warning('Please fill in all payment details');
        return;
    }
    
    const newTransaction = {
        id: Math.max(...transactions.map(t => t.id)) + 1,
        date: new Date().toISOString().split('T')[0],
        studentId: selectedStudentForPayment.id,
        student: selectedStudentForPayment.name,
        type: paymentCategories.find(cat => cat.name.toLowerCase().replace(' ', '_') === type)?.name || type,
        amount,
        status: 'Paid',
        method,
        classId: selectedStudentForPayment.classId
    };
    
    transactions.push(newTransaction);
    
    // Update student balance
    const student = students.find(s => s.id === selectedStudentForPayment.id);
    if (student) {
        student.balance += amount;
    }
    
    // Reset form
    $('#paymentForm')[0].reset();
    
    // Refresh displays
    loadStudentBalance(selectedStudentForPayment.id);
    loadStudentPaymentHistory(selectedStudentForPayment.id);
    updateDashboardStats();
    
    Logger.success('Payment recorded', {
        transactionId: newTransaction.id,
        studentId: selectedStudentForPayment.id,
        amount,
        type: newTransaction.type
    });
    Notifications.success(`Payment of ${formatCurrency(amount)} recorded for ${selectedStudentForPayment.name}`);
}

// Billing functions
function loadBilling() {
    Logger.info('Loading billing section');
    populateClassDropdowns();
    Logger.success('Billing section loaded');
}

function openEnrollmentModal() {
    Logger.info('Opening enrollment modal');
    populateClassDropdowns();
    $('#enrollmentModal').addClass('active');
}

function loadClassStudents() {
    const classId = parseInt($('#enrollClass').val());
    if (!classId) {
        $('#enrollStudentsList').html('<p class="text-muted">Select a class to view students</p>');
        return;
    }
    
    const classStudents = students.filter(s => s.classId === classId);
    const container = $('#enrollStudentsList');
    container.empty();
    
    if (classStudents.length === 0) {
        container.html('<p class="text-muted">No students in this class</p>');
        Logger.info('No students found for class', { classId });
        return;
    }
    
    classStudents.forEach(student => {
        const item = $(`
            <div class="student-checkbox-item">
                <input type="checkbox" value="${student.id}" id="student_${student.id}">
                <label for="student_${student.id}">
                    <strong>${student.name}</strong><br>
                    <small>ID: ${student.id} • Balance: ${formatCurrency(student.balance)}</small>
                </label>
            </div>
        `);
        container.append(item);
    });
    
    Logger.info('Class students loaded for enrollment', { classId, studentCount: classStudents.length });
}

function enrollSelectedStudents() {
    const sessionId = parseInt($('#enrollSession').val());
    const term = $('#enrollTerm').val();
    const classId = parseInt($('#enrollClass').val());
    
    if (!sessionId || !term || !classId) {
        Logger.warn('Enrollment validation failed', { sessionId, term, classId });
        Notifications.warning('Please fill in all enrollment details');
        return;
    }
    
    const selectedStudentIds = [];
    $('#enrollStudentsList input[type="checkbox"]:checked').each(function() {
        selectedStudentIds.push(parseInt($(this).val()));
    });
    
    if (selectedStudentIds.length === 0) {
        Logger.warn('No students selected for enrollment');
        Notifications.warning('Please select at least one student');
        return;
    }
    
    selectedStudentIds.forEach(studentId => {
        const enrollment = {
            id: Math.max(...(enrollments.length > 0 ? enrollments.map(e => e.id) : [0])) + 1,
            studentId,
            sessionId,
            classId,
            term,
            enrollmentDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        enrollments.push(enrollment);
    });
    
    closeModal();
    Logger.success('Students enrolled', { 
        count: selectedStudentIds.length, 
        classId, 
        sessionId, 
        term 
    });
    Notifications.success(`Successfully enrolled ${selectedStudentIds.length} students`);
}

function generateClassInvoices() {
    const classId = parseInt($('#bulkActionClass').val());
    if (!classId) {
        Logger.warn('Generate invoices failed - no class selected');
        Notifications.warning('Please select a class');
        return;
    }
    
    const classStudents = students.filter(s => s.classId === classId);
    let invoicesGenerated = 0;
    
    classStudents.forEach(student => {
        paymentCategories.filter(cat => cat.type === 'compulsory').forEach(category => {
            const invoice = {
                id: Math.max(...(transactions.length > 0 ? transactions.map(t => t.id) : [0])) + 1,
                date: new Date().toISOString().split('T')[0],
                studentId: student.id,
                student: student.name,
                type: category.name,
                amount: category.amount,
                status: 'Pending',
                method: '-',
                classId: student.classId
            };
            transactions.push(invoice);
            invoicesGenerated++;
        });
    });
    
    updateDashboardStats();
    Logger.success('Class invoices generated', { 
        classId, 
        className: getClassName(classId), 
        invoicesGenerated 
    });
    Notifications.success(`Generated ${invoicesGenerated} invoices for ${getClassName(classId)}`);
}

function loadInvoices() {
    const searchQuery = $('#invoiceStudentSearch').val().toLowerCase().trim();
    if (!searchQuery) {
        Logger.warn('Load invoices failed - no search query');
        Notifications.warning('Please enter student name or ID');
        return;
    }
    
    const student = students.find(s => 
        s.name.toLowerCase().includes(searchQuery) || 
        s.id.toString() === searchQuery
    );
    
    if (!student) {
        Logger.warn('Student not found for invoice search', { searchQuery });
        Notifications.warning('Student not found');
        return;
    }
    
    const studentInvoices = transactions.filter(t => t.studentId === student.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tbody = $('#invoicesTableBody');
    tbody.empty();
    
    if (studentInvoices.length === 0) {
        tbody.append('<tr><td colspan="4" class="text-center text-muted">No invoices found</td></tr>');
        Logger.info('No invoices found for student', { studentId: student.id, studentName: student.name });
        return;
    }
    
    studentInvoices.forEach(invoice => {
        const statusClass = invoice.status === 'Paid' ? 'success' : 
                          invoice.status === 'Pending' ? 'warning' : 'danger';
        
        const row = $(`
            <tr>
                <td>${invoice.date}</td>
                <td>${invoice.type}</td>
                <td>${formatCurrency(invoice.amount)}</td>
                <td><span class="badge ${statusClass}">${invoice.status}</span></td>
            </tr>
        `);
        tbody.append(row);
    });
    
    Logger.success('Student invoices loaded', { 
        studentId: student.id, 
        studentName: student.name, 
        invoiceCount: studentInvoices.length 
    });
}

// Expenses management
function loadExpenses() {
    Logger.info('Loading expenses');
    displayExpenses(expenses);
    Logger.success('Expenses loaded', { count: expenses.length });
}

function displayExpenses(expensesToShow) {
    const tbody = $('#expensesTableBody');
    tbody.empty();
    
    expensesToShow.forEach(expense => {
        const row = $(`
            <tr>
                <td>${expense.date}</td>
                <td>${expense.category}</td>
                <td>${expense.description}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>
                    <button class="btn btn-ghost" onclick="editExpense(${expense.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-ghost" onclick="deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
        tbody.append(row);
    });
    
    Logger.info('Expenses displayed', { count: expensesToShow.length });
}

function saveExpense() {
    const category = $('#expenseCategory').val().trim();
    const description = $('#expenseDescription').val().trim();
    const amount = parseFloat($('#expenseAmount').val());
    const date = $('#expenseDate').val() || new Date().toISOString().split('T')[0];
    
    if (!category || !amount || amount <= 0) {
        Logger.warn('Expense validation failed', { category, amount });
        Notifications.warning('Please fill in required fields');
        return;
    }
    
    const newExpense = {
        id: Math.max(...expenses.map(e => e.id)) + 1,
        category,
        description: description || '',
        amount,
        date
    };
    
    expenses.push(newExpense);
    $('#expenseForm')[0].reset();
    loadExpenses();
    updateDashboardStats();
    
    Logger.success('Expense created', { expenseId: newExpense.id, category, amount });
    Notifications.success(`Expense of ${formatCurrency(amount)} recorded`);
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) {
        Logger.warn('Expense not found for editing', { id });
        Notifications.warning('Expense not found');
        return;
    }
    
    Logger.info('Opening expense edit form', { expenseId: id, category: expense.category });
    
    $('#expenseCategory').val(expense.category);
    $('#expenseDescription').val(expense.description);
    $('#expenseAmount').val(expense.amount);
    $('#expenseDate').val(expense.date);
}

function deleteExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) {
        Logger.warn('Expense not found for deletion', { id });
        Notifications.warning('Expense not found');
        return;
    }
    
    if (window.confirm && window.confirm(`Are you sure you want to delete this ${expense.category} expense?`)) {
        expenses = expenses.filter(e => e.id !== id);
        loadExpenses();
        updateDashboardStats();
        
        Logger.success('Expense deleted', { expenseId: id, category: expense.category });
        Notifications.success('Expense deleted successfully');
    }
}

function filterExpenses() {
    const startDate = $('#expenseStart').val();
    const endDate = $('#expenseEnd').val();
    const category = $('#expenseFilterCategory').val().toLowerCase();
    
    let filteredExpenses = [...expenses];
    
    if (startDate) {
        filteredExpenses = filteredExpenses.filter(e => e.date >= startDate);
    }
    
    if (endDate) {
        filteredExpenses = filteredExpenses.filter(e => e.date <= endDate);
    }
    
    if (category) {
        filteredExpenses = filteredExpenses.filter(e => 
            e.category.toLowerCase().includes(category)
        );
    }
    
    displayExpenses(filteredExpenses);
    Logger.info('Expenses filtered', { 
        startDate, 
        endDate, 
        category, 
        originalCount: expenses.length, 
        filteredCount: filteredExpenses.length 
    });
}

// Payment Categories management
function loadPaymentCategories() {
    Logger.info('Loading payment categories');
    displayPaymentCategories(paymentCategories);
    Logger.success('Payment categories loaded', { count: paymentCategories.length });
}

function displayPaymentCategories(categoriesToShow) {
    const tbody = $('#categoriesTableBody');
    tbody.empty();
    
    categoriesToShow.forEach(category => {
        const typeClass = category.type === 'compulsory' ? 'danger' : 'info';
        const statusClass = category.status === 'active' ? 'success' : 'warning';
        
        const row = $(`
            <tr>
                <td>${category.name}</td>
                <td><span class="badge ${typeClass}">${category.type}</span></td>
                <td>${formatCurrency(category.amount)}</td>
                <td><span class="badge ${statusClass}">${category.status}</span></td>
                <td>
                    <button class="btn btn-ghost" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-ghost" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
        tbody.append(row);
    });
    
    Logger.info('Payment categories displayed', { count: categoriesToShow.length });
}

function addPaymentCategory() {
    Logger.info('Opening add payment category modal');
    resetForm('#addCategoryForm');
    $('#categoryModal').addClass('active');
}

function saveCategory() {
    const name = $('#categoryName').val().trim();
    const type = $('#categoryType').val();
    const amount = parseFloat($('#categoryAmount').val()) || 0;
    
    if (!name) {
        Logger.warn('Category validation failed - no name');
        Notifications.warning('Please enter category name');
        return;
    }
    
    const editingId = $('#addCategoryForm').data('editing');
    
    if (editingId) {
        const category = paymentCategories.find(c => c.id === editingId);
        if (category) {
            category.name = name;
            category.type = type;
            category.amount = amount;
            Logger.success('Payment category updated', { categoryId: editingId, name });
        }
        $('#addCategoryForm').removeData('editing');
    } else {
        const newCategory = {
            id: Math.max(...paymentCategories.map(c => c.id)) + 1,
            name,
            type,
            amount,
            status: 'active'
        };
        paymentCategories.push(newCategory);
        Logger.success('Payment category created', { categoryId: newCategory.id, name });
    }
    
    closeModal();
    loadPaymentCategories();
    populateClassDropdowns();
    
    const action = editingId ? 'updated' : 'created';
    Notifications.success(`Payment category ${action} successfully`);
}

function editCategory(id) {
    const category = paymentCategories.find(c => c.id === id);
    if (!category) {
        Logger.warn('Payment category not found for editing', { id });
        Notifications.warning('Payment category not found');
        return;
    }
    
    Logger.info('Opening payment category edit modal', { categoryId: id, categoryName: category.name });
    
    $('#categoryName').val(category.name);
    $('#categoryType').val(category.type);
    $('#categoryAmount').val(category.amount);
    
    $('#categoryModal').addClass('active');
    $('#addCategoryForm').data('editing', id);
}

function deleteCategory(id) {
    const category = paymentCategories.find(c => c.id === id);
    if (!category) {
        Logger.warn('Payment category not found for deletion', { id });
        Notifications.warning('Payment category not found');
        return;
    }
    
    if (window.confirm && window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
        paymentCategories = paymentCategories.filter(c => c.id !== id);
        loadPaymentCategories();
        populateClassDropdowns();
        
        Logger.success('Payment category deleted', { categoryId: id, categoryName: category.name });
        Notifications.success(`Payment category "${category.name}" deleted successfully`);
    }
}

// Reports management
function loadReports() {
    Logger.info('Loading reports section');
    populateClassDropdowns();
    Logger.success('Reports section loaded');
}

function generateReport() {
    const dateRange = $('#reportDateRange').val();
    const paymentType = $('#reportPaymentType').val();
    const classFilter = $('#reportClassFilter').val();
    
    let filteredTransactions = [...transactions];
    
    // Apply filters
    if (paymentType && paymentType !== 'all') {
        const categoryName = paymentCategories.find(cat => 
            cat.name.toLowerCase().replace(' ', '_') === paymentType
        )?.name;
        if (categoryName) {
            filteredTransactions = filteredTransactions.filter(t => t.type === categoryName);
        }
    }
    
    if (classFilter && classFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.classId == classFilter);
    }
    
    // Generate report HTML
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const paidAmount = filteredTransactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = filteredTransactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
    
    const reportHtml = `
        <div class="card" style="padding: 1.5rem; margin-bottom: 1rem;">
            <h5>Report Summary</h5>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
                <div>
                    <label>Total Transactions:</label>
                    <h6>${filteredTransactions.length}</h6>
                </div>
                <div>
                    <label>Total Amount:</label>
                    <h6>${formatCurrency(totalAmount)}</h6>
                </div>
                <div>
                    <label>Paid Amount:</label>
                    <h6 class="text-success">${formatCurrency(paidAmount)}</h6>
                </div>
                <div>
                    <label>Pending Amount:</label>
                    <h6 class="text-warning">${formatCurrency(pendingAmount)}</h6>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Method</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredTransactions.map(t => `
                        <tr>
                            <td>${t.date}</td>
                            <td>${t.student}</td>
                            <td>${getClassName(t.classId)}</td>
                            <td>${t.type}</td>
                            <td>${formatCurrency(t.amount)}</td>
                            <td><span class="badge ${t.status === 'Paid' ? 'success' : t.status === 'Pending' ? 'warning' : 'danger'}">${t.status}</span></td>
                            <td>${t.method}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    $('#reportResults').html(reportHtml);
    
    Logger.success('Report generated', {
        filters: { dateRange, paymentType, classFilter },
        transactionCount: filteredTransactions.length,
        totalAmount,
        paidAmount,
        pendingAmount
    });
}

// Settings management
function loadSettings() {
    Logger.info('Loading settings section');
    Logger.success('Settings section loaded');
}

function saveSettings() {
    const schoolName = $('#schoolName').val();
    const schoolAddress = $('#schoolAddress').val();
    const schoolPhone = $('#schoolPhone').val();
    const schoolEmail = $('#schoolEmail').val();
    
    Logger.success('Settings saved', {
        schoolName,
        schoolAddress,
        schoolPhone,
        schoolEmail
    });
    Notifications.success('Settings saved successfully');
}

// Modal management
function closeModal() {
    $('.modal').removeClass('active');
    
    // Reset forms
    $('form').each(function() {
        if (this.id.includes('add') || this.id.includes('Add')) {
            resetForm('#' + this.id);
        }
    });
    
    // Clear search results
    $('#studentSearchResults').empty().hide();
    selectedStudentForPayment = null;
    $('#selectedStudentInfo').empty();
    $('#studentBalance').html('<div class="text-muted">Select a student to view balance</div>');
    $('#paymentHistory').html('<div class="text-muted">Select a student to view history</div>');
    
    Logger.info('Modal closed and forms reset');
}

// Chart initialization
function initializeCharts() {
    Logger.info('Initializing charts');
    
    // Revenue vs Expenses Chart
    const revenueCtx = document.getElementById('revenueExpenseChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'Revenue',
                    data: [850000, 920000, 880000, 950000, 1020000, 1080000, 1150000, 1250000],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Expenses',
                    data: [350000, 380000, 420000, 390000, 410000, 430000, 440000, 460000],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₦' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        Logger.success('Revenue chart initialized');
    }

    // Payment Status Chart
    const statusCtx = document.getElementById('paymentStatusChart');
    if (statusCtx) {
        const paidCount = transactions.filter(t => t.status === 'Paid').length;
        const pendingCount = transactions.filter(t => t.status === 'Pending').length;
        const overdueCount = transactions.filter(t => t.status === 'Overdue').length;
        
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Paid', 'Pending', 'Overdue'],
                datasets: [{
                    data: [paidCount, pendingCount, overdueCount],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
        Logger.success('Payment status chart initialized', { paidCount, pendingCount, overdueCount });
    }
    
    Logger.success('Charts initialization completed');
}

// Search functionality with debouncing
function setupSearchFunctionality() {
    Logger.info('Setting up search functionality');
    let searchTimeout;
    
    // Student search
    $('#studentSearch').on('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterStudents();
        }, 300);
    });
    
    // Payment student search is handled in setupPaymentSearch()
    
    // Invoice student search
    $('#invoiceStudentSearch').on('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = $(this).val().toLowerCase().trim();
            const student = students.find(s => 
                s.name.toLowerCase() === query || 
                s.id.toString() === query
            );
            if (student) {
                loadInvoices();
            }
        }, 500);
    });
    
    // Enrollment student search
    $('#enrollStudentSearch').on('input', function() {
        const query = $(this).val().toLowerCase().trim();
        
        $('#enrollStudentsList .student-checkbox-item').each(function() {
            const studentName = $(this).find('label strong').text().toLowerCase();
            const studentId = $(this).find('input').val();
            
            if (studentName.includes(query) || studentId.includes(query)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
    
    Logger.success('Search functionality setup completed');
}

// Sorting functionality
function setupTableSorting() {
    Logger.info('Setting up table sorting');
    
    $('.sort-icon').off('click').on('click', function() {
        const field = $(this).data('sort');
        const table = $(this).closest('table');
        const tableId = table.attr('id');
        
        // Toggle sort direction
        if (currentSort.field === field) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = field;
            currentSort.direction = 'asc';
        }
        
        // Update icons
        $('.sort-icon').removeClass('active fa-sort-up fa-sort-down').addClass('fa-sort');
        $(this).addClass('active');
        $(this).removeClass('fa-sort').addClass(currentSort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
        
        // Sort data based on table
        const sortHandlers = {
            'recentTransactionsTable': () => loadRecentTransactions(),
            'classesTable': () => displayClasses(getSortedClasses(field)),
            'sessionsTable': () => displaySessions(getSortedSessions(field)),
            'expensesTableBody': () => displayExpenses(getSortedExpenses(field)),
            'categoriesTableBody': () => displayPaymentCategories(getSortedCategories(field))
        };
        
        const handler = sortHandlers[tableId];
        if (handler) {
            handler();
            Logger.info('Table sorted', { tableId, field, direction: currentSort.direction });
        }
    });
    
    Logger.success('Table sorting setup completed');
}

// Sorting helper functions
function getSortedClasses(field) {
    return [...classes].sort((a, b) => {
        let aVal, bVal;
        switch(field) {
            case 'studentCount':
                aVal = a.studentCount;
                bVal = b.studentCount;
                break;
            default:
                aVal = a[field]?.toString().toLowerCase() || '';
                bVal = b[field]?.toString().toLowerCase() || '';
        }
        
        if (currentSort.direction === 'desc') {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
}

function getSortedSessions(field) {
    return [...sessions].sort((a, b) => {
        let aVal, bVal;
        switch(field) {
            case 'startDate':
            case 'endDate':
                aVal = new Date(a[field]);
                bVal = new Date(b[field]);
                break;
            default:
                aVal = a[field]?.toString().toLowerCase() || '';
                bVal = b[field]?.toString().toLowerCase() || '';
        }
        
        if (currentSort.direction === 'desc') {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
}

function getSortedExpenses(field) {
    return [...expenses].sort((a, b) => {
        let aVal, bVal;
        switch(field) {
            case 'date':
                aVal = new Date(a.date);
                bVal = new Date(b.date);
                break;
            case 'amount':
                aVal = a.amount;
                bVal = b.amount;
                break;
            default:
                aVal = a[field]?.toString().toLowerCase() || '';
                bVal = b[field]?.toString().toLowerCase() || '';
        }
        
        if (currentSort.direction === 'desc') {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
}

function getSortedCategories(field) {
    return [...paymentCategories].sort((a, b) => {
        let aVal, bVal;
        switch(field) {
            case 'amount':
                aVal = a.amount;
                bVal = b.amount;
                break;
            default:
                aVal = a[field]?.toString().toLowerCase() || '';
                bVal = b[field]?.toString().toLowerCase() || '';
        }
        
        if (currentSort.direction === 'desc') {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
}

// Advanced utility functions
function getStudentsByClass(classId) {
    return students.filter(s => s.classId === classId);
}

function getTransactionsByStudent(studentId) {
    return transactions.filter(t => t.studentId === studentId);
}

function getTransactionsByClass(classId) {
    return transactions.filter(t => t.classId === classId);
}

function getOutstandingStudents() {
    return students.filter(s => s.balance < 0);
}

function getCreditStudents() {
    return students.filter(s => s.balance > 0);
}

function updateStudentBalance(studentId, amount) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        student.balance += amount;
        Logger.info('Student balance updated', { studentId, amount, newBalance: student.balance });
        return true;
    }
    Logger.warn('Student not found for balance update', { studentId, amount });
    return false;
}

// Data export/import functions
function exportData() {
    const data = {
        students,
        classes,
        sessions,
        transactions,
        expenses,
        paymentCategories,
        enrollments,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `school_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    Logger.success('Data exported', { recordCounts: Object.keys(data).reduce((acc, key) => {
        if (Array.isArray(data[key])) acc[key] = data[key].length;
        return acc;
    }, {}) });
    Notifications.success('Data exported successfully');
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    Logger.info('Starting data import', { filename: file.name, size: file.size });
    
    try {
        const text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
        
        const data = JSON.parse(text);
        
        if (window.confirm && window.confirm('This will replace all current data. Are you sure?')) {
            students = data.students || [];
            classes = data.classes || [];
            sessions = data.sessions || [];
            transactions = data.transactions || [];
            expenses = data.expenses || [];
            paymentCategories = data.paymentCategories || [];
            enrollments = data.enrollments || [];
            
            // Refresh current section
            const activeSection = $('.content-section.active').attr('id').replace('-section', '');
            showSection(activeSection);
            
            Logger.success('Data imported successfully', { 
                studentCount: students.length,
                classCount: classes.length,
                transactionCount: transactions.length
            });
            Notifications.success('Data imported successfully');
        }
    } catch (error) {
        Logger.error('Data import failed', error, { filename: file.name });
        Notifications.error('Error importing data: Invalid file format');
    }
}

// Quick action functions
function markAllPaid(classId) {
    const pendingTransactions = transactions.filter(t => 
        t.classId === classId && t.status === 'Pending'
    );
    
    pendingTransactions.forEach(transaction => {
        transaction.status = 'Paid';
        updateStudentBalance(transaction.studentId, transaction.amount);
    });
    
    updateDashboardStats();
    
    Logger.success('All payments marked as paid for class', { 
        classId, 
        className: getClassName(classId), 
        transactionCount: pendingTransactions.length 
    });
    Notifications.success(`Marked ${pendingTransactions.length} payments as paid`);
}

function generateClassReport(classId) {
    const className = getClassName(classId);
    const classStudents = getStudentsByClass(classId);
    const classTransactions = getTransactionsByClass(classId);
    
    const totalPaid = classTransactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
    const totalPending = classTransactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
    const totalOutstanding = classStudents.reduce((sum, s) => sum + Math.max(0, -s.balance), 0);
    
    const reportData = {
        className,
        studentCount: classStudents.length,
        totalPaid,
        totalPending,
        totalOutstanding,
        transactions: classTransactions
    };
    
    Logger.info('Class report generated', reportData);
    return reportData;
}

// Application initialization
async function initializeApp() {
    Logger.info('Initializing application');
    
    loadTheme();
    
    try {
        // Try to load classes from API
        const response = await fetch(`${window.API_BASE_URL}/api/classes`);
        if (response.ok) {
            const apiClasses = await response.json();
            if (Array.isArray(apiClasses) && apiClasses.length > 0) {
                classes = apiClasses;
                Logger.success('Classes loaded from API', { count: apiClasses.length });
            }
        }
    } catch (err) {
        Logger.warn('Failed to load classes from API, using mock data', err);
    }
    
    populateClassDropdowns();
    setupSearchFunctionality();
    setupTableSorting();
    setupEventListeners();
    
    // Initialize dashboard
    showSection('dashboard');
    
    Logger.success('Application initialization completed');
}

function setupEventListeners() {
    Logger.info('Setting up event listeners');
    
    // Navigation event listeners
    $('.nav-link').on('click', function(e) {
        e.preventDefault();
        const section = $(this).data('section');
        showSection(section);
    });
    
    // Modal close on backdrop click
    $('.modal').on('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Close modal on escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Cancel buttons
    $('.btn-cancel, [id*="cancel"], [id*="Cancel"]').off('click').on('click', function(e) {
        e.preventDefault();
        closeModal();
    });
    
    Logger.success('Event listeners setup completed');
}

// Advanced search functionality
function advancedStudentSearch(criteria) {
    Logger.info('Performing advanced student search', criteria);
    
    const results = students.filter(student => {
        const className = getClassName(student.classId);
        let matches = true;
        
        if (criteria.name) {
            matches = matches && student.name.toLowerCase().includes(criteria.name.toLowerCase());
        }
        
        if (criteria.classId) {
            matches = matches && student.classId === criteria.classId;
        }
        
        if (criteria.balanceRange) {
            const { min, max } = criteria.balanceRange;
            matches = matches && student.balance >= min && student.balance <= max;
        }
        
        if (criteria.guardian) {
            matches = matches && student.guardian.toLowerCase().includes(criteria.guardian.toLowerCase());
        }
        
        return matches;
    });
    
    Logger.success('Advanced search completed', { 
        criteria, 
        resultCount: results.length, 
        totalStudents: students.length 
    });
    
    return results;
}

// Bulk operations
function bulkEnrollByClass() {
    const classId = parseInt($('#bulkActionClass').val());
    const sessionId = parseInt($('#enrollSession').val());
    const term = $('#enrollTerm').val();
    
    if (!classId || !sessionId || !term) {
        Logger.warn('Bulk enrollment validation failed', { classId, sessionId, term });
        Notifications.warning('Please select class, session, and term');
        return;
    }
    
    const classStudents = getStudentsByClass(classId);
    
    classStudents.forEach(student => {
        const enrollment = {
            id: Math.max(...(enrollments.length > 0 ? enrollments.map(e => e.id) : [0])) + 1,
            studentId: student.id,
            sessionId,
            classId,
            term,
            enrollmentDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        enrollments.push(enrollment);
    });
    
    Logger.success('Bulk enrollment completed', { 
        classId, 
        className: getClassName(classId), 
        studentCount: classStudents.length,
        sessionId,
        term
    });
    Notifications.success(`Successfully enrolled ${classStudents.length} students from ${getClassName(classId)}`);
}

// Initialize when document is ready
$(document).ready(async function() {
    Logger.info('DOM ready - starting application');
    
    try {
        await initializeApp();
        initializeForms();
        
        Logger.success('Application startup completed successfully');
    } catch (error) {
        Logger.error('Application initialization failed', error);
        Notifications.error('Failed to initialize application. Please refresh the page.');
    }
});

// Global function assignments for HTML onclick compatibility
window.toggleTheme = toggleTheme;
window.showSection = showSection;
window.saveStudent = saveStudentEnhanced;
window.editStudent = editStudent;
window.addClass = addClass;
window.saveClass = saveClassEnhanced;
window.editClass = editClass;
window.deleteClass = deleteClass;
window.addSession = addSession;
window.saveSession = saveSession;
window.editSession = editSession;
window.deleteSession = deleteSession;
window.addPaymentCategory = addPaymentCategory;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.recordPayment = recordPayment;
window.saveExpense = saveExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.filterExpenses = filterExpenses;
window.openEnrollmentModal = openEnrollmentModal;
window.loadClassStudents = loadClassStudents;
window.enrollSelectedStudents = enrollSelectedStudents;
window.generateClassInvoices = generateClassInvoices;
window.loadInvoices = loadInvoices;
window.generateReport = generateReport;
window.saveSettings = saveSettings;
window.closeModal = closeModal;
window.filterStudents = filterStudents;
window.exportData = exportData;
window.importData = importData;
window.markAllPaid = markAllPaid;
window.generateClassReport = generateClassReport;
window.bulkEnrollByClass = bulkEnrollByClass;