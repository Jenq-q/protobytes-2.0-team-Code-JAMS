    // =====================================================
    // NEPAL CITIZEN SERVICE PORTAL - JAVASCRIPT
    // =====================================================

    // =====================================================
    // GLOBAL STATE
    // ===================================================== 
    
    const appState = {
        currentUser: api.getCurrentUser(),
        notifications: [],
        complaints: [],
        currentSection: 'dashboard'
    };
    const API_BASE = 'http://localhost:8000/api';
    

    // =====================================================
    // MODAL FUNCTIONS
    // =====================================================
    function showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

        }
    }

    function closeLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 200);
        }
    }

    function showRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
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
    document.addEventListener('DOMContentLoaded', () => {
        // Handle role selection in modals
        document.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', function() {
                this.closest('.role-selector').querySelectorAll('.role-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                this.querySelector('input[type="radio"]').checked = true;
            });
        });
        
        // Update date display
        updateDateDisplay();
        
        console.log('Nepal Citizen Service Portal loaded successfully');
    });

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
    // TRACK COMPLAINT FUNCTION
    // =====================================================

        
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

    // ========================================================
    // CONFIG
    // ========================================================

    const API_DASHBOARD = "http://localhost:8000/api/dashboard";

    let currentComplaints = []; // store for client-side sorting


    // ========================================================
    // FETCH COMPLAINTS
    // ========================================================

    async function fetchComplaints(type = "all") {
        try {

            const endpointMap = {
                all: "/newest-first",
                recent: "/newest-first",
                trending: "/highest-upvote"
            };

            const endpoint = endpointMap[type] || "/newest-first";

            console.log("Fetching:", endpoint);

            const response = await fetch(
                `${API_DASHBOARD}${endpoint}?limit=20`
            );

            const data = await response.json();

            currentComplaints = data; // store for sorting
            renderComplaints(currentComplaints);

        } catch (error) {
            console.error("Error fetching complaints:", error);
        }
    }


    // ========================================================
    // RENDER CARDS
    // ========================================================

    function renderComplaints(complaints) {

        const grid = document.getElementById("complaintGrid");
        if (!grid) return;

        grid.innerHTML = "";

        complaints.forEach(c => {

            const upvotes = parseInt(c.upvotes);
            const downvotes = parseInt(c.downvotes);

            const card = document.createElement("div");
            card.className = "complaint-card";

            card.innerHTML = `
                <div class="complaint-header">
                    <span class="complaint-id">
                        CPL-${c.complain_id}
                    </span>

                    <span class="priority-badge ${c.status}">
                        ${c.status.toUpperCase()}
                    </span>
                </div>

                ${c.img_url ? `
                    <img src="${c.img_url}" class="complaint-image"/>
                ` : ""}

                <h3 class="complaint-title">
                    ${c.complain_msg}
                </h3>

                <div class="complaint-meta">
                    <div class="complaint-category">
                        ${c.departments || "General Department"}
                    </div>

                    <span class="complaint-date">
                        ${new Date(c.created_at).toLocaleDateString()}
                    </span>
                </div>

                <div class="complaint-actions">
                    <button class="upvote-btn">
                        👍 <span>${upvotes}</span>
                    </button>

                    <button class="downvote-btn">
                        👎 <span>${downvotes}</span>
                    </button>
                </div>
            `;

            grid.appendChild(card);
        });
    }


    // ========================================================
    // SORTING (CLIENT SIDE)
    // ========================================================

    function sortComplaints(option) {

        let sorted = [...currentComplaints];

        switch (option) {

            case "upvotes":
                sorted.sort((a, b) =>
                    parseInt(b.upvotes) - parseInt(a.upvotes)
                );
                break;

            case "recent":
                sorted.sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                );
                break;

            case "category":
                sorted.sort((a, b) =>
                    (a.departments || "").localeCompare(b.departments || "")
                );
                break;

            case "priority":
            default:
                sorted.sort((a, b) =>
                    a.status.localeCompare(b.status)
                );
        }

        renderComplaints(sorted);
    }


    // ========================================================
    // TAB SWITCHING
    // ========================================================

    document.addEventListener("DOMContentLoaded", () => {

        const tabs = document.querySelectorAll(".explore-tab");
        const sortSelect = document.getElementById("exploreSort");

        // Tab Click
        tabs.forEach(tab => {
            tab.addEventListener("click", function () {

                tabs.forEach(t => t.classList.remove("active"));
                this.classList.add("active");

                const type = this.dataset.type;

                fetchComplaints(type);
            });
        });

        // Dropdown Sort
        if (sortSelect) {
        sortSelect.addEventListener("change", function () {
            sortComplaints(this.value);
        });
    }


        // Initial Load
        fetchComplaints("all");
    });

    // =====================================================
    // BACKEND API INTEGRATION
    // Add this at the END of portal-script.js or include as separate file
    // =====================================================

    

    // =====================================================
    // OVERRIDE LOGIN FUNCTION WITH API CALL
    // =====================================================
    async function handleLogin(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const role = formData.get('loginRole');
        const email = formData.get('loginEmail');
        const password = formData.get('loginPassword');
        const citizenship = formData.get('loginCitizenship');
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Signing in...';
        submitBtn.disabled = true;
        
        try {
            let response;
            
            if (role === 'citizen') {
                // User login
                response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            } else {
                // Admin login
                response = await fetch(`${API_BASE}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ citizenship, password })
                });
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Store tokens
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userRole', role);
                localStorage.setItem('userInfo', JSON.stringify(role === 'citizen' ? data.user : data.admin));
                
                showNotification('Login successful!', 'success');
                
                setTimeout(() => {
                    closeLoginModal();
                    window.location.href = role === 'citizen' ? 'user-dashboard.html' : 'admin-dashboard.html';
                }, 1000);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification(error.message || 'Login failed. Please check your credentials.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        
        return false;
    }

    // =====================================================
    // OVERRIDE REGISTER FUNCTION WITH API CALL
    // =====================================================
    async function handleRegister(event) {
        return handleRegistration(event);
    }

    async function handleRegister(event) {
        return handleRegistration(event);
    }

    async function handleRegistration(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Validate passwords match
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'warning');
            return;
        }
        
        // Prepare data for backend - matching database schema exactly
        const registrationData = {
            full_name: formData.get('fullName'),
            phone_no: formData.get('phoneNumber'),
            email: formData.get('email'),
            password: password,
            citizenship: formData.get('citizenship'),
            home_no: parseInt(formData.get('houseNumber')) || 0,
            permanent_province: formData.get('permanentProvince'),
            permanent_district: formData.get('permanentDistrict'),
            permanent_municipality: formData.get('permanentMunicipality'),
            permanent_ward: parseInt(formData.get('permanentWard')),  // INT in database
            temporary_province: formData.get('temporaryProvince') || null,
            temporary_district: formData.get('temporaryDistrict') || null,
            temporary_municipality: formData.get('temporaryMunicipality') || null,
            temporary_ward: formData.get('temporaryWard') ? parseInt(formData.get('temporaryWard')) : null,  // INT in database
            nid: formData.get('nidCard') || null
        };
        
        console.log('Registration data being sent:', registrationData);
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Creating Account...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationData)
            });
            
            const data = await response.json();
            
            console.log('Server response:', data);
            
            if (response.ok && data.success) {
                // Store tokens
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userRole', 'citizen');
                localStorage.setItem('userInfo', JSON.stringify(data.user));
                
                showNotification('Account created successfully! Redirecting to dashboard...', 'success');
                
                setTimeout(() => {
                    closeRegisterModal();
                    window.location.href = 'user-dashboard.html';
                }, 1500);
            } else {
                // Handle validation errors
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(e => e.msg || e.message).join(', ');
                    throw new Error(errorMessages);
                } else {
                    throw new Error(data.message || 'Registration failed');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(error.message || 'Registration failed. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // =====================================================
    // LOGOUT FUNCTION
    // =====================================================
    async function handleLogout() {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.clear();
            window.location.href = 'index-portal.html';
        }
    }

    // =====================================================
    // DASHBOARD PROTECTION
    // =====================================================
    document.addEventListener('DOMContentLoaded', function() {
        const isDashboard = window.location.pathname.includes('dashboard');
        
        if (isDashboard) {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                window.location.href = 'index-portal.html';
                return;
            }
            
            // Update user info in dashboard
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    const userNameEl = document.getElementById('userName');
                    if (userNameEl) {
                        userNameEl.textContent = user.fullName || user.full_name || user.full_name || 'User';
                    }
                } catch (e) {
                    console.error('Error parsing user info:', e);
                }
            }
        }
    });

    // =====================================================
    // COMPLAINT SUBMISSION - Add this to api-integration-simple.js
    // =====================================================

    // Override submitComplaint function
    async function submitComplaint(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Get the complaint message (combine title and description)
        const title = formData.get('complaintTitle');
        const description = formData.get('complaintDescription');
        
        // Combine title and description with category info
        const complain_msg = ` ${title}\n\n${description}\n\nLocation: ${formData.get('province')}, ${formData.get('district')}, ${formData.get('municipality')}, Ward ${formData.get('wardNo')}${formData.get('specificLocation') ? ', ' + formData.get('specificLocation') : ''}`;
        
        const complaintData = {
            complain_msg: complain_msg,
            img_url: null, // You can implement file upload separately
            ministry_ids: [], // Can be added later based on category mapping
            department_ids: [] // Can be added later based on category mapping
        };
        
        console.log('Submitting complaint:', complaintData);
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Submitting...';
        submitBtn.disabled = true;
        
        try {
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                showNotification('Please login to submit a complaint', 'error');
                window.location.href = 'index-portal.html';
                return;
            }
            
            const response = await fetch(`${API_BASE}/complaints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(complaintData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                const referenceNo = `CPL-${String(data.complaint.complain_id).padStart(4, '0')}`;
                
                showNotification(`Complaint registered successfully! Reference No: ${referenceNo}`, 'success');
                
                // Reset form
                event.target.reset();
                const charCount = document.getElementById('charCount');
                if (charCount) charCount.textContent = '0';
                
                // Switch to my complaints section after a delay
                setTimeout(() => {
                    showSection('my-complaints');
                    loadMyComplaints(); // Load user's complaints
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to submit complaint');
            }
            
        } catch (error) {
            console.error('Error submitting complaint:', error);
            showNotification(error.message || 'Failed to submit complaint. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    }

    // Load user's own complaints
    async function loadMyComplaints() {
        try {
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                window.location.href = 'index-portal.html';
                return;
            }
            
            const response = await fetch(`${API_BASE}/complaints/my-complaints`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const complaints = await response.json();
            
            // Display complaints in the my-complaints section
            displayMyComplaints(complaints);
            
        } catch (error) {
            console.error('Error loading complaints:', error);
            showNotification('Failed to load your complaints', 'error');
        }
    }

    // Display user's complaints
    // IMMEDIATE FIX - Add this to portal-script.js
    // Replace your existing displayMyComplaints function

    // FIXED VERSION - No variable conflicts
    // Replace your displayMyComplaints function with this

    function displayMyComplaints(complaints) {
        console.log('=== displayMyComplaints called ===');
        console.log('Complaints to display:', complaints);
        
        // Find the container
        let container = document.getElementById('myComplaintsContainer');
        
        if (!container) {
            const myComplaintsSection = document.getElementById('my-complaints-section');
            console.log('Section element:', myComplaintsSection);
            
            if (myComplaintsSection) {
                // Try to find existing grid
                container = myComplaintsSection.querySelector('.complaints-grid');
                console.log('Found .complaints-grid:', container);
                
                if (!container) {
                    // Look for any element that might be the container
                    const possibleContainers = myComplaintsSection.querySelectorAll('div[class*="complaint"]');
                    console.log('Possible containers:', possibleContainers);
                    
                    if (possibleContainers.length > 0) {
                        container = possibleContainers[0].parentElement;
                    }
                }
                
                // If still not found, create it
                if (!container) {
                    console.log('Creating new container...');
                    container = document.createElement('div');
                    container.className = 'complaints-grid';
                    container.id = 'myComplaintsContainer';
                    
                    // Find where to insert it
                    const headerElement = myComplaintsSection.querySelector('.section-header-inline');
                    if (headerElement && headerElement.nextElementSibling) {
                        headerElement.parentNode.insertBefore(container, headerElement.nextElementSibling);
                    } else {
                        myComplaintsSection.appendChild(container);
                    }
                    console.log('Container created and inserted');
                }
            }
        }
        
        if (!container) {
            console.error('❌ Still no container found!');
            alert('Error: Cannot find or create complaints container. Check your HTML structure.');
            return;
        }
        
        console.log('✅ Using container:', container);
        
        // Clear any existing dummy content
        container.innerHTML = '';
        
        if (complaints.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem;">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <h3 style="margin-bottom: 0.5rem; color: #374151;">No complaints yet</h3>
                    <p style="color: #6b7280; margin-bottom: 1rem;">You haven't submitted any complaints. Click "New Complaint" to get started.</p>
                    <button class="btn-primary" onclick="showSection('new-complaint')">Submit Your First Complaint</button>
                </div>
            `;
            console.log('✅ Displayed empty state');
            return;
        }
        
        // Build HTML for all complaints
        let html = '';
        complaints.forEach(complaint => {
            const createdDate = new Date(complaint.created_at);
            const dateStr = createdDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const lines = complaint.complain_msg.split('\n');
            const title = lines[0] || 'Complaint';
            const safetitle = escapeHTML(title.substring(0, 100));
            const safeMsg = escapeHTML(complaint.complain_msg.substring(0, 200));
            
            html += `
                <div class="complaint-card" data-status="pending">
                    <div class="complaint-header">
                        <div>
                            <h3>${safetitle}</h3>
                            <p class="complaint-ref">CPL-${String(complaint.complain_id).padStart(4, '0')}</p>
                        </div>
                        <span class="status-badge pending">Pending</span>
                    </div>
                    <div class="complaint-body">
                        <div class="complaint-meta">
                            <span><strong>Submitted:</strong> ${dateStr}</span>
                        </div>
                        <p class="complaint-excerpt">${safeMsg}${complaint.complain_msg.length > 200 ? '...' : ''}</p>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem; color: #6b7280; font-size: 0.875rem;">
                            <span>👍 ${complaint.upvotes || 0} upvotes</span>
                            <span>👎 ${complaint.downvotes || 0}</span>
                        </div>
                    </div>
                    <div class="complaint-footer">
                        <button class="btn-view" onclick="viewMyComplaintDetails(${complaint.complain_id})">View Details</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log(`✅ Displayed ${complaints.length} complaint(s) in container`);
    }

    // Add click handler to My Complaints link
    setTimeout(function() {
        const myComplaintsLink = document.querySelector('a[data-section="my-complaints"]');
        
        if (myComplaintsLink) {
            console.log('✅ Adding click handler to My Complaints link');
            
            myComplaintsLink.addEventListener('click', function() {
                console.log('🔄 My Complaints clicked!');
                setTimeout(function() {
                    console.log('Loading complaints...');
                    loadMyComplaints();
                }, 300);
            });
        }
    }, 1000);

    function escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =====================================================
// BACKEND INTEGRATION FUNCTIONS
// =====================================================

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (api.isAuthenticated()) {
        appState.currentUser = api.getCurrentUser();
        updateUIForLoggedInUser();
    }
    loadPublicFeed();
});

// Update UI when user logs in
function updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('.nav-btn');
    const registerBtn = document.querySelector('.nav-btn-primary');
    
    if (loginBtn && registerBtn) {
        loginBtn.textContent = appState.currentUser.fullName;
        loginBtn.onclick = null;
        registerBtn.textContent = 'Logout';
        registerBtn.onclick = handleLogout;
    }
}

// Handle user login
async function handleUserLogin(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const role = document.querySelector('input[name="loginRole"]:checked')?.value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        let response;
        if (role === 'admin') {
            response = await api.loginAdmin(email, password);
        } else {
            response = await api.loginUser(email, password);
        }

        if (response.success) {
            appState.currentUser = response.data.user;
            updateUIForLoggedInUser();
            closeLoginModal();
            showNotification('Login successful!', 'success');
            
            if (role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
        }
    } catch (error) {
        showNotification(error.message || 'Login failed', 'error');
    }
}

// Handle user registration
async function handleUserRegistration(event) {
    if (event) event.preventDefault();
    
    const formData = {
        fullName: document.getElementById('registerFullName')?.value,
        email: document.getElementById('registerEmail')?.value,
        phone: document.getElementById('registerPhone')?.value,
        citizenship: document.getElementById('registerCitizenship')?.value,
        password: document.getElementById('registerPassword')?.value,
        province: document.getElementById('permanentProvince')?.value,
        district: document.getElementById('permanentDistrict')?.value,
        municipality: document.getElementById('permanentMunicipality')?.value,
        ward: document.getElementById('permanentWard')?.value,
        houseNumber: document.getElementById('registerHouseNo')?.value
    };

    try {
        const response = await api.registerUser(formData);
        
        if (response.success) {
            closeRegisterModal();
            showOTPModal(response.data.userId, response.data.otp);
            showNotification('Registration successful! Please verify your phone.', 'success');
        }
    } catch (error) {
        showNotification(error.message || 'Registration failed', 'error');
    }
}

// Show OTP verification modal
function showOTPModal(userId, otp) {
    const modal = document.createElement('div');
    modal.id = 'otpModal';
    modal.className = 'modal active';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Verify Your Phone</h2>
            <p>Enter the 6-digit code sent to your phone</p>
            <p style="color: #f59e0b; font-weight: bold;">Development OTP: ${otp}</p>
            <form id="otpForm" onsubmit="handleOTPVerification(event, ${userId})">
                <input type="text" id="otpInput" maxlength="6" placeholder="Enter OTP" required 
                       style="width: 100%; padding: 12px; font-size: 18px; text-align: center; letter-spacing: 8px;">
                <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;">Verify</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Handle OTP verification
async function handleOTPVerification(event, userId) {
    if (event) event.preventDefault();
    
    const otp = document.getElementById('otpInput')?.value;
    
    if (!otp || otp.length !== 6) {
        showNotification('Please enter 6-digit OTP', 'error');
        return;
    }

    try {
        const response = await api.verifyOTP(userId, otp);
        
        if (response.success) {
            appState.currentUser = response.data.user;
            document.getElementById('otpModal')?.remove();
            updateUIForLoggedInUser();
            showNotification('Phone verified successfully!', 'success');
            window.location.href = 'user-dashboard.html';
        }
    } catch (error) {
        showNotification(error.message || 'OTP verification failed', 'error');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await api.logout();
        appState.currentUser = null;
        localStorage.clear();
        window.location.href = 'index-portal.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index-portal.html';
    }
}

// Load public complaint feed
async function loadPublicFeed(sortBy = 'newest') {
    const feedContainer = document.getElementById('complaintFeed');
    if (!feedContainer) return;

    try {
        feedContainer.innerHTML = '<div class="loading">Loading complaints...</div>';
        
        let response;
        if (sortBy === 'popular') {
            response = await api.getHighestUpvoted(20, 0);
        } else {
            response = await api.getNewestFirst(20, 0);
        }

        if (response.success && response.data.length > 0) {
            renderComplaintCards(response.data);
        } else {
            feedContainer.innerHTML = '<div class="empty-state">No complaints found</div>';
        }
    } catch (error) {
        console.error('Load feed error:', error);
        feedContainer.innerHTML = '<div class="error">Failed to load complaints</div>';
    }
}

// Render complaint cards
function renderComplaintCards(complaints) {
    const feedContainer = document.getElementById('complaintFeed');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = complaints.map(complaint => `
        <div class="complaint-card">
            <div class="complaint-header">
                <span class="category-badge">${complaint.category || 'General'}</span>
                <span class="priority-badge priority-${complaint.priority}">${complaint.priority}</span>
            </div>
            <h3>${escapeHtml(complaint.title)}</h3>
            <p>${escapeHtml(complaint.complain_msg.substring(0, 150))}...</p>
            <div class="complaint-meta">
                <span>📍 ${complaint.municipality}, Ward ${complaint.ward}</span>
                <span>🕐 ${api.formatTimeAgo(complaint.created_at)}</span>
            </div>
            <div class="vote-actions">
                <button class="vote-btn upvote" onclick="handleVote(${complaint.complain_id}, 1)">
                    👍 ${complaint.upvote_count || 0}
                </button>
                <button class="vote-btn downvote" onclick="handleVote(${complaint.complain_id}, -1)">
                    👎 ${complaint.downvote_count || 0}
                </button>
                <button class="view-details-btn" onclick="viewComplaintDetail('${complaint.complaint_ref}')">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Handle voting
async function handleVote(complaintId, voteType) {
    if (!api.isAuthenticated()) {
        showNotification('Please login to vote', 'warning');
        showLoginModal();
        return;
    }

    try {
        const response = await api.voteComplaint(complaintId, voteType);
        if (response.success) {
            showNotification('Vote registered!', 'success');
            loadPublicFeed(); // Reload to show updated counts
        }
    } catch (error) {
        showNotification(error.message || 'Failed to vote', 'error');
    }
}

// View complaint details
async function viewComplaintDetail(complaintRef) {
    try {
        const response = await api.getComplaintById(complaintRef);
        if (response.success) {
            showComplaintDetailModal(response.data);
        }
    } catch (error) {
        showNotification('Failed to load complaint details', 'error');
    }
}

// Show complaint detail modal
function showComplaintDetailModal(complaint) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <button onclick="this.closest('.modal').remove()" style="float: right; font-size: 24px; border: none; background: none; cursor: pointer;">&times;</button>
            <h2>${escapeHtml(complaint.title)}</h2>
            <p><strong>Ref:</strong> ${complaint.id}</p>
            <p><strong>Status:</strong> ${complaint.status}</p>
            <p><strong>Priority:</strong> ${complaint.priority}</p>
            <p>${escapeHtml(complaint.description)}</p>
            ${complaint.imageUrl ? `<img src="${complaint.imageUrl}" style="max-width: 100%; border-radius: 8px;">` : ''}
            <div class="vote-actions" style="margin-top: 20px;">
                <button class="vote-btn upvote" onclick="handleVote(${complaint.complaintId}, 1)">
                    👍 ${complaint.upvotes || 0}
                </button>
                <button class="vote-btn downvote" onclick="handleVote(${complaint.complaintId}, -1)">
                    👎 ${complaint.downvotes || 0}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// HTML escape helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Attach login/register handlers to forms
setTimeout(() => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = handleUserLogin;
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = handleUserRegistration;
    }
}, 1000);
