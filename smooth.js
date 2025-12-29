// ====== GLOBAL VARIABLES ======
let currentUser = '';
let fileUploadQueue = [];
let isUploading = false;
let uploadProgress = 0;
let systemLogs = [];

// ====== DOM ELEMENTS ======
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentUserSpan = document.getElementById('current-user');
const userAvatar = document.getElementById('user-avatar');
const uploadProgressBar = document.getElementById('upload-progress');
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const queueCount = document.getElementById('queue-count');
const queueList = document.getElementById('queue-list');
const recentFiles = document.getElementById('recent-files');
const systemLog = document.getElementById('system-log');
const notificationToast = document.getElementById('notification-toast');

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initEventListeners();
    initFakeData();
    updateLiveStats();
});

// ====== PARTICLE BACKGROUND ======
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(67, 97, 238, ${Math.random() * 0.4 + 0.1});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: float ${Math.random() * 20 + 10}s linear infinite;
        `;
        particlesContainer.appendChild(particle);
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(0) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ====== EVENT LISTENERS ======
function initEventListeners() {
    // Login Form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout Button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-link, .nav-item').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // File Upload
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and Drop
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    
    // Upload Area Click
    dropArea.addEventListener('click', () => fileInput.click());
    
    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', toggleFAQ);
    });
    
    // Server Controls
    document.querySelectorAll('.btn-control').forEach(btn => {
        btn.addEventListener('click', handleServiceControl);
    });
    
    // Settings
    document.getElementById('max-upload').addEventListener('input', updateMaxUploadValue);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // File Manager
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', switchFileView);
    });
    
    // Quick Actions
    document.getElementById('quick-upload').addEventListener('click', () => {
        switchSection('upload');
        fileInput.click();
    });
    
    // Notification Close
    document.querySelector('.toast-close').addEventListener('click', hideToast);
}

// ====== LOGIN/LOGOUT ======
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validate credentials (must be exactly 5 characters)
    if (username.length !== 5 || password.length !== 5) {
        showNotification('Username and password must be exactly 5 characters!', 'error');
        return;
    }
    
    // Show loading state
    const loader = loginBtn.querySelector('.btn-loader');
    loader.style.display = 'block';
    loginBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        currentUser = username.toUpperCase();
        currentUserSpan.textContent = currentUser;
        userAvatar.textContent = currentUser.substring(0, 2);
        
        // Add to system log
        addSystemLog(`User '${currentUser}' logged in successfully`, 'success');
        
        // Switch screens
        loginScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        
        // Reset form
        loginForm.reset();
        loader.style.display = 'none';
        loginBtn.disabled = false;
        
        // Show welcome notification
        showNotification(`Welcome back, ${currentUser}!`, 'success');
        
        // Update stats
        updateLiveStats();
    }, 1500);
}

function handleLogout() {
    // Add to system log
    addSystemLog(`User '${currentUser}' logged out`, 'info');
    
    // Switch screens
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
    
    // Reset
    currentUser = '';
    
    // Show notification
    showNotification('You have been logged out successfully', 'info');
}

// ====== NAVIGATION ======
function handleNavigation(e) {
    e.preventDefault();
    const section = this.dataset.section || this.getAttribute('href').substring(1);
    
    // Update active nav items
    document.querySelectorAll('.nav-link, .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    this.classList.add('active');
    
    // Switch section
    switchSection(section);
}

function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(`${sectionId}-section`) || 
                         document.getElementById(`${sectionId}`);
    
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// ====== FILE UPLOAD ======
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFilesToQueue(files);
}

function handleDragOver(e) {
    e.preventDefault();
    dropArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    addFilesToQueue(files);
}

function addFilesToQueue(files) {
    // Check file size (max 300MB)
    const maxSize = 300 * 1024 * 1024; // 300MB in bytes
    const validFiles = files.filter(file => {
        if (file.size > maxSize) {
            showNotification(`File "${file.name}" exceeds 300MB limit!`, 'error');
            return false;
        }
        return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Add to queue
    validFiles.forEach(file => {
        const fileId = Date.now() + Math.random();
        fileUploadQueue.push({
            id: fileId,
            file: file,
            progress: 0,
            status: 'queued'
        });
    });
    
    updateUploadQueue();
    showNotification(`${validFiles.length} file(s) added to upload queue`, 'success');
}

function updateUploadQueue() {
    queueCount.textContent = fileUploadQueue.length;
    
    // Update queue list
    queueList.innerHTML = '';
    fileUploadQueue.forEach(item => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.innerHTML = `
            <div class="queue-item-info">
                <div class="queue-item-icon">
                    <i class="fas fa-file"></i>
                </div>
                <div class="queue-item-details">
                    <h4>${item.file.name}</h4>
                    <p>${formatFileSize(item.file.size)}</p>
                </div>
            </div>
            <div class="queue-item-progress">
                <div class="queue-item-progress-fill" style="width: ${item.progress}%"></div>
            </div>
        `;
        queueList.appendChild(queueItem);
    });
    
    // Start upload if not already uploading
    if (!isUploading && fileUploadQueue.length > 0) {
        startUpload();
    }
}

function startUpload() {
    if (fileUploadQueue.length === 0 || isUploading) return;
    
    isUploading = true;
    const item = fileUploadQueue[0];
    item.status = 'uploading';
    
    // Show progress bar
    uploadProgressBar.classList.add('active');
    
    // Simulate upload progress
    const interval = setInterval(() => {
        item.progress += Math.random() * 10;
        if (item.progress >= 100) {
            item.progress = 100;
            clearInterval(interval);
            completeUpload(item);
        }
        updateUploadProgress(item);
        updateUploadQueue();
    }, 200);
}

function updateUploadProgress(item) {
    const progressFill = uploadProgressBar.querySelector('.progress-fill');
    const progressPercent = uploadProgressBar.querySelector('.progress-percent');
    const progressSpeed = uploadProgressBar.querySelector('.progress-speed');
    const progressTime = uploadProgressBar.querySelector('.progress-time');
    
    progressFill.style.width = `${item.progress}%`;
    progressPercent.textContent = `${Math.round(item.progress)}%`;
    
    // Simulate upload speed and time
    const speed = Math.random() * 5 + 2;
    const time = Math.round((100 - item.progress) / speed);
    
    progressSpeed.textContent = `${speed.toFixed(1)} MB/s`;
    progressTime.textContent = `${time}s remaining`;
}

function completeUpload(item) {
    // Remove from queue
    fileUploadQueue = fileUploadQueue.filter(i => i.id !== item.id);
    
    // Add to recent files
    addRecentFile(item.file);
    
    // Add to system log
    addSystemLog(`File "${item.file.name}" uploaded successfully`, 'success');
    
    // Update live stats
    updateLiveStats();
    
    // Update queue
    updateUploadQueue();
    
    // Hide progress bar if queue is empty
    if (fileUploadQueue.length === 0) {
        setTimeout(() => {
            uploadProgressBar.classList.remove('active');
            isUploading = false;
            showNotification('All files uploaded successfully!', 'success');
        }, 1000);
    } else {
        // Start next upload
        setTimeout(() => {
            isUploading = false;
            startUpload();
        }, 500);
    }
}

function addRecentFile(file) {
    const fileType = getFileType(file.name);
    const fileSize = formatFileSize(file.size);
    
    const fileCard = document.createElement('div');
    fileCard.className = 'file-card';
    fileCard.innerHTML = `
        <div class="file-icon">
            <i class="${getFileIcon(fileType)}"></i>
        </div>
        <h4 title="${file.name}">${truncateFileName(file.name)}</h4>
        <p class="file-meta">${fileSize} • ${fileType}</p>
        <div class="file-actions">
            <button class="file-action" title="Download">
                <i class="fas fa-download"></i>
            </button>
            <button class="file-action" title="Share">
                <i class="fas fa-share"></i>
            </button>
            <button class="file-action" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add to beginning
    recentFiles.insertBefore(fileCard, recentFiles.firstChild);
    
    // Limit to 8 files
    if (recentFiles.children.length > 8) {
        recentFiles.removeChild(recentFiles.lastChild);
    }
}

