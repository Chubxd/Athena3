const books = [
    {
        id: 1,
        title: "Meditations",
        author: "Marcus Aurelius",
        description: "A series of personal writings by the Roman Emperor, outlining his Stoic philosophy and guidance on life.",
        expCost: 500,
        genre: "philosophy",
        cover: "images/book-covers/meditations.jpg",
        unlocked: false,
        popularity: 95
    },
    {
        id: 2,
        title: "Deep Work",
        author: "Cal Newport",
        description: "Rules for focused success in a distracted world. Learn to master concentration and produce better work.",
        expCost: 400,
        genre: "self-help",
        cover: "images/book-covers/deep-work.jpg",
        unlocked: true,
        popularity: 88
    },
    {
        id: 3,
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        description: "Explore the two systems that drive the way we think—fast, intuitive, and slow, deliberate.",
        expCost: 600,
        genre: "non-fiction",
        cover: "images/book-covers/thinking.jpg",
        unlocked: false,
        popularity: 92
    },
    {
        id: 4,
        title: "Pride and Prejudice",
        author: "Jane Austen",
        description: "A romantic novel of manners that depicts the emotional development of protagonist Elizabeth Bennet.",
        expCost: 350,
        genre: "fiction",
        cover: "images/book-covers/pride.jpg",
        unlocked: false,
        popularity: 85
    },
    {
        id: 5,
        title: "Atomic Habits",
        author: "James Clear",
        description: "Tiny changes, remarkable results. Learn how to build good habits and break bad ones.",
        expCost: 450,
        genre: "self-help",
        cover: "images/book-covers/atomic.jpg",
        unlocked: false,
        popularity: 90
    },
    {
        id: 6,
        title: "1984",
        author: "George Orwell",
        description: "A dystopian social science fiction novel about totalitarian control and thought control.",
        expCost: 550,
        genre: "fiction",
        cover: "images/book-covers/1984.jpg",
        unlocked: false,
        popularity: 94
    }
];

let userData = {
    exp: 1250,
    unlockedBooks: [2], 
    favorites: []
};

const booksGrid = document.getElementById('books-grid');
const loadingState = document.getElementById('loading-state');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const userExpElement = document.getElementById('user-exp');
const unlockedCountElement = document.getElementById('unlocked-count');
const purchaseModal = document.getElementById('purchase-modal');
const confirmPurchaseBtn = document.getElementById('confirm-purchase');

document.addEventListener('DOMContentLoaded', function() {
    updateUserStats();
    loadBooks();
    setupEventListeners();
});

function updateUserStats() {
    userExpElement.textContent = userData.exp.toLocaleString();
    unlockedCountElement.textContent = userData.unlockedBooks.length;
}

function loadBooks(filter = 'all', sort = 'newest') {
    loadingState.style.display = 'block';
    booksGrid.innerHTML = '';

    setTimeout(() => {
        let filteredBooks = filter === 'all' 
            ? books 
            : books.filter(book => book.genre === filter);

        filteredBooks = sortBooks(filteredBooks, sort);

        filteredBooks.forEach(book => {
            const bookCard = createBookCard(book);
            booksGrid.appendChild(bookCard);
        });

        loadingState.style.display = 'none';
    }, 500);
}

function sortBooks(books, sortType) {
    switch(sortType) {
        case 'exp-low':
            return [...books].sort((a, b) => a.expCost - b.expCost);
        case 'exp-high':
            return [...books].sort((a, b) => b.expCost - a.expCost);
        case 'popular':
            return [...books].sort((a, b) => b.popularity - a.popularity);
        case 'newest':
        default:
            return [...books].sort((a, b) => b.id - a.id);
    }
}

function createBookCard(book) {
    const isUnlocked = userData.unlockedBooks.includes(book.id);
    const canAfford = userData.exp >= book.expCost;

    const bookCard = document.createElement('div');
    bookCard.className = `shop-book-card ${isUnlocked ? 'unlocked' : ''}`;
    bookCard.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" class="book-cover-shop" onerror="this.src='https://placehold.co/200x300/6c3b3b/ffffff?text=${encodeURIComponent(book.title)}'">
        <div class="book-info-shop">
            <h3 class="book-title-shop">${book.title}</h3>
            <p class="book-author-shop">by ${book.author}</p>
            <p class="book-description-shop">${book.description}</p>
            <div class="book-meta">
                <span class="book-genre">${book.genre}</span>
                <div class="book-exp-cost">
                    <i class='bx bx-star'></i>
                    <span>${book.expCost}</span>
                </div>
            </div>
        </div>
        <div class="shop-book-actions">
            <button class="btn-preview" onclick="previewBook(${book.id})">Preview</button>
            <button class="btn-buy" 
                    onclick="openPurchaseModal(${book.id})"
                    ${isUnlocked || !canAfford ? 'disabled' : ''}>
                ${isUnlocked ? 'Unlocked' : (canAfford ? 'Buy' : 'Need EXP')}
            </button>
        </div>
    `;
    
    return bookCard;
}

function setupEventListeners() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadBooks(btn.dataset.filter, sortSelect.value);
        });
    });

    sortSelect.addEventListener('change', () => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        loadBooks(activeFilter, sortSelect.value);
    });

    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.querySelector('.btn-cancel').addEventListener('click', closeModal);
    
    confirmPurchaseBtn.addEventListener('click', confirmPurchase);

    window.addEventListener('click', (event) => {
        if (event.target === purchaseModal) {
            closeModal();
        }
    });
}

let currentBookId = null;

function openPurchaseModal(bookId) {
    currentBookId = bookId;
    const book = books.find(b => b.id === bookId);
    
    if (book) {
        document.getElementById('modal-book-cover').src = book.cover;
        document.getElementById('modal-book-title').textContent = book.title;
        document.getElementById('modal-book-author').textContent = `by ${book.author}`;
        document.getElementById('modal-book-exp').textContent = book.expCost;
        document.getElementById('modal-user-exp').textContent = userData.exp.toLocaleString();
        
        confirmPurchaseBtn.disabled = userData.exp < book.expCost;
        confirmPurchaseBtn.textContent = userData.exp < book.expCost ? 'Not Enough EXP' : 'Confirm Purchase';
        
        purchaseModal.style.display = 'block';
    }
}

function closeModal() {
    purchaseModal.style.display = 'none';
    currentBookId = null;
}

function confirmPurchase() {
    if (!currentBookId) return;
    
    const book = books.find(b => b.id === currentBookId);
    if (userData.exp >= book.expCost) {

        userData.exp -= book.expCost;
        userData.unlockedBooks.push(currentBookId);
        
        updateUserStats();
        closeModal();
        loadBooks(); 
        
        showNotification(`Successfully purchased "${book.title}"!`, 'success');
    }
}

function previewBook(bookId) {
    showNotification('Book preview feature coming soon!', 'info');
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

window.shopModule = {
    loadBooks,
    openPurchaseModal,
    confirmPurchase
};