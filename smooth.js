// ====== ملف JavaScript الرئيسي - Hostinger x Team ======
// ====== نظام الاستضافة المتقدم مع أمان محسن ======

// ====== متغيرات النظام ======
let currentUser = '';
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 5;
let isAccountLocked = false;
let lockEndTime = null;
let sessionTimeout = null;
let sessionTimer = null;
let otpCode = '';
let securityPIN = '';
let isAuthenticated = false;
let userSession = {
    startTime: null,
    lastActivity: null,
    ipAddress: '',
    deviceInfo: ''
};

// ====== قوائم الأمان ======
const BLACKLISTED_USERS = ['admin', 'root', 'test', 'user', 'guest'];
const ALLOWED_IPS = ['192.168.1.*', '10.0.0.*']; // يمكن إضافة IPs مسموحة
const SUSPICIOUS_PATTERNS = ['12345', 'admin1', 'password', 'qwerty'];

// ====== عناصر DOM الرئيسية ======
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loadingScreen = document.getElementById('loading-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const pinInput = document.getElementById('pin');
const pinGroup = document.getElementById('pin-group');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const generatePinBtn = document.getElementById('generate-pin-btn');
const otpModal = document.getElementById('otp-modal');
const verifyOtpBtn = document.getElementById('verify-otp');
const resendOtpBtn = document.getElementById('resend-otp');
const otpTimer = document.getElementById('otp-timer');
const attemptsCounter = document.getElementById('attempts-counter');
const attemptsCount = document.getElementById('attempts-count');
const warningMessage = document.getElementById('warning-message');
const warningText = document.getElementById('warning-text');
const lockedMessage = document.getElementById('locked-message');
const unlockTime = document.getElementById('unlock-time');
const blacklistNotice = document.getElementById('blacklist-notice');
const modalClose = document.getElementById('modal-close');
const otpDigits = document.querySelectorAll('.otp-digit');
const currentUserSpan = document.getElementById('current-user');
const userAvatar = document.getElementById('user-avatar');
const sessionWarning = document.getElementById('session-warning');
const sessionTimerSpan = document.getElementById('session-timer');
const extendSessionBtn = document.getElementById('extend-session');
const logoutNowBtn = document.getElementById('logout-now');

// ====== تهيئة النظام ======
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Hostinger x Team Platform Initializing...');
    
    initializeApplication();
    setupEventListeners();
    checkPreviousSession();
    initializeSecurity();
    simulateLoading();
    
    console.log('✅ Platform Ready!');
});

function initializeApplication() {
    // إخفاء عناصر إضافية في البداية
    pinGroup.style.display = 'none';
    warningMessage.style.display = 'none';
    lockedMessage.style.display = 'none';
    blacklistNotice.style.display = 'none';
    attemptsCounter.style.display = 'none';
    
    // إعداد وقت الخادم
    updateServerTime();
    setInterval(updateServerTime, 1000);
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // نموذج الدخول
    loginForm.addEventListener('submit', handleLogin);
    
    // تحقق من المدخلات أثناء الكتابة
    usernameInput.addEventListener('input', validateUsername);
    passwordInput.addEventListener('input', validatePassword);
    pinInput.addEventListener('input', validatePIN);
    
    // توليد PIN
    generatePinBtn.addEventListener('click', generateSecurityPIN);
    
    // إدارة OTP
    verifyOtpBtn.addEventListener('click', verifyOTP);
    resendOtpBtn.addEventListener('click', resendOTP);
    modalClose.addEventListener('click', closeOTPModal);
    
    // إدارة OTP digits
    otpDigits.forEach((digit, index) => {
        digit.addEventListener('input', function(e) {
            handleOTPInput(e, index);
        });
        
        digit.addEventListener('keydown', function(e) {
            handleOTPKeyDown(e, index);
        });
    });
    
    // إدارة الجلسة
    logoutBtn.addEventListener('click', handleLogout);
    extendSessionBtn.addEventListener('click', extendSession);
    logoutNowBtn.addEventListener('click', logoutNow);
    
    // التنقل
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // البحث العالمي
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('input', handleGlobalSearch);
    }
    
    // الإشعارات
    const notificationsBtn = document.getElementById('notifications-btn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', showNotifications);
    }
    
    // الإجراءات السريعة
    const quickUploadBtn = document.getElementById('quick-upload');
    const quickBackupBtn = document.getElementById('quick-backup');
    const quickRestartBtn = document.getElementById('quick-restart');
    
    if (quickUploadBtn) quickUploadBtn.addEventListener('click', quickUpload);
    if (quickBackupBtn) quickBackupBtn.addEventListener('click', createBackup);
    if (quickRestartBtn) quickRestartBtn.addEventListener('click', restartServices);
    
    // تحديث البيانات
    const refreshDashboard = document.getElementById('refresh-dashboard');
    if (refreshDashboard) {
        refreshDashboard.addEventListener('click', refreshDashboardData);
    }
    
    // إغلاق النوافذ المنبثقة بالنقر خارجها
    document.addEventListener('click', function(event) {
        if (event.target === otpModal) {
            closeOTPModal();
        }
        if (event.target === sessionWarning) {
            sessionWarning.style.display = 'none';
        }
    });
    
    // تتبع النشاط لإعادة تعيين مؤقت الجلسة
    document.addEventListener('mousemove', resetSessionTimer);
    document.addEventListener('keypress', resetSessionTimer);
    document.addEventListener('click', resetSessionTimer);
    
    console.log('✅ Event listeners initialized');
}

