
document.addEventListener("DOMContentLoaded", () => {
    const favoritesGrid = document.getElementById("favorites-grid");

    function renderFavorites() {
        const user = getCurrentUser();
        if (!user || !user.favorites || user.favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-book-heart'></i>
                    <h3>No Favorite Books Yet</h3>
                    <p>Discover amazing books and add them to your favorites to see them here!</p>
                    <a href="athena.html" class="explore-btn">Explore Books</a>
                </div>
            `;
            return;
        }

        
        const totalFavorites = document.getElementById('total-favorites');
        if (totalFavorites) {
            totalFavorites.textContent = user.favorites.length;
        }

        favoritesGrid.innerHTML = user.favorites.map(id => {
            const book = window.bookDB.getBookById(id);
            if (!book) return "";
            
            const isUnlocked = window.bookDB.isBookUnlocked(id);
            
            return `
                <div class="favorite-card">
                    <img src="${book.cover}" alt="${book.title}" class="favorite-cover">
                    <span class="book-type ${book.type}">${book.type === 'free' ? 'Free' : 'Premium'}</span>
                    <h3 class="favorite-title">${book.title}</h3>
                    <p class="favorite-author">by ${book.author}</p>
                    <div class="favorite-actions">
                        <button class="read-btn" data-id="${book.id}">
                            ${isUnlocked ? 'Read Now' : 'Get Book'}
                        </button>
                        <button class="remove-btn" data-id="${book.id}">Remove</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    favoritesGrid.addEventListener("click", e => {
        
        if (e.target.classList.contains("remove-btn")) {
            const bookId = Number(e.target.dataset.id);
            const user = getCurrentUser();
            if (!user || !user.favorites) return;
            
            user.favorites = user.favorites.filter(favId => favId !== bookId);
            localStorage.setItem("athena_user", JSON.stringify(user));
            renderFavorites();
            
            if (window.showNotification) {
                showNotification('Removed from favorites', 'info');
            }
        }
        
        else if (e.target.classList.contains("read-btn")) {
            const bookId = Number(e.target.dataset.id);
            const book = window.bookDB.getBookById(bookId);
            
            if (!book) {
                showNotification('Book not found', 'error');
                return;
            }
            
            const isUnlocked = window.bookDB.isBookUnlocked(bookId);
            
            if (isUnlocked) {
                
                window.location.href = `reader.html?book=${bookId}`;
            } else {
                
                window.location.href = `shop.html`;
                if (window.showNotification) {
                    showNotification(`Visit the shop to unlock "${book.title}"`, 'info');
                }
            }
        }
    });

    renderFavorites();
});