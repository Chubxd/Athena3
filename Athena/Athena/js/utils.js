function isUserLoggedIn() {
    return !!localStorage.getItem('athena_token');
}

function getCurrentUser() {
    const userData = localStorage.getItem('athena_user');
    return userData ? JSON.parse(userData) : null;
}

function setUser(user, token) {
    localStorage.setItem('athena_user', JSON.stringify(user));
    localStorage.setItem('athena_token', token);
}

function logout() {
    localStorage.removeItem('athena_token');
    localStorage.removeItem('athena_user');
    window.dispatchEvent(new CustomEvent('userAuthStateChange', { 
        detail: { user: null, isLoggedIn: false } 
    }));
    
    if (!window.location.pathname.includes('athena.html') && !window.location.pathname.endsWith('/')) {
        window.location.href = 'athena.html';
    }
}


function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    

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
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }
            .notification.success { background: #4CAF50; }
            .notification.info { background: #2196F3; }
            .notification.error { background: #f44336; }
            .notification.warning { background: #ff9800; }
            .notification button {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
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

function getBookById(bookId) {
    const allBooks = [
        {
            id: 1,
            title: "Meditations",
            author: "Marcus Aurelius",
            description: "A series of personal writings by the Roman Emperor, outlining his Stoic philosophy and guidance on life.",
            cover: "images/book-covers/meditations.jpg",
            expCost: 500,
            genre: "philosophy"
        },
        {
            id: 2,
            title: "Deep Work",
            author: "Cal Newport",
            description: "Rules for focused success in a distracted world. Learn to master concentration and produce better work.",
            cover: "images/book-covers/deep-work.jpg",
            expCost: 400,
            genre: "self-help"
        },
        {
            id: 3,
            title: "Thinking, Fast and Slow",
            author: "Daniel Kahneman",
            description: "Explore the two systems that drive the way we think—fast, intuitive, and slow, deliberate.",
            cover: "images/book-covers/thinking.jpg",
            expCost: 600,
            genre: "non-fiction"
        }
    ];
    
    return allBooks.find(book => book.id === bookId);
}

function isBookUnlocked(bookId) {
    const user = getCurrentUser();
    return user && user.unlockedBooks && user.unlockedBooks.includes(bookId);
}

function canAffordBook(bookId) {
    const user = getCurrentUser();
    const book = getBookById(bookId);
    return user && book && user.exp >= book.expCost;
}

function unlockBook(bookId) {
    const user = getCurrentUser();
    const book = getBookById(bookId);
    
    if (!user || !book) return false;
    
    if (!user.unlockedBooks) user.unlockedBooks = [];
    if (!user.unlockedBooks.includes(bookId)) {
        user.unlockedBooks.push(bookId);
        user.exp -= book.expCost; 
        localStorage.setItem('athena_user', JSON.stringify(user));
        
        window.dispatchEvent(new CustomEvent('userInventoryUpdate', { 
            detail: { user } 
        }));
        
        return true;
    }
    
    return false;
}

function addToFavorites(bookId) {
    const user = getCurrentUser();
    if (!user) return false;
    
    if (!user.favorites) user.favorites = [];
    if (!user.favorites.includes(bookId)) {
        user.favorites.push(bookId);
        localStorage.setItem('athena_user', JSON.stringify(user));
        return true;
    }
    
    return false;
}

function removeFromFavorites(bookId) {
    const user = getCurrentUser();
    if (!user || !user.favorites) return false;
    
    const initialLength = user.favorites.length;
    user.favorites = user.favorites.filter(id => id !== bookId);
    
    if (user.favorites.length !== initialLength) {
        localStorage.setItem('athena_user', JSON.stringify(user));
        return true;
    }
    
    return false;
}

function isBookFavorited(bookId) {
    const user = getCurrentUser();
    return user && user.favorites && user.favorites.includes(bookId);
}

function addEXP(amount) {
    const user = getCurrentUser();
    if (!user) return false;
    
    user.exp = (user.exp || 0) + amount;
    localStorage.setItem('athena_user', JSON.stringify(user));
    
    window.dispatchEvent(new CustomEvent('userEXPUpdate', { 
        detail: { user, amount } 
    }));
    
    return true;
}

function getEXP() {
    const user = getCurrentUser();
    return user ? user.exp : 0;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    return password && password.length >= 6;
}

function isValidUsername(username) {
    return username && username.length >= 3;
}

function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error writing to localStorage:', error);
        return false;
    }
}

function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

function formatEXP(exp) {
    return exp.toLocaleString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function navigateTo(page) {
    window.location.href = `${page}.html`;
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function initializeApp() {
    const user = getCurrentUser();
    
   
    window.dispatchEvent(new CustomEvent('userAuthStateChange', { 
        detail: { user, isLoggedIn: !!user } 
    }));
    
    initializeTheme();
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('athena_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark');
    }
}

function handleAPIError(error) {
    console.error('API Error:', error);
    
    if (error.status === 401) {
        logout();
        showNotification('Session expired. Please log in again.', 'error');
    } else if (error.status === 403) {
        showNotification('You do not have permission to perform this action.', 'error');
    } else {
        showNotification('Something went wrong. Please try again.', 'error');
    }
}

window.isUserLoggedIn = isUserLoggedIn;
window.getCurrentUser = getCurrentUser;
window.setUser = setUser;
window.logout = logout;
window.showNotification = showNotification;
window.getBookById = getBookById;
window.isBookUnlocked = isBookUnlocked;
window.canAffordBook = canAffordBook;
window.unlockBook = unlockBook;
window.addToFavorites = addToFavorites;
window.removeFromFavorites = removeFromFavorites;
window.isBookFavorited = isBookFavorited;
window.addEXP = addEXP;
window.getEXP = getEXP;
window.isValidEmail = isValidEmail;
window.isValidPassword = isValidPassword;
window.isValidUsername = isValidUsername;
window.getStorageItem = getStorageItem;
window.setStorageItem = setStorageItem;
window.removeStorageItem = removeStorageItem;
window.formatEXP = formatEXP;
window.debounce = debounce;
window.throttle = throttle;
window.navigateTo = navigateTo;
window.getQueryParam = getQueryParam;
window.initializeApp = initializeApp;
window.handleAPIError = handleAPIError;

document.addEventListener('DOMContentLoaded', initializeApp);