function simulateLoading() {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);
}

// ====== نظام الأمان ======
function initializeSecurity() {
    // التحقق من حالة القفل السابقة
    const lockState = localStorage.getItem('accountLockState');
    if (lockState) {
        const { locked, until } = JSON.parse(lockState);
        if (locked && new Date(until) > new Date()) {
            isAccountLocked = true;
            lockEndTime = new Date(until);
            showLockedMessage();
        }
    }
    
    // استعادة عدد المحاولات
    const attempts = localStorage.getItem('loginAttempts');
    if (attempts) {
        loginAttempts = parseInt(attempts);
        updateAttemptsCounter();
    }
    
    // توليد PIN افتراضي
    generateSecurityPIN(true);
}

function validateUsername() {
    const username = usernameInput.value.trim();
    const feedback = document.getElementById('username-feedback');
    
    if (username.length === 0) {
        clearFeedback(feedback);
        return false;
    }
    
    if (username.length !== 5) {
        showFeedback(feedback, 'Username must be exactly 5 characters', 'error');
        return false;
    }
    
    if (!/^[A-Za-z0-9]+$/.test(username)) {
        showFeedback(feedback, 'Only letters and numbers allowed', 'error');
        return false;
    }
    
    // التحقق من القائمة السوداء
    if (BLACKLISTED_USERS.includes(username.toLowerCase())) {
        showBlacklistNotice(username);
        return false;
    }
    
    // التحقق من الأنماط المشبوهة
    if (SUSPICIOUS_PATTERNS.includes(username.toLowerCase())) {
        showFeedback(feedback, 'This username pattern is not allowed', 'warning');
        return false;
    }
    
    showFeedback(feedback, '✓ Username is valid', 'success');
    return true;
}

function validatePassword() {
    const password = passwordInput.value.trim();
    const feedback = document.getElementById('password-feedback');
    
    if (password.length === 0) {
        clearFeedback(feedback);
        return false;
    }
    
    if (password.length !== 5) {
        showFeedback(feedback, 'Password must be exactly 5 characters', 'error');
        return false;
    }
    
    if (!/^[A-Za-z0-9]+$/.test(password)) {
        showFeedback(feedback, 'Only letters and numbers allowed', 'error');
        return false;
    }
    
    // التحقق من قوة كلمة المرور
    const strength = checkPasswordStrength(password);
    if (strength === 'weak') {
        showFeedback(feedback, 'Password is too weak', 'warning');
    } else {
        showFeedback(feedback, '✓ Password is valid', 'success');
    }
    
    return true;
}

function validatePIN() {
    const pin = pinInput.value.trim();
    const feedback = document.getElementById('pin-feedback');
    
    if (pin.length === 0) {
        clearFeedback(feedback);
        return false;
    }
    
    if (pin.length !== 5) {
        showFeedback(feedback, 'PIN must be exactly 5 digits', 'error');
        return false;
    }
    
    if (!/^\d{5}$/.test(pin)) {
        showFeedback(feedback, 'Only digits allowed', 'error');
        return false;
    }
    
    showFeedback(feedback, '✓ PIN is valid', 'success');
    return true;
}

