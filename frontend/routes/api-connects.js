class NepalPortalAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    // ===== UTILITY =====
    async apiCall(method, endpoint, body = null) {
        try {
            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            };

            if (this.token) {
                options.headers['Authorization'] = `Bearer ${this.token}`;
            }

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`[API Error] ${method} ${endpoint}:`, error.message);
            throw error;
        }
    }

    setAuth(token, user) {
        this.token = token;
        this.currentUser = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // ===== AUTHENTICATION =====
    async registerUser(userData) {
        return await this.apiCall('POST', '/auth/register', {
            fullName: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            citizenship: userData.citizenship,
            password: userData.password,
            province: userData.province,
            district: userData.district,
            municipality: userData.municipality,
            ward: userData.ward,
            houseNumber: userData.houseNumber
        });
    }

    async verifyOTP(userId, otp) {
        const response = await this.apiCall('POST', '/auth/verify-otp', { userId, otp });
        if (response.success && response.data.token) {
            this.setAuth(response.data.token, response.data.user);
        }
        return response;
    }

    async loginUser(email, password) {
        const response = await this.apiCall('POST', '/auth/login', { email, password });
        if (response.success && response.data.token) {
            this.setAuth(response.data.token, response.data.user);
        }
        return response;
    }

    async loginAdmin(email, password) {
        const response = await this.apiCall('POST', '/auth/admin-login', { email, password });
        if (response.success && response.data.token) {
            this.setAuth(response.data.token, response.data.user);
        }
        return response;
    }

    async logout() {
        try {
            await this.apiCall('POST', '/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
        }
    }

    // ===== COMPLAINTS =====
    async submitComplaint(data) {
        return await this.apiCall('POST', '/complaints', {
            title: data.title,
            description: data.description,
            province: data.province,
            district: data.district,
            municipality: data.municipality,
            ward: data.ward,
            imageUrl: data.imageUrl,
            userId: this.currentUser?.id
        });
    }

    async getComplaints(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) params.append(key, filters[key]);
        });
        const queryString = params.toString();
        return await this.apiCall('GET', `/complaints${queryString ? '?' + queryString : ''}`);
    }

    async getComplaintById(complaintRef) {
        return await this.apiCall('GET', `/complaints/${complaintRef}`);
    }

    // ===== VOTING =====
    async voteComplaint(complaintId, voteType) {
        return await this.apiCall('POST', '/complaints/vote', {
            complaintId,
            userId: this.currentUser?.id,
            voteType
        });
    }

    async removeVote(complaintId) {
        return await this.apiCall('DELETE', '/complaints/vote', {
            complaintId,
            userId: this.currentUser?.id
        });
    }

    async getUserVote(complaintId) {
        return await this.apiCall('GET', `/complaints/${complaintId}/vote?userId=${this.currentUser?.id}`);
    }

    // ===== DASHBOARD =====
    async getHighestUpvoted(limit = 20, offset = 0) {
        return await this.apiCall('GET', `/dashboard/highest-upvote?limit=${limit}&offset=${offset}`);
    }

    async getNewestFirst(limit = 20, offset = 0) {
        return await this.apiCall('GET', `/dashboard/newest-first?limit=${limit}&offset=${offset}`);
    }

    // ===== HELPERS =====
    formatTimeAgo(dateString) {
        const now = new Date();
        const then = new Date(dateString);
        const seconds = Math.floor((now - then) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
        return then.toLocaleDateString();
    }
}

// Create global instance
const api = new NepalPortalAPI();
window.api = api;