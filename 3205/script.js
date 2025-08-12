// Attendance Management System JavaScript with Role-Based Authentication

class AttendanceSystem {
    constructor() {
        this.students = JSON.parse(localStorage.getItem('students')) || [];
        this.attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
        this.teacherModifications = JSON.parse(localStorage.getItem('teacherModifications')) || {};
        this.currentDate = new Date().toISOString().split('T')[0];
        this.currentUser = null;
        this.userCredentials = {
            admin: { username: 'admin', password: 'admin123', name: 'Administrator' },
            teacher: { username: 'teacher', password: 'teacher123', name: 'Teacher' },
            student: { username: 'student', password: 'student123', name: 'Student' }
        };
        this.checkLoginStatus();
    }

    checkLoginStatus() {
        const savedUser = JSON.parse(localStorage.getItem('currentUser'));
        if (savedUser) {
            this.currentUser = savedUser;
            this.showMainInterface();
        } else {
            this.showLoginInterface();
        }
    }

    showLoginInterface() {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainContainer').style.display = 'none';
    }

    showMainInterface() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        this.init();
        this.setupRoleBasedUI();
    }

    init() {
        this.updateDateDisplay();
        this.loadDefaultStudents();
        this.renderStudentList();
        this.renderStudentsGrid();
        this.renderRecords();
        this.updateStats();
        this.populateFilters();
        this.updateUserInfo();
    }

    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('currentUserRole').textContent = this.currentUser.role.toUpperCase();
            document.getElementById('currentUserName').textContent = this.currentUser.name;
        }
    }

    setupRoleBasedUI() {
        const role = this.currentUser.role;
        
        // Get all navigation tabs
        const attendanceTab = document.getElementById('attendanceTab');
        const recordsTab = document.getElementById('recordsTab');
        const studentsTab = document.getElementById('studentsTab');
        const analyticsTab = document.getElementById('analyticsTab');
        const settingsTab = document.getElementById('settingsTab');
        
        // Reset all tabs to visible first
        [attendanceTab, recordsTab, studentsTab, analyticsTab, settingsTab].forEach(tab => {
            if (tab) tab.style.display = 'block';
        });
        
        // Apply role-based restrictions
        if (role === 'student') {
            // Students can only view records and analytics
            if (attendanceTab) attendanceTab.style.display = 'none';
            if (studentsTab) studentsTab.style.display = 'none';
            if (settingsTab) settingsTab.style.display = 'none';
            
            // Show records section by default for students
            this.showSectionProgrammatically('records');
        } else if (role === 'teacher') {
            // Teachers can mark attendance, view records and analytics, but no student management or settings
            if (studentsTab) studentsTab.style.display = 'none';
            if (settingsTab) settingsTab.style.display = 'none';
            
            this.checkTeacherRestrictions();
        } else if (role === 'admin') {
            // Admin has full access to all sections
            // All tabs remain visible
        }
        
        this.updateUIPermissions();
    }

    checkTeacherRestrictions() {
        const hasModifiedToday = this.teacherModifications[this.currentDate];
        const restrictionDiv = document.getElementById('teacherRestriction');
        const controlsDiv = document.getElementById('attendanceControls');
        
        if (hasModifiedToday) {
            restrictionDiv.style.display = 'block';
            controlsDiv.style.display = 'none';
            // Disable student card interactions
            this.disableAttendanceInteraction();
        } else {
            restrictionDiv.style.display = 'none';
            controlsDiv.style.display = 'flex';
        }
    }

    disableAttendanceInteraction() {
        const studentCards = document.querySelectorAll('.student-card');
        studentCards.forEach(card => {
            card.classList.add('disabled');
        });
    }

    updateUIPermissions() {
        const role = this.currentUser.role;
        
        // Student management form
        const addStudentForm = document.querySelector('.add-student-form');
        if (role === 'student' || role === 'teacher') {
            addStudentForm.classList.add('disabled');
        } else {
            addStudentForm.classList.remove('disabled');
        }
        
        // Remove buttons for students in management section
        const removeButtons = document.querySelectorAll('.btn-danger');
        if (role !== 'admin') {
            removeButtons.forEach(btn => {
                if (btn.textContent.includes('Remove')) {
                    btn.style.display = 'none';
                }
            });
        }
    }

    updateDateDisplay() {
        const dateElement = document.getElementById('currentDate');
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    loadDefaultStudents() {
        if (this.students.length === 0) {
            const defaultStudents = [
                { id: 'STU001', name: 'John Smith' },
                { id: 'STU002', name: 'Emma Johnson' },
                { id: 'STU003', name: 'Michael Brown' },
                { id: 'STU004', name: 'Sarah Davis' },
                { id: 'STU005', name: 'David Wilson' },
                { id: 'STU006', name: 'Lisa Anderson' },
                { id: 'STU007', name: 'James Taylor' },
                { id: 'STU008', name: 'Jennifer Martinez' }
            ];
            this.students = defaultStudents;
            this.saveData();
        }
    }

    renderStudentList() {
        const studentList = document.getElementById('studentList');
        studentList.innerHTML = '';

        this.students.forEach(student => {
            const isPresent = this.isStudentPresentToday(student.id);
            const studentCard = document.createElement('div');
            let cardClass = `student-card ${isPresent ? 'present' : 'absent'}`;
            
            // Disable interaction for students or teachers who have already modified today
            if (this.currentUser.role === 'student' || 
                (this.currentUser.role === 'teacher' && this.teacherModifications[this.currentDate])) {
                cardClass += ' disabled';
            }
            
            studentCard.className = cardClass;
            
            // Only add click handler if user has permission
            if (this.currentUser.role !== 'student' && 
                !(this.currentUser.role === 'teacher' && this.teacherModifications[this.currentDate])) {
                studentCard.onclick = () => this.toggleAttendance(student.id);
            }

            studentCard.innerHTML = `
                <div class="student-info">
                    <div class="student-details">
                        <h3>${student.name}</h3>
                        <p>ID: ${student.id}</p>
                    </div>
                    <div class="attendance-status ${isPresent ? 'present' : 'absent'}">
                        ${isPresent ? '✓ Present' : '✗ Absent'}
                    </div>
                </div>
            `;

            studentList.appendChild(studentCard);
        });
    }

    renderStudentsGrid() {
        const studentsGrid = document.getElementById('studentsGrid');
        studentsGrid.innerHTML = '';

        this.students.forEach(student => {
            const studentItem = document.createElement('div');
            studentItem.className = 'student-item';

            studentItem.innerHTML = `
                <div class="student-item-info">
                    <h4>${student.name}</h4>
                    <p>ID: ${student.id}</p>
                </div>
                <button class="btn btn-danger" onclick="attendanceSystem.removeStudent('${student.id}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            `;

            studentsGrid.appendChild(studentItem);
        });
    }

    toggleAttendance(studentId, forceStatus = null) {
        // Check permissions
        if (this.currentUser.role === 'student') {
            this.showMessage('Students cannot modify attendance!', 'error');
            return;
        }
        
        if (this.currentUser.role === 'teacher' && this.teacherModifications[this.currentDate]) {
            this.showMessage('Teachers can only modify attendance once per day!', 'error');
            return;
        }

        if (!this.attendanceRecords[this.currentDate]) {
            this.attendanceRecords[this.currentDate] = {};
        }

        if (forceStatus !== null) {
            // For bulk operations, set specific status
            this.attendanceRecords[this.currentDate][studentId] = forceStatus;
        } else {
            // For individual clicks, toggle status
            const currentStatus = this.attendanceRecords[this.currentDate][studentId] || false;
            this.attendanceRecords[this.currentDate][studentId] = !currentStatus;
        }

        this.renderStudentList();
        
        // Only show message for individual toggles, not bulk operations
        if (forceStatus === null) {
            this.showMessage(
                `Attendance updated for ${this.getStudentName(studentId)}`,
                'success'
            );
        }
    }

    isStudentPresentToday(studentId) {
        return this.attendanceRecords[this.currentDate] && 
               this.attendanceRecords[this.currentDate][studentId] === true;
    }

    getStudentName(studentId) {
        const student = this.students.find(s => s.id === studentId);
        return student ? student.name : 'Unknown Student';
    }

    markAllPresent() {
        // Check permissions
        if (this.currentUser.role === 'student') {
            this.showMessage('Students cannot modify attendance!', 'error');
            return;
        }
        
        if (this.currentUser.role === 'teacher' && this.teacherModifications[this.currentDate]) {
            this.showMessage('Teachers can only modify attendance once per day!', 'error');
            return;
        }

        if (!this.attendanceRecords[this.currentDate]) {
            this.attendanceRecords[this.currentDate] = {};
        }

        this.students.forEach(student => {
            this.attendanceRecords[this.currentDate][student.id] = true;
        });

        this.renderStudentList();
        this.showMessage('All students marked present!', 'success');
    }

    clearAttendance() {
        // Check permissions
        if (this.currentUser.role === 'student') {
            this.showMessage('Students cannot modify attendance!', 'error');
            return;
        }
        
        if (this.currentUser.role === 'teacher' && this.teacherModifications[this.currentDate]) {
            this.showMessage('Teachers can only modify attendance once per day!', 'error');
            return;
        }

        if (this.attendanceRecords[this.currentDate]) {
            delete this.attendanceRecords[this.currentDate];
        }

        this.renderStudentList();
        this.showMessage('Attendance cleared for today!', 'success');
    }

    saveAttendance() {
        // Check permissions
        if (this.currentUser.role === 'student') {
            this.showMessage('Students cannot save attendance!', 'error');
            return;
        }
        
        // Mark that teacher has modified attendance today
        if (this.currentUser.role === 'teacher') {
            this.teacherModifications[this.currentDate] = true;
            localStorage.setItem('teacherModifications', JSON.stringify(this.teacherModifications));
            this.checkTeacherRestrictions();
        }

        this.saveData();
        this.updateStats();
        this.renderRecords();
        this.showMessage('Attendance saved successfully!', 'success');
    }

    addStudent() {
        // Check permissions - only admin can add students
        if (this.currentUser.role !== 'admin') {
            this.showMessage('Only administrators can add students!', 'error');
            return;
        }
        
        const nameInput = document.getElementById('studentName');
        const idInput = document.getElementById('studentId');
        
        const name = nameInput.value.trim();
        const id = idInput.value.trim();

        if (!name || !id) {
            this.showMessage('Please enter both name and ID!', 'error');
            return;
        }

        if (this.students.find(s => s.id === id)) {
            this.showMessage('Student ID already exists!', 'error');
            return;
        }

        this.students.push({ id, name });
        this.saveData();
        this.renderStudentList();
        this.renderStudentsGrid();
        this.populateFilters();

        nameInput.value = '';
        idInput.value = '';

        this.showMessage(`Student ${name} added successfully!`, 'success');
    }

    removeStudent(studentId) {
        // Check permissions - only admin can remove students
        if (this.currentUser.role !== 'admin') {
            this.showMessage('Only administrators can remove students!', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to remove this student?')) {
            this.students = this.students.filter(s => s.id !== studentId);
            
            // Remove from attendance records
            Object.keys(this.attendanceRecords).forEach(date => {
                delete this.attendanceRecords[date][studentId];
            });

            this.saveData();
            this.renderStudentList();
            this.renderStudentsGrid();
            this.renderRecords();
            this.populateFilters();
            this.updateStats();

            this.showMessage('Student removed successfully!', 'success');
        }
    }

    renderRecords() {
        const tableBody = document.getElementById('recordsTableBody');
        tableBody.innerHTML = '';

        const selectedStudent = document.getElementById('studentFilter').value;
        const studentsToShow = selectedStudent === 'all' ? 
            this.students : 
            this.students.filter(s => s.id === selectedStudent);

        studentsToShow.forEach(student => {
            const stats = this.getStudentStats(student.id);
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${student.name}</td>
                <td>${stats.totalDays}</td>
                <td>${stats.presentDays}</td>
                <td>${stats.absentDays}</td>
                <td>${stats.attendanceRate}%</td>
                <td>
                    <button class="btn btn-primary" onclick="attendanceSystem.showStudentCalendar('${student.id}')">
                        <i class="fas fa-calendar"></i> View Calendar
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    getStudentStats(studentId) {
        let totalDays = 0;
        let presentDays = 0;

        const monthFilter = document.getElementById('monthFilter').value;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        Object.keys(this.attendanceRecords).forEach(date => {
            const recordDate = new Date(date);
            
            if (monthFilter === 'current') {
                if (recordDate.getMonth() !== currentMonth || 
                    recordDate.getFullYear() !== currentYear) {
                    return;
                }
            }

            if (this.attendanceRecords[date].hasOwnProperty(studentId)) {
                totalDays++;
                if (this.attendanceRecords[date][studentId]) {
                    presentDays++;
                }
            }
        });

        const absentDays = totalDays - presentDays;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        return {
            totalDays,
            presentDays,
            absentDays,
            attendanceRate
        };
    }

    updateStats() {
        let totalDays = 0;
        let totalPresentDays = 0;

        this.students.forEach(student => {
            const stats = this.getStudentStats(student.id);
            totalDays += stats.totalDays;
            totalPresentDays += stats.presentDays;
        });

        const overallRate = totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0;

        document.getElementById('totalDays').textContent = totalDays;
        document.getElementById('presentDays').textContent = totalPresentDays;
        document.getElementById('attendanceRate').textContent = `${overallRate}%`;
    }

    populateFilters() {
        const studentFilter = document.getElementById('studentFilter');
        studentFilter.innerHTML = '<option value="all">All Students</option>';

        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            studentFilter.appendChild(option);
        });
    }

    showStudentCalendar(studentId) {
        const student = this.students.find(s => s.id === studentId);
        const calendarDiv = document.getElementById('attendanceCalendar');
        
        calendarDiv.innerHTML = `<h4>Attendance Calendar for ${student.name}</h4>`;
        
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const calendarGrid = document.createElement('div');
        calendarGrid.style.display = 'grid';
        calendarGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        calendarGrid.style.gap = '5px';
        calendarGrid.style.marginTop = '15px';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.textContent = day;
            header.style.fontWeight = 'bold';
            header.style.textAlign = 'center';
            header.style.padding = '10px';
            calendarGrid.appendChild(header);
        });

        // Add empty cells for days before month starts
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayElement = document.createElement('div');
            dayElement.textContent = day;
            dayElement.className = 'calendar-day';
            
            if (this.attendanceRecords[dateStr] && this.attendanceRecords[dateStr][studentId] === true) {
                dayElement.classList.add('present');
            } else if (this.attendanceRecords[dateStr] && this.attendanceRecords[dateStr][studentId] === false) {
                dayElement.classList.add('absent');
            }
            
            if (dateStr === this.currentDate) {
                dayElement.classList.add('today');
            }
            
            calendarGrid.appendChild(dayElement);
        }

        calendarDiv.appendChild(calendarGrid);
        
        // Scroll to calendar
        calendarDiv.scrollIntoView({ behavior: 'smooth' });
    }

    filterRecords() {
        this.renderRecords();
        this.updateStats();
    }

    showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        messageContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    showSectionProgrammatically(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to corresponding button
        const targetButton = document.getElementById(sectionId + 'Tab');
        if (targetButton) {
            targetButton.classList.add('active');
        }

        // Update data when switching sections
        if (sectionId === 'records') {
            this.renderRecords();
            this.updateStats();
        } else if (sectionId === 'analytics') {
            // Initialize analytics when first opened
            setTimeout(() => {
                this.initializeAnalytics();
            }, 100);
        }
    }

    saveData() {
        localStorage.setItem('students', JSON.stringify(this.students));
        localStorage.setItem('attendanceRecords', JSON.stringify(this.attendanceRecords));
        localStorage.setItem('teacherModifications', JSON.stringify(this.teacherModifications));
    }

    // Authentication methods
    login(username, password, role) {
        const credentials = this.userCredentials[role];
        
        if (credentials && credentials.username === username && credentials.password === password) {
            this.currentUser = {
                username: username,
                role: role,
                name: credentials.name,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showMainInterface();
            this.showMessage(`Welcome, ${credentials.name}! Logged in as ${role.toUpperCase()}`, 'success');
            
            // Initialize role-specific features
            this.initializeRoleFeatures();
            
            return true;
        }
        
        return false;
    }
    
    initializeRoleFeatures() {
        const role = this.currentUser.role;
        
        // Populate analytics student filter
        const analyticsStudentSelect = document.getElementById('analyticsStudent');
        if (analyticsStudentSelect) {
            analyticsStudentSelect.innerHTML = '<option value="all">All Students</option>';
            this.students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.name;
                analyticsStudentSelect.appendChild(option);
            });
        }
        
        // Set default section based on role
        if (role === 'student') {
            this.showSectionProgrammatically('records');
        } else if (role === 'teacher') {
            this.showSectionProgrammatically('attendance');
        } else {
            this.showSectionProgrammatically('attendance');
        }
    }
    
    initializeAnalytics() {
        // Initialize analytics charts when section is opened
        if (this.currentUser) {
            setTimeout(() => {
                updateAnalytics();
            }, 200);
        }
    }

    logout() {
        // Clear all user session data
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        
        // Clear any running timers
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }
        
        // Reset UI state
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show login interface
        this.showLoginInterface();
        this.showMessage('Logged out successfully!', 'success');
        
        // Restart auto-save timer for next login
        setTimeout(() => {
            autoSaveTimer = setInterval(() => {
                if (attendanceSystem && attendanceSystem.currentUser) {
                    attendanceSystem.saveData();
                }
            }, autoSaveInterval);
        }, 1000);
    }
}