function checkPasswordStrength(password) {
    if (password.length < 5) return 'very-weak';
    
    const hasLetters = /[A-Za-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (hasLetters && hasNumbers) return 'strong';
    if (hasLetters || hasNumbers) return 'medium';
    return 'weak';
}

function generateSecurityPIN(silent = false) {
    securityPIN = Math.floor(10000 + Math.random() * 90000).toString();
    
    if (!silent) {
        showNotification(`Security PIN generated: ${securityPIN}`, 'info');
        
        // إظهار حقل PIN
        pinGroup.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
        
        // إضافة إلى سجل النظام
        logSecurityEvent('Security PIN generated', {
            timestamp: new Date().toISOString(),
            pin: securityPIN
        });
    }
    
    return securityPIN;
}

function checkBlacklist(username) {
    return BLACKLISTED_USERS.includes(username.toLowerCase());
}

function increaseLoginAttempts(username) {
    loginAttempts++;
    localStorage.setItem('loginAttempts', loginAttempts);
    updateAttemptsCounter();
    
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockAccount();
        return;
    }
    
    const remaining = MAX_LOGIN_ATTEMPTS - loginAttempts;
    showWarning(`Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    
    // تسجيل محاولة الدخول الفاشلة
    logSecurityEvent('Failed login attempt', {
        username: username,
        attempts: loginAttempts,
        ip: userSession.ipAddress,
        timestamp: new Date().toISOString()
    });
}

function lockAccount() {
    isAccountLocked = true;
    lockEndTime = new Date(Date.now() + 5 * 60 * 1000); // قفل لمدة 5 دقائق
    
    // حفظ حالة القفل
    localStorage.setItem('accountLockState', JSON.stringify({
        locked: true,
        until: lockEndTime.toISOString()
    }));
    
    showLockedMessage();
    
    // تسجيل حدث القفل
    logSecurityEvent('Account locked due to multiple failed attempts', {
        lockDuration: '5 minutes',
        lockUntil: lockEndTime.toISOString()
    });
}

function unlockAccount() {
    isAccountLocked = false;
    loginAttempts = 0;
    localStorage.removeItem('accountLockState');
    localStorage.removeItem('loginAttempts');
    
    attemptsCounter.style.display = 'none';
    lockedMessage.style.display = 'none';
    
    logSecurityEvent('Account unlocked', {
        timestamp: new Date().toISOString()
    });
}

function updateAttemptsCounter() {
    if (loginAttempts > 0) {
        attemptsCounter.style.display = 'flex';
        attemptsCount.textContent = loginAttempts;
    } else {
        attemptsCounter.style.display = 'none';
    }
}

// ====== معالجة الدخول ======
function handleLogin(e) {
    e.preventDefault();
    
    if (!validateLoginForm()) {
        return;
    }
    
    const username = usernameInput.value.trim();
    
    // التحقق من القفل
    if (isAccountLocked) {
        const now = new Date();
        if (now < lockEndTime) {
            const minutes = Math.ceil((lockEndTime - now) / 60000);
            showWarning(`Account is locked. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
            return;
        } else {
            unlockAccount();
        }
    }
    
    // التحقق من القائمة السوداء
    if (checkBlacklist(username)) {
        showBlacklistNotice(username);
        return;
    }
    
    // التحقق من PIN إذا كان ظاهراً
    if (pinGroup.style.display === 'block') {
        const pin = pinInput.value.trim();
        if (pin !== securityPIN) {
            showWarning('Invalid security PIN');
            pinInput.focus();
            increaseLoginAttempts(username);
            return;
        }
    }
    
    // بدء عملية المصادقة
    authenticateUser(username);
}

function validateLoginForm() {
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    
    if (pinGroup.style.display === 'block') {
        const isPINValid = validatePIN();
        return isUsernameValid && isPasswordValid && isPINValid;
    }
    
    return isUsernameValid && isPasswordValid;
}

function authenticateUser(username) {
    const password = passwordInput.value.trim();
    
    // إظهار حالة التحميل
    showLoginLoading();
    
    // محاكاة تأخير الشبكة
    setTimeout(() => {
        // في بيئة حقيقية، هنا يتم الاتصال بالسيرفر
        const isAuthenticated = simulateServerAuthentication(username, password);
        
        if (isAuthenticated) {
            // التحقق من OTP إذا مطلوب
            if (requiresTwoFactor(username)) {
                hideLoginLoading();
                showOTPModal();
            } else {
                completeLogin(username);
            }
        } else {
            hideLoginLoading();
            increaseLoginAttempts(username);
            showWarning('Invalid username or password');
        }
    }, 1500);
}

