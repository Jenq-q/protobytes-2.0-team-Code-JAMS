// =====================================================
// NEPAL CITIZEN SERVICE PORTAL - JAVASCRIPT
// =====================================================

// =====================================================
// GLOBAL STATE
// ===================================================== 
const appState = {
    currentUser: null,
    notifications: [],
    complaints: [],
    currentSection: 'dashboard'
};

// =====================================================
// MODAL FUNCTIONS
// =====================================================
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

function switchToRegister() {
    closeLoginModal();
    setTimeout(() => {
        showRegisterModal();
    }, 200);
}

function switchToLogin() {
    closeRegisterModal();
    setTimeout(() => {
        showLoginModal();
    }, 200);
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (e.target === loginModal) {
        closeLoginModal();
    }
    if (e.target === registerModal) {
        closeRegisterModal();
    }
});

// =====================================================
// FORM HANDLERS
// =====================================================
function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get('loginEmail');
    const password = formData.get('loginPassword');
    
    // Simulate login (replace with actual API call)
    console.log('Login attempt:', email);
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Signing in...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Simulate successful login
        showNotification('Login successful! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = 'user-dashboard.html';
        }, 1000);
    }, 1500);
}

function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Validate passwords match
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'warning');
        return;
    }
    
    // Get all form data
    const registrationData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        citizenship: formData.get('citizenship'),
        permanentProvince: formData.get('permanentProvince'),
        permanentDistrict: formData.get('permanentDistrict'),
        permanentMunicipality: formData.get('permanentMunicipality'),
        permanentWard: formData.get('permanentWard'),
        temporaryProvince: formData.get('temporaryProvince'),
        temporaryDistrict: formData.get('temporaryDistrict'),
        temporaryMunicipality: formData.get('temporaryMunicipality'),
        temporaryWard: formData.get('temporaryWard'),
        nidCard: formData.get('nidCard')
    };
    
    console.log('Registration data:', registrationData);
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Creating Account...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('Account created successfully! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = 'user-dashboard.html';
        }, 1500);
    }, 2000);
}