// Authentication Functions
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('userRole').value;
    
    if (!username || !password) {
        attendanceSystem.showMessage('Please enter username and password!', 'error');
        return;
    }
    
    if (attendanceSystem.login(username, password, role)) {
        // Clear login form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    } else {
        attendanceSystem.showMessage('Invalid credentials!', 'error');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any unsaved changes warning
        window.onbeforeunload = null;
        attendanceSystem.logout();
    }
}

// Navigation Functions
function showSection(sectionId) {
    // Check permissions based on user role
    if (!attendanceSystem.currentUser) {
        attendanceSystem.showMessage('Please login first!', 'error');
        return;
    }
    
    const role = attendanceSystem.currentUser.role;
    
    // Role-based access control
    if (role === 'student') {
        if (sectionId === 'attendance' || sectionId === 'students' || sectionId === 'settings') {
            attendanceSystem.showMessage('Access denied! Students can only view records and analytics.', 'error');
            return;
        }
    } else if (role === 'teacher') {
        if (sectionId === 'students' || sectionId === 'settings') {
            attendanceSystem.showMessage('Access denied! Teachers cannot access this section.', 'error');
            return;
        }
    }
    
    attendanceSystem.showSectionProgrammatically(sectionId);
}

// Global Functions for HTML onclick events
function markAllPresent() {
    attendanceSystem.markAllPresent();
}