function simulateServerAuthentication(username, password) {
    // في تطبيق حقيقي، هنا يتم الاتصال بالسيرفر
    // هذه مجرد محاكاة للاختبار
    
    // أسماء مستخدمين وهمية مسموحة
    const validUsers = {
        'ADMIN1': 'PASS1',
        'USER01': 'PASS2',
        'TEST01': 'TEST1',
        'HOST01': 'HOST1',
        'TEAM01': 'TEAM1'
    };
    
    return validUsers[username.toUpperCase()] === password.toUpperCase();
}

function requiresTwoFactor(username) {
    // في تطبيق حقيقي، يتم التحقق من إعدادات المستخدم
    // هنا نطلب OTP للمستخدمين المميزين فقط
    const premiumUsers = ['ADMIN1', 'HOST01'];
    return premiumUsers.includes(username.toUpperCase());
}

function completeLogin(username) {
    // إخفاء شاشة التحميل
    hideLoginLoading();
    
    // إعادة تعيين المحاولات
    loginAttempts = 0;
    localStorage.removeItem('loginAttempts');
    
    // تعيين المستخدم الحالي
    currentUser = username.toUpperCase();
    currentUserSpan.textContent = currentUser;
    userAvatar.innerHTML = `<span>${currentUser.substring(0, 2)}</span>`;
    
    // تهيئة الجلسة
    initializeUserSession();
    
    // إضافة إلى سجل النظام
    logSecurityEvent('User logged in successfully', {
        username: currentUser,
        timestamp: new Date().toISOString(),
        ip: userSession.ipAddress,
        device: userSession.deviceInfo
    });
    
    // تبديل الشاشات
    switchToDashboard();
    
    // إظهار إشعار الترحيب
    showNotification(`Welcome back, ${currentUser}!`, 'success');
    
    // بدء مؤقت الجلسة
    startSessionTimer();
}

function initializeUserSession() {
    userSession = {
        startTime: new Date(),
        lastActivity: new Date(),
        ipAddress: getClientIP(),
        deviceInfo: getDeviceInfo(),
        token: generateSessionToken()
    };
    
    // حفظ الجلسة
    localStorage.setItem('userSession', JSON.stringify(userSession));
}

function checkPreviousSession() {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        const sessionAge = new Date() - new Date(session.lastActivity);
        
        // إذا كانت الجلسة حديثة (أقل من 30 دقيقة)
        if (sessionAge < 30 * 60 * 1000) {
            // تخطي شاشة الدخول
            currentUser = session.username || 'ADMIN';
            currentUserSpan.textContent = currentUser;
            userAvatar.innerHTML = `<span>${currentUser.substring(0, 2)}</span>`;
            switchToDashboard();
            startSessionTimer();
        } else {
            // مسح الجلسة القديمة
            localStorage.removeItem('userSession');
        }
    }
}

// ====== نظام OTP ======
function showOTPModal() {
    generateOTP();
    otpModal.style.display = 'flex';
    
    // بدء المؤقت
    startOTPTimer();
    
    // تفعيل زر التحقق
    verifyOtpBtn.disabled = true;
    
    // إعادة تعيين الحقول
    otpDigits.forEach(digit => digit.value = '');
    otpDigits[0].focus();
}

function closeOTPModal() {
    otpModal.style.display = 'none';
    clearOTPTimer();
}

function generateOTP() {
    otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    console.log(`Generated OTP: ${otpCode}`); // في الإنتاج، يتم إرساله بالبريد أو SMS
    
    logSecurityEvent('OTP generated', {
        forUser: currentUser,
        otp: otpCode,
        timestamp: new Date().toISOString()
    });
}

function handleOTPInput(event, index) {
    const digit = event.target;
    const value = digit.value;
    
    // السماح بالأرقام فقط
    if (!/^\d$/.test(value)) {
        digit.value = '';
        return;
    }
    
    // الانتقال للحقل التالي
    if (index < otpDigits.length - 1) {
        otpDigits[index + 1].focus();
    }
    
    // التحقق من اكتمال OTP
    checkOTPCompletion();
}