function copyPermanentAddress() {
    const checkbox = document.getElementById('sameAsPermament');
    
    if (checkbox.checked) {
        // Copy permanent address to temporary
        document.getElementById('temporaryProvince').value = document.getElementById('permanentProvince').value;
        document.getElementById('temporaryDistrict').value = document.getElementById('permanentDistrict').value;
        document.getElementById('temporaryMunicipality').value = document.getElementById('permanentMunicipality').value;
        document.getElementById('temporaryWard').value = document.getElementById('permanentWard').value;
    } else {
        // Clear temporary address
        document.getElementById('temporaryProvince').value = '';
        document.getElementById('temporaryDistrict').value = '';
        document.getElementById('temporaryMunicipality').value = '';
        document.getElementById('temporaryWard').value = '';
    }
}

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✓',
        warning: '⚠',
        error: '✕',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 0.75rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                max-width: 400px;
                border-left: 4px solid;
            }
            .notification-info { border-color: #3b82f6; }
            .notification-warning { border-color: #f59e0b; }
            .notification-success { border-color: #10b981; }
            .notification-error { border-color: #dc2626; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .notification-icon {
                font-size: 1.5rem;
            }
            .notification-message {
                color: #262626;
                font-weight: 600;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// =====================================================
// NAVIGATION FUNCTIONS
// =====================================================
function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// =====================================================
// DASHBOARD FUNCTIONS
// =====================================================
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
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    appState.currentSection = sectionName;
}

function showAdminSection(sectionName) {
    showSection(sectionName);
}

// =====================================================
// DROPDOWN MENUS
// =====================================================
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    const userMenu = document.getElementById('userMenuDropdown');
    
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
    
    if (userMenu) {
        userMenu.classList.remove('active');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    const notifMenu = document.getElementById('notificationDropdown');
    
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
    
    if (notifMenu) {
        notifMenu.classList.remove('active');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    const notifIcon = document.querySelector('.notification-icon');
    const userProfile = document.querySelector('.user-profile');
    const notifDropdown = document.getElementById('notificationDropdown');
    const userDropdown = document.getElementById('userMenuDropdown');
    
    if (notifDropdown && !notifIcon?.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('active');
    }
    
    if (userDropdown && !userProfile?.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
});

// =====================================================
// COMPLAINT FUNCTIONS
// =====================================================
function submitComplaint(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const complaintData = {
        category: formData.get('category'),
        title: formData.get('complaintTitle'),
        description: formData.get('complaintDescription'),
        province: formData.get('province'),
        district: formData.get('district'),
        municipality: formData.get('municipality'),
        wardNo: formData.get('wardNo'),
        specificLocation: formData.get('specificLocation'),
        emailNotification: formData.get('emailNotification') === 'on',
        smsNotification: formData.get('smsNotification') === 'on'
    };
    
    console.log('Complaint data:', complaintData);
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        const referenceNo = 'CPL-2025-' + String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
        
        showNotification(`Complaint registered successfully! Reference No: ${referenceNo}`, 'success');
        
        // Reset form
        event.target.reset();
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
        
        // Switch to my complaints section
        setTimeout(() => {
            showSection('my-complaints');
        }, 2000);
    }, 2000);
}

function resetComplaintForm() {
    const form = document.getElementById('complaintForm');
    if (form) {
        form.reset();
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = '0';
        }
        showNotification('Form reset successfully', 'info');
    }
}

// Character counter for complaint description
document.addEventListener('DOMContentLoaded', () => {
    const descriptionField = document.getElementById('complaintDescription');
    const charCount = document.getElementById('charCount');
    
    if (descriptionField && charCount) {
        descriptionField.addEventListener('input', () => {
            const length = descriptionField.value.length;
            charCount.textContent = length;
            
            if (length > 1800) {
                charCount.style.color = 'var(--danger-red)';
            } else if (length > 1500) {
                charCount.style.color = 'var(--warning-yellow)';
            } else {
                charCount.style.color = 'var(--neutral-500)';
            }
        });
    }
});

// File upload handling
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    let selectedFiles = [];
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-red)';
            uploadArea.style.background = 'var(--primary-lightest)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--neutral-300)';
            uploadArea.style.background = 'transparent';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--neutral-300)';
            uploadArea.style.background = 'transparent';
            
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleFiles(files);
        });
    }
    
    function handleFiles(files) {
        files.forEach(file => {
            if (file.size <= 10 * 1024 * 1024) { // 10MB limit
                selectedFiles.push(file);
                displayFile(file);
            } else {
                showNotification(`File ${file.name} is too large. Maximum size is 10MB.`, 'warning');
            }
        });
    }
    
    function displayFile(file) {
        if (!fileList) return;
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
            <button class="remove-file-btn" onclick="removeFile('${file.name}')">✕</button>
        `;
        
        fileList.appendChild(fileItem);
        
        // Add file list styles if not present
        if (!document.getElementById('file-list-styles')) {
            const style = document.createElement('style');
            style.id = 'file-list-styles';
            style.textContent = `
                .file-list {
                    margin-top: 1rem;
                }
                .file-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: var(--neutral-100);
                    border-radius: var(--radius-md);
                    margin-bottom: 0.5rem;
                }
                .file-name {
                    flex: 1;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--neutral-700);
                }
                .file-size {
                    font-size: 0.75rem;
                    color: var(--neutral-500);
                    margin: 0 1rem;
                }
                .remove-file-btn {
                    background: var(--danger-red);
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-weight: 700;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    window.removeFile = function(fileName) {
        selectedFiles = selectedFiles.filter(f => f.name !== fileName);
        const fileItems = fileList.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            if (item.querySelector('.file-name').textContent === fileName) {
                item.remove();
            }
        });
    };
});

// =====================================================
// FILTER AND SEARCH FUNCTIONS
// =====================================================
function filterComplaints(status) {
    const cards = document.querySelectorAll('.complaint-card');
    
    cards.forEach(card => {
        if (status === 'all' || card.dataset.status === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// =====================================================
// TRACK COMPLAINT FUNCTION
// =====================================================
function trackComplaint() {
    const trackingNumber = document.getElementById('trackingNumber').value.trim();
    const resultDiv = document.getElementById('trackingResult');
    
    if (!trackingNumber) {
        showNotification('Please enter a reference number', 'warning');
        return;
    }
    
    // Simulate API call
    showNotification('Searching for complaint...', 'info');
    
    setTimeout(() => {
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="tracking-details">
                    <h3>Complaint Details</h3>
                    <p><strong>Reference:</strong> ${trackingNumber}</p>
                    <p><strong>Status:</strong> <span class="status-badge progress">In Progress</span></p>
                    <p><strong>Category:</strong> Electricity</p>
                    <p><strong>Submitted:</strong> Feb 10, 2025</p>
                    <div class="tracking-timeline">
                        <div class="timeline-step completed">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p class="timeline-title">Complaint Registered</p>
                                <p class="timeline-date">Feb 10, 2025 - 10:30 AM</p>
                            </div>
                        </div>
                        <div class="timeline-step completed">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p class="timeline-title">Assigned to NEA</p>
                                <p class="timeline-date">Feb 10, 2025 - 2:15 PM</p>
                            </div>
                        </div>
                        <div class="timeline-step active">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p class="timeline-title">Investigation in Progress</p>
                                <p class="timeline-date">Feb 11, 2025 - 9:00 AM</p>
                            </div>
                        </div>
                        <div class="timeline-step">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p class="timeline-title">Pending Resolution</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }, 1000);
}

// =====================================================
// RATING SYSTEM
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('.rating-stars .star');
    let selectedRating = 0;
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateStars(selectedRating);
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            updateStars(rating);
        });
    });
    
    const starsContainer = document.querySelector('.rating-stars');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', () => {
            updateStars(selectedRating);
        });
    }
    
    function updateStars(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#f59e0b';
            } else {
                star.style.color = '#d4d4d4';
            }
        });
    }
});