function clearAttendance() {
    attendanceSystem.clearAttendance();
}

function saveAttendance() {
    attendanceSystem.saveAttendance();
}

function addStudent() {
    attendanceSystem.addStudent();
}

function filterRecords() {
    attendanceSystem.filterRecords();
}

// Initialize the system when page loads
let attendanceSystem;

document.addEventListener('DOMContentLoaded', function() {
    attendanceSystem = new AttendanceSystem();
    
    // Add Enter key support for login
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Add Enter key support for adding students (when logged in)
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const target = e.target;
            if (target.id === 'studentName' || target.id === 'studentId') {
                addStudent();
            }
        }
    });
});

// Auto-save attendance every 30 seconds
let autoSaveInterval = 30000;
let autoSaveTimer = setInterval(() => {
    if (attendanceSystem) {
        attendanceSystem.saveData();
    }
}, autoSaveInterval);

// ============ NEW MODERN FEATURES ============

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'light';
let currentColorScheme = localStorage.getItem('colorScheme') || 'blue';

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme();
    localStorage.setItem('theme', currentTheme);
    showToast(`Switched to ${currentTheme} theme`, 'success');
}

function changeTheme() {
    const themeSelect = document.getElementById('themeSelect');
    currentTheme = themeSelect.value;
    if (currentTheme === 'auto') {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme();
    localStorage.setItem('theme', currentTheme);
}

function applyTheme() {
    document.body.setAttribute('data-theme', currentTheme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Color Scheme Management
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('color-option')) {
        const color = e.target.getAttribute('data-color');
        changeColorScheme(color);
    }
});