// ====== SYSTEM LOG ======
function addSystemLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        <span class="log-message">${message}</span>
    `;
    
    // Add to beginning
    systemLog.insertBefore(logEntry, systemLog.firstChild);
    
    // Limit to 50 entries
    if (systemLog.children.length > 50) {
        systemLog.removeChild(systemLog.lastChild);
    }
    
    // Save to array
    systemLogs.unshift({timestamp, message, type});
    if (systemLogs.length > 100) systemLogs.pop();
}

// ====== SERVER CONTROL ======
function handleServiceControl(e) {
    e.stopPropagation();
    
    const button = e.currentTarget;
    const serviceCard = button.closest('.service-card');
    const service = serviceCard.dataset.service;
    const action = button.dataset.action;
    
    // Get service name
    const serviceName = serviceCard.querySelector('h4').textContent;
    
    // Disable all buttons temporarily
    const buttons = serviceCard.querySelectorAll('.btn-control');
    buttons.forEach(btn => btn.disabled = true);
    
    // Update status
    const statusDot = serviceCard.querySelector('.status-dot');
    const statusText = serviceCard.querySelector('.service-status span:nth-child(2)');
    
    switch(action) {
        case 'stop':
            statusDot.style.background = 'var(--danger)';
            statusText.textContent = 'Stopping...';
            setTimeout(() => {
                statusText.textContent = 'Stopped';
                addSystemLog(`${serviceName} service stopped`, 'warning');
                showNotification(`${serviceName} stopped successfully`, 'warning');
                buttons.forEach(btn => btn.disabled = false);
            }, 2000);
            break;
            
        case 'restart':
            statusDot.style.background = 'var(--warning)';
            statusText.textContent = 'Restarting...';
            setTimeout(() => {
                statusDot.style.background = 'var(--success)';
                statusText.textContent = 'Running';
                addSystemLog(`${serviceName} service restarted`, 'success');
                showNotification(`${serviceName} restarted successfully`, 'success');
                buttons.forEach(btn => btn.disabled = false);
            }, 3000);
            break;
            
        case 'logs':
            showNotification(`Opening ${serviceName} logs...`, 'info');
            setTimeout(() => {
                buttons.forEach(btn => btn.disabled = false);
            }, 1000);
            break;
    }
}

// ====== SETTINGS ======
function updateMaxUploadValue() {
    const slider = document.getElementById('max-upload');
    const valueSpan = document.getElementById('max-upload-value');
    valueSpan.textContent = `${slider.value} MB`;
}

function saveSettings() {
    const serverName = document.getElementById('server-name').value;
    const maxUpload = document.getElementById('max-upload').value;
    const phpVersion = document.getElementById('php-version').value;
    const autoBackup = document.getElementById('auto-backup').checked;
    const maintenanceMode = document.getElementById('maintenance-mode').checked;
    
    // Show loading
    const saveBtn = document.getElementById('save-settings');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Update system log
        addSystemLog('Server settings updated successfully', 'success');
        
        // Show notification
        showNotification('Settings saved successfully!', 'success');
        
        // Reset button
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }, 1500);
}

// ====== FILE MANAGER ======
function switchFileView(e) {
    const view = this.dataset.view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    this.classList.add('active');
    
    // Switch view
    const gridView = document.getElementById('files-grid');
    const listView = document.getElementById('files-list');
    
    if (view === 'grid') {
        gridView.style.display = 'grid';
        listView.style.display = 'none';
    } else {
        gridView.style.display = 'none';
        listView.style.display = 'block';
    }
}

// ====== FAQ ======
function toggleFAQ() {
    const faqItem = this.parentElement;
    faqItem.classList.toggle('active');
}

// ====== NOTIFICATIONS ======
function showNotification(message, type = 'success') {
    const toast = document.getElementById('notification-toast');
    const toastIcon = toast.querySelector('i');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Update icon and message
    switch(type) {
        case 'success':
            toastIcon.className = 'fas fa-check-circle';
            toast.style.borderLeftColor = 'var(--success)';
            break;
        case 'error':
            toastIcon.className = 'fas fa-exclamation-circle';
            toast.style.borderLeftColor = 'var(--danger)';
            break;
        case 'warning':
            toastIcon.className = 'fas fa-exclamation-triangle';
            toast.style.borderLeftColor = 'var(--warning)';
            break;
        case 'info':
            toastIcon.className = 'fas fa-info-circle';
            toast.style.borderLeftColor = 'var(--info)';
            break;
    }
    
    toastMessage.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto hide after 5 seconds
    setTimeout(hideToast, 5000);
}

function hideToast() {
    notificationToast.classList.remove('show');
}

// ====== LIVE STATS ======
function updateLiveStats() {
    // Update online users (random between 5-15)
    const onlineUsers = Math.floor(Math.random() * 10) + 5;
    document.getElementById('online-users').textContent = onlineUsers;
    document.getElementById('online-users-count').textContent = onlineUsers;
    
    // Update active files (random between 100-200)
    const activeFiles = Math.floor(Math.random() * 100) + 100;
    document.getElementById('active-files-count').textContent = activeFiles;
    document.getElementById('online-files').textContent = activeFiles;
    
    // Update response time (random between 20-50ms)
    const responseTime = Math.floor(Math.random() * 30) + 20;
    document.getElementById('response-time').textContent = `${responseTime}ms`;
    
    // Update offline files (random between 10-30)
    const offlineFiles = Math.floor(Math.random() * 20) + 10;
    document.getElementById('offline-files').textContent = offlineFiles;
    
    // Update every 30 seconds
    setTimeout(updateLiveStats, 30000);
}

// ====== UTILITY FUNCTIONS ======
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const fileTypes = {
        'php': 'PHP Script',
        'py': 'Python Script',
        'js': 'JavaScript',
        'html': 'HTML Document',
        'css': 'Stylesheet',
        'json': 'JSON Data',
        'txt': 'Text File',
        'zip': 'ZIP Archive',
        'rar': 'RAR Archive',
        'gz': 'GZIP Archive',
        'jpg': 'JPEG Image',
        'jpeg': 'JPEG Image',
        'png': 'PNG Image',
        'gif': 'GIF Image',
        'pdf': 'PDF Document',
        'doc': 'Word Document',
        'docx': 'Word Document',
        'xls': 'Excel Spreadsheet',
        'xlsx': 'Excel Spreadsheet'
    };
    return fileTypes[extension] || 'Unknown File';
}

function getFileIcon(fileType) {
    const iconMap = {
        'PHP Script': 'fab fa-php',
        'Python Script': 'fab fa-python',
        'JavaScript': 'fab fa-js',
        'HTML Document': 'fab fa-html5',
        'Stylesheet': 'fab fa-css3-alt',
        'JSON Data': 'fas fa-code',
        'Text File': 'fas fa-file-alt',
        'ZIP Archive': 'fas fa-file-archive',
        'RAR Archive': 'fas fa-file-archive',
        'GZIP Archive': 'fas fa-file-archive',
        'JPEG Image': 'fas fa-file-image',
        'PNG Image': 'fas fa-file-image',
        'GIF Image': 'fas fa-file-image',
        'PDF Document': 'fas fa-file-pdf',
        'Word Document': 'fas fa-file-word',
        'Excel Spreadsheet': 'fas fa-file-excel',
        'Unknown File': 'fas fa-file'
    };
    return iconMap[fileType] || 'fas fa-file';
}

function truncateFileName(filename, maxLength = 20) {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const name = filename.substring(0, maxLength - extension.length - 4);
    return name + '...' + extension;
}

// ====== INITIAL DATA ======
function initFakeData() {
    // Add some recent files
    const fakeFiles = [
        { name: 'index.php', size: 24576, type: 'PHP Script' },
        { name: 'app.py', size: 153600, type: 'Python Script' },
        { name: 'styles.css', size: 8192, type: 'Stylesheet' },
        { name: 'script.js', size: 16384, type: 'JavaScript' },
        { name: 'database_backup.zip', size: 157286400, type: 'ZIP Archive' },
        { name: 'config.json', size: 4096, type: 'JSON Data' },
        { name: 'readme.txt', size: 2048, type: 'Text File' },
        { name: 'logo.png', size: 51200, type: 'PNG Image' }
    ];
    
    fakeFiles.forEach(file => {
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        fileCard.innerHTML = `
            <div class="file-icon">
                <i class="${getFileIcon(file.type)}"></i>
            </div>
            <h4 title="${file.name}">${truncateFileName(file.name)}</h4>
            <p class="file-meta">${formatFileSize(file.size)} • ${file.type}</p>
            <div class="file-actions">
                <button class="file-action" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="file-action" title="Share">
                    <i class="fas fa-share"></i>
                </button>
                <button class="file-action" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        recentFiles.appendChild(fileCard);
    });
}

// ====== EXPORT FUNCTIONS (for console debugging) ======
window.hostingApp = {
    login: handleLogin,
    logout: handleLogout,
    uploadFiles: addFilesToQueue,
    showNotification: showNotification,
    addSystemLog: addSystemLog,
    getStats: () => ({
        onlineUsers: document.getElementById('online-users').textContent,
        activeFiles: document.getElementById('online-files').textContent,
        uploadQueue: fileUploadQueue.length
    })
};

console.log('Hostinger x Team Platform Loaded!');
console.log('Available commands: window.hostingApp.login(), window.hostingApp.logout(), etc.');