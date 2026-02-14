-- =================================
-- ENHANCED DATABASE SCHEMA
-- Nepal Citizen Service Portal
-- =================================

-- Enable UUID extension (optional, for better ID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================
-- USERS TABLE (Citizens)
-- =================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(70) NOT NULL,
    full_name_nepali VARCHAR(100),
    phone_no VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    citizenship VARCHAR(30) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
    
    -- Address fields
    home_no VARCHAR(20),
    permanent_province VARCHAR(150) NOT NULL,
    permanent_district VARCHAR(150) NOT NULL,
    permanent_municipality VARCHAR(150) NOT NULL,
    permanent_ward VARCHAR(10) NOT NULL,
    temporary_province VARCHAR(150),
    temporary_district VARCHAR(150),
    temporary_municipality VARCHAR(150),
    temporary_ward VARCHAR(10),
    
    nid VARCHAR(30) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- ADMINS TABLE (Department Officials)
-- =================================
CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    full_name VARCHAR(70) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_no VARCHAR(15) UNIQUE,
    citizenship VARCHAR(30) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(150),
    designation VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- SESSIONS TABLE (For authentication)
-- =================================
CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT,
    admin_id INT,
    token VARCHAR(500) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('citizen', 'admin')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE,
    CHECK ((user_id IS NOT NULL AND admin_id IS NULL) OR (user_id IS NULL AND admin_id IS NOT NULL))
);

-- =================================
-- COMPLAINTS TABLE (Enhanced)
-- =================================
CREATE TABLE complaints (
    complain_id SERIAL PRIMARY KEY,
    complaint_ref VARCHAR(50) UNIQUE NOT NULL, -- CPL-2025-XXXX format
    user_id INT NOT NULL,
    
    -- Complaint details
    title VARCHAR(255) NOT NULL,
    complain_msg TEXT NOT NULL,
    img_url VARCHAR(255),
    
    -- Location
    province VARCHAR(150),
    district VARCHAR(150),
    municipality VARCHAR(150),
    ward VARCHAR(10),
    
    -- Classification (AI/Manual)
    category VARCHAR(100),
    sub_category VARCHAR(100),
    government_level VARCHAR(50), -- federal, provincial, local
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL')),
    confidence_score INT, -- AI classification confidence
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'pending', 'in-progress', 'resolved', 'rejected', 'escalated')),
    assigned_to VARCHAR(100),
    assigned_team_member_id INT,
    
    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMP,
    
    -- Escalation
    is_escalated BOOLEAN DEFAULT FALSE,
    escalated_to VARCHAR(150),
    escalation_reason TEXT,
    
    -- Metadata
    upvote_count INT DEFAULT 0,
    downvote_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_team_member_id) REFERENCES admins(admin_id) ON DELETE SET NULL
);

-- =================================
-- COMPLAINT TIMELINE (Activity Log)
-- =================================
CREATE TABLE complaint_timeline (
    timeline_id SERIAL PRIMARY KEY,
    complain_id INT NOT NULL,
    step VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    performed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE
);

-- =================================
-- MINISTRIES
-- =================================
CREATE TABLE ministries (
    ministry_id SERIAL PRIMARY KEY,
    ministry_name VARCHAR(150) UNIQUE NOT NULL,
    ministry_name_nepali VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- DEPARTMENTS
-- =================================
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(150) UNIQUE NOT NULL,
    department_name_nepali VARCHAR(200),
    ministry_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ministry_id) REFERENCES ministries(ministry_id) ON DELETE SET NULL
);

-- =================================
-- COMPLAINT → MINISTRY (MANY-TO-MANY)
-- =================================
CREATE TABLE complaint_ministries (
    complain_id INT,
    ministry_id INT,
    PRIMARY KEY (complain_id, ministry_id),
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE,
    FOREIGN KEY (ministry_id) REFERENCES ministries(ministry_id) ON DELETE CASCADE
);

-- =================================
-- COMPLAINT → DEPARTMENT (MANY-TO-MANY)
-- =================================
CREATE TABLE complaint_departments (
    complain_id INT,
    department_id INT,
    PRIMARY KEY (complain_id, department_id),
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
);