// =====================================================
// FEEDBACK SUBMISSION
// =====================================================
function submitFeedback(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.innerHTML = 'Submitting...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('Thank you for your feedback!', 'success');
        event.target.reset();
        submitBtn.innerHTML = 'Submit Feedback';
        submitBtn.disabled = false;
    }, 1500);
}

// =====================================================
// VIEW COMPLAINT DETAILS
// =====================================================
function viewComplaint(refNumber) {
    showNotification(`Loading details for ${refNumber}...`, 'info');
    // In a real application, this would open a modal with full complaint details
}

function viewComplaintDetails(refNumber) {
    viewComplaint(refNumber);
}

// =====================================================
// ADMIN FUNCTIONS
// =====================================================
function openComplaintDetail(refNumber) {
    const modal = document.getElementById('complaintDetailModal');
    const modalRef = document.getElementById('modalComplaintRef');
    const modalContent = document.getElementById('complaintDetailContent');
    
    if (modal && modalRef && modalContent) {
        modalRef.textContent = refNumber;
        
        // Simulate loading complaint details
        modalContent.innerHTML = `
            <div class="detail-loading">Loading complaint details...</div>
        `;
        
        modal.classList.add('active');
        modal.style.display = 'flex';
        
        setTimeout(() => {
            modalContent.innerHTML = `
                <div class="complaint-full-details">
                    <div class="detail-section">
                        <h3>Complaint Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Category:</label>
                                <span>Electricity</span>
                            </div>
                            <div class="detail-item">
                                <label>Priority:</label>
                                <span class="priority-badge high">High</span>
                            </div>
                            <div class="detail-item">
                                <label>Submitted:</label>
                                <span>Feb 12, 2025 - 9:30 AM</span>
                            </div>
                            <div class="detail-item">
                                <label>Citizen:</label>
                                <span>Ram Sharma</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h3>Description</h3>
                        <p>Complete power outage affecting 50+ industrial units in the area. This has been ongoing for 6 hours and causing significant production losses...</p>
                    </div>
                    <div class="detail-section">
                        <h3>Location</h3>
                        <p>Kathmandu, Ward 5, Industrial Area</p>
                    </div>
                    <div class="detail-actions">
                        <button class="btn-admin primary" onclick="takeAction('${refNumber}')">Take Action</button>
                        <button class="btn-admin secondary" onclick="closeComplaintModal()">Close</button>
                    </div>
                </div>
            `;
        }, 800);
    }
}

function closeComplaintModal() {
    const modal = document.getElementById('complaintDetailModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

function takeAction(refNumber) {
    showNotification(`Initiating action for ${refNumber}...`, 'info');
    closeComplaintModal();
}

function assignComplaint(refNumber) {
    showNotification(`Opening assignment dialog for ${refNumber}...`, 'info');
}

function requestCollaboration(refNumber) {
    showNotification('Collaboration request sent to relevant departments', 'success');
}

function assignToTeam(refNumber) {
    showNotification('Opening team assignment dialog...', 'info');
}

function viewFullDetails(refNumber) {
    openComplaintDetail(refNumber);
}

function updateCollabProgress(refNumber) {
    showNotification('Opening progress update form...', 'info');
}

function addCollabUpdate(refNumber) {
    showNotification('Opening update form...', 'info');
}

function viewCollabTimeline(refNumber) {
    showNotification('Loading collaboration timeline...', 'info');
}

function viewResolution(refNumber) {
    showNotification(`Loading resolution details for ${refNumber}...`, 'info');
}

function initiateCollaboration() {
    showNotification('Opening collaboration initiation form...', 'info');
}

function addTeamMember() {
    showNotification('Opening add team member form...', 'info');
}

// =====================================================
// INITIALIZE ON PAGE LOAD
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Nepal Citizen Service Portal initialized');
    
    // Set current date in admin dashboard
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }
    
    // Initialize first section
    const firstSection = document.querySelector('.content-section');
    if (firstSection && !document.querySelector('.content-section.active')) {
        firstSection.classList.add('active');
    }
});

// =====================================================
// CONSOLE EASTER EGG
// =====================================================
console.log('%c🏛️ Nepal Citizen Service Portal', 'color: #dc2626; font-size: 24px; font-weight: bold;');
console.log('%cGovernment of Nepal Initiative', 'color: #ea580c; font-size: 16px; font-weight: bold;');
console.log('%cVersion 1.0.0', 'color: #737373; font-size: 14px;');

