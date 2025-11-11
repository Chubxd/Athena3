document.addEventListener('DOMContentLoaded', function() {
    
    if (!window.bookDB) {
        console.error('Book database not loaded');
        setTimeout(initializeShop, 100);
        return;
    }
    initializeShop();
});

function initializeShop() {
    const booksGrid = document.getElementById('books-grid');
    const loadingState = document.getElementById('loading-state');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-select');
    const userExpElement = document.getElementById('user-exp');
    const unlockedCountElement = document.getElementById('unlocked-count');
    const purchaseModal = document.getElementById('purchase-modal');
    const confirmPurchaseBtn = document.getElementById('confirm-purchase');

    let currentBookId = null;

    function updateUserStats() {
        const user = getCurrentUser();
        if (userExpElement) {
            userExpElement.textContent = formatEXP(user.exp || 0);
        }
        if (unlockedCountElement) {
            unlockedCountElement.textContent = (user.unlockedBooks || []).length;
        }
    }

    function loadBooks(filter = 'all', sort = 'newest') {
    if (!booksGrid) return;
    
    loadingState.style.display = 'block';
    booksGrid.innerHTML = '';

    setTimeout(() => {
        try {
            const user = getCurrentUser();
            const unlockedBooks = user.unlockedBooks || [];
            
            
            let filteredBooks = window.bookDB.getPremiumBooks().filter(book => 
                !unlockedBooks.includes(book.id)
            );
            
            
            if (filter !== 'all') {
                filteredBooks = filteredBooks.filter(book => book.genre === filter);
            }

            
            filteredBooks = sortBooks(filteredBooks, sort);

            if (filteredBooks.length === 0) {
                booksGrid.innerHTML = `
                    <div class="empty-shop-state">
                        <i class='bx bx-check-circle'></i>
                        <h3>All Books Purchased!</h3>
                        <p>You've unlocked all available books. Check your owned collection to start reading.</p>
                        <a href="owned.html" class="explore-btn">View Owned Books</a>
                    </div>
                `;
            } else {
                filteredBooks.forEach(book => {
                    const bookCard = createBookCard(book);
                    booksGrid.appendChild(bookCard);
                });
            }

            loadingState.style.display = 'none';
        } catch (error) {
            console.error('Error loading books:', error);
            booksGrid.innerHTML = '<p class="empty-state">Error loading books. Please refresh the page.</p>';
            loadingState.style.display = 'none';
        }
    }, 500);
}

    function sortBooks(books, sortType) {
        if (!books) return [];
        
        switch(sortType) {
            case 'exp-low':
                return [...books].sort((a, b) => (a.expCost || 0) - (b.expCost || 0));
            case 'exp-high':
                return [...books].sort((a, b) => (b.expCost || 0) - (a.expCost || 0));
            case 'popular':
                return [...books].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            case 'newest':
            default:
                return [...books].sort((a, b) => (b.id || 0) - (a.id || 0));
        }
    }

    function createBookCard(book) {
        if (!book) return document.createElement('div');
        
        const user = getCurrentUser();
        const isUnlocked = (user.unlockedBooks || []).includes(book.id);
        const canAfford = (user.exp || 0) >= (book.expCost || 0);

        const bookCard = document.createElement('div');
        bookCard.className = `shop-book-card ${isUnlocked ? 'unlocked' : ''}`;
        bookCard.innerHTML = `
            <img src="${book.cover || ''}" alt="${book.title || 'Unknown'}" class="book-cover-shop" 
                 onerror="this.src='https:
            <div class="book-info-shop">
                <h3 class="book-title-shop">${book.title || 'Unknown Title'}</h3>
                <p class="book-author-shop">by ${book.author || 'Unknown Author'}</p>
                <p class="book-description-shop">${book.description || 'No description available.'}</p>
                <div class="book-meta">
                    <span class="book-genre">${book.genre || 'Unknown'}</span>
                    <div class="book-exp-cost">
                        <i class='bx bx-star'></i>
                        <span>${book.expCost || 0}</span>
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

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const activeFilter = document.querySelector('.filter-btn.active');
                loadBooks(activeFilter ? activeFilter.dataset.filter : 'all', sortSelect.value);
            });
        }

        const closeModalBtn = document.querySelector('.close-modal');
        const cancelBtn = document.querySelector('.btn-cancel');
        
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        
        if (confirmPurchaseBtn) confirmPurchaseBtn.addEventListener('click', confirmPurchase);

        window.addEventListener('click', (event) => {
            if (event.target === purchaseModal) {
                closeModal();
            }
        });
    }

    function openPurchaseModal(bookId) {
        currentBookId = bookId;
        const book = window.bookDB.getBookById(bookId);
        const user = getCurrentUser();
        
        if (book && purchaseModal) {
            document.getElementById('modal-book-cover').src = book.cover || '';
            document.getElementById('modal-book-title').textContent = book.title || 'Unknown';
            document.getElementById('modal-book-author').textContent = `by ${book.author || 'Unknown'}`;
            document.getElementById('modal-book-exp').textContent = book.expCost || 0;
            document.getElementById('modal-user-exp').textContent = formatEXP(user.exp || 0);
            
            if (confirmPurchaseBtn) {
                confirmPurchaseBtn.disabled = (user.exp || 0) < (book.expCost || 0);
                confirmPurchaseBtn.textContent = (user.exp || 0) < (book.expCost || 0) ? 'Not Enough EXP' : 'Confirm Purchase';
            }
            
            purchaseModal.style.display = 'block';
        }
    }

    function closeModal() {
        if (purchaseModal) {
            purchaseModal.style.display = 'none';
            currentBookId = null;
        }
    }

    function confirmPurchase() {
    if (!currentBookId) return;
    
    const book = window.bookDB.getBookById(currentBookId);
    const user = getCurrentUser();
    
    if (user && (user.exp || 0) >= (book.expCost || 0)) {
        
        user.exp = (user.exp || 0) - (book.expCost || 0);
        
        
        user.unlockedBooks = user.unlockedBooks || [];
        if (!user.unlockedBooks.includes(currentBookId)) {
            user.unlockedBooks.push(currentBookId);
        }
        
        
        localStorage.setItem('athena_user', JSON.stringify(user));
        
        
        updateUserStats();
        closeModal();
        
        
        loadBooks();
        
        showNotification(`Successfully purchased "${book.title}"!`, 'success');
        
        
        window.dispatchEvent(new CustomEvent('booksUpdated', {
            detail: { purchasedBookId: currentBookId }
        }));
    }
}

    function previewBook(bookId) {
        showNotification('Book preview feature coming soon!', 'info');
    }

    
    updateUserStats();
    loadBooks();
    setupEventListeners();

    
    window.openPurchaseModal = openPurchaseModal;
    window.confirmPurchase = confirmPurchase;
    window.previewBook = previewBook;
}