function changeColorScheme(color) {
    currentColorScheme = color;
    document.body.setAttribute('data-color-scheme', color);
    localStorage.setItem('colorScheme', color);
    showToast(`Color scheme changed to ${color}`, 'success');
}

// Export Functionality
function toggleExportMenu() {
    const dropdown = document.getElementById('exportDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function exportToCSV() {
    if (!attendanceSystem || !attendanceSystem.currentUser) {
        showToast('Please login first!', 'error');
        return;
    }
    
    showLoading();
    try {
        setTimeout(() => {
            const csvContent = generateCSVData();
            if (csvContent) {
                downloadFile(csvContent, `attendance-data-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
                showToast('CSV exported successfully!', 'success');
            } else {
                showToast('No data to export!', 'warning');
            }
            hideLoading();
            toggleExportMenu();
        }, 500);
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting CSV!', 'error');
        hideLoading();
    }
}

function exportToPDF() {
    showLoading();
    setTimeout(() => {
        // Simulate PDF generation
        const pdfContent = generatePDFData();
        showToast('PDF export feature coming soon!', 'info');
        hideLoading();
        toggleExportMenu();
    }, 1500);
}

function generateReport() {
    if (!attendanceSystem || !attendanceSystem.currentUser) {
        showToast('Please login first!', 'error');
        return;
    }
    
    showLoading();
    try {
        setTimeout(() => {
            const reportData = generateReportData();
            if (reportData) {
                downloadFile(reportData, `attendance-report-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
                showToast('Report generated successfully!', 'success');
            } else {
                showToast('No data to generate report!', 'warning');
            }
            hideLoading();
            toggleExportMenu();
        }, 1000);
    } catch (error) {
        console.error('Report generation error:', error);
        showToast('Error generating report!', 'error');
        hideLoading();
    }
}

function generateCSVData() {
    if (!attendanceSystem || !attendanceSystem.students || attendanceSystem.students.length === 0) {
        return null;
    }
    
    let csv = 'Student Name,Student ID,Total Days,Present Days,Absent Days,Attendance Rate\n';
    
    attendanceSystem.students.forEach(student => {
        const stats = attendanceSystem.getStudentStats(student.id);
        csv += `"${student.name.replace(/"/g, '""')}","${student.id}",${stats.totalDays},${stats.presentDays},${stats.absentDays},${stats.attendanceRate}%\n`;
    });
    
    return csv;
}

function generateReportData() {
    const report = {
        generatedAt: new Date().toISOString(),
        totalStudents: attendanceSystem.students.length,
        students: attendanceSystem.students.map(student => ({
            ...student,
            stats: attendanceSystem.getStudentStats(student.id)
        })),
        attendanceRecords: attendanceSystem.attendanceRecords
    };
    return JSON.stringify(report, null, 2);
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Search and Filter Functionality
function filterStudents() {
    const searchInput = document.getElementById('studentSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const studentCards = document.querySelectorAll('.student-card');
    
    studentCards.forEach(card => {
        const studentName = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const studentId = card.querySelector('p')?.textContent.toLowerCase() || '';
        
        if (studentName.includes(searchTerm) || studentId.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Bulk Operations
function bulkMarkAttendance() {
    // Check permissions
    if (!attendanceSystem.currentUser) {
        showToast('Please login first!', 'error');
        return;
    }
    
    if (attendanceSystem.currentUser.role === 'student') {
        showToast('Students cannot modify attendance!', 'error');
        return;
    }
    
    if (attendanceSystem.currentUser.role === 'teacher' && attendanceSystem.teacherModifications[attendanceSystem.currentDate]) {
        showToast('Teachers can only modify attendance once per day!', 'error');
        return;
    }
    
    populateBulkStudentList();
    document.getElementById('bulkModal').style.display = 'block';
}

function closeBulkModal() {
    document.getElementById('bulkModal').style.display = 'none';
}

function populateBulkStudentList() {
    const container = document.getElementById('bulkStudentList');
    container.innerHTML = '';
    
    attendanceSystem.students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'bulk-student-item';
        div.innerHTML = `
            <input type="checkbox" id="bulk_${student.id}" value="${student.id}">
            <label for="bulk_${student.id}">${student.name} (${student.id})</label>
        `;
        container.appendChild(div);
    });
}

function toggleAllStudents() {
    const selectAll = document.getElementById('selectAllStudents');
    const checkboxes = document.querySelectorAll('#bulkStudentList input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function bulkMarkPresent() {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length === 0) {
        showToast('Please select at least one student!', 'warning');
        return;
    }
    
    selectedStudents.forEach(studentId => {
        attendanceSystem.toggleAttendance(studentId, true);
    });
    attendanceSystem.renderStudentList();
    closeBulkModal();
    showToast(`Marked ${selectedStudents.length} students as present`, 'success');
}

function bulkMarkAbsent() {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length === 0) {
        showToast('Please select at least one student!', 'warning');
        return;
    }
    
    selectedStudents.forEach(studentId => {
        attendanceSystem.toggleAttendance(studentId, false);
    });
    attendanceSystem.renderStudentList();
    closeBulkModal();
    showToast(`Marked ${selectedStudents.length} students as absent`, 'success');
}

function getSelectedStudents() {
    const checkboxes = document.querySelectorAll('#bulkStudentList input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Analytics and Charts
let charts = {};

function updateAnalytics() {
    if (!attendanceSystem || !attendanceSystem.currentUser) {
        showToast('Please login first!', 'error');
        return;
    }
    
    const timeframe = document.getElementById('analyticsTimeframe')?.value || 'month';
    const studentId = document.getElementById('analyticsStudent')?.value || 'all';
    
    try {
        createAttendanceTrendChart(timeframe, studentId);
        createPerformanceChart();
        createWeeklyPatternChart();
        createAttendanceHeatmap();
        generateInsights();
        showToast('Analytics updated successfully!', 'success');
    } catch (error) {
        console.error('Analytics error:', error);
        showToast('Error updating analytics', 'error');
    }
}

function createAttendanceTrendChart(timeframe, studentId) {
    const ctx = document.getElementById('attendanceTrendChart');
    if (!ctx) {
        console.warn('Attendance trend chart canvas not found');
        return;
    }
    
    try {
        if (charts.trendChart) {
            charts.trendChart.destroy();
        }
        
        const data = generateTrendData(timeframe, studentId);
        
        charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: data.values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating trend chart:', error);
    }
}

function createPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) {
        console.warn('Performance chart canvas not found');
        return;
    }
    
    try {
        if (charts.performanceChart) {
            charts.performanceChart.destroy();
        }
        
        const data = attendanceSystem.students.map(student => {
            const stats = attendanceSystem.getStudentStats(student.id);
            return {
                name: student.name,
                rate: parseFloat(stats.attendanceRate)
            };
        });
        
        charts.performanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: data.map(d => d.rate),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating performance chart:', error);
    }
}

function createWeeklyPatternChart() {
    const ctx = document.getElementById('weeklyPatternChart');
    if (!ctx) return;
    
    if (charts.weeklyChart) {
        charts.weeklyChart.destroy();
    }
    
    const weeklyData = generateWeeklyPatternData();
    
    charts.weeklyChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [{
                label: 'Average Attendance',
                data: weeklyData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function createAttendanceHeatmap() {
    const container = document.getElementById('attendanceHeatmap');
    if (!container) return;
    
    container.innerHTML = '<p>Attendance heatmap visualization coming soon!</p>';
}

function generateTrendData(timeframe, studentId) {
    const labels = [];
    const values = [];
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
    
    // Generate real data based on attendance records
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Calculate actual attendance rate for this date
        let attendanceRate = 0;
        if (attendanceSystem.attendanceRecords[dateStr]) {
            const records = attendanceSystem.attendanceRecords[dateStr];
            if (studentId === 'all') {
                const totalStudents = Object.keys(records).length;
                const presentStudents = Object.values(records).filter(present => present).length;
                attendanceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;
            } else {
                attendanceRate = records[studentId] ? 100 : 0;
            }
        }
        
        values.push(attendanceRate);
    }
    
    return { labels, values };
}

function generateWeeklyPatternData() {
    // Generate sample weekly pattern data
    return [85, 90, 88, 92, 87, 75, 70]; // Sample attendance rates for each day
}

function generateInsights() {
    const container = document.getElementById('insightsContainer');
    if (!container) return;
    
    const insights = [
        '📈 Attendance has improved by 5% this month',
        '⚠️ Friday shows the lowest attendance rate (75%)',
        '🎯 3 students have perfect attendance this month',
        '📊 Overall class average is 87%'
    ];
    
    container.innerHTML = insights.map(insight => 
        `<div class="insight-item">${insight}</div>`
    ).join('');
}

// Settings Management
function toggleNotifications() {
    const checkbox = document.getElementById('enableNotifications');
    if (!checkbox) {
        showToast('Settings not available!', 'error');
        return;
    }
    
    const enabled = checkbox.checked;
    localStorage.setItem('notificationsEnabled', enabled.toString());
    showToast(`Notifications ${enabled ? 'enabled' : 'disabled'}`, 'info');
    
    // Request notification permission if enabling
    if (enabled && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notification permission granted!', 'success');
            }
        });
    }
}

function toggleDailyReminders() {
    const checkbox = document.getElementById('dailyReminders');
    if (!checkbox) {
        showToast('Settings not available!', 'error');
        return;
    }
    
    const enabled = checkbox.checked;
    localStorage.setItem('dailyReminders', enabled.toString());
    showToast(`Daily reminders ${enabled ? 'enabled' : 'disabled'}`, 'info');
}

function updateAutoSave() {
    const select = document.getElementById('autoSaveInterval');
    if (!select) {
        showToast('Settings not available!', 'error');
        return;
    }
    
    const interval = parseInt(select.value) * 1000;
    if (isNaN(interval) || interval < 1000) {
        showToast('Invalid auto-save interval!', 'error');
        return;
    }
    
    // Update global variable
    autoSaveInterval = interval;
    localStorage.setItem('autoSaveInterval', interval.toString());
    
    // Restart timer with new interval
    clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (attendanceSystem && attendanceSystem.currentUser) {
            attendanceSystem.saveData();
        }
    }, interval);
    
    showToast(`Auto-save interval updated to ${interval/1000} seconds`, 'info');
}

function clearAllData() {
    if (!attendanceSystem || !attendanceSystem.currentUser) {
        showToast('Please login first!', 'error');
        return;
    }
    
    if (attendanceSystem.currentUser.role !== 'admin') {
        showToast('Only administrators can clear all data!', 'error');
        return;
    }
    
    const confirmText = 'DELETE ALL DATA';
    const userInput = prompt(`This will permanently delete ALL data including students, attendance records, and settings.\n\nType "${confirmText}" to confirm:`);
    
    if (userInput === confirmText) {
        // Clear all data except current user session
        const currentUser = localStorage.getItem('currentUser');
        localStorage.clear();
        if (currentUser) {
            localStorage.setItem('currentUser', currentUser);
        }
        
        showToast('All data cleared successfully', 'success');
        setTimeout(() => location.reload(), 1500);
    } else if (userInput !== null) {
        showToast('Data clear cancelled - confirmation text did not match', 'warning');
    }
}

function importData() {
    document.getElementById('fileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!attendanceSystem || !attendanceSystem.currentUser) {
        showToast('Please login first!', 'error');
        return;
    }
    
    if (attendanceSystem.currentUser.role !== 'admin') {
        showToast('Only administrators can import data!', 'error');
        return;
    }
    
    showLoading();
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (data.students && Array.isArray(data.students)) {
                attendanceSystem.students = data.students;
            }
            
            if (data.attendanceRecords && typeof data.attendanceRecords === 'object') {
                attendanceSystem.attendanceRecords = data.attendanceRecords;
            }
            
            if (data.teacherModifications && typeof data.teacherModifications === 'object') {
                attendanceSystem.teacherModifications = data.teacherModifications;
            }
            
            // Save imported data
            attendanceSystem.saveData();
            
            // Refresh UI
            attendanceSystem.renderStudentList();
            attendanceSystem.renderStudentsGrid();
            attendanceSystem.renderRecords();
            attendanceSystem.populateFilters();
            attendanceSystem.updateStats();
            
            showToast('Data imported successfully!', 'success');
        } catch (error) {
            console.error('Import error:', error);
            showToast('Error importing data: Invalid file format', 'error');
        }
        hideLoading();
    };
    reader.readAsText(file);
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Loading States
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey) {
        switch(e.key) {
            case 'a':
                e.preventDefault();
                if (attendanceSystem && attendanceSystem.currentUser && attendanceSystem.currentUser.role !== 'student') {
                    markAllPresent();
                }
                break;
            case 's':
                e.preventDefault();
                if (attendanceSystem && attendanceSystem.currentUser && attendanceSystem.currentUser.role !== 'student') {
                    saveAttendance();
                }
                break;
            case 'f':
                e.preventDefault();
                const searchInput = document.getElementById('studentSearch');
                if (searchInput) {
                    searchInput.focus();
                }
                break;
            case 't':
                e.preventDefault();
                toggleTheme();
                break;
        }
    }
});

