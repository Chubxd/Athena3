document.addEventListener("DOMContentLoaded", () => {
    const ownedGrid = document.getElementById("owned-grid");

    function getOwnedBooks() {
        const user = getCurrentUser();
        const unlockedBooks = user.unlockedBooks || [];
        
        
        const allBooks = window.bookDB.getAllBooks();
        const ownedBooks = allBooks.filter(book => 
            book.type === 'free' || unlockedBooks.includes(book.id)
        );
        
        return ownedBooks;
    }

    function renderOwned() {
        const ownedBooks = getOwnedBooks();
        const user = getCurrentUser();

        if (ownedBooks.length === 0) {
            ownedGrid.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-book-heart'></i>
                    <h3>No Books Owned Yet</h3>
                    <p>Start building your library! Explore free books or visit the shop to purchase new ones.</p>
                    <div class="empty-actions">
                        <a href="athena.html" class="explore-btn">Explore Free Books</a>
                        <a href="shop.html" class="explore-btn secondary">Visit Shop</a>
                    </div>
                </div>
            `;
            return;
        }

        ownedGrid.innerHTML = ownedBooks.map(book => {
            const isFavorited = user.favorites && user.favorites.includes(book.id);
            const isFree = book.type === 'free';
            
            return `
                <div class="owned-card">
                    <img src="${book.cover}" alt="${book.title}" class="owned-cover" data-id="${book.id}">
                    <span class="book-badge ${isFree ? 'free-badge' : 'premium-badge'}">
                        ${isFree ? 'Free' : 'Premium'}
                    </span>
                    <h3 class="owned-title">${book.title}</h3>
                    <p class="owned-author">by ${book.author}</p>
                    <div class="owned-actions">
                        <button class="read-btn" data-id="${book.id}">Read Now</button>
                        <button class="favorite-toggle ${isFavorited ? 'favorited' : ''}" data-id="${book.id}">
                            <i class='bx ${isFavorited ? 'bxs-heart' : 'bx-heart'}'></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    ownedGrid.addEventListener("click", e => {
        const bookId = Number(e.target.dataset.id);
        
        
        if (e.target.classList.contains("read-btn")) {
            window.location.href = `reader.html?book=${bookId}`;
        }
        
        else if (e.target.classList.contains("owned-cover")) {
            window.location.href = `reader.html?book=${bookId}`;
        }
        
        else if (e.target.closest(".favorite-toggle")) {
            const btn = e.target.closest(".favorite-toggle");
            const id = Number(btn.dataset.id);
            const user = getCurrentUser();
            user.favorites = user.favorites || [];

            if (user.favorites.includes(id)) {
                user.favorites = user.favorites.filter(favId => favId !== id);
                btn.classList.remove("favorited");
                btn.innerHTML = '<i class="bx bx-heart"></i>';
                showNotification('Removed from favorites', 'info');
            } else {
                user.favorites.push(id);
                btn.classList.add("favorited");
                btn.innerHTML = '<i class="bx bxs-heart"></i>';
                showNotification('Added to favorites!', 'success');
            }

            localStorage.setItem("athena_user", JSON.stringify(user));
        }
    });

    
    window.addEventListener('booksUpdated', (e) => {
        renderOwned(); 
    });

    renderOwned();
});