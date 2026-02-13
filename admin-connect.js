// =====================================================
// ADMIN DASHBOARD v2 - All 5 Easy Wins Integrated
// =====================================================
(function() {
    'use strict';
    var API = 'http://localhost:3000/api';

    async function api(method, path, body) {
        var opts = { method:method, headers:{'Content-Type':'application/json'} };
        if (body) opts.body = JSON.stringify(body);
        var res = await fetch(API+path, opts);
        var data = await res.json();
        if (!res.ok) throw new Error(data.error||'API error');
        return data;
    }

    function timeAgo(d) {
        var m=Math.floor((Date.now()-new Date(d).getTime())/60000);
        if(m<1)return'Just now';if(m<60)return m+'m ago';
        var h=Math.floor(m/60);if(h<24)return h+'h ago';
        return Math.floor(h/24)+'d ago';
    }

    // =====================================================
    // INJECT ADMIN STYLES
    // =====================================================
    function injectStyles() {
        if (document.getElementById('admin-v2-styles')) return;
        var s = document.createElement('style');
        s.id = 'admin-v2-styles';
        s.textContent = [
            // SLA Timer
            '.sla-timer{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:.75rem;font-weight:700;font-family:monospace}',
            '.sla-timer.ok{background:#d1fae5;color:#065f46}',
            '.sla-timer.warning{background:#fef3c7;color:#92400e}',
            '.sla-timer.critical{background:#fee2e2;color:#991b1b;animation:slaPulse 1s infinite}',
            '.sla-timer.overdue{background:#dc2626;color:#fff;animation:slaPulse .5s infinite}',
            '@keyframes slaPulse{0%,100%{opacity:1}50%{opacity:.6}}',

            // Report badge
            '.rpt-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:linear-gradient(135deg,#EDE9FE,#F5F3FF);border:1px solid #8B5CF6;border-radius:999px;font-size:.7rem;font-weight:700;color:#7C3AED;margin-left:6px}',
            '.rpt-badge svg{width:12px;height:12px}',
            '.rpt-badge-lg{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;background:linear-gradient(135deg,#EDE9FE,#F5F3FF);border:2px solid #8B5CF6;border-radius:12px;font-size:.8rem;font-weight:700;color:#7C3AED;margin-bottom:.75rem}',

            // Location chips
            '.loc-chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem}',
            '.loc-chip{padding:.4rem .85rem;border-radius:999px;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;border:2px solid #e5e5e5;background:#fff;color:#404040}',
            '.loc-chip:hover{border-color:#003893;background:#E3F2FD}',
            '.loc-chip.active{background:linear-gradient(135deg,#003893,#0047AB);color:#fff;border-color:#003893}',
            '.loc-chip .chip-count{background:rgba(0,0,0,.1);padding:1px 6px;border-radius:999px;font-size:.7rem;margin-left:4px}',
            '.loc-chip.active .chip-count{background:rgba(255,255,255,.3)}',
            '.loc-chip.hot{border-color:#dc2626;background:#fee2e2;color:#991b1b}',
            '.loc-chip.hot.active{background:#dc2626;color:#fff}',

            // Notification log
            '.notif-entry{display:flex;align-items:start;gap:.5rem;padding:.5rem;font-size:.8rem;color:#525252;border-left:3px solid #3b82f6;margin-bottom:.4rem;background:#f0f7ff;border-radius:0 6px 6px 0}',
            '.notif-entry.sms{border-color:#16a34a;background:#f0fdf4}',
            '.notif-entry.email{border-color:#3b82f6;background:#eff6ff}',
            '.notif-entry.escalation{border-color:#dc2626;background:#fef2f2}',

            // Citizen history card
            '.citizen-card{background:linear-gradient(135deg,#FFF7ED,#FFFBEB);border:2px solid #f59e0b;border-radius:12px;padding:1.25rem;margin-bottom:1rem}',
            '.citizen-card h4{color:#92400e;margin-bottom:.75rem;font-size:1rem}',
            '.citizen-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:.75rem}',
            '.citizen-stat{text-align:center}',
            '.citizen-stat strong{display:block;font-size:1.5rem;color:#171717}',
            '.citizen-stat span{font-size:.7rem;color:#737373;text-transform:uppercase}',
            '.citizen-history-list{max-height:150px;overflow-y:auto}',
            '.citizen-history-item{display:flex;justify-content:space-between;padding:.4rem .5rem;font-size:.8rem;border-bottom:1px solid #fde68a}',

            // Leaderboard on landing page
            '.lb-section{padding:3rem 1.5rem;background:#fff}',
            '.lb-grid{max-width:900px;margin:0 auto}',
            '.lb-row{display:flex;align-items:center;gap:1rem;padding:1.25rem;margin-bottom:.75rem;border-radius:12px;border:2px solid #e5e5e5;transition:all .25s;background:#fff}',
            '.lb-row:hover{box-shadow:0 4px 12px rgba(0,0,0,.08);transform:translateY(-2px)}',
            '.lb-row.gold{border-color:#f59e0b;background:linear-gradient(135deg,#FFFBEB,#FEF3C7)}',
            '.lb-row.silver{border-color:#94a3b8;background:linear-gradient(135deg,#f8fafc,#f1f5f9)}',
            '.lb-row.bronze{border-color:#d97706;background:linear-gradient(135deg,#FFF7ED,#FFEDD5)}',
            '.lb-rank{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;flex-shrink:0;color:#fff}',
            '.lb-rank.r1{background:linear-gradient(135deg,#f59e0b,#d97706)}.lb-rank.r2{background:linear-gradient(135deg,#94a3b8,#64748b)}.lb-rank.r3{background:linear-gradient(135deg,#d97706,#b45309)}',
            '.lb-rank.rn{background:#e5e5e5;color:#404040}',
            '.lb-info{flex:1}',
            '.lb-dept{font-size:1rem;font-weight:700;color:#171717}',
            '.lb-level{font-size:.75rem;color:#737373}',
            '.lb-stats{display:flex;gap:1.5rem;flex-wrap:wrap}',
            '.lb-stat{text-align:center}',
            '.lb-stat strong{display:block;font-size:1.1rem;font-weight:800}',
            '.lb-stat span{font-size:.7rem;color:#737373;text-transform:uppercase}',
            '.lb-stat .green{color:#16a34a}.lb-stat .blue{color:#003893}.lb-stat .amber{color:#d97706}'
        ].join('\n');
        document.head.appendChild(s);
    }

    // =====================================================
    // SLA TIMER HELPER (Easy Win #1)
    // =====================================================
    function getSlaHtml(expectedResponseBy) {
        var now = Date.now();
        var deadline = new Date(expectedResponseBy).getTime();
        var remaining = deadline - now;
        var hours = Math.max(0, Math.floor(remaining / 3600000));
        var mins = Math.max(0, Math.floor((remaining % 3600000) / 60000));

        var status, label;
        if (remaining <= 0) { status = 'overdue'; label = 'OVERDUE'; }
        else if (hours < 1) { status = 'critical'; label = hours + 'h ' + mins + 'm'; }
        else if (hours < 4) { status = 'warning'; label = hours + 'h ' + mins + 'm'; }
        else { status = 'ok'; label = hours + 'h ' + mins + 'm'; }

        return '<span class="sla-timer ' + status + '">' +
            (status === 'overdue' ? '!! ' : '') + label +
            (status === 'overdue' ? ' !!' : '') + '</span>';
    }

    function reportBadgeHtml(count) {
        if (!count || count <= 1) return '';
        return '<span class="rpt-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' + count + ' reports</span>';
    }

    function reportBadgeLgHtml(count) {
        if (!count || count <= 1) return '';
        return '<div class="rpt-badge-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> ' + count + ' citizens reported this issue</div>';
    }

    // =====================================================
    // SEED DATA
    // =====================================================
    async function seedIfEmpty() {
        var existing = await api('GET', '/complaints');
        if (existing.count > 0) return;
        console.log('[Admin] Seeding...');
        var samples = [
            { title:'Major Power Outage - Industrial Area', description:'Complete power outage affecting 50+ industrial units. Transformer exploded. Urgent electricity restoration needed.', province:'bagmati', district:'Kathmandu', municipality:'KMC', ward:'5' },
            { title:'Transformer Malfunction', description:'Transformer making loud noises and sparking dangerously. Residents concerned about electrocution risk.', province:'bagmati', district:'Lalitpur', municipality:'Lalitpur MC', ward:'12' },
            { title:'Voltage Fluctuation', description:'Frequent voltage fluctuation damaging household appliances. Need voltage stabilization.', province:'bagmati', district:'Bhaktapur', municipality:'Bhaktapur Municipality', ward:'3' },
            { title:'Bridge Collapse Risk', description:'Critical bridge showing severe structural damage road cracking. Danger of collapse.', province:'bagmati', district:'Sindhupalchok', municipality:'Chautara', ward:'5' },
            { title:'Corruption in Procurement', description:'Bribery and fraud in government tender allocation. Nepotism in procurement.', province:'bagmati', district:'Kathmandu', municipality:'KMC', ward:'1' },
            { title:'Street Light Not Working', description:'Multiple street lights not functioning. Electricity pole damaged. Safety hazard.', province:'bagmati', district:'Kathmandu', municipality:'KMC', ward:'7' },
            { title:'Water Supply Disruption', description:'No drinking water supply for 5 days. Pipe broken.', province:'bagmati', district:'Lalitpur', municipality:'Lalitpur MC', ward:'8' },
            { title:'Garbage Collection Failure', description:'Garbage waste not collected. Pollution causing foul smell.', province:'bagmati', district:'Kathmandu', municipality:'KMC', ward:'12' }
        ];
        for (var i=0;i<samples.length;i++) await api('POST','/complaints',samples[i]);
        // Cluster some
        for (var j=0;j<3;j++) await api('POST','/complaints',{ title:'Power outage ward 5', description:'No electricity report '+(j+2), district:'Kathmandu', municipality:'KMC', ward:'5', province:'bagmati' });
        // Assign & resolve one
        await api('PATCH','/admin/complaints/CPL-2025-0001/assign',{assignedTo:'Rajesh Thapa',teamMemberId:'TM-001'});
        await api('PATCH','/admin/complaints/CPL-2025-0006/assign',{assignedTo:'Rajesh Thapa',teamMemberId:'TM-001'});
        await api('PATCH','/admin/complaints/CPL-2025-0003/assign',{assignedTo:'Sita Karki',teamMemberId:'TM-002'});
        await api('PATCH','/admin/complaints/CPL-2025-0006/status',{status:'resolved',note:'Street lights repaired',resolution:'Replaced damaged bulbs.'});
        await api('POST','/complaints/CPL-2025-0006/feedback',{rating:5,comment:'Quick resolution!'});
        console.log('[Admin] Seeded');
    }

    // =====================================================
    // DASHBOARD (with SLA timers)
    // =====================================================
    async function loadDashboard() {
        try {
            var dash = await api('GET','/admin/dashboard');
            var d = dash.data;
            var stats = document.querySelectorAll('.admin-stats .stat-info h3');
            if (stats.length>=4) { stats[0].textContent=d.stats.newAssignments; stats[1].textContent=d.stats.pendingAction; stats[2].textContent=d.stats.inProgress; stats[3].textContent=d.stats.resolutionRate+'%'; }
            var smalls = document.querySelectorAll('.admin-stats .stat-info small');
            if (smalls.length>=4) { smalls[0].textContent='Last 24 hours'; smalls[1].textContent=d.stats.total+' total'; smalls[2].textContent=d.stats.resolved+' resolved'; smalls[3].textContent='This month'; }
            var mvs = document.querySelectorAll('.metric-value');
            if (mvs.length>=3) { mvs[0].textContent=d.metrics.avgResolutionTime; mvs[1].textContent=d.metrics.citizenSatisfaction+'/5.0'; mvs[2].textContent=d.metrics.responseRate+'%'; }

            await loadPriorityTable();
            await loadLocationChips();
            await loadRecentActivity();
        } catch(err) { console.error('[Admin]', err.message); }
    }

    // =====================================================
    // PRIORITY TABLE (with SLA + report badges)
    // =====================================================
    async function loadPriorityTable(locationFilter) {
        try {
            var path = '/admin/complaints?limit=15';
            if (locationFilter) path += '&location=' + encodeURIComponent(locationFilter);
            var result = await api('GET', path);
            var tbody = document.querySelector('.admin-table tbody');
            if (!tbody) return;

            var html = '';
            result.data.forEach(function(c) {
                var pc = c.priority==='HIGH'||c.priority==='CRITICAL'?'high':(c.priority==='MEDIUM'?'medium':'low');
                var assigned = c.assignedTo||'Unassigned';
                var actionBtn = c.assignedTo
                    ? '<button class="btn-action" onclick="adminReviewComplaint(\''+c.id+'\')">Review</button>'
                    : '<button class="btn-action primary" onclick="adminAssignComplaint(\''+c.id+'\')">Assign</button>';

                html += '<tr class="priority-'+pc+'">' +
                    '<td><span class="priority-badge '+pc+'">'+c.priority+'</span></td>' +
                    '<td><strong>'+c.id+'</strong>'+reportBadgeHtml(c.reportCount)+'</td>' +
                    '<td>'+c.title+'</td>' +
                    '<td>'+(c.location.district||'')+', Ward '+(c.location.ward||'')+'</td>' +
                    '<td>'+getSlaHtml(c.expectedResponseBy)+'</td>' +
                    '<td>'+assigned+'</td>' +
                    '<td>'+actionBtn+'</td></tr>';
            });
            tbody.innerHTML = html;
        } catch(err) { console.error('[Admin] Table:', err.message); }
    }

    // =====================================================
    // LOCATION CHIPS (Easy Win #3)
    // =====================================================
    var activeLocationFilter = null;

    async function loadLocationChips() {
        try {
            var result = await api('GET', '/complaints/location-summary');
            var container = document.querySelector('.card-header-inline');
            if (!container) return;

            var existing = document.getElementById('locChips');
            if (existing) existing.remove();

            var div = document.createElement('div');
            div.id = 'locChips';
            div.className = 'loc-chips';

            var allChip = '<span class="loc-chip'+(activeLocationFilter?'':' active')+'" onclick="filterByLocation(null)">All Locations</span>';
            var chips = result.data.map(function(l) {
                var isHot = l.highPriority > 0 || l.citizensAffected > 5;
                var isActive = activeLocationFilter === l.district;
                return '<span class="loc-chip'+(isHot?' hot':'')+(isActive?' active':'')+'" onclick="filterByLocation(\''+l.district+'\')">' +
                    l.location+'<span class="chip-count">'+l.count+(l.citizensAffected>l.count?' ('+l.citizensAffected+' citizens)':'')+'</span></span>';
            }).join('');

            div.innerHTML = allChip + chips;
            var cardDiv = container.closest('.dashboard-card');
            if (cardDiv) cardDiv.insertBefore(div, cardDiv.querySelector('.complaints-table-container'));
        } catch(err) { console.log('[Admin] Loc chips:', err.message); }
    }

    window.filterByLocation = function(district) {
        activeLocationFilter = district;
        loadPriorityTable(district);
        // Update chip styles
        document.querySelectorAll('.loc-chip').forEach(function(c) { c.classList.remove('active'); });
        event.target.classList.add('active');
    };

    // =====================================================
    // RECENT ACTIVITY
    // =====================================================
    async function loadRecentActivity() {
        try {
            var result = await api('GET','/complaints?limit=5');
            var tl = document.querySelector('.activity-timeline');
            if (!tl) return;
            var html = '';
            result.data.forEach(function(c) {
                var icon = c.status==='resolved'?'success':(c.status==='in-progress'?'info':'warning');
                var action = c.status==='resolved'?'resolved':(c.status==='in-progress'?'working on':'New');
                html += '<div class="activity-item"><div class="activity-icon '+icon+'"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="activity-content"><p><strong>'+(c.assignedTo||'System')+'</strong> '+action+' '+c.id+(c.reportCount>1?' ('+c.reportCount+' reports)':'')+'</p><span class="activity-time">'+timeAgo(c.createdAt)+'</span></div></div>';
            });
            tl.innerHTML = html;
        } catch(err) {}
    }

    // =====================================================
    // ASSIGNED COMPLAINTS (with SLA + reports)
    // =====================================================
    async function loadAssignedComplaints() {
        try {
            var result = await api('GET','/admin/complaints');
            var grid = document.querySelector('#assigned-section .complaints-grid') || document.querySelector('#assigned-section .admin-grid');
            if (!grid) return;
            var unresolved = result.data.filter(function(c){return c.status!=='resolved';});
            var html = '';
            unresolved.forEach(function(c) {
                var pc = c.priority==='HIGH'||c.priority==='CRITICAL'?'high':(c.priority==='MEDIUM'?'medium':'low');
                html += '<div class="complaint-card admin-card"><div class="complaint-header"><div class="complaint-priority"><span class="priority-badge '+pc+'">'+c.priority+'</span><span class="complaint-ref">'+c.id+'</span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><div class="complaint-age">'+timeAgo(c.createdAt)+'</div>'+getSlaHtml(c.expectedResponseBy)+'</div></div><div class="complaint-body">'+reportBadgeLgHtml(c.reportCount)+'<h3>'+c.title+'</h3><div class="complaint-meta"><div class="meta-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg> '+(c.location.district||'')+', Ward '+(c.location.ward||'')+'</div><div class="meta-item">'+(c.classification?c.classification.category:'')+'</div></div><p class="complaint-excerpt">'+c.description.substring(0,120)+'...</p><div class="action-buttons-admin"><button class="btn-admin primary" onclick="adminTakeAction(\''+c.id+'\')"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Take Action</button><button class="btn-admin secondary" onclick="adminViewDetails(\''+c.id+'\')">View Details</button>'+(c.assignedTo?'':'<button class="btn-admin secondary" onclick="adminAssignComplaint(\''+c.id+'\')">Assign</button>')+'</div></div></div>';
            });
            if (!html) html = '<p style="padding:2rem;color:#737373;text-align:center">No pending complaints</p>';
            grid.innerHTML = html;
        } catch(err) { console.error('[Admin]', err.message); }
    }

    // =====================================================
    // RESOLVED COMPLAINTS
    // =====================================================
    async function loadResolvedComplaints() {
        try {
            var result = await api('GET','/complaints?status=resolved');
            var tbody = document.querySelector('#resolved-section .complaints-table tbody');
            if (!tbody) return;
            var html = '';
            result.data.forEach(function(c) {
                var date = new Date(c.resolvedAt||c.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
                var stars = '';
                if (c.feedback) { for(var i=0;i<5;i++) stars += i<c.feedback.rating?'\u2605':'\u2606'; stars += ' ('+c.feedback.rating+'.0)'; } else stars = 'No feedback';
                html += '<tr><td><strong>'+c.id+'</strong>'+reportBadgeHtml(c.reportCount)+'</td><td>'+c.title+'</td><td>'+(c.assignedTo||'System')+'</td><td>'+date+'</td><td><div class="rating-display">'+stars+'</div></td><td><button class="btn-view" onclick="adminViewDetails(\''+c.id+'\')">View</button></td></tr>';
            });
            if (!html) html = '<tr><td colspan="6" style="text-align:center;color:#737373;padding:2rem">No resolved complaints</td></tr>';
            tbody.innerHTML = html;
        } catch(err) {}
    }

    // =====================================================
    // COMPLAINT DETAIL MODAL (with citizen history + notif log)
    // =====================================================
    window.adminViewDetails = async function(id) {
        try {
            var result = await api('GET','/complaints/'+id);
            var c = result.data;
            var modal = document.getElementById('complaintDetailModal');
            var modalRef = document.getElementById('modalComplaintRef');
            var modalContent = document.getElementById('complaintDetailContent');
            if (!modal||!modalContent) return;
            if (modalRef) modalRef.textContent = c.id;

            // Citizen history (Easy Win #4)
            var citizenHtml = '';
            try {
                var hist = await api('GET','/complaints/'+id+'/citizen-history');
                var h = hist.data;
                if (h.userId !== 'anonymous') {
                    citizenHtml = '<div class="citizen-card"><h4>Citizen Profile: '+h.userId+'</h4><div class="citizen-stats"><div class="citizen-stat"><strong>'+h.total+'</strong><span>Total Filed</span></div><div class="citizen-stat"><strong>'+h.resolved+'</strong><span>Resolved</span></div><div class="citizen-stat"><strong>'+h.pending+'</strong><span>Pending</span></div><div class="citizen-stat"><strong>'+(h.avgResolutionHours||'N/A')+'</strong><span>Avg Hours</span></div></div>';
                    if (h.complaints.length > 1) {
                        citizenHtml += '<div class="citizen-history-list">';
                        h.complaints.forEach(function(cc) {
                            citizenHtml += '<div class="citizen-history-item"><span><strong>'+cc.id+'</strong> '+cc.title.substring(0,25)+'</span><span class="status-badge '+cc.status+'">'+cc.status+'</span></div>';
                        });
                        citizenHtml += '</div>';
                    }
                    citizenHtml += '</div>';
                }
            } catch(e) {}

            // Cluster info
            var clusterHtml = '';
            if (c.reportCount && c.reportCount > 1) {
                clusterHtml = '<div style="background:linear-gradient(135deg,#EDE9FE,#F5F3FF);border:2px solid #8B5CF6;border-radius:12px;padding:1.25rem"><h3 style="color:#5B21B6;margin-bottom:.75rem">Clustered Incident — '+c.reportCount+' Reports</h3><p style="color:#6B21A8;margin-bottom:.75rem">Resolving this notifies all '+c.reportCount+' citizens.</p>';
                if (c.linkedReports && c.linkedReports.length > 0) {
                    clusterHtml += '<div style="max-height:180px;overflow-y:auto">';
                    c.linkedReports.forEach(function(r,i) {
                        clusterHtml += '<div style="background:#fff;border:1px solid #DDD6FE;border-radius:8px;padding:.75rem;margin-bottom:.5rem"><div style="display:flex;justify-content:space-between"><strong style="font-size:.85rem;color:#5B21B6">Report #'+(i+2)+'</strong><span style="font-size:.75rem;color:#737373">'+new Date(r.reportedAt).toLocaleString()+'</span></div><p style="font-size:.85rem;color:#404040;margin:.25rem 0 0">'+r.description.substring(0,120)+'</p></div>';
                    });
                    clusterHtml += '</div>';
                }
                clusterHtml += '</div>';
            }

            // Notification log (Easy Win #2)
            var notifHtml = '';
            var notifs = c.timeline.filter(function(t){return t.type==='notification'||t.type==='escalation';});
            if (notifs.length > 0) {
                notifHtml = '<div><h3 style="margin-bottom:.75rem">Notification Log ('+c.notificationsSent+' sent)</h3>';
                notifs.slice(-8).forEach(function(n) {
                    var cls = n.step.indexOf('SMS')!==-1?'sms':(n.step.indexOf('Email')!==-1?'email':'escalation');
                    notifHtml += '<div class="notif-entry '+cls+'"><span>'+new Date(n.date).toLocaleString('en-US',{timeStyle:'short',dateStyle:'short'})+'</span> '+n.step+'</div>';
                });
                notifHtml += '</div>';
            }

            // Timeline
            var tlHtml = c.timeline.filter(function(t){return t.type!=='notification';}).map(function(t) {
                var cls = t.status==='done'?'completed':(t.status==='active'?'active':'');
                var dt = t.date?new Date(t.date).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'}):'Pending';
                return '<div class="timeline-step '+cls+'"><div class="timeline-marker"></div><div class="timeline-content"><p class="timeline-title">'+t.step+'</p><p class="timeline-date">'+dt+'</p></div></div>';
            }).join('');

            modalContent.innerHTML = '<div style="display:grid;gap:1.5rem">'+
                clusterHtml + citizenHtml +
                '<div><h3>Complaint Information</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:.75rem"><div><label style="font-size:.8rem;color:#737373">Category</label><p style="font-weight:600">'+(c.classification?c.classification.category:'')+'</p></div><div><label style="font-size:.8rem;color:#737373">Priority</label><p><span class="priority-badge '+c.priority.toLowerCase()+'">'+c.priority+'</span></p></div><div><label style="font-size:.8rem;color:#737373">Department</label><p style="font-weight:600">'+(c.classification?c.classification.department:'')+'</p></div><div><label style="font-size:.8rem;color:#737373">SLA</label><p>'+getSlaHtml(c.expectedResponseBy)+'</p></div><div><label style="font-size:.8rem;color:#737373">Location</label><p>'+(c.location.district||'')+', Ward '+(c.location.ward||'')+'</p></div><div><label style="font-size:.8rem;color:#737373">Assigned</label><p>'+(c.assignedTo||'Unassigned')+'</p></div></div></div>'+
                '<div><h3>Description</h3><p style="line-height:1.7;color:#404040">'+c.description+'</p></div>'+
                '<div><h3>Timeline</h3><div class="complaint-timeline">'+tlHtml+'</div></div>'+
                notifHtml +
                '<div style="display:flex;gap:.75rem"><button class="btn-admin primary" onclick="adminTakeAction(\''+c.id+'\');closeComplaintModal()">Take Action</button><button class="btn-admin secondary" onclick="adminSendNotify(\''+c.id+'\')">Send Notification</button><button class="btn-admin secondary" onclick="closeComplaintModal()">Close</button></div></div>';

            modal.classList.add('active');
            modal.style.display = 'flex';
        } catch(err) { showNotification('Error: '+err.message,'error'); }
    };

    window.adminSendNotify = async function(id) {
        var msg = prompt('Notification message to send to citizen(s):');
        if (!msg) return;
        try {
            await api('POST','/complaints/'+id+'/notify',{message:msg});
            showNotification('Notification sent!','success');
            adminViewDetails(id);
        } catch(err) { showNotification('Failed: '+err.message,'error'); }
    };

    // =====================================================
    // TEAM, COLLABORATIONS, ANALYTICS (same as before)
    // =====================================================
    async function loadTeam() {
        try {
            var r = await api('GET','/admin/team');
            var grid = document.querySelector('.team-grid-admin');
            if (!grid) return;
            var html = '';
            r.data.forEach(function(m) {
                html += '<div class="team-card-admin"><div class="team-member-avatar"><svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div><h3>'+m.name+'</h3><p class="team-role">'+m.role+'</p><div class="team-stats"><div class="team-stat"><strong>'+m.activeCases+'</strong><span>Active</span></div><div class="team-stat"><strong>'+m.successRate+'%</strong><span>Success</span></div></div><button class="btn-admin secondary full-width" onclick="adminViewTeamMember(\''+m.id+'\')">View Profile</button></div>';
            });
            grid.innerHTML = html;
        } catch(err) {}
    }

    async function loadCollaborations() {
        try {
            var r = await api('GET','/admin/collaborations');
            var grid = document.querySelector('.collab-grid');
            if (!grid) return;
            var html = '';
            r.data.forEach(function(col) {
                var tags = col.departments.map(function(d){return '<span class="dept-tag'+(d.name===col.leadDepartment?' primary':'')+'">'+d.name+'</span>';}).join('');
                var prog = col.departments.map(function(d){return '<div class="dept-progress-item"><div class="dept-progress-header"><span><strong>'+d.name+'</strong> - '+d.task+'</span><span class="progress-percent">'+d.progress+'%</span></div><div class="progress-bar"><div class="progress-fill'+(d.progress>=100?' completed':'')+'" style="width:'+d.progress+'%"></div></div><p class="progress-note">'+(d.note||'')+'</p></div>';}).join('');
                var upd = col.updates.slice(0,3).map(function(u){return '<div class="update-item"><span class="update-dept">'+u.dept+'</span><p>'+u.message+'</p><span class="update-time">'+timeAgo(u.date)+'</span></div>';}).join('');
                html += '<div class="collab-card"><div class="collab-header"><h3>'+col.complaintId+' - '+col.title+'</h3><span class="collab-status '+col.status+'">'+col.status+'</span></div><div class="collab-body"><div class="collab-departments"><h4>Departments:</h4><div class="dept-tags">'+tags+'</div></div><div class="collab-progress-section"><h4>Progress:</h4>'+prog+'</div><div class="collab-updates"><h4>Updates:</h4>'+upd+'</div><div class="collab-actions"><button class="btn-admin primary" onclick="adminUpdateCollabProgress(\''+col.id+'\')">Update Progress</button><button class="btn-admin secondary" onclick="adminAddCollabUpdate(\''+col.id+'\')">Add Update</button></div></div></div>';
            });
            if (!html) html = '<p style="padding:2rem;color:#737373;text-align:center">No collaborations</p>';
            grid.innerHTML = html;
        } catch(err) {}
    }

    async function loadAnalytics() {
        try {
            var r = await api('GET','/admin/analytics');
            var d = r.data;
            var container = document.querySelector('#analytics-admin-section .analytics-grid');
            if (!container) return;
            container.innerHTML =
                '<div class="analytics-card"><h3>By Category</h3><div style="padding:1rem">'+buildBar(d.byCategory,'#DC143C')+'</div></div>'+
                '<div class="analytics-card"><h3>By Priority</h3><div style="padding:1rem">'+buildBar(d.byPriority,'#003893')+'</div></div>'+
                '<div class="analytics-card full-width"><h3>By Government Level</h3><div style="padding:1rem">'+buildBar(d.byLevel,'#8B5CF6')+'</div></div>'+
                '<div class="analytics-card full-width"><h3>Team Performance</h3><div style="padding:1rem">'+buildTeam(d.teamPerformance)+'</div></div>';
        } catch(err) {}
    }

    function buildBar(obj,color) {
        var max=0; for(var k in obj) if(obj[k]>max)max=obj[k]; if(!max)max=1;
        var h=''; for(var key in obj) { var pct=Math.round(obj[key]/max*100); h+='<div style="display:flex;align-items:center;gap:1rem;margin-bottom:.75rem"><div style="width:140px;font-size:.85rem;font-weight:600;color:#404040;text-align:right;flex-shrink:0">'+key+'</div><div style="flex:1;background:#e5e5e5;border-radius:999px;height:24px;overflow:hidden"><div style="width:'+pct+'%;background:'+color+';height:100%;border-radius:999px;min-width:30px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px"><span style="color:#fff;font-size:.75rem;font-weight:700">'+obj[key]+'</span></div></div></div>'; }
        return h;
    }
    function buildTeam(team) {
        var h='<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f5f5f5"><th style="padding:.75rem;text-align:left">Name</th><th style="padding:.75rem;text-align:center">Active</th><th style="padding:.75rem;text-align:center">Resolved</th><th style="padding:.75rem;text-align:center">Rate</th></tr></thead><tbody>';
        team.forEach(function(m){h+='<tr style="border-bottom:1px solid #e5e5e5"><td style="padding:.75rem;font-weight:600">'+m.name+'</td><td style="padding:.75rem;text-align:center">'+m.active+'</td><td style="padding:.75rem;text-align:center">'+m.resolved+'</td><td style="padding:.75rem;text-align:center;font-weight:700;color:#16a34a">'+m.successRate+'%</td></tr>';});
        return h+'</tbody></table>';
    }

    // =====================================================
    // ADMIN ACTIONS (same as before)
    // =====================================================
    window.adminAssignComplaint = async function(id) {
        try {
            var team = await api('GET','/admin/team');
            var choice = prompt('Assign '+id+' to:\n'+team.data.map(function(m,i){return(i+1)+'. '+m.name+' ('+m.activeCases+' active)';}).join('\n')+'\n\nEnter number:');
            if (!choice) return;
            var m = team.data[parseInt(choice)-1];
            if (!m) return;
            await api('PATCH','/admin/complaints/'+id+'/assign',{assignedTo:m.name,teamMemberId:m.id});
            showNotification(id+' assigned to '+m.name,'success');
            loadPriorityTable(); loadAssignedComplaints(); loadDashboard();
        } catch(err) { showNotification('Failed: '+err.message,'error'); }
    };

    window.adminTakeAction = async function(id) {
        var a = prompt('Action for '+id+':\n1. In Progress\n2. Resolve\n3. Escalate\n\nEnter:');
        if (!a) return;
        try {
            if (a==='1') { await api('PATCH','/admin/complaints/'+id+'/status',{status:'in-progress',note:'Investigation started'}); showNotification('In Progress','success'); }
            else if (a==='2') { var res=prompt('Resolution:'); if(!res)return; await api('PATCH','/admin/complaints/'+id+'/status',{status:'resolved',note:'Resolved',resolution:res}); showNotification('Resolved!','success'); }
            else if (a==='3') { var reason=prompt('Reason:'); if(!reason)return; await api('PATCH','/admin/complaints/'+id+'/escalate',{reason:reason,escalateTo:'Provincial Govt'}); showNotification('Escalated!','success'); }
            loadPriorityTable(); loadAssignedComplaints(); loadDashboard();
        } catch(err) { showNotification('Failed: '+err.message,'error'); }
    };

    window.adminReviewComplaint = function(id) { adminViewDetails(id); };
    window.adminViewTeamMember = async function(id) { try { var r=await api('GET','/admin/team/'+id); var m=r.data; alert(m.name+' - '+m.role+'\nActive: '+m.activeCases+'\nResolved: '+m.resolvedCases+'\nRate: '+m.successRate+'%'); } catch(err){} };
    window.adminUpdateCollabProgress = async function(id) { var dept=prompt('Department:'); if(!dept)return; var prog=prompt('Progress (0-100):'); if(!prog)return; var note=prompt('Note:'); try { await api('PATCH','/admin/collaborations/'+id+'/progress',{departmentName:dept,progress:parseInt(prog),note:note||''}); showNotification('Updated!','success'); loadCollaborations(); } catch(err){showNotification('Failed','error');} };
    window.adminAddCollabUpdate = function(id) { adminUpdateCollabProgress(id); };
    window.addTeamMember = async function() { var n=prompt('Name:'); if(!n)return; var r=prompt('Role:'); if(!r)return; try { await api('POST','/admin/team',{name:n,role:r}); showNotification('Added!','success'); loadTeam(); } catch(err){} };

    // =====================================================
    // SECTION SWITCHING
    // =====================================================
    var origShow = window.showAdminSection;
    window.showAdminSection = function(section) {
        if (typeof origShow==='function') origShow(section);
        else if (typeof showSection==='function') showSection(section);
        if (section==='dashboard') loadDashboard();
        if (section==='assigned') loadAssignedComplaints();
        if (section==='resolved') loadResolvedComplaints();
        if (section==='team') loadTeam();
        if (section==='collaboration') loadCollaborations();
        if (section==='analytics-admin') loadAnalytics();
    };

    // =====================================================
    // INIT
    // =====================================================
    async function init() {
        injectStyles();
        console.log('[Admin v2] Initializing...');
        try {
            await fetch(API+'/health');
            await seedIfEmpty();
            await loadDashboard();
            // Refresh SLA timers every minute
            setInterval(function() {
                if (document.querySelector('.admin-table')) loadPriorityTable(activeLocationFilter);
            }, 60000);
            console.log('[Admin v2] Ready!');
        } catch(err) { console.warn('[Admin v2] API not available'); }
    }

    if (document.querySelector('.admin-body')) {
        if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    }
})();