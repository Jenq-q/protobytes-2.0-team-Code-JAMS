-- =================================
-- USERS
-- =================================
CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(70) NOT NULL,
    phone_no VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    citizenship VARCHAR(30) UNIQUE NOT NULL,
    home_no INT NOT NULL,
    permanent_province VARCHAR(150) NOT NULL,
    permanent_district VARCHAR(150) NOT NULL,
    permanent_municipality VARCHAR(150) NOT NULL,
    permanent_ward VARCHAR(150) NOT NULL,
    temporary_province VARCHAR(150),
    temporary_district VARCHAR(150),
    temporary_municipality VARCHAR(150),
    temporary_ward VARCHAR(150),
    nid VARCHAR(30) UNIQUE,
    created_at DATE DEFAULT CURRENT_DATE
);

-- =================================
-- ADMINS (Independent)
-- =================================
CREATE TABLE admins (
    admin_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(70) NOT NULL,
    citizenship VARCHAR(30) UNIQUE NOT NULL,  -- login field
    password VARCHAR(255) NOT NULL,           -- login field
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- COMPLAINTS / POSTS
-- =================================
CREATE TABLE complaints (
    complain_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    complain_msg TEXT NOT NULL,
    img_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =================================
-- MINISTRIES
-- =================================
CREATE TABLE ministries (
    ministry_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ministry_name VARCHAR(150) UNIQUE NOT NULL
);

-- =================================
-- DEPARTMENTS
-- =================================
CREATE TABLE departments (
    department_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_name VARCHAR(150) UNIQUE NOT NULL
);

-- =================================
-- COMPLAINT ↔ MINISTRY (MANY-TO-MANY)
-- =================================
CREATE TABLE complaint_ministries (
    complain_id INT,
    ministry_id INT,
    PRIMARY KEY (complain_id, ministry_id),
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE,
    FOREIGN KEY (ministry_id) REFERENCES ministries(ministry_id) ON DELETE CASCADE
);

-- =================================
-- COMPLAINT ↔ DEPARTMENT (MANY-TO-MANY)
-- =================================
CREATE TABLE complaint_departments (
    complain_id INT,
    department_id INT,
    PRIMARY KEY (complain_id, department_id),
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
);

-- =================================
-- VOTES (THUMBS UP / THUMBS DOWN)
-- vote_type: 1 = upvote, -1 = downvote
-- =================================
CREATE TABLE votes (
    vote_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    complain_id INT NOT NULL,
    user_id INT NOT NULL,
    vote_type SMALLINT NOT NULL,  -- 1 = upvote, -1 = downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (complain_id, user_id),  -- prevent double voting
    FOREIGN KEY (complain_id) REFERENCES complaints(complain_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,

    CHECK (vote_type IN (1, -1))
);

-- =================================
-- INDEXES FOR PERFORMANCE
-- =================================
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_votes_complain_id ON votes(complain_id);
CREATE INDEX idx_complaint_ministries_complain_id ON complaint_ministries(complain_id);
CREATE INDEX idx_complaint_departments_complain_id ON complaint_departments(complain_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
