class AuthModal {
    constructor() {
        this.modal = document.getElementById('auth-modal');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.authTabs = document.querySelectorAll('.auth-tab');
        this.closeBtn = document.querySelector('.close-auth-modal');
        
        this.users = this.getStoredUsers(); 
        this.initEventListeners();
        this.initSocialAuth();
    }

    initSocialAuth() {
        const googleBtn = document.querySelector('.google-btn');
        const githubBtn = document.querySelector('.github-btn');
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.signInWithGoogle());
        }
        
        if (githubBtn) {
            githubBtn.addEventListener('click', () => this.signInWithGitHub());
        }
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            await this.handleSocialLogin(user, 'google');
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showNotification('Google sign-in failed. Please try again.', 'error');
        }
    }

    async signInWithGitHub() {
        try {
            const provider = new firebase.auth.GithubAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            await this.handleSocialLogin(user, 'github');
        } catch (error) {
            console.error('GitHub sign-in error:', error);
            this.showNotification('GitHub sign-in failed. Please try again.', 'error');
        }
    }

    async handleSocialLogin(firebaseUser, provider) {
        try {
            // Check if user already exists in our system
            let existingUser = this.findUserByEmail(firebaseUser.email);
            
            if (existingUser) {
                // User exists - log them in
                this.onLoginSuccess(existingUser);
            } else {
                // New user - create account
                const freeBooks = window.bookDB ? window.bookDB.getFreeBooks() : [];
                const freeBookIds = freeBooks.map(book => book.id);
                
                const newUser = {
                    id: Date.now(),
                    username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    email: firebaseUser.email,
                    provider: provider,
                    firebaseUid: firebaseUser.uid,
                    exp: 1000,
                    unlockedBooks: freeBookIds,
                    favorites: [],
                    readingProgress: {},
                    createdAt: new Date().toISOString()
                };
                
                // Add to users array and save
                this.users.push(newUser);
                this.saveUsers(this.users);
                
                // Create session user
                const sessionUser = {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    exp: newUser.exp,
                    unlockedBooks: newUser.unlockedBooks,
                    favorites: newUser.favorites,
                    readingProgress: newUser.readingProgress
                };
                
                this.onRegisterSuccess(sessionUser);
            }
        } catch (error) {
            console.error('Social login handling error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }
    
    findUserByEmail(email) {
        return this.users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    
    getStoredUsers() {
        return JSON.parse(localStorage.getItem('athena_registered_users')) || [];
    }

    
    saveUsers(users) {
        localStorage.setItem('athena_registered_users', JSON.stringify(users));
    }

    
    isUserExists(username, email) {
        return this.users.some(user => 
            user.username.toLowerCase() === username.toLowerCase() || 
            user.email.toLowerCase() === email.toLowerCase()
        );
    }

    
    findUser(identifier, password) {
        return this.users.find(user => 
            (user.username.toLowerCase() === identifier.toLowerCase() || 
             user.email.toLowerCase() === identifier.toLowerCase()) &&
            user.password === password
        );
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
            const user = await this.authenticateUser(username, password);
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

        
        if (this.isUserExists(username, email)) {
            this.showError('register-username', 'Username or email already exists');
            return;
        }

        try {
            const user = await this.registerUser({ username, email, password });
            this.onRegisterSuccess(user);
        } catch (error) {
            this.showError('register-username', error.message);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async authenticateUser(identifier, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const storedUser = this.findUser(identifier, password);
            
            if (storedUser) {
                
                const currentSession = JSON.parse(localStorage.getItem('athena_user') || '{}');
                
                
                const sessionUser = {
                    id: storedUser.id,
                    username: storedUser.username,
                    email: storedUser.email,
                    exp: storedUser.exp || 1000,
                    unlockedBooks: storedUser.unlockedBooks || [],
                    favorites: storedUser.favorites || [],
                    readingProgress: storedUser.readingProgress || {},
                    
                    ...currentSession
                };
                
                
                this.updateStoredUser(storedUser.id, sessionUser);
                
                resolve(sessionUser);
            } else {
                reject(new Error('Invalid username/email or password'));
            }
        }, 1000);
    });
}


updateStoredUser(userId, newData) {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
        
        this.users[userIndex] = {
            ...this.users[userIndex],
            exp: newData.exp,
            unlockedBooks: newData.unlockedBooks,
            favorites: newData.favorites,
            readingProgress: newData.readingProgress
        };
        this.saveUsers(this.users);
    }
}

    async registerUser(userData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    
                    const freeBooks = window.bookDB ? window.bookDB.getFreeBooks() : [];
                    const freeBookIds = freeBooks.map(book => book.id);
                    
                    const newUser = {
                        id: Date.now(),
                        username: userData.username,
                        email: userData.email,
                        password: userData.password,
                        exp: 1000,
                        unlockedBooks: freeBookIds,
                        favorites: [],
                        readingProgress: {},
                        createdAt: new Date().toISOString()
                    };
                    
                    
                    this.users.push(newUser);
                    this.saveUsers(this.users);
                    
                    
                    const sessionUser = {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email,
                        exp: newUser.exp,
                        unlockedBooks: newUser.unlockedBooks,
                        favorites: newUser.favorites,
                        readingProgress: newUser.readingProgress
                    };
                    
                    resolve(sessionUser);
                } catch (error) {
                    reject(new Error('Registration failed. Please try again.'));
                }
            }, 1000);
        });
    }

    onLoginSuccess(user) {
    
    this.updateStoredUser(user.id, user);
    
    localStorage.setItem('athena_user', JSON.stringify(user));
    
    this.showNotification('Login successful!', 'success');
    
    this.close();
    
    this.updateUIAfterAuth(user);
}

    onRegisterSuccess(user) {
    
    localStorage.setItem('athena_user', JSON.stringify(user));
    
    this.showNotification('Account created successfully!', 'success');
    
    this.close();

    this.updateUIAfterAuth(user);
}

    updateUIAfterAuth(user) {
        console.log('User logged in:', user);
        
        
        const pendingBook = localStorage.getItem('pending_book');
        if (pendingBook) {
            console.log('Found pending book:', pendingBook);
            setTimeout(() => {
                window.location.href = `reader.html?book=${pendingBook}`;
            }, 500);
            localStorage.removeItem('pending_book');
        }
        
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