// Auth Modal Functionality
class AuthModal {
    constructor() {
        this.modal = document.getElementById('auth-modal');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.authTabs = document.querySelectorAll('.auth-tab');
        this.closeBtn = document.querySelector('.close-auth-modal');
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        this.closeBtn.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.close();
            }
        });
    }

    switchTab(tab) {
        this.authTabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');

        this.clearErrors();
    }

    open(initialTab = 'login') {
        this.switchTab(initialTab);
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; 
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.clearForms();
        this.clearErrors();
    }

    clearForms() {
        this.loginForm.reset();
        this.registerForm.reset();
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
        document.querySelectorAll('input').forEach(input => {
            input.classList.remove('error');
        });
    }

    showError(inputId, message) {
        const input = document.getElementById(inputId);
        const errorElement = document.getElementById(`${inputId}-error`);
        
        input.classList.add('error');
        errorElement.textContent = message;
    }

    async handleLogin(e) {
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(this.loginForm);
        const username = formData.get('username').trim();
        const password = formData.get('password');

        if (!username) {
            this.showError('login-username', 'Username or email is required');
            return;
        }

        if (!password) {
            this.showError('login-password', 'Password is required');
            return;
        }

        try {
            const user = await this.mockLoginAPI(username, password);
            this.onLoginSuccess(user);
        } catch (error) {
            this.showError('login-password', error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(this.registerForm);
        const username = formData.get('username').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const terms = formData.get('terms');

        if (!username) {
            this.showError('register-username', 'Username is required');
            return;
        }

        if (username.length < 3) {
            this.showError('register-username', 'Username must be at least 3 characters');
            return;
        }

        if (!email) {
            this.showError('register-email', 'Email is required');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('register-email', 'Please enter a valid email');
            return;
        }

        if (!password) {
            this.showError('register-password', 'Password is required');
            return;
        }

        if (password.length < 6) {
            this.showError('register-password', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('register-confirm-password', 'Passwords do not match');
            return;
        }

        if (!terms) {
            this.showError('register-confirm-password', 'You must agree to the terms');
            return;
        }

        try {
            const user = await this.mockRegisterAPI({ username, email, password });
            this.onRegisterSuccess(user);
        } catch (error) {
            this.showError('register-username', error.message);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async mockLoginAPI(username, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {

                if (username && password) {
                    resolve({
                        id: 1,
                        username: username,
                        email: 'user@example.com',
                        exp: 1250,
                        unlockedBooks: [2]
                    });
                } else {
                    reject(new Error('Invalid username or password'));
                }
            }, 1000);
        });
    }

    async mockRegisterAPI(userData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {

                if (userData.username && userData.email && userData.password) {
                    resolve({
                        id: 1,
                        username: userData.username,
                        email: userData.email,
                        exp: 100, 
                        unlockedBooks: []
                    });
                } else {
                    reject(new Error('Registration failed'));
                }
            }, 1000);
        });
    }

    onLoginSuccess(user) {
        localStorage.setItem('athena_user', JSON.stringify(user));
        localStorage.setItem('athena_token', 'mock_jwt_token');
        
        this.showNotification('Login successful!', 'success');
        
        this.close();
        
        this.updateUIAfterAuth(user);
    }

    onRegisterSuccess(user) {
        localStorage.setItem('athena_user', JSON.stringify(user));
        localStorage.setItem('athena_token', 'mock_jwt_token');
        
        this.showNotification('Account created successfully!', 'success');
        
        this.close();

        this.updateUIAfterAuth(user);
    }

    updateUIAfterAuth(user) {
        console.log('User logged in:', user);
        
        window.dispatchEvent(new CustomEvent('userAuthStateChange', { 
            detail: { user, isLoggedIn: true } 
        }));
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.authModal = new AuthModal();
});

function isUserLoggedIn() {
    return !!localStorage.getItem('athena_token');
}

function getCurrentUser() {
    const userData = localStorage.getItem('athena_user');
    return userData ? JSON.parse(userData) : null;
}

function logout() {
    localStorage.removeItem('athena_token');
    localStorage.removeItem('athena_user');
    window.dispatchEvent(new CustomEvent('userAuthStateChange', { 
        detail: { user: null, isLoggedIn: false } 
    }));
}