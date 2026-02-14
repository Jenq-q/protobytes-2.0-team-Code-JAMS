// =====================================================
// API CONNECTION LAYER v2
// Clustering + Public Feed + All original features
// =====================================================

(function() {
    'use strict';

    var API = 'http://localhost:3000/api';
    var currentUser = null;
    var authToken = null;
    var visitorId = 'visitor-' + Math.random().toString(36).substring(2, 10);

    // =====================================================
    // UTILITY
    // =====================================================
    async function apiCall(method, path, body) {
        try {
            var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
            if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
            if (body) opts.body = JSON.stringify(body);
            var res = await fetch(API + path, opts);
            var data = await res.json();
            if (!res.ok) throw new Error(data.error || 'API error');
            return data;
        } catch (err) {
            console.error('[API Error]', method, path, err.message);
            throw err;
        }
    }

    function timeAgo(dateStr) {
        var now = new Date(), then = new Date(dateStr);
        var mins = Math.floor((now - then) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return mins + ' min ago';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + ' hour' + (hrs > 1 ? 's' : '') + ' ago';
        var days = Math.floor(hrs / 24);
        return days + ' day' + (days > 1 ? 's' : '') + ' ago';
    }

    // =====================================================
    // INJECT STYLES (confirmation + cluster + public feed)
    // =====================================================
    function injectStyles() {
        if (document.getElementById('api-connect-styles')) return;
        var s = document.createElement('style');
        s.id = 'api-connect-styles';
        s.textContent = [
            '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
            '@keyframes cfIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}',
            '@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(220,20,60,.7)}50%{box-shadow:0 0 0 10px rgba(220,20,60,0)}}',

            '.cf-wrap{max-width:800px;margin:0 auto;animation:cfIn .5s ease-out}',
            '.cf-header{text-align:center;padding:2rem 1rem}',
            '.cf-check{width:80px;height:80px;background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#16a34a}',
            '.cf-header h1{font-size:1.8rem;font-weight:800;color:#171717;margin-bottom:.5rem}',
            '.cf-header p{font-size:1.1rem;color:#525252}',

            '.cf-ref{text-align:center;padding:1.5rem;background:linear-gradient(135deg,#FFEBEE,#E3F2FD);border:2px dashed #4A90E2;border-radius:16px;margin-bottom:1.5rem}',
            '.cf-ref-label{display:block;font-size:.85rem;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem}',
            '.cf-ref-box{display:inline-flex;align-items:center;gap:.75rem;background:#fff;padding:.75rem 1.5rem;border-radius:12px;border:2px solid #003893;box-shadow:0 4px 6px rgba(0,0,0,.1)}',
            '.cf-ref-num{font-size:1.8rem;font-weight:800;color:#003893;font-family:monospace;letter-spacing:.08em}',
            '.cf-copy{padding:.5rem;background:#E3F2FD;border:1px solid #4A90E2;border-radius:8px;color:#003893;cursor:pointer;display:flex;align-items:center}',
            '.cf-copy:hover{background:#003893;color:#fff}',
            '.cf-ref-hint{display:block;margin-top:.75rem;font-size:.85rem;color:#737373}',

            '.cf-priority{text-align:center;padding:.875rem 1.5rem;border-radius:12px;margin-bottom:1.5rem;font-weight:700;font-size:1rem}',

            '.cf-card{background:#fff;border-radius:16px;border:1px solid #e5e5e5;padding:1.75rem;margin-bottom:1.5rem;box-shadow:0 1px 2px rgba(0,0,0,.05)}',
            '.cf-card h2{font-size:1.2rem;font-weight:700;color:#171717;margin-bottom:1.5rem;display:flex;align-items:center;gap:.5rem}',
            '.cf-card h2 svg{color:#003893;flex-shrink:0}',

            '.cf-route{display:flex;align-items:stretch;overflow-x:auto;padding:.5rem 0}',
            '.cf-step{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;min-width:130px;padding:0 .5rem}',
            '.cf-step-icon{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:.75rem;color:#fff}',
            '.cf-step-icon.s1{background:#737373}.cf-step-icon.s2{background:#8B5CF6}.cf-step-icon.s3{background:#003893}.cf-step-icon.s4{background:#16a34a}',
            '.cf-step-label{font-size:.7rem;color:#737373;text-transform:uppercase;font-weight:600}',
            '.cf-step-val{font-size:.85rem;color:#262626;font-weight:700;margin-top:.25rem}',
            '.cf-conf{display:inline-block;padding:.15rem .6rem;background:rgba(139,92,246,.15);color:#7C3AED;border-radius:999px;font-size:.7rem;font-weight:700;margin-top:.25rem}',
            '.cf-arrow{display:flex;align-items:center;color:#a3a3a3;flex-shrink:0;padding-bottom:2rem}',

            '.cf-tl-step{display:flex;gap:1rem;position:relative;padding-bottom:1.5rem}',
            '.cf-tl-step:last-child{padding-bottom:0}',
            '.cf-tl-step:not(:last-child)::after{content:"";position:absolute;left:11px;top:28px;bottom:0;width:2px;background:#e5e5e5}',
            '.cf-tl-step.done:not(:last-child)::after{background:#16a34a}',
            '.cf-tl-dot{width:24px;height:24px;border-radius:50%;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;position:relative;z-index:1}',
            '.cf-tl-step.done .cf-tl-dot{background:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.15)}',
            '.cf-tl-step.done .cf-tl-dot::after{content:"\\2713";color:#fff;font-size:11px;font-weight:700}',
            '.cf-tl-step.active .cf-tl-dot{background:#DC143C;animation:pulse 2s infinite}',
            '.cf-tl-step.pending .cf-tl-dot{background:#d4d4d4}',
            '.cf-tl-info{flex:1}',
            '.cf-tl-info strong{display:block;font-size:.95rem;color:#262626;margin-bottom:.1rem}',
            '.cf-tl-info span{display:block;font-size:.75rem;color:#737373;margin-bottom:.2rem}',
            '.cf-tl-info p{font-size:.85rem;color:#525252;margin:0}',
            '.cf-tl-step.done .cf-tl-info strong{color:#16a34a}',
            '.cf-tl-step.pending .cf-tl-info strong{color:#737373}',

            '.cf-sla{background:linear-gradient(135deg,#FFFBEB,#FEF3C7)!important;border:2px solid #F59E0B!important}',
            '.cf-sla-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.5rem}',
            '.cf-sla-item{display:flex;align-items:center;gap:.75rem}',
            '.cf-sla-item svg{color:#D97706;flex-shrink:0}',
            '.cf-sla-item span{display:block;font-size:.7rem;color:#525252;text-transform:uppercase}',
            '.cf-sla-item strong{display:block;font-size:.95rem;color:#171717}',
            '.cf-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;padding:1.5rem 0}',

            // Cluster confirmation styles
            '.cf-cluster{text-align:center;padding:2rem;background:linear-gradient(135deg,#EDE9FE,#F5F3FF);border:2px solid #8B5CF6;border-radius:16px;margin-bottom:1.5rem}',
            '.cf-cluster-icon{width:64px;height:64px;background:#8B5CF6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#fff}',
            '.cf-cluster h2{font-size:1.5rem;font-weight:800;color:#5B21B6;margin-bottom:.5rem}',
            '.cf-cluster p{color:#6B21A8;font-size:1rem;line-height:1.6}',
            '.cf-cluster-count{font-size:3rem;font-weight:800;color:#7C3AED;display:block;margin:.5rem 0}',
            '.cf-cluster-ref{display:inline-block;padding:.5rem 1.25rem;background:#fff;border:2px solid #8B5CF6;border-radius:12px;font-family:monospace;font-size:1.2rem;font-weight:700;color:#5B21B6;margin:.75rem 0}',
            '.cf-cluster-msg{background:#fff;border-radius:12px;padding:1.25rem;margin:1rem 0;text-align:left;border:1px solid #DDD6FE}',
            '.cf-cluster-msg p{color:#404040;font-size:.9rem;margin:0 0 .5rem}',

            // Report count badge on complaint cards
            '.report-count-badge{display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .75rem;background:linear-gradient(135deg,#EDE9FE,#F5F3FF);border:1px solid #8B5CF6;border-radius:999px;font-size:.75rem;font-weight:700;color:#7C3AED}',

            // Public feed card styles
            '.pub-card{background:#fff;border-radius:16px;padding:1.5rem;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);border:1px solid #e5e5e5;position:relative;overflow:hidden;transition:all .25s}',
            '.pub-card::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(135deg,#DC143C,#003893)}',
            '.pub-card:hover{transform:translateY(-4px);box-shadow:0 20px 25px -5px rgba(0,0,0,.1)}',
            '.pub-card.critical-card::before{height:6px;background:#DC143C}',
            '.pub-card.critical-card{border:2px solid #F28B82;box-shadow:0 4px 12px rgba(220,20,60,.15)}',
            '.pub-card-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem}',
            '.pub-card-id{font-size:.8rem;color:#003893;font-weight:700;background:#E3F2FD;padding:.25rem .75rem;border-radius:8px}',
            '.pub-card-title{font-size:1.1rem;font-weight:700;color:#171717;margin-bottom:.5rem;line-height:1.4}',
            '.pub-card-desc{font-size:.9rem;color:#525252;margin-bottom:1rem;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
            '.pub-card-meta{display:flex;justify-content:space-between;align-items:center;padding-top:1rem;border-top:1px solid #e5e5e5;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem}',
            '.pub-card-cat{display:inline-flex;align-items:center;gap:.4rem;font-size:.8rem;color:#404040;font-weight:600}',
            '.pub-card-cat svg{width:14px;height:14px}',
            '.pub-card-time{font-size:.8rem;color:#737373}',
            '.pub-card-footer{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}',
            '.pub-upvote{display:flex;align-items:center;gap:.4rem;padding:.5rem 1rem;border:2px solid #4A90E2;background:#fff;color:#003893;border-radius:12px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .25s}',
            '.pub-upvote:hover{background:#E3F2FD;border-color:#003893}',
            '.pub-upvote.voted{background:linear-gradient(135deg,#003893,#0047AB);color:#fff;border-color:#003893}',
            '.pub-report-btn{display:flex;align-items:center;gap:.4rem;padding:.5rem 1rem;border:2px solid #8B5CF6;background:#fff;color:#7C3AED;border-radius:12px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .25s}',
            '.pub-report-btn:hover{background:#EDE9FE}',

            '@media(max-width:768px){.cf-route{flex-direction:column;align-items:flex-start}.cf-step{flex-direction:row;text-align:left;gap:1rem;min-width:auto}.cf-arrow{padding:.5rem 0 .5rem 1.25rem;transform:rotate(90deg)}.cf-sla-grid{grid-template-columns:1fr}.cf-actions{flex-direction:column}.cf-actions button{width:100%}}'
        ].join('\n');
        document.head.appendChild(s);
    }

    // =====================================================
    // AUTH: Login
    // =====================================================
    window.handleLogin = async function(event) {
        event.preventDefault();
        var form = event.target;
        var fd = new FormData(form);
        var role = fd.get('loginRole');
        var email = fd.get('loginEmail');
        var password = fd.get('loginPassword');

        var btn = form.querySelector('button[type="submit"]');
        var orig = btn.innerHTML;
        btn.innerHTML = 'Signing in...';
        btn.disabled = true;

        try {
            var loginRole = (role === 'agency') ? 'admin' : role;
            var result = await apiCall('POST', '/auth/login', { email: email, password: password, role: loginRole });
            currentUser = result.data.user;
            authToken = result.data.token;
            showNotification('Welcome back, ' + currentUser.fullName + '!', 'success');
            setTimeout(function() {
                if (typeof closeLoginModal === 'function') closeLoginModal();
                if (role === 'citizen') window.location.href = 'user-dashboard.html';
                else window.location.href = 'admin-dashboard.html';
            }, 800);
        } catch (err) {
            showNotification('Login failed: ' + err.message, 'error');
            btn.innerHTML = orig;
            btn.disabled = false;
        }
        return false;
    };

    // =====================================================
    // AUTH: Register
    // =====================================================
    window.handleRegistration = async function(event) {
        event.preventDefault();
        var form = event.target;
        var fd = new FormData(form);
        if (fd.get('password') !== fd.get('confirmPassword')) {
            showNotification('Passwords do not match!', 'warning');
            return;
        }
        var btn = form.querySelector('button[type="submit"]');
        var orig = btn.innerHTML;
        btn.innerHTML = 'Creating Account...';
        btn.disabled = true;

        try {
            var result = await apiCall('POST', '/auth/register', {
                fullName: fd.get('fullNameEng'), fullNameNepali: fd.get('fullName'),
                email: fd.get('email'), phone: fd.get('phoneNumber'),
                citizenship: fd.get('citizenship'), password: fd.get('password'),
                province: fd.get('permanentProvince'), district: fd.get('permanentDistrict'),
                municipality: fd.get('permanentMunicipality'), ward: fd.get('permanentWard'),
                houseNumber: fd.get('houseNumber')
            });
            showNotification('Account created! OTP sent.', 'success');
            if (typeof closeRegisterModal === 'function') closeRegisterModal();
            setTimeout(function() {
                showOtpModal(result.data.userId, result.data.otp, fd.get('phoneNumber'));
            }, 300);
        } catch (err) {
            showNotification('Registration failed: ' + err.message, 'error');
            btn.innerHTML = orig;
            btn.disabled = false;
        }
        return false;
    };

    function showOtpModal(userId, otp, phone) {
        var modal = document.getElementById('otpModal');
        var phoneDisplay = document.getElementById('otpPhoneDisplay');
        if (phoneDisplay) phoneDisplay.textContent = phone;
        if (modal) { modal.classList.add('active'); modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
        window._pendingOtp = { userId: userId, otp: otp };
        console.log('[DEV] OTP:', otp);
    }

    window.verifyOTP = async function() {
        var inputs = document.querySelectorAll('.otp-input');
        var otp = '';
        inputs.forEach(function(inp) { otp += inp.value; });
        if (otp.length !== 6) { showNotification('Enter 6-digit OTP', 'warning'); return; }
        try {
            var result = await apiCall('POST', '/auth/verify-otp', { userId: window._pendingOtp.userId, otp: otp });
            currentUser = result.data.user;
            authToken = result.data.token;
            showNotification('Verified! Redirecting...', 'success');
            setTimeout(function() { window.location.href = 'user-dashboard.html'; }, 1000);
        } catch (err) { showNotification('OTP failed: ' + err.message, 'error'); }
    };

    window.moveToNext = function(input, index) {
        if (input.value.length === 1) { var next = document.querySelectorAll('.otp-input')[index + 1]; if (next) next.focus(); }
    };

    // =====================================================
    // COMPLAINTS: Submit with clustering
    // =====================================================
    window.submitComplaint = async function(event) {
        event.preventDefault();
        var form = event.target;
        var fd = new FormData(form);
        var title = fd.get('complaintTitle');
        var description = fd.get('complaintDescription');

        if (!title || !description) { showNotification('Title and description required', 'warning'); return; }

        var btn = form.querySelector('button[type="submit"]');
        var orig = btn.innerHTML;

        btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px"><svg style="animation:spin 1s linear infinite" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Classifying...</span>';
        btn.disabled = true;

        try {
            await new Promise(function(r) { setTimeout(r, 1000); });
            btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px"><svg style="animation:spin 1s linear infinite" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Checking existing reports...</span>';

            await new Promise(function(r) { setTimeout(r, 800); });
            btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px"><svg style="animation:spin 1s linear infinite" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Submitting...</span>';

            var result = await apiCall('POST', '/complaints', {
                title: title, description: description,
                province: fd.get('province'), district: fd.get('district'),
                municipality: fd.get('municipality'), ward: fd.get('wardNo'),
                specificLocation: fd.get('specificLocation'),
                userId: currentUser ? currentUser.id : 'anonymous'
            });

            if (result.clustered) {
                showClusterConfirmation(result);
            } else {
                showNewConfirmation(result.data);
            }

        } catch (err) {
            showNotification('Submit failed: ' + err.message, 'error');
            btn.innerHTML = orig;
            btn.disabled = false;
        }
        return false;
    };

    // =====================================================
    // CLUSTER CONFIRMATION
    // =====================================================
    function showClusterConfirmation(result) {
        var section = document.getElementById('new-complaint-section');
        if (!section) return;
        if (!window._origFormHTML) window._origFormHTML = section.innerHTML;

        var c = result.data;
        var cr = c.classification;

        section.innerHTML = '<div class="cf-wrap">' +

            '<div class="cf-cluster">' +
                '<div class="cf-cluster-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>' +
                '<h2>You\'re Not Alone!</h2>' +
                '<p>Other citizens in your area have already reported this issue</p>' +
                '<span class="cf-cluster-count">' + result.reportCount + ' Reports</span>' +
                '<p>Your report has been added to the existing case:</p>' +
                '<div class="cf-cluster-ref">' + result.parentComplaint + '</div>' +
            '</div>' +

            '<div class="cf-card cf-cluster-msg">' +
                '<h2><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> What This Means</h2>' +
                '<p style="font-size:.95rem;line-height:1.7;color:#404040;margin-bottom:1rem">Instead of creating a duplicate ticket, your report has been <strong>merged</strong> with ' + (result.reportCount - 1) + ' other reports about the same issue. This means:</p>' +
                '<div style="display:grid;gap:.75rem">' +
                    '<div style="display:flex;align-items:start;gap:.75rem;padding:.75rem;background:#F0FDF4;border-radius:8px"><span style="color:#16a34a;font-size:1.2rem;flex-shrink:0">&#10003;</span><span>The department sees <strong>' + result.reportCount + ' citizens affected</strong> — higher impact = faster action</span></div>' +
                    '<div style="display:flex;align-items:start;gap:.75rem;padding:.75rem;background:#F0FDF4;border-radius:8px"><span style="color:#16a34a;font-size:1.2rem;flex-shrink:0">&#10003;</span><span>Priority auto-escalates as more people report — currently <strong>' + c.priority + '</strong></span></div>' +
                    '<div style="display:flex;align-items:start;gap:.75rem;padding:.75rem;background:#F0FDF4;border-radius:8px"><span style="color:#16a34a;font-size:1.2rem;flex-shrink:0">&#10003;</span><span>When resolved, <strong>all ' + result.reportCount + ' citizens</strong> will be notified</span></div>' +
                    '<div style="display:flex;align-items:start;gap:.75rem;padding:.75rem;background:#F0FDF4;border-radius:8px"><span style="color:#16a34a;font-size:1.2rem;flex-shrink:0">&#10003;</span><span>Your specific details have been attached to help the investigation</span></div>' +
                '</div>' +
            '</div>' +

            '<div class="cf-card">' +
                '<h2><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Case Details</h2>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
                    '<div><span style="font-size:.75rem;color:#737373;text-transform:uppercase">Category</span><p style="font-weight:700">' + cr.category + '</p></div>' +
                    '<div><span style="font-size:.75rem;color:#737373;text-transform:uppercase">Department</span><p style="font-weight:700">' + cr.department + '</p></div>' +
                    '<div><span style="font-size:.75rem;color:#737373;text-transform:uppercase">Priority</span><p style="font-weight:700">' + c.priority + '</p></div>' +
                    '<div><span style="font-size:.75rem;color:#737373;text-transform:uppercase">Status</span><p style="font-weight:700">' + c.status + '</p></div>' +
                '</div>' +
            '</div>' +

            '<div class="cf-actions">' +
                '<button class="btn-primary" id="cfTrackBtn">Track Case ' + result.parentComplaint + '</button>' +
                '<button class="btn-secondary" id="cfNewBtn">Lodge Different Complaint</button>' +
                '<button class="btn-secondary" id="cfDashBtn">Go to Dashboard</button>' +
            '</div>' +
        '</div>';

        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        document.getElementById('cfTrackBtn').onclick = function() {
            if (typeof showSection === 'function') showSection('track-status');
            setTimeout(function() {
                var inp = document.getElementById('trackingNumber');
                if (inp) { inp.value = result.parentComplaint; trackComplaint(); }
            }, 300);
        };
        document.getElementById('cfNewBtn').onclick = function() { restoreForm(); };
        document.getElementById('cfDashBtn').onclick = function() { if (typeof showSection === 'function') showSection('dashboard'); };
    }

    // =====================================================
    // NEW COMPLAINT CONFIRMATION (no cluster)
    // =====================================================
    function showNewConfirmation(c) {
        var section = document.getElementById('new-complaint-section');
        if (!section) return;
        if (!window._origFormHTML) window._origFormHTML = section.innerHTML;

        var cr = c.classification;
        var colors = { HIGH: {bg:'#fee2e2',border:'#dc2626',text:'#991b1b',label:'HIGH PRIORITY'}, MEDIUM: {bg:'#fef3c7',border:'#f59e0b',text:'#92400e',label:'MEDIUM PRIORITY'}, NORMAL: {bg:'#dbeafe',border:'#3b82f6',text:'#1e40af',label:'NORMAL'}, CRITICAL: {bg:'#fee2e2',border:'#dc2626',text:'#991b1b',label:'CRITICAL'} };
        var p = colors[c.priority] || colors.NORMAL;

        var expDate = new Date(c.expectedResponseBy).toLocaleString('en-US', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
        var creDate = new Date(c.createdAt).toLocaleString('en-US', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
        var arrow = '<div class="cf-arrow"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13 7l5 5-5 5M6 7l5 5-5 5"/></svg></div>';

        section.innerHTML = '<div class="cf-wrap">' +
            '<div class="cf-header"><div class="cf-check"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><h1>Complaint Registered Successfully!</h1><p>Classified and assigned to the relevant department</p></div>' +
            '<div class="cf-ref"><span class="cf-ref-label">Reference Number</span><div class="cf-ref-box"><span class="cf-ref-num">' + c.id + '</span><button class="cf-copy" id="cfCopyBtn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button></div><span class="cf-ref-hint">Save this number to track your complaint</span></div>' +
            '<div class="cf-priority" style="background:' + p.bg + ';border:2px solid ' + p.border + ';color:' + p.text + '">' + p.label + (cr.isUrgent ? ' — Fast-tracked' : '') + '</div>' +
            '<div class="cf-card"><h2><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3"/></svg> AI Classification Result</h2><div class="cf-route">' +
                '<div class="cf-step"><div class="cf-step-icon s1"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div><div class="cf-step-label">Complaint</div><div class="cf-step-val">' + c.title + '</div></div>' + arrow +
                '<div class="cf-step"><div class="cf-step-icon s2"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9.663 17h4.673M12 3v1"/></svg></div><div class="cf-step-label">Category</div><div class="cf-step-val">' + cr.category + '</div><div class="cf-conf">' + cr.confidence + '%</div></div>' + arrow +
                '<div class="cf-step"><div class="cf-step-icon s3"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg></div><div class="cf-step-label">Level</div><div class="cf-step-val">' + cr.governmentLevel + '</div></div>' + arrow +
                '<div class="cf-step"><div class="cf-step-icon s4"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="cf-step-label">Assigned To</div><div class="cf-step-val">' + cr.department + '</div></div>' +
            '</div></div>' +
            '<div class="cf-card"><h2><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> What Happens Next</h2><div>' +
                '<div class="cf-tl-step done"><div class="cf-tl-dot"></div><div class="cf-tl-info"><strong>Registered</strong><span>' + creDate + '</span></div></div>' +
                '<div class="cf-tl-step done"><div class="cf-tl-dot"></div><div class="cf-tl-info"><strong>Classified: ' + cr.category + '</strong><span>' + cr.confidence + '% confidence</span></div></div>' +
                '<div class="cf-tl-step done"><div class="cf-tl-dot"></div><div class="cf-tl-info"><strong>Assigned to ' + cr.department + '</strong><span>' + creDate + '</span></div></div>' +
                '<div class="cf-tl-step active"><div class="cf-tl-dot"></div><div class="cf-tl-info"><strong>Awaiting Review</strong><span>Expected by ' + expDate + '</span></div></div>' +
                '<div class="cf-tl-step pending"><div class="cf-tl-dot"></div><div class="cf-tl-info"><strong>Investigation & Resolution</strong><span>Pending</span></div></div>' +
            '</div></div>' +
            '<div class="cf-card cf-sla"><div class="cf-sla-grid">' +
                '<div class="cf-sla-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><div><span>Response</span><strong>' + cr.slaHours + ' hours</strong></div></div>' +
                '<div class="cf-sla-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><div><span>Deadline</span><strong>' + expDate + '</strong></div></div>' +
                '<div class="cf-sla-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg><div><span>Escalation</span><strong>Auto in ' + cr.slaHours + 'h</strong></div></div>' +
            '</div></div>' +
            '<div class="cf-actions"><button class="btn-primary" id="cfTrackBtn">Track Status</button><button class="btn-secondary" id="cfNewBtn">Lodge Another</button><button class="btn-secondary" id="cfDashBtn">Dashboard</button></div></div>';

        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('cfCopyBtn').onclick = function() { navigator.clipboard.writeText(c.id).catch(function(){}); showNotification('Copied: ' + c.id, 'success'); };
        document.getElementById('cfTrackBtn').onclick = function() { if (typeof showSection === 'function') showSection('track-status'); setTimeout(function() { var inp = document.getElementById('trackingNumber'); if (inp) { inp.value = c.id; trackComplaint(); } }, 300); };
        document.getElementById('cfNewBtn').onclick = function() { restoreForm(); };
        document.getElementById('cfDashBtn').onclick = function() { if (typeof showSection === 'function') showSection('dashboard'); };
    }

    function restoreForm() {
        var section = document.getElementById('new-complaint-section');
        if (section && window._origFormHTML) { section.innerHTML = window._origFormHTML; window._origFormHTML = null; }
    }

    // =====================================================
    // TRACK COMPLAINT
    // =====================================================
    window.trackComplaint = async function() {
        var input = document.getElementById('trackingNumber');
        var resultDiv = document.getElementById('trackingResult');
        var refNo = input ? input.value.trim() : '';
        if (!refNo) { showNotification('Enter a reference number', 'warning'); return; }

        try {
            var result = await apiCall('GET', '/complaints/' + refNo);
            var c = result.data;
            if (!resultDiv) return;
            resultDiv.style.display = 'block';

            var tlHTML = '';
            c.timeline.forEach(function(t) {
                var cls = t.status === 'done' ? 'completed' : (t.status === 'active' ? 'active' : '');
                var dt = t.date ? new Date(t.date).toLocaleString('en-US', {dateStyle:'medium', timeStyle:'short'}) : '';
                tlHTML += '<div class="timeline-step ' + cls + '"><div class="timeline-marker"></div><div class="timeline-content"><p class="timeline-title">' + t.step + '</p>' + (dt ? '<p class="timeline-date">' + dt + '</p>' : '') + '</div></div>';
            });

            var clusterInfo = '';
            if (c.reportCount > 1) {
                clusterInfo = '<div style="background:linear-gradient(135deg,#EDE9FE,#F5F3FF);border:2px solid #8B5CF6;border-radius:12px;padding:1rem;margin-bottom:1rem"><strong style="color:#5B21B6">' + c.reportCount + ' citizens</strong><span style="color:#6B21A8"> have reported this same issue in this area</span></div>';
            }

            resultDiv.innerHTML = '<div style="margin-top:1.5rem">' +
                '<h3 style="margin-bottom:1rem">' + c.title + '</h3>' + clusterInfo +
                '<p><strong>Reference:</strong> ' + c.id + '</p>' +
                '<p><strong>Status:</strong> <span class="status-badge ' + c.status + '">' + c.status + '</span></p>' +
                '<p><strong>Category:</strong> ' + c.classification.category + '</p>' +
                '<p><strong>Department:</strong> ' + c.classification.department + '</p>' +
                '<p><strong>Priority:</strong> ' + c.priority + (c.reportCount > 1 ? ' (auto-escalated from ' + c.reportCount + ' reports)' : '') + '</p>' +
                (c.resolution ? '<p><strong>Resolution:</strong> ' + c.resolution + '</p>' : '') +
                '<div style="margin-top:1.5rem">' + tlHTML + '</div></div>';
        } catch (err) {
            showNotification('Not found: ' + refNo, 'error');
            if (resultDiv) { resultDiv.style.display = 'block'; resultDiv.innerHTML = '<p style="color:#dc2626;padding:1rem">No complaint found: ' + refNo + '</p>'; }
        }
    };

    // =====================================================
    // PUBLIC EXPLORE FEED
    // =====================================================
    async function loadPublicFeed(sort) {
        try {
            var result = await apiCall('GET', '/complaints/public?sort=' + (sort || 'trending') + '&limit=20');
            var grid = document.getElementById('complaintGrid');
            if (!grid) return;

            if (result.data.length === 0) {
                grid.innerHTML = '<p style="padding:2rem;text-align:center;color:#737373;grid-column:1/-1">No public complaints yet. Be the first to report an issue!</p>';
                return;
            }

            var html = '';
            result.data.forEach(function(c) {
                var isCritical = c.priority === 'CRITICAL' || c.priority === 'HIGH';
                var pClass = c.priority === 'CRITICAL' ? 'critical' : c.priority.toLowerCase();
                var catIcon = getCategoryIcon(c.categoryKey);

                html +=
                    '<div class="pub-card' + (isCritical ? ' critical-card' : '') + '" data-category="' + c.categoryKey + '" data-priority="' + pClass + '">' +
                        (isCritical ? '<div class="urgent-indicator"></div>' : '') +
                        '<div class="pub-card-header">' +
                            '<span class="pub-card-id">' + c.id + '</span>' +
                            '<span class="priority-badge ' + pClass + '">' + c.priority + '</span>' +
                        '</div>' +
                        '<h3 class="pub-card-title">' + c.title + '</h3>' +
                        '<p class="pub-card-desc">' + c.description + '</p>' +
                        '<div class="pub-card-meta">' +
                            '<div class="pub-card-cat">' + catIcon + ' ' + c.category + '</div>' +
                            '<span class="pub-card-time">' + timeAgo(c.createdAt) + '</span>' +
                        '</div>' +
                        (c.reportCount > 1 ? '<div style="margin-bottom:.75rem"><span class="report-count-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> ' + c.reportCount + ' citizens reported</span></div>' : '') +
                        '<div class="pub-card-footer">' +
                            '<button class="pub-upvote" onclick="publicUpvote(this,\'' + c.id + '\')">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>' +
                                '<span>' + c.upvotes + '</span>' +
                            '</button>' +
                            '<button class="pub-report-btn" onclick="publicReportSame(\'' + c.id + '\')">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>' +
                                'I have this issue too' +
                            '</button>' +
                        '</div>' +
                    '</div>';
            });

            grid.innerHTML = html;
        } catch (err) {
            console.log('[Public Feed] Could not load:', err.message);
        }
    }

    function getCategoryIcon(catKey) {
        var icons = {
            electricity: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
            water: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
            road: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg>',
            corruption: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg>',
            environment: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945"/></svg>',
            health: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
            law: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9m6-9l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l-3 9"/></svg>'
        };
        return icons[catKey] || '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>';
    }

    // Public upvote
    window.publicUpvote = async function(btn, id) {
        try {
            var result = await apiCall('POST', '/complaints/' + id + '/upvote', { visitorId: visitorId });
            var countEl = btn.querySelector('span');
            if (countEl) countEl.textContent = result.upvotes;
            if (result.upvoted) { btn.classList.add('voted'); }
            else { btn.classList.remove('voted'); }
        } catch (err) {
            console.error('Upvote failed:', err.message);
        }
    };

    // "I have this issue too" — navigates to complaint form or login
    window.publicReportSame = function(id) {
        if (document.getElementById('new-complaint-section')) {
            showSection('new-complaint');
        } else {
            showNotification('Login or register to add your report to this issue', 'info');
            if (typeof showLoginModal === 'function') showLoginModal();
        }
    };

    // Wire up explore tab filters
    window.filterComplaints = function(filter) {
        var tabs = document.querySelectorAll('.explore-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        event.target.classList.add('active');

        var sortMap = { all: 'trending', critical: 'priority', trending: 'trending', recent: 'recent' };
        loadPublicFeed(sortMap[filter] || 'trending');
    };

    window.sortComplaints = function(value) {
        var sortMap = { priority: 'priority', upvotes: 'upvotes', recent: 'recent', category: 'trending' };
        loadPublicFeed(sortMap[value] || 'trending');
    };

    // =====================================================
    // DEPARTMENT LEADERBOARD (Easy Win #5)
    // =====================================================
    async function loadLeaderboard() {
        try {
            var result = await apiCall('GET', '/complaints/leaderboard');
            if (result.data.length === 0) return;

            // Find where to insert — after explore section, before features
            var exploreSection = document.getElementById('explore');
            var featuresSection = document.getElementById('features');
            if (!exploreSection || !featuresSection) return;

            // Check if already exists
            if (document.getElementById('leaderboardSection')) return;

            var section = document.createElement('section');
            section.id = 'leaderboardSection';
            section.style.cssText = 'padding:4rem 1.5rem;background:#fff';

            var html = '<div style="max-width:900px;margin:0 auto">' +
                '<div style="text-align:center;margin-bottom:2.5rem">' +
                    '<h2 style="font-size:2.25rem;font-weight:800;background:linear-gradient(135deg,#DC143C,#003893);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.75rem">Department Performance Leaderboard</h2>' +
                    '<div style="width:100px;height:4px;background:linear-gradient(135deg,#DC143C,#003893);margin:.75rem auto;border-radius:999px"></div>' +
                    '<p style="font-size:1.1rem;color:#525252">Transparency drives accountability — see how departments are performing</p>' +
                '</div>';

            result.data.forEach(function(d) {
                var rankClass = d.rank===1?'r1':(d.rank===2?'r2':(d.rank===3?'r3':'rn'));
                var rowClass = d.rank===1?'gold':(d.rank===2?'silver':(d.rank===3?'bronze':''));
                var rateColor = d.resolutionRate>=80?'green':(d.resolutionRate>=50?'amber':'');
                var rating = d.avgRating ? d.avgRating+'/5' : 'N/A';
                var time = d.avgResolutionHours ? d.avgResolutionHours+'h' : 'N/A';

                html += '<div style="display:flex;align-items:center;gap:1rem;padding:1.25rem;margin-bottom:.75rem;border-radius:12px;border:2px solid #e5e5e5;background:#fff;transition:all .25s'+(rowClass==='gold'?';border-color:#f59e0b;background:linear-gradient(135deg,#FFFBEB,#FEF3C7)':(rowClass==='silver'?';border-color:#94a3b8;background:linear-gradient(135deg,#f8fafc,#f1f5f9)':(rowClass==='bronze'?';border-color:#d97706;background:linear-gradient(135deg,#FFF7ED,#FFEDD5)':'')))+ '">' +
                    '<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;flex-shrink:0;color:#fff;background:'+(d.rank===1?'linear-gradient(135deg,#f59e0b,#d97706)':(d.rank===2?'linear-gradient(135deg,#94a3b8,#64748b)':(d.rank===3?'linear-gradient(135deg,#d97706,#b45309)':'#e5e5e5')))+';'+(d.rank>3?'color:#404040':'')+'">#'+d.rank+'</div>' +
                    '<div style="flex:1"><div style="font-size:1rem;font-weight:700;color:#171717">'+d.department+'</div><div style="font-size:.75rem;color:#737373">'+d.level+' Government</div></div>' +
                    '<div style="display:flex;gap:1.5rem;flex-wrap:wrap">' +
                        '<div style="text-align:center"><strong style="display:block;font-size:1.1rem;font-weight:800;color:'+(rateColor==='green'?'#16a34a':(rateColor==='amber'?'#d97706':'#dc2626'))+'">'+d.resolutionRate+'%</strong><span style="font-size:.7rem;color:#737373;text-transform:uppercase">Resolution</span></div>' +
                        '<div style="text-align:center"><strong style="display:block;font-size:1.1rem;font-weight:800;color:#003893">'+time+'</strong><span style="font-size:.7rem;color:#737373;text-transform:uppercase">Avg Time</span></div>' +
                        '<div style="text-align:center"><strong style="display:block;font-size:1.1rem;font-weight:800;color:#d97706">'+rating+'</strong><span style="font-size:.7rem;color:#737373;text-transform:uppercase">Rating</span></div>' +
                        '<div style="text-align:center"><strong style="display:block;font-size:1.1rem;font-weight:800;color:#525252">'+d.citizensServed+'</strong><span style="font-size:.7rem;color:#737373;text-transform:uppercase">Citizens</span></div>' +
                    '</div></div>';
            });

            html += '</div>';
            section.innerHTML = html;
            featuresSection.parentNode.insertBefore(section, featuresSection);

        } catch(err) { console.log('[Leaderboard]', err.message); }
    }

    // =====================================================
    // SCROLL HELPER
    // =====================================================
    window.scrollToSection = function(id) {
        var el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // =====================================================
    // DASHBOARD STATS
    // =====================================================
    async function loadDashboardStats() {
        try {
            var result = await apiCall('GET', '/complaints');
            var all = result.data;
            var pending = all.filter(function(c) { return c.status === 'registered' || c.status === 'pending'; }).length;
            var inProgress = all.filter(function(c) { return c.status === 'in-progress'; }).length;
            var resolved = all.filter(function(c) { return c.status === 'resolved'; }).length;
            var statCards = document.querySelectorAll('.stat-card-dash .stat-info h3');
            if (statCards.length >= 4) { statCards[0].textContent = pending; statCards[1].textContent = inProgress; statCards[2].textContent = resolved; statCards[3].textContent = all.length; }
        } catch (err) { console.log('[API] Stats error:', err.message); }
    }

    // =====================================================
    // INIT
    // =====================================================
    document.addEventListener('DOMContentLoaded', function() {
        injectStyles();
        console.log('[API Connect v2] Initialized — API at ' + API);

        fetch(API + '/health')
            .then(function(r) { return r.json(); })
            .then(function(d) {
                console.log('[API Connect v2] Server OK');

                // Load dashboard if on dashboard page
                if (document.getElementById('dashboard-section')) {
                    loadDashboardStats();
                }

                // Load public feed if on landing page
                if (document.getElementById('complaintGrid')) {
                    loadPublicFeed('trending');
                    loadLeaderboard();
                }
            })
            .catch(function() {
                console.warn('[API Connect v2] Server not running at ' + API);
            });
    });

})();