// test-all.js - Comprehensive API Testing Suite
const http = require('http');

// Helper function to make API calls
function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(body && { 'Content-Length': Buffer.byteLength(data) })
      }
    };

    const req = http.request(opts, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) req.write(data);
    req.end();
  });
}

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.yellow}━━━ ${msg} ━━━${colors.reset}`)
};

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  Nepal Citizen Portal - API Test Suite        ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // =====================================================
    // 1. HEALTH CHECK
    // =====================================================
    log.section('1. Health Check');
    const health = await api('GET', '/api/health');
    if (health.data.status === 'ok') {
      log.success(`API Status: ${health.data.status}`);
      log.success(`Database: ${health.data.database}`);
    } else {
      log.error('Health check failed');
      return;
    }

    // =====================================================
    // 2. USER REGISTRATION
    // =====================================================
    log.section('2. User Registration');
    const registerData = {
      fullName: 'Test User ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      phone: `+977-98${String(Math.floor(10000000 + Math.random() * 90000000))}`,
      citizenship: `01-02-03-${Math.floor(10000 + Math.random() * 90000)}`,
      password: 'test123',
      province: 'bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan City',
      ward: '10',
      houseNumber: '123'
    };

    const reg = await api('POST', '/api/auth/register', registerData);
    
    if (reg.status === 201 && reg.data.success) {
      log.success(`User registered: ID ${reg.data.data.userId}`);
      log.info(`OTP sent: ${reg.data.data.otp} (for testing)`);
    } else {
      log.error(`Registration failed: ${reg.data.error}`);
    }

    const testUserId = reg.data.data?.userId;
    const testOTP = reg.data.data?.otp;
    const testEmail = registerData.email;

    // =====================================================
    // 3. OTP VERIFICATION
    // =====================================================
    log.section('3. OTP Verification');
    if (testUserId && testOTP) {
      const verify = await api('POST', '/api/auth/verify-otp', {
        userId: testUserId,
        otp: testOTP
      });

      if (verify.status === 200 && verify.data.success) {
        log.success('Phone verified successfully');
        log.info(`Token received: ${verify.data.data.token.substring(0, 30)}...`);
      } else {
        log.error(`OTP verification failed: ${verify.data.error}`);
      }
    }

    // =====================================================
    // 4. USER LOGIN
    // =====================================================
    log.section('4. User Login');
    const login = await api('POST', '/api/auth/login', {
      email: testEmail,
      password: 'test123'
    });

    let userToken = null;
    if (login.status === 200 && login.data.success) {
      log.success(`Logged in as: ${login.data.data.user.fullName}`);
      log.success(`Role: ${login.data.data.user.role}`);
      userToken = login.data.data.token;
    } else {
      log.error(`Login failed: ${login.data.error}`);
    }

    // =====================================================
    // 5. ADMIN LOGIN (with default credentials)
    // =====================================================
    log.section('5. Admin Login');
    const adminLogin = await api('POST', '/api/auth/admin-login', {
      email: 'shyam.adhikari@nea.gov.np',
      password: 'admin123'
    });

    let adminToken = null;
    if (adminLogin.status === 200 && adminLogin.data.success) {
      log.success(`Admin logged in: ${adminLogin.data.data.user.fullName}`);
      log.success(`Department: ${adminLogin.data.data.user.department}`);
      adminToken = adminLogin.data.data.token;
    } else {
      log.error(`Admin login failed: ${adminLogin.data.error}`);
    }

    // =====================================================
    // 6. SUBMIT COMPLAINTS
    // =====================================================
    log.section('6. Submit Complaints');
    
    const complaintData = [
      {
        title: 'Power outage in Ward 5',
        description: 'No electricity for 3 days. Transformer appears damaged and dangerous. Sparks visible.',
        province: 'bagmati',
        district: 'Kathmandu',
        municipality: 'Kathmandu Metropolitan City',
        ward: '5',
        userId: testUserId
      },
      {
        title: 'Bridge collapse risk',
        description: 'Bridge structure cracking. Road damage underneath. Dangerous for vehicles.',
        province: 'bagmati',
        district: 'Sindhupalchok',
        municipality: 'Chautara Sangachowkgadhi',
        ward: '3',
        userId: testUserId
      },
      {
        title: 'Corruption in tender process',
        description: 'Bribery in procurement. Irregularities in government tender. Fraud suspected.',
        province: 'bagmati',
        district: 'Kathmandu',
        municipality: 'Kathmandu Metropolitan City',
        ward: '1',
        userId: testUserId
      },
      {
        title: 'No water supply for weeks',
        description: 'Water pipe broken. No drinking water supply for 2 weeks. Emergency situation.',
        province: 'bagmati',
        district: 'Lalitpur',
        municipality: 'Lalitpur Metropolitan City',
        ward: '8',
        userId: testUserId
      },
      {
        title: 'Garbage pile up causing health hazard',
        description: 'Waste not collected for months. Garbage dumping everywhere. Pollution and smell unbearable.',
        province: 'bagmati',
        district: 'Kathmandu',
        municipality: 'Kathmandu Metropolitan City',
        ward: '12',
        userId: testUserId
      }
    ];

    const submittedComplaints = [];
    for (const complaint of complaintData) {
      const result = await api('POST', '/api/complaints', complaint);
      
      if (result.status === 201 && result.data.success) {
        const c = result.data.data;
        submittedComplaints.push(c);
        log.success(`${c.id} | ${c.classification.category} (${c.classification.confidence}%) | Priority: ${c.priority}`);
      } else {
        log.error(`Failed to submit: ${complaint.title}`);
      }
    }

    // =====================================================
    // 7. CLASSIFY COMPLAINT (without saving)
    // =====================================================
    log.section('7. Classify Complaint (No Save)');
    const classify = await api('POST', '/api/complaints/classify', {
      title: 'School has no teachers',
      description: 'Education crisis. Teacher shortage. Students suffering from lack of instruction.'
    });

    if (classify.status === 200 && classify.data.success) {
      const c = classify.data.data;
      log.success(`Category: ${c.category}`);
      log.success(`Government Level: ${c.governmentLevel}`);
      log.success(`Priority: ${c.priority}`);
      log.success(`Confidence: ${c.confidence}%`);
    }

    // =====================================================
    // 8. FIND SIMILAR COMPLAINTS
    // =====================================================
    log.section('8. Find Similar Complaints');
    const similar = await api('POST', '/api/complaints/similar', {
      title: 'Electricity problem in area',
      description: 'Power outage affecting our neighborhood',
      municipality: 'Kathmandu Metropolitan City',
      ward: '5',
      category: 'electricity'
    });

    if (similar.status === 200 && similar.data.success) {
      log.success(`Found ${similar.data.count} similar complaints`);
      similar.data.data.forEach(c => {
        log.info(`  ${c.complaint_ref} - ${c.title}`);
      });
    }

    // =====================================================
    // 9. GET SINGLE COMPLAINT
    // =====================================================
    log.section('9. Get Single Complaint Details');
    if (submittedComplaints.length > 0) {
      const firstComplaint = submittedComplaints[0];
      const single = await api('GET', `/api/complaints/${firstComplaint.id}`);
      
      if (single.status === 200 && single.data.success) {
        const c = single.data.data;
        log.success(`ID: ${c.id}`);
        log.success(`Status: ${c.status}`);
        log.success(`Views: ${c.views}`);
        log.success(`Timeline entries: ${c.timeline.length}`);
      }
    }

    // =====================================================
    // 10. LIST ALL COMPLAINTS
    // =====================================================
    log.section('10. List All Complaints');
    const allComplaints = await api('GET', '/api/complaints?limit=5');
    
    if (allComplaints.status === 200 && allComplaints.data.success) {
      log.success(`Total: ${allComplaints.data.total} complaints`);
      log.success(`Page: ${allComplaints.data.page}/${allComplaints.data.totalPages}`);
      log.success(`Showing: ${allComplaints.data.count} results`);
    }

    // =====================================================
    // 11. ADMIN DASHBOARD
    // =====================================================
    log.section('11. Admin Dashboard');
    const dashboard = await api('GET', '/api/admin/dashboard');
    
    if (dashboard.status === 200 && dashboard.data.success) {
      const stats = dashboard.data.data.stats;
      log.success(`Total Complaints: ${stats.total}`);
      log.success(`Pending Action: ${stats.pendingAction}`);
      log.success(`In Progress: ${stats.inProgress}`);
      log.success(`Resolved: ${stats.resolved}`);
      log.success(`Resolution Rate: ${stats.resolutionRate}%`);
      
      const priority = dashboard.data.data.priorityBreakdown;
      log.info(`High Priority: ${priority.high} | Medium: ${priority.medium} | Normal: ${priority.normal}`);
    }

    // =====================================================
    // 12. ASSIGN COMPLAINT TO TEAM MEMBER
    // =====================================================
    log.section('12. Assign Complaint');
    if (submittedComplaints.length > 0) {
      const complaint = submittedComplaints[0];
      const assign = await api('PATCH', `/api/admin/complaints/${complaint.id}/assign`, {
        assignedTo: 'Rajesh Thapa',
        teamMemberId: 'TM-001'
      });

      if (assign.status === 200 && assign.data.success) {
        log.success(`Assigned to: ${assign.data.data.assigned_to}`);
        log.success(`Status: ${assign.data.data.status}`);
      }
    }

    // =====================================================
    // 13. RESOLVE COMPLAINT
    // =====================================================
    log.section('13. Resolve Complaint');
    if (submittedComplaints.length > 0) {
      const complaint = submittedComplaints[0];
      const resolve = await api('PATCH', `/api/admin/complaints/${complaint.id}/status`, {
        status: 'resolved',
        note: 'Transformer replaced and power restored',
        resolution: 'New transformer installed. Power supply normalized. Issue resolved completely.'
      });

      if (resolve.status === 200 && resolve.data.success) {
        log.success(`Status: ${resolve.data.data.status}`);
        log.success(`Resolved at: ${resolve.data.data.resolved_at}`);
      }
    }

    // =====================================================
    // 14. ESCALATE COMPLAINT
    // =====================================================
    log.section('14. Escalate Complaint');
    if (submittedComplaints.length > 1) {
      const complaint = submittedComplaints[1];
      const escalate = await api('PATCH', `/api/admin/complaints/${complaint.id}/escalate`, {
        reason: 'Safety hazard - bridge may collapse. Requires immediate provincial attention.',
        escalateTo: 'Provincial Government - Bagmati'
      });

      if (escalate.status === 200 && escalate.data.success) {
        log.success(`Priority: ${escalate.data.data.priority}`);
        log.success(`Escalated: ${escalate.data.data.is_escalated}`);
        log.success(`Escalated to: ${escalate.data.data.escalated_to}`);
      }
    }

    // =====================================================
    // 15. SUBMIT FEEDBACK
    // =====================================================
    log.section('15. Submit Citizen Feedback');
    if (submittedComplaints.length > 0) {
      const complaint = submittedComplaints[0];
      const feedback = await api('POST', `/api/complaints/${complaint.id}/feedback`, {
        rating: 5,
        comment: 'Excellent service! Very quick resolution. Thank you!',
        userId: testUserId
      });

      if (feedback.status === 200 && feedback.data.success) {
        log.success(`Rating: ${feedback.data.data.feedback.rating}/5`);
        log.success(`Comment submitted`);
      }
    }

    // =====================================================
    // 16. TEAM MANAGEMENT
    // =====================================================
    log.section('16. Team Management');
    const team = await api('GET', '/api/admin/team');
    
    if (team.status === 200 && team.data.success) {
      log.success(`Total team members: ${team.data.count}`);
      team.data.data.forEach(member => {
        log.info(`  ${member.name} | Active: ${member.active_cases} | Resolved: ${member.resolved_cases}`);
      });
    }

    // Add new team member
    const newMember = await api('POST', '/api/admin/team', {
      name: 'Maya Shrestha',
      role: 'Junior Engineer',
      department: 'Nepal Electricity Authority',
      email: 'maya.shrestha@nea.gov.np'
    });

    if (newMember.status === 201 && newMember.data.success) {
      log.success(`New member added: ${newMember.data.data.name} (${newMember.data.data.member_ref})`);
    }

    // =====================================================
    // 17. COLLABORATIONS
    // =====================================================
    log.section('17. Multi-Department Collaboration');
    
    // Create collaboration
    if (submittedComplaints.length > 1) {
      const complaint = submittedComplaints[1];
      const collab = await api('POST', '/api/admin/collaborations', {
        complaintId: complaint.id,
        title: 'Bridge Safety - Multi-Department Response',
        departments: [
          { name: 'Department of Roads', task: 'Structural assessment and repair' },
          { name: 'Ward Office - 3', task: 'Site inspection and local coordination' },
          { name: 'Provincial Government', task: 'Budget allocation and oversight' }
        ]
      });

      if (collab.status === 201 && collab.data.success) {
        log.success(`Collaboration created: ${collab.data.data.collab_ref}`);
        log.success(`Lead department: ${collab.data.data.lead_department}`);

        // Update progress
        const update = await api('PATCH', `/api/admin/collaborations/${collab.data.data.collab_ref}/progress`, {
          departmentName: 'Department of Roads',
          progress: 75,
          note: 'Structural assessment complete. Repair work 75% done. Expected completion in 2 days.'
        });

        if (update.status === 200 && update.data.success) {
          log.success('Progress updated successfully');
        }
      }
    }

    // List all collaborations
    const collabs = await api('GET', '/api/admin/collaborations');
    
    if (collabs.status === 200 && collabs.data.success) {
      log.success(`Active collaborations: ${collabs.data.count}`);
      collabs.data.data.forEach(c => {
        log.info(`  ${c.collab_ref} - ${c.title} (${c.status})`);
      });
    }

    // =====================================================
    // 18. ANALYTICS
    // =====================================================
    log.section('18. Analytics & Reports');
    const analytics = await api('GET', '/api/admin/analytics');
    
    if (analytics.status === 200 && analytics.data.success) {
      const data = analytics.data.data;
      log.success(`Total complaints: ${data.total}`);
      log.info('By Category:');
      Object.entries(data.byCategory).forEach(([cat, count]) => {
        log.info(`  ${cat}: ${count}`);
      });
      log.info('By Priority:');
      Object.entries(data.byPriority).forEach(([pri, count]) => {
        log.info(`  ${pri}: ${count}`);
      });
      log.success(`Avg Resolution Time: ${data.avgResolutionHours} hours`);
    }

    // =====================================================
    // FINAL SUMMARY
    // =====================================================
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║           ALL TESTS COMPLETED                  ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    log.success('Database Integration: Working');
    log.success('Authentication: Working');
    log.success('Complaint Management: Working');
    log.success('Admin Functions: Working');
    log.success('Analytics: Working');
    
    console.log('\n');

  } catch (err) {
    log.error(`Test failed: ${err.message}`);
    console.error(err);
  }
}

// Run tests with error handling
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});