function handleOTPKeyDown(event, index) {
    if (event.key === 'Backspace') {
        if (otpDigits[index].value === '' && index > 0) {
            otpDigits[index - 1].focus();
        }
    } else if (event.key === 'ArrowLeft' && index > 0) {
        otpDigits[index - 1].focus();
    } else if (event.key === 'ArrowRight' && index < otpDigits.length - 1) {
        otpDigits[index + 1].focus();
    }
}

function checkOTPCompletion() {
    const enteredOTP = Array.from(otpDigits).map(d => d.value).join('');
    verifyOtpBtn.disabled = enteredOTP.length !== 5;
}

function verifyOTP() {
    const enteredOTP = Array.from(otpDigits).map(d => d.value).join('');
    
    if (enteredOTP === otpCode) {
        closeOTPModal();
        completeLogin(currentUser);
        
        logSecurityEvent('OTP verified successfully', {
            username: currentUser,
            timestamp: new Date().toISOString()
        });
    } else {
        showWarning('Invalid OTP code');
        otpDigits.forEach(digit => digit.value = '');
        otpDigits[0].focus();
        verifyOtpBtn.disabled = true;
        
        logSecurityEvent('Invalid OTP entered', {
            username: currentUser,
            enteredOTP: enteredOTP
        });
    }
}

function resendOTP() {
    generateOTP();
    startOTPTimer();
    
    otpDigits.forEach(digit => digit.value = '');
    otpDigits[0].focus();
    verifyOtpBtn.disabled = true;
    
    showNotification('New OTP code sent', 'info');
}

function startOTPTimer() {
    let timeLeft = 120; // 120 ثانية
    
    clearOTPTimer();
    
    otpTimer.textContent = formatTime(timeLeft);
    
    otpTimerInterval = setInterval(() => {
        timeLeft--;
        otpTimer.textContent = formatTime(timeLeft);
        
        if (timeLeft <= 0) {
            clearOTPTimer();
            verifyOtpBtn.disabled = true;
            showWarning('OTP code expired');
        }
    }, 1000);
}

function clearOTPTimer() {
    if (otpTimerInterval) {
        clearInterval(otpTimerInterval);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ====== إدارة الجلسة ======
function startSessionTimer() {
    // مسح أي مؤقت سابق
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
    
    let timeLeft = 30 * 60; // 30 دقيقة بالثواني
    
    // تحديث المؤقت كل ثانية
    sessionTimer = setInterval(() => {
        timeLeft--;
        
        if (timeLeft <= 300 && timeLeft > 0) { // 5 دقائق متبقية
            if (!sessionWarning.style.display || sessionWarning.style.display === 'none') {
                showSessionWarning(timeLeft);
            } else {
                sessionTimerSpan.textContent = Math.ceil(timeLeft / 60);
            }
        }
        
        if (timeLeft <= 0) {
            endSession();
        }
    }, 1000);
}

function resetSessionTimer() {
    if (sessionTimer) {
        // إعادة تعيين المؤقت للقيمة الأصلية
        clearInterval(sessionTimer);
        startSessionTimer();
        
        // تحديث وقت النشاط الأخير
        userSession.lastActivity = new Date();
        localStorage.setItem('userSession', JSON.stringify(userSession));
    }
}

function showSessionWarning(timeLeft) {
    const minutesLeft = Math.ceil(timeLeft / 60);
    sessionTimerSpan.textContent = minutesLeft;
    sessionWarning.style.display = 'flex';
}

function extendSession() {
    sessionWarning.style.display = 'none';
    resetSessionTimer();
    
    showNotification('Session extended for 30 minutes', 'success');
    
    logSecurityEvent('Session extended', {
        username: currentUser,
        timestamp: new Date().toISOString()
    });
}

function logoutNow() {
    sessionWarning.style.display = 'none';
    handleLogout();
}

function endSession() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
    
    showNotification('Your session has expired', 'warning');
    handleLogout();
}

function handleLogout() {
    // مسح مؤقت الجلسة
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
    
    // تسجيل خروج
    logSecurityEvent('User logged out', {
        username: currentUser,
        timestamp: new Date().toISOString(),
        sessionDuration: getSessionDuration()
    });
    
    // مسح الجلسة
    localStorage.removeItem('userSession');
    
    // إعادة تعيين البيانات
    currentUser = '';
    loginAttempts = 0;
    localStorage.removeItem('loginAttempts');
    
    // إعادة تعيين النموذج
    loginForm.reset();
    pinGroup.style.display = 'none';
    warningMessage.style.display = 'none';
    lockedMessage.style.display = 'none';
    blacklistNotice.style.display = 'none';
    attemptsCounter.style.display = 'none';
    
    // تبديل الشاشات
    switchToLogin();
    
    // إظهار رسالة
    showNotification('You have been logged out successfully', 'info');
}

function getSessionDuration() {
    if (!userSession.startTime) return '0m';
    
    const start = new Date(userSession.startTime);
    const end = new Date();
    const duration = end - start;
    
    const minutes = Math.floor(duration / 60000);
    return `${minutes}m`;
}

// ====== التنقل ======
function switchToDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
    
    // تحميل بيانات Dashboard
    loadDashboardData();
}

