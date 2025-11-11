document.addEventListener("DOMContentLoaded", () => {
    
    if (!isUserLoggedIn()) {
        window.location.href = 'athena.html';
        return;
    }
    
    
});

class AccountPage {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        
        if (!isUserLoggedIn()) {
            window.location.href = 'athena.html';
            return;
        }

        this.currentUser = getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'athena.html';
            return;
        }

        this.loadUserData();
        this.setupEventListeners();
    }

    
    loadUserData() {
        document.getElementById('profile-username').textContent = this.currentUser.username || 'User';
        document.getElementById('profile-email').textContent = this.currentUser.email || 'No email';
        
        const exp = this.currentUser.exp || 0;
        document.getElementById('user-exp').textContent = formatEXP ? formatEXP(exp) : exp.toLocaleString();
        
        const readingProgress = this.currentUser.readingProgress || {};
        const booksRead = Object.keys(readingProgress).length;
        document.getElementById('books-read').textContent = booksRead;
        
        const favorites = this.currentUser.favorites || [];
        document.getElementById('favorites-count').textContent = favorites.length;
        
        document.getElementById('setting-username').textContent = this.currentUser.username || '-';
        document.getElementById('setting-email').textContent = this.currentUser.email || '-';

        const isDark = document.body.classList.contains('dark');
        document.getElementById('current-theme').textContent = isDark ? 'Dark Mode' : 'Light Mode';

        this.loadReadingProgress();

        this.loadFavorites();
    }

    loadReadingProgress() {
    const progressList = document.getElementById('reading-progress-list');
    const readingProgress = this.currentUser.readingProgress || {};
    
    if (Object.keys(readingProgress).length === 0) {
        progressList.innerHTML = '<p class="empty-state">No reading progress yet. Start reading a book!</p>';
        return;
    }
    
    progressList.innerHTML = '';
    
    Object.entries(readingProgress).forEach(([bookId, progress]) => {
        const book = window.bookDB ? window.bookDB.getBookById(parseInt(bookId)) : null;
        if (!book) return;
        
        const percentage = Math.round((progress.currentPage / progress.totalPages) * 100);
        
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" 
                 onerror="this.src='https:
            <div class="progress-item-info">
                <h3>${book.title}</h3>
                <p>by ${book.author}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                    <span>Page ${progress.currentPage} of ${progress.totalPages}</span>
                    <span class="progress-percentage">${percentage}%</span>
                </div>
            </div>
        `;
        
        progressItem.addEventListener('click', () => {
            window.location.href = `reader.html?book=${bookId}`;
        });
        
        progressList.appendChild(progressItem);
    });
}


    loadFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    const favorites = this.currentUser.favorites || [];
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-state">No favorite books yet. Add some books to your favorites!</p>';
        return;
    }
    
    favoritesList.innerHTML = '';
    
    favorites.forEach(bookId => {
        const book = window.bookDB ? window.bookDB.getBookById(bookId) : null;
        if (!book) return;
        
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <button class="remove-favorite" data-book-id="${bookId}" title="Remove from favorites">
                <i class='bx bx-x'></i>
            </button>
            <img src="${book.cover}" alt="${book.title}"
                 onerror="this.src='https:
            <div class="favorite-item-info">
                <h4>${book.title}</h4>
                <p>by ${book.author}</p>
            </div>
        `;
        
        favoriteItem.querySelector('img').addEventListener('click', () => {
            window.location.href = `reader.html?book=${bookId}`;
        });
        
        const removeBtn = favoriteItem.querySelector('.remove-favorite');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFavorite(bookId);
        });
        
        favoritesList.appendChild(favoriteItem);
    });
}

    removeFavorite(bookId) {
        if (!this.currentUser.favorites) {
            this.currentUser.favorites = [];
        }
        
        this.currentUser.favorites = this.currentUser.favorites.filter(id => id !== bookId);
        localStorage.setItem('athena_user', JSON.stringify(this.currentUser));
        
        if (window.showNotification) {
            showNotification('Removed from favorites', 'info');
        }
        
        this.loadFavorites();
        this.loadUserData(); 
    }

    
    setupEventListeners() {
        document.getElementById('edit-username-btn').addEventListener('click', () => {
            this.openModal('edit-username-modal');
            document.getElementById('new-username').value = this.currentUser.username || '';
        });
        
        document.getElementById('edit-username-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUsername();
        });
        
        document.getElementById('cancel-username-btn').addEventListener('click', () => {
            this.closeModal('edit-username-modal');
        });
        
        document.getElementById('edit-email-btn').addEventListener('click', () => {
            this.openModal('edit-email-modal');
            document.getElementById('new-email').value = this.currentUser.email || '';
        });
        
        document.getElementById('edit-email-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateEmail();
        });
        
        document.getElementById('cancel-email-btn').addEventListener('click', () => {
            this.closeModal('edit-email-modal');
        });
        
        document.getElementById('change-password-btn').addEventListener('click', () => {
            this.openModal('change-password-modal');
        });
        
        document.getElementById('change-password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
        
        document.getElementById('cancel-password-btn').addEventListener('click', () => {
            this.closeModal('change-password-modal');
        });
        
        document.getElementById('toggle-theme-btn').addEventListener('click', () => {
            toggleTheme(); 
    
            
            const isDark = document.body.classList.contains('dark');
            document.getElementById('current-theme').textContent = isDark ? 'Dark Mode' : 'Light Mode';
        });

        window.addEventListener('themeChanged', (e) => {
        const isDark = e.detail.isDark;
        document.getElementById('current-theme').textContent = isDark ? 'Dark Mode' : 'Light Mode';
        });
    
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                logout();
                window.location.href = 'athena.html';
            }
        });
        
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';

            modal.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
            });
        }
    }

    updateUsername() {
        const newUsername = document.getElementById('new-username').value.trim();
        const errorEl = document.getElementById('username-error');
        
        if (!newUsername) {
            errorEl.textContent = 'Username is required';
            return;
        }
        
        if (newUsername.length < 3) {
            errorEl.textContent = 'Username must be at least 3 characters';
            return;
        }
        
        this.currentUser.username = newUsername;
        localStorage.setItem('athena_user', JSON.stringify(this.currentUser));
        
        if (window.showNotification) {
            showNotification('Username updated successfully!', 'success');
        }
        
        this.loadUserData();
        this.closeModal('edit-username-modal');
    }

    updateEmail() {
        const newEmail = document.getElementById('new-email').value.trim();
        const errorEl = document.getElementById('email-error');
        
        if (!newEmail) {
            errorEl.textContent = 'Email is required';
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            errorEl.textContent = 'Please enter a valid email';
            return;
        }
        
        this.currentUser.email = newEmail;
        localStorage.setItem('athena_user', JSON.stringify(this.currentUser));
        
        if (window.showNotification) {
            showNotification('Email updated successfully!', 'success');
        }
        
        this.loadUserData();
        this.closeModal('edit-email-modal');
    }

    

    changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        const errorEl = document.getElementById('password-error');
        
        if (!currentPassword) {
            errorEl.textContent = 'Current password is required';
            return;
        }
        
        if (!newPassword) {
            errorEl.textContent = 'New password is required';
            return;
        }
        
        if (newPassword.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match';
            return;
        }
        
        
        if (window.showNotification) {
            showNotification('Password changed successfully!', 'success');
        }
        
        document.getElementById('change-password-form').reset();
        this.closeModal('change-password-modal');
    }

    

    
}


document.addEventListener('DOMContentLoaded', () => {
    window.accountPage = new AccountPage();
});

