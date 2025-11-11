
function getCurrentUser() {
    try {
        const userData = localStorage.getItem('athena_user');
        if (!userData) return {};
        
        const user = JSON.parse(userData);
        
        if (user && user.id && user.username && user.email) {
            return user;
        }
        return {};
    } catch (error) {
        return {};
    }
}

function isUserLoggedIn() {
    const user = getCurrentUser();
    return !!(user && user.id && user.username);
}

function logout() {
    syncUserData(); 
    localStorage.removeItem('athena_user');
    localStorage.removeItem('athena_token');
    window.dispatchEvent(new CustomEvent('userAuthStateChange', { 
        detail: { isLoggedIn: false } 
    }));
}

function formatEXP(exp) {
    return window.bookDB ? window.bookDB.formatEXP(exp) : exp.toLocaleString();
}

function showNotification(message, type = 'info') {
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-family: 'Poppins', sans-serif;
                z-index: 1001;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 300px;
                animation: slideIn 0.3s ease;
            }
            .notification.success { background: #4CAF50; }
            .notification.info { background: #2196F3; }
            .notification.error { background: #f44336; }
            .notification button {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}


window.getCurrentUser = getCurrentUser;
window.isUserLoggedIn = isUserLoggedIn;
window.logout = logout;
window.formatEXP = formatEXP;
window.showNotification = showNotification;



function isBookFavorited(bookId) {
    const user = getCurrentUser();
    return user.favorites && user.favorites.includes(parseInt(bookId));
}

function addEXP(amount) {
    const user = getCurrentUser();
    user.exp = (user.exp || 0) + amount;
    localStorage.setItem('athena_user', JSON.stringify(user));
    syncUserData(); 
    
    window.dispatchEvent(new CustomEvent('userEXPUpdated', { 
        detail: { newExp: user.exp, added: amount } 
    }));
    
    return user.exp;
}


function addToFavorites(bookId) {
    const user = getCurrentUser();
    if (!user) return;
    
    if (!user.favorites) user.favorites = [];
    if (!user.favorites.includes(bookId)) {
        user.favorites.push(bookId);
        localStorage.setItem('athena_user', JSON.stringify(user));
        syncUserData(); 
    }
    
    if (window.showNotification) {
        window.showNotification('Added to favorites!', 'success');
    }
}

function removeFromFavorites(bookId) {
    const user = getCurrentUser();
    if (!user || !user.favorites) return;
    
    user.favorites = user.favorites.filter(id => id !== bookId);
    localStorage.setItem('athena_user', JSON.stringify(user));
    syncUserData(); 
    
    if (window.showNotification) {
        window.showNotification('Removed from favorites', 'info');
    }
}

function syncUserData() {
    const currentUser = getCurrentUser();
    const registeredUsers = JSON.parse(localStorage.getItem('athena_registered_users')) || [];
    
    if (currentUser.id) {
        const userIndex = registeredUsers.findIndex(user => user.id === currentUser.id);
        if (userIndex !== -1) {
            
            registeredUsers[userIndex] = {
                ...registeredUsers[userIndex],
                exp: currentUser.exp,
                unlockedBooks: currentUser.unlockedBooks,
                favorites: currentUser.favorites,
                readingProgress: currentUser.readingProgress
            };
            localStorage.setItem('athena_registered_users', JSON.stringify(registeredUsers));
        }
    }
}


window.isBookFavorited = isBookFavorited;
window.addEXP = addEXP;
window.addToFavorites = addToFavorites;
window.removeFromFavorites = removeFromFavorites;