function switchToLogin() {
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
}

function handleNavigation(e) {
    e.preventDefault();
    
    const target = e.currentTarget;
    const section = target.dataset.section;
    
    // تحديث التنقل النشط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    target.classList.add('active');
    
    // إظهار القسم المحدد
    showSection(section);
    
    // تسجيل النشاط
    logUserActivity(`Navigated to ${section} section`);
}

function showSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إظهار القسم المطلوب
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // تحميل بيانات القسم
        switch(sectionId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'files':
                loadFilesData();
                break;
            case 'databases':
                loadDatabasesData();
                break;
            case 'settings':
                loadSettingsData();
                break;
        }
    }
}

// ====== وظائف Dashboard ======
function loadDashboardData() {
    // تحديث الإحصائيات
    updateDashboardStats();
    
    // تحديث النشاطات الحديثة
    updateRecentActivity();
    
    // تحديث حالة الخادم
    updateServerStatus();
}

function updateDashboardStats() {
    // هنا يمكن جلب البيانات من السيرفر
    // حالياً نستخدم بيانات وهمية
    
    const stats = {
        totalFiles: Math.floor(Math.random() * 1000) + 500,
        dbSize: (Math.random() * 5 + 1).toFixed(1),
        activeUsers: Math.floor(Math.random() * 20) + 5,
        uptime: '99.97%'
    };
    
    // تحديث واجهة المستخدم
    // سيتم تطبيق هذا في التحديثات القادمة
}

function updateRecentActivity() {
    // تحديث قائمة النشاطات
}

function updateServerStatus() {
    // تحديث حالة الخادم
}

function refreshDashboardData() {
    showNotification('Refreshing dashboard data...', 'info');
    
    setTimeout(() => {
        loadDashboardData();
        showNotification('Dashboard data updated', 'success');
    }, 1000);
}

// ====== وظائف الملفات ======
function loadFilesData() {
    // تحميل بيانات الملفات
}

function quickUpload() {
    showNotification('Opening file upload dialog...', 'info');
    // هنا سيتم فتح نافذة رفع الملفات
}

// ====== وظائف النسخ الاحتياطي ======
function createBackup() {
    const backupBtn = document.getElementById('quick-backup');
    const originalText = backupBtn.innerHTML;
    
    backupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    backupBtn.disabled = true;
    
    setTimeout(() => {
        backupBtn.innerHTML = originalText;
        backupBtn.disabled = false;
        
        const backupSize = (Math.random() * 500 + 100).toFixed(1);
        showNotification(`Backup created successfully! Size: ${backupSize} MB`, 'success');
        
        logUserActivity('Created system backup');
    }, 3000);
}

// ====== وظائف الخادم ======
function restartServices() {
    if (confirm('Are you sure you want to restart all services? This may cause temporary downtime.')) {
        showNotification('Restarting services...', 'warning');
        
        setTimeout(() => {
            showNotification('All services restarted successfully', 'success');
            
            logUserActivity('Restarted all services');
        }, 5000);
    }
}

// ====== البحث ======
function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (query.length < 2) {
        return;
    }
    
    // البحث في البيانات
    // سيتم تطبيق البحث الحقيقي في التحديثات القادمة
}

// ====== الإشعارات ======
function showNotifications() {
    // عرض قائمة الإشعارات
    showNotification('Notifications feature coming soon!', 'info');
}

// ====== وظائف المساعدة ======
function showLoginLoading() {
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    loginBtn.disabled = true;
}

function hideLoginLoading() {
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
    loginBtn.disabled = false;
}

function showWarning(message) {
    warningText.textContent = message;
    warningMessage.style.display = 'flex';
    
    setTimeout(() => {
        warningMessage.style.display = 'none';
    }, 5000);
}

function showLockedMessage() {
    if (!isAccountLocked || !lockEndTime) return;
    
    const updateTimer = () => {
        const now = new Date();
        const diff = lockEndTime - now;
        
        if (diff <= 0) {
            unlockAccount();
            return;
        }
        
        const minutes = Math.ceil(diff / 60000);
        unlockTime.textContent = `${minutes}:00`;
        
        setTimeout(updateTimer, 1000);
    };
    
    lockedMessage.style.display = 'block';
    updateTimer();
}

function showBlacklistNotice(username) {
    blacklistNotice.style.display = 'block';
    
    logSecurityEvent('Blacklisted user attempted login', {
        username: username,
        timestamp: new Date().toISOString(),
        ip: getClientIP()
    });
}

function showNotification(message, type = 'info', duration = 3000) {
    // في تطبيق حقيقي، هنا يتم عرض إشعار
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // يمكن إضافة مكتبة إشعارات هنا
    alert(message); // مؤقتاً نستخدم alert
}

function showFeedback(element, message, type) {
    element.textContent = message;
    element.className = 'validation-feedback ' + type;
    element.style.display = 'block';
}

function clearFeedback(element) {
    element.textContent = '';
    element.style.display = 'none';
}

// ====== وظائف الأمان ======
function logSecurityEvent(event, data = {}) {
    const logEntry = {
        event: event,
        timestamp: new Date().toISOString(),
        user: currentUser || 'system',
        data: data
    };
    
    // في تطبيق حقيقي، هنا يتم إرسال السجل للسيرفر
    console.log('🔒 Security Event:', logEntry);
    
    // حفظ في localStorage للعرض
    const securityLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    securityLogs.unshift(logEntry);
    if (securityLogs.length > 100) securityLogs.pop();
    localStorage.setItem('securityLogs', JSON.stringify(securityLogs));
}

function logUserActivity(activity) {
    console.log(`👤 User Activity: ${currentUser} - ${activity}`);
}

function generateSessionToken() {
    return 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function getClientIP() {
    // في تطبيق حقيقي، يتم الحصول على IP من السيرفر
    // هنا نعيد IP وهمي للاختبار
    return '192.168.1.' + Math.floor(Math.random() * 255);
}

function getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
        browser: getBrowserName(ua),
        os: getOSName(ua),
        platform: navigator.platform
    };
}

function getBrowserName(ua) {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
}

function getOSName(ua) {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
}

function updateServerTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const serverTimeElement = document.getElementById('server-time');
    if (serverTimeElement) {
        serverTimeElement.textContent = timeString;
    }
}

// ====== تصدير الوظائف للاستخدام في وحدة التحكم ======
window.hostingApp = {
    // نظام الدخول
    login: handleLogin,
    logout: handleLogout,
    generatePIN: generateSecurityPIN,
    
    // الأمان
    checkSecurity: () => ({
        attempts: loginAttempts,
        locked: isAccountLocked,
        lockUntil: lockEndTime,
        session: userSession
    }),
    
    // الإدارة
    backup: createBackup,
    restart: restartServices,
    
    // المعلومات
    getStats: () => ({
        user: currentUser,
        sessionTime: getSessionDuration(),
        securityLogs: JSON.parse(localStorage.getItem('securityLogs') || '[]').length
    }),
    
    // المساعدة
    help: () => {
        console.log('=== Hostinger x Team Platform ===');
        console.log('Available commands:');
        console.log('• hostingApp.login() - Test login');
        console.log('• hostingApp.logout() - Logout current user');
        console.log('• hostingApp.generatePIN() - Generate new security PIN');
        console.log('• hostingApp.checkSecurity() - View security status');
        console.log('• hostingApp.backup() - Create system backup');
        console.log('• hostingApp.restart() - Restart services');
        console.log('• hostingApp.getStats() - View platform statistics');
    }
};

// عرض رسالة الترحيب في الكونسول
console.log('🚀 Hostinger x Team Platform Loaded!');
console.log('Type "hostingApp.help()" for available commands.');