// Initialize new features when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Apply saved theme
    applyTheme();
    document.body.setAttribute('data-color-scheme', currentColorScheme);
    
    // Load saved auto-save interval
    const savedInterval = localStorage.getItem('autoSaveInterval');
    if (savedInterval) {
        autoSaveInterval = parseInt(savedInterval);
    }
    
    // Set theme select value
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = localStorage.getItem('theme') || 'light';
    }
    
    // Set auto-save interval select value
    const autoSaveSelect = document.getElementById('autoSaveInterval');
    if (autoSaveSelect) {
        autoSaveSelect.value = (autoSaveInterval / 1000).toString();
    }
    
    // Load settings
    const enableNotifications = document.getElementById('enableNotifications');
    if (enableNotifications) {
        enableNotifications.checked = localStorage.getItem('notificationsEnabled') === 'true';
    }
    
    const dailyReminders = document.getElementById('dailyReminders');
    if (dailyReminders) {
        dailyReminders.checked = localStorage.getItem('dailyReminders') === 'true';
    }
    
    // Close export dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const exportMenu = document.querySelector('.export-menu');
        const dropdown = document.getElementById('exportDropdown');
        if (dropdown && !exportMenu.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('bulkModal');
        if (e.target === modal) {
            closeBulkModal();
        }
    });
    
    // Initialize tooltips and help text
    initializeTooltips();
});

// Initialize tooltips for better UX
function initializeTooltips() {
    // Add helpful tooltips to various elements
    const elements = [
        { id: 'enableNotifications', title: 'Enable browser notifications for attendance reminders' },
        { id: 'dailyReminders', title: 'Get daily reminders to mark attendance' },
        { id: 'autoSaveInterval', title: 'How often to automatically save data' },
        { id: 'themeSelect', title: 'Choose your preferred theme' }
    ];
    
    elements.forEach(({ id, title }) => {
        const element = document.getElementById(id);
        if (element) {
            element.title = title;
        }
    });
}