-- =================================
-- VOTES (Enhanced with user tracking)
-- =================================
CREATE TABLE votes (
    vote_id SERIAL PRIMARY KEY,
    complain_id INT NOT NULL,
    user_id INT NOT NULL,
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (1, -1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (complain_id, user_id),
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =================================
-- TEAM MEMBERS (For Admin Dashboard)
-- =================================
CREATE TABLE team_members (
    team_id SERIAL PRIMARY KEY,
    member_ref VARCHAR(50) UNIQUE NOT NULL, -- TM-XXX format
    admin_id INT UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    department VARCHAR(150),
    email VARCHAR(150),
    active_cases INT DEFAULT 0,
    resolved_cases INT DEFAULT 0,
    success_rate INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE SET NULL
);

-- =================================
-- COLLABORATIONS (Multi-department)
-- =================================
CREATE TABLE collaborations (
    collab_id SERIAL PRIMARY KEY,
    collab_ref VARCHAR(50) UNIQUE NOT NULL, -- COLLAB-XXX format
    complain_id INT NOT NULL,
    title VARCHAR(255),
    lead_department VARCHAR(150),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE
);

-- =================================
-- COLLABORATION DEPARTMENTS
-- =================================
CREATE TABLE collaboration_departments (
    id SERIAL PRIMARY KEY,
    collab_id INT NOT NULL,
    department_name VARCHAR(150) NOT NULL,
    task VARCHAR(255),
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (collab_id) REFERENCES collaborations(collab_id) ON DELETE CASCADE
);

-- =================================
-- COLLABORATION UPDATES
-- =================================
CREATE TABLE collaboration_updates (
    update_id SERIAL PRIMARY KEY,
    collab_id INT NOT NULL,
    department_name VARCHAR(150),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (collab_id) REFERENCES collaborations(collab_id) ON DELETE CASCADE
);

-- =================================
-- FEEDBACK (Citizen satisfaction)
-- =================================
CREATE TABLE feedback (
    feedback_id SERIAL PRIMARY KEY,
    complain_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =================================
-- INDEXES FOR PERFORMANCE
-- =================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_citizenship ON users(citizenship);
CREATE INDEX idx_users_phone ON users(phone_no);

-- Admins
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_citizenship ON admins(citizenship);

-- Sessions
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_admin_id ON sessions(admin_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Complaints
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_ref ON complaints(complaint_ref);
CREATE INDEX idx_complaints_location ON complaints(district, municipality, ward);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_team_member_id);

-- Timeline
CREATE INDEX idx_timeline_complain_id ON complaint_timeline(complain_id);
CREATE INDEX idx_timeline_created_at ON complaint_timeline(created_at);

-- Votes
CREATE INDEX idx_votes_complain_id ON votes(complain_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- Complaint associations
CREATE INDEX idx_complaint_ministries_complain_id ON complaint_ministries(complain_id);
CREATE INDEX idx_complaint_departments_complain_id ON complaint_departments(complain_id);

-- Collaborations
CREATE INDEX idx_collaborations_complain_id ON collaborations(complain_id);
CREATE INDEX idx_collaborations_status ON collaborations(status);

-- =================================
-- FUNCTIONS AND TRIGGERS
-- =================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_complaint_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE complaints
        SET 
            upvote_count = (SELECT COUNT(*) FROM votes WHERE complain_id = NEW.complain_id AND vote_type = 1),
            downvote_count = (SELECT COUNT(*) FROM votes WHERE complain_id = NEW.complain_id AND vote_type = -1)
        WHERE complain_id = NEW.complain_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE complaints
        SET 
            upvote_count = (SELECT COUNT(*) FROM votes WHERE complain_id = OLD.complain_id AND vote_type = 1),
            downvote_count = (SELECT COUNT(*) FROM votes WHERE complain_id = OLD.complain_id AND vote_type = -1)
        WHERE complain_id = OLD.complain_id;
        RETURN OLD;
    END IF;
END;
$$ language 'plpgsql';

-- Apply vote count trigger
CREATE TRIGGER update_vote_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_complaint_vote_counts();

-- =================================
-- SEED DATA
-- =================================

-- Insert sample ministries
INSERT INTO ministries (ministry_name) VALUES
    ('Ministry of Home Affairs'),
    ('Ministry of Energy, Water Resources and Irrigation'),
    ('Ministry of Physical Infrastructure and Transport'),
    ('Ministry of Education, Science and Technology'),
    ('Ministry of Health and Population'),
    ('Ministry of Agriculture and Livestock Development')
ON CONFLICT (ministry_name) DO NOTHING;

-- Insert sample departments
INSERT INTO departments (department_name) VALUES
    ('Nepal Electricity Authority'),
    ('Department of Roads'),
    ('Department of Water Supply and Sewerage'),
    ('Department of Education'),
    ('Metropolitan Police'),
    ('Ward Office')
ON CONFLICT (department_name) DO NOTHING;

-- Insert default admin user
INSERT INTO admins (full_name, email, citizenship, password, department, designation)
VALUES (
    'Shyam Kumar Adhikari',
    'shyam.adhikari@nea.gov.np',
    'ADMIN-001',
    '$2b$10$xHzN8vhNJ6V1XYP7xKR7Q.YJ1w0VxGQxF3QZJ1KP3nN0O7D1YJ2Hy', -- admin123 hashed
    'Nepal Electricity Authority',
    'Department Admin'
)
ON CONFLICT (email) DO NOTHING;

-- Insert default citizen user
INSERT INTO users (
    full_name, full_name_nepali, email, phone_no, citizenship, password,
    permanent_province, permanent_district, permanent_municipality, permanent_ward
)
VALUES (
    'Ram Bahadur Sharma',
    'राम बहादुर शर्मा',
    'ram.sharma@example.com',
    '+977-9841234567',
    '01-01-12-34567',
    '$2b$10$xHzN8vhNJ6V1XYP7xKR7Q.YJ1w0VxGQxF3QZJ1KP3nN0O7D1YJ2Hy', -- password123 hashed
    'bagmati',
    'Kathmandu',
    'Kathmandu Metropolitan City',
    '5'
)
ON CONFLICT (email) DO NOTHING;

-- Insert team members
INSERT INTO team_members (member_ref, name, role, department, email, active_cases, resolved_cases, success_rate)
VALUES
    ('TM-001', 'Rajesh Thapa', 'Senior Engineer', 'Nepal Electricity Authority', 'rajesh.thapa@nea.gov.np', 15, 42, 87),
    ('TM-002', 'Sita Karki', 'Technical Officer', 'Nepal Electricity Authority', 'sita.karki@nea.gov.np', 12, 38, 91),
    ('TM-003', 'Bikash Gurung', 'Field Inspector', 'Nepal Electricity Authority', 'bikash.gurung@nea.gov.np', 8, 25, 84)
ON CONFLICT (member_ref) DO NOTHING;