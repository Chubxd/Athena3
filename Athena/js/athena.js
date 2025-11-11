let intro = document.querySelector('.intro');
let logo = document.querySelector('.logo-header');
let logospans = document.querySelectorAll('.logo');
let tagline = document.querySelector('.tagline');

window.addEventListener("DOMContentLoaded", () => {
    
    const hasSeenIntro = localStorage.getItem('athena_has_seen_intro');
    
    if (!hasSeenIntro) {
        
        document.body.classList.add("loading");
        showIntroAnimation();
        
        
        localStorage.setItem('athena_has_seen_intro', 'true');
    } else {
        
        skipIntroAnimation();
    }
});

function showIntroAnimation() {
    const intro = document.querySelector(".intro");
    const logoSpans = document.querySelectorAll(".logo");
    const tagline = document.querySelector(".tagline");

    setTimeout(() => {
        logoSpans.forEach((span, idx) => {
            setTimeout(() => {
                span.classList.add("active");
            }, (idx + 1) * 200);
        });
    }, 500);

    setTimeout(() => {
        tagline.classList.add("active");
    }, 1200);

    setTimeout(() => {
        logoSpans.forEach((span, idx) => {
            setTimeout(() => {
                span.classList.remove("active");
                span.classList.add("fade");
            }, (idx + 1) * 50);
        });
        tagline.classList.add("fade");
    }, 2500);

    setTimeout(() => {
        intro.classList.add("fade-out");
        document.body.classList.remove("loading");
        
        
        setTimeout(() => {
            initHomePage();
        }, 500);
    }, 3500);
}

function skipIntroAnimation() {
    const intro = document.querySelector(".intro");
    
    
    if (intro) {
        intro.style.display = 'none';
    }
    
    
    document.body.classList.remove("loading");
    
    
    initHomePage();
}

function initHomePage() {
    loadKidsBooks();
    loadFeaturedBooks();
    setupBookEventListeners();
    checkUserState();
}

function loadFeaturedBooks() {
    const recommendationsContainer = document.querySelector('.recommendations');
    
    if (!recommendationsContainer) return;
    
    recommendationsContainer.innerHTML = '';
    
    
    const featuredBooks = window.bookDB.getFeaturedBooks();
    
    featuredBooks.forEach(book => {
        const bookCard = createHomeBookCard(book);
        recommendationsContainer.appendChild(bookCard);
    });
}

function loadKidsBooks() {
    const kidsContainer = document.querySelector('.kids-section');
    
    if (!kidsContainer) return;
    
    kidsContainer.innerHTML = '';
    
    
    const kidsBooks = window.bookDB.getKidsBooks();
    
    kidsBooks.forEach(book => {
        const bookCard = createHomeBookCard(book);
        kidsContainer.appendChild(bookCard);
    });
}

function createHomeBookCard(book) {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" class="book-cover" 
             onerror="this.src='https:
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">by ${book.author}</p>
        <p class="book-description">${book.description}</p>
        <div class="book-actions">
            <button class="read-btn" data-book-id="${book.id}">Read Now</button>
            <button class="favorite-btn" data-book-id="${book.id}">♥</button>
        </div>
    `;
    
    return bookCard;
}

function setupBookEventListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('read-btn')) {
            const bookId = e.target.getAttribute('data-book-id');
            onBookClick(parseInt(bookId));
        }
        
        if (e.target.classList.contains('favorite-btn')) {
            const bookId = e.target.getAttribute('data-book-id');
            onFavoriteClick(parseInt(bookId), e.target);
        }
    });
}

function onBookClick(bookId) {
    console.log('Book clicked, user logged in:', isUserLoggedIn());
    
    if (!isUserLoggedIn()) {
        console.log('User not logged in, opening auth modal');
        if (window.authModal) {
            window.authModal.open('login');
            
            localStorage.setItem('pending_book', bookId);
        } else {
            console.error('Auth modal not available');
            alert('Please log in to read this book');
        }
        return;
    }
    
    console.log('User is logged in, opening book');
    openBook(bookId);
}

function onFavoriteClick(bookId, button) {
    if (!isUserLoggedIn()) {
        if (window.authModal) {
            window.authModal.open('login');
        }
        return;
    }
    
    const isFavorited = button.classList.toggle('favorited');
    
    if (isFavorited) {
        button.style.color = 'var(--primary-color)';
        addToFavorites(bookId);
    } else {
        button.style.color = 'var(--primary-color-light)';
        removeFromFavorites(bookId);
    }
}

function openBook(bookId) {
    console.log('Opening book:', bookId);
    
    
    const book = getBookById(bookId);
    
    if (!book) {
        if (window.showNotification) {
            window.showNotification('Book not found', 'error');
        } else {
            alert('Book not found');
        }
        return;
    }
    
    
    window.location.href = `reader.html?book=${bookId}`;
    
    if (window.showNotification) {
        window.showNotification('Opening book reader...', 'info');
    }
}

function addToFavorites(bookId) {
    const user = getCurrentUser();
    if (!user) return;
    
    if (!user.favorites) user.favorites = [];
    if (!user.favorites.includes(bookId)) {
        user.favorites.push(bookId);
        localStorage.setItem('athena_user', JSON.stringify(user));
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
    
    if (window.showNotification) {
        window.showNotification('Removed from favorites', 'info');
    }
}

function checkUserState() {
    const user = getCurrentUser();
    if (user && user.username) {
        console.log('User is logged in:', user.username);
        
        updateUIForLoggedInUser(user);
    } else {
        console.log('User is in guest mode');
        
        updateUIForGuestUser();
    }
}

function updateUIForLoggedInUser(user) {
    
    console.log('Welcome back, ' + user.username);
}

function updateUIForGuestUser() {
    
    console.log('Exploring as guest');
}

window.addEventListener('userAuthStateChange', (e) => {
    if (e.detail.isLoggedIn) {
        const pendingBook = localStorage.getItem('pending_book');
        if (pendingBook) {
            openBook(parseInt(pendingBook));
            localStorage.removeItem('pending_book');
        }
        
        checkUserState();
    }
});

function debugAuthState() {
    console.log('=== AUTH DEBUG ===');
    console.log('isUserLoggedIn():', isUserLoggedIn());
    console.log('getCurrentUser():', getCurrentUser());
    console.log('localStorage athena_user:', localStorage.getItem('athena_user'));
    console.log('localStorage athena_token:', localStorage.getItem('athena_token'));
    console.log('Auth modal available:', !!window.authModal);
    console.log('==================');
}


function initHomePage() {
    loadKidsBooks();
    loadFeaturedBooks();
    setupBookEventListeners();
    checkUserState();
    debugAuthState(); 
}


window.onBookClick = onBookClick;
window.onFavoriteClick = onFavoriteClick;

function resetIntro() {
    localStorage.removeItem('athena_has_seen_intro');
    location.reload();
}


window.resetIntro = resetIntro;