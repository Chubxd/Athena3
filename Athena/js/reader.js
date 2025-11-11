class BookReader {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.2;
        this.canvas = document.getElementById('pdf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentBookId = null;
        this.bookmarks = [];
        this.quizInterval = 5; // comprehension check every 5 pages
        this.quizQuestions = [];
        this.currentQuestionIndex = 0;
        this.quizScore = 0;
        
        this.init();
    }

    async init() {
        // Load PDF.js worker first
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            console.log('PDF.js worker loaded');
        } catch (error) {
            console.error('Failed to load PDF.js worker:', error);
            this.showError('Failed to initialize PDF reader. Please refresh the page.');
            return;
        }
        
        this.currentBookId = this.getBookIdFromURL();
        
        if (!this.currentBookId) {
            this.showError('No book specified');
            return;
        }

        await this.loadBook();
        this.setupEventListeners();
        this.updateUI();
    }

    getBookIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('book'));
    }

    async loadBook() {
        // Check if database is loaded
        if (!window.bookDB) {
            this.showError('Book database not loaded. Please refresh the page.');
            return;
        }
        
        const book = window.bookDB.getBookById(this.currentBookId);
        if (!book) {
            this.showError('Book not found');
            return;
        }

        // Debug: Check book and user status
        console.log('=== DEBUG BOOK INFO ===');
        console.log('Book ID:', this.currentBookId);
        console.log('Book:', book);
        console.log('Book type:', book.type);
        console.log('Book unlocked property:', book.unlocked);
        
        const user = getCurrentUser();
        console.log('User:', user);
        console.log('User unlocked books:', user.unlockedBooks);
        console.log('Is book in unlocked list:', user.unlockedBooks.includes(this.currentBookId));
        console.log('Database isBookUnlocked check:', window.bookDB.isBookUnlocked(this.currentBookId));
        console.log('========================');

        // Update book info
        document.getElementById('book-title').textContent = book.title;
        document.getElementById('book-author').textContent = `by ${book.author}`;

        // Check if book is unlocked - FIXED LOGIC
        const isUnlocked = window.bookDB.isBookUnlocked(this.currentBookId);
        console.log('Final unlock check result:', isUnlocked);
        
        if (!isUnlocked) {
            this.showError('You need to unlock this book first. Visit the shop to purchase it.');
            return;
        }

        // Load PDF 
        const pdfUrl = this.getPDFUrl(book);
        if (!pdfUrl) {
            this.showError('PDF file path not specified for this book');
            return;
        }
        
        console.log('Attempting to load PDF from:', pdfUrl);
        await this.loadPDF(pdfUrl);
        
        this.updateFavoriteButton();
    }

    // In reader.js - Update the getPDFUrl function
    getPDFUrl(book) {
        if (!book.pdfFile) {
            return null;
        }
        
        // If it's already a full URL, return as is
        if (book.pdfFile.startsWith('http://') || book.pdfFile.startsWith('https://')) {
            return book.pdfFile;
        }
        
        // Remove leading ./ if present to make it relative to server root
        let cleanPath = book.pdfFile;
        if (cleanPath.startsWith('./')) {
            cleanPath = cleanPath.substring(2);
        }
        
        // If it starts with books/, use it as is (relative to root)
        if (cleanPath.startsWith('books/')) {
            return cleanPath;
        }
        
        // If it's already a relative path starting with ../, keep it
        if (cleanPath.startsWith('../')) {
            return cleanPath;
        }
        
        // Otherwise, assume it's a filename and prepend the books directory
        return 'books/' + cleanPath;
    }

    async loadPDF(url) {
        console.log('Loading PDF from:', url);
        
        try {
            document.getElementById('loading-pdf').style.display = 'block';
            
            // Simple fetch approach
            const loadingTask = pdfjsLib.getDocument(url);
            this.pdfDoc = await loadingTask.promise;
            
            this.totalPages = this.pdfDoc.numPages;
            console.log('PDF loaded successfully. Total pages:', this.totalPages);
            document.getElementById('total-pages').textContent = this.totalPages;
            
            // Load first page
            await this.renderPage(this.currentPage);
            
            document.getElementById('loading-pdf').style.display = 'none';
            
        } catch (error) {
            console.error('PDF loading error:', error);
            let errorMessage = 'Failed to load PDF. ';
            
            if (error.name === 'MissingPDFException') {
                errorMessage += 'The PDF file was not found. Please check if the file exists.';
            } else if (error.name === 'InvalidPDFException') {
                errorMessage += 'The PDF file is corrupted or invalid.';
            } else if (error.message.includes('NetworkError')) {
                errorMessage += 'Network error. Please check your connection.';
            } else {
                errorMessage += error.message;
            }
            
            this.showError(errorMessage);
            document.getElementById('loading-pdf').style.display = 'none';
        }
    }

    async renderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
            return;
        }

        this.pageRendering = true;
        document.getElementById('loading-pdf').style.display = 'block';

        try {
            const page = await this.pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: this.scale });

            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;

            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };

            await page.render(renderContext).promise;
            
            this.currentPage = num;
            this.updateUI();
            this.checkComprehensionTrigger();
            this.saveReadingProgress();
            
        } catch (error) {
            console.error('Error rendering page:', error);
        }

        document.getElementById('loading-pdf').style.display = 'none';
        this.pageRendering = false;

        if (this.pageNumPending !== null) {
            this.renderPage(this.pageNumPending);
            this.pageNumPending = null;
        }
    }

    updateUI() {
        // Update page numbers
        document.getElementById('current-page').textContent = this.currentPage;
        
        // Update progress
        const progress = (this.currentPage / this.totalPages) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Update navigation buttons
        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= this.totalPages;
        document.getElementById('mobile-prev').disabled = this.currentPage <= 1;
        document.getElementById('mobile-next').disabled = this.currentPage >= this.totalPages;
        
        // Update zoom level
        document.getElementById('zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
        
        // Update table of contents active item
        this.updateActiveTOCItem();
    }

    updateFavoriteButton() {
        const favoriteBtn = document.getElementById('favorite-btn');
        const isFavorited = isBookFavorited(this.currentBookId);
        
        if (isFavorited) {
            favoriteBtn.classList.add('active');
            favoriteBtn.innerHTML = '<i class="bx bxs-heart"></i>';
        } else {
            favoriteBtn.classList.remove('active');
            favoriteBtn.innerHTML = '<i class="bx bx-heart"></i>';
        }
    }

    async loadTableOfContents() {
        // In a real app, you might extract TOC from PDF metadata
        // For now, we'll create a simple TOC based on page numbers
        const tocList = document.getElementById('toc-list');
        tocList.innerHTML = '';
        
        // Create basic TOC items (every 10 pages)
        for (let i = 1; i <= this.totalPages; i += 10) {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.textContent = `Page ${i}`;
            tocItem.addEventListener('click', () => {
                this.goToPage(i);
                this.closeSidebar();
            });
            tocList.appendChild(tocItem);
        }
    }

    updateActiveTOCItem() {
        const tocItems = document.querySelectorAll('.toc-item');
        tocItems.forEach(item => item.classList.remove('active'));
        
        // Find the TOC item that corresponds to current page range
        const currentRange = Math.floor((this.currentPage - 1) / 10) * 10 + 1;
        const activeItem = Array.from(tocItems).find(item => 
            item.textContent.includes(`Page ${currentRange}`)
        );
        
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());
        document.getElementById('mobile-prev').addEventListener('click', () => this.previousPage());
        document.getElementById('mobile-next').addEventListener('click', () => this.nextPage());

        // Zoom
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());

        // Sidebar
        document.getElementById('toggle-sidebar').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('close-sidebar').addEventListener('click', () => this.closeSidebar());

        // Favorites
        document.getElementById('favorite-btn').addEventListener('click', () => this.toggleFavorite());

        // Theme
        document.getElementById('toggle-theme').addEventListener('click', () => this.toggleTheme());

        // Bookmarks
        document.getElementById('add-bookmark').addEventListener('click', () => this.addBookmark());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Quiz
        document.getElementById('start-quiz').addEventListener('click', () => this.startQuiz());
        document.getElementById('close-quiz').addEventListener('click', () => this.closeQuiz());
        document.getElementById('next-question').addEventListener('click', () => this.nextQuestion());
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.renderPage(this.currentPage - 1);
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.renderPage(this.currentPage + 1);
        }
    }

    goToPage(pageNum) {
        const page = Math.max(1, Math.min(pageNum, this.totalPages));
        this.renderPage(page);
    }

    zoomIn() {
        this.scale = Math.min(this.scale + 0.1, 3.0);
        this.renderPage(this.currentPage);
    }

    zoomOut() {
        this.scale = Math.max(this.scale - 0.1, 0.5);
        this.renderPage(this.currentPage);
    }

    toggleSidebar() {
        const sidebar = document.getElementById('reader-sidebar');
        sidebar.classList.toggle('hidden');
    }

    closeSidebar() {
        document.getElementById('reader-sidebar').classList.add('hidden');
    }

    toggleFavorite() {
        const isFavorited = isBookFavorited(this.currentBookId);
        
        if (isFavorited) {
            removeFromFavorites(this.currentBookId);
            showNotification('Removed from favorites', 'info');
        } else {
            addToFavorites(this.currentBookId);
            showNotification('Added to favorites!', 'success');
        }
        
        this.updateFavoriteButton();
    }

    toggleTheme() {
        toggleTheme(); // Use the global function
    
    // Update theme icon in reader
    const isDark = document.body.classList.contains('dark');
    const themeBtn = document.getElementById('toggle-theme');
    if (themeBtn) {
        themeBtn.innerHTML = isDark ? '<i class="bx bx-sun"></i>' : '<i class="bx bx-moon"></i>';
    }
}

    addBookmark() {
        const bookmark = {
            page: this.currentPage,
            timestamp: new Date().toISOString(),
            note: `Bookmark at page ${this.currentPage}`
        };
        
        this.bookmarks.push(bookmark);
        this.updateBookmarksList();
        showNotification('Bookmark added!', 'success');
    }

    updateBookmarksList() {
        const bookmarksList = document.getElementById('bookmarks-list');
        bookmarksList.innerHTML = '';
        
        if (this.bookmarks.length === 0) {
            bookmarksList.innerHTML = '<div class="no-bookmarks">No bookmarks yet</div>';
            return;
        }
        
        this.bookmarks.forEach((bookmark, index) => {
            const bookmarkItem = document.createElement('div');
            bookmarkItem.className = 'bookmark-item';
            bookmarkItem.innerHTML = `
                <div>Page ${bookmark.page}</div>
                <small>${new Date(bookmark.timestamp).toLocaleDateString()}</small>
            `;
            bookmarkItem.addEventListener('click', () => {
                this.goToPage(bookmark.page);
                this.closeSidebar();
            });
            bookmarksList.appendChild(bookmarkItem);
        });
    }

    handleKeyboard(e) {
        // Don't trigger if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                this.previousPage();
                break;
            case 'ArrowRight':
            case 'PageDown':
            case ' ':
                e.preventDefault();
                this.nextPage();
                break;
            case 'Home':
                e.preventDefault();
                this.goToPage(1);
                break;
            case 'End':
                e.preventDefault();
                this.goToPage(this.totalPages);
                break;
            case '+':
            case '=':
                e.preventDefault();
                this.zoomIn();
                break;
            case '-':
                e.preventDefault();
                this.zoomOut();
                break;
            case 'b':
                e.preventDefault();
                this.toggleSidebar();
                break;
            case 'f':
                e.preventDefault();
                this.toggleFavorite();
                break;
        }
    }

    checkComprehensionTrigger() {
        // Check if we should trigger a comprehension quiz
        if (this.currentPage % this.quizInterval === 0) {
            document.getElementById('start-quiz').disabled = false;
            document.getElementById('comprehension-status').querySelector('p').textContent = 
                `Ready for comprehension check!`;
        }
    }

    async startQuiz() {
        // This will be integrated with AI in the next phase
        // For now, we'll use mock questions
        this.quizQuestions = this.generateMockQuestions();
        this.currentQuestionIndex = 0;
        this.quizScore = 0;
        
        document.getElementById('quiz-modal').style.display = 'block';
        this.showQuestion();
    }

    generateMockQuestions() {
        // Mock questions - in real app, these would come from AI
        return [
            {
                question: "What is the main theme discussed in the recent pages you've read?",
                options: [
                    "The importance of daily routines",
                    "The concept of mindfulness and presence", 
                    "The history of ancient philosophy",
                    "The benefits of physical exercise"
                ],
                correctAnswer: 1,
                explanation: "The text emphasized mindfulness and being present in the current moment."
            },
            {
                question: "Which philosopher was mentioned as an influence?",
                options: [
                    "Aristotle",
                    "Plato", 
                    "Marcus Aurelius",
                    "Socrates"
                ],
                correctAnswer: 2,
                explanation: "Marcus Aurelius was referenced in relation to Stoic philosophy."
            },
            {
                question: "What was the key advice given about dealing with distractions?",
                options: [
                    "Ignore them completely",
                    "Schedule specific times for focused work",
                    "Use technology to block distractions", 
                    "Work in complete isolation"
                ],
                correctAnswer: 1,
                explanation: "The text recommended scheduling specific blocks of time for deep, focused work."
            }
        ];
    }

    showQuestion() {
        if (this.currentQuestionIndex >= this.quizQuestions.length) {
            this.showQuizResults();
            return;
        }

        const question = this.quizQuestions[this.currentQuestionIndex];
        
        // Update question progress
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = this.quizQuestions.length;
        
        // Set question text
        document.getElementById('question-text').textContent = question.question;
        
        // Create options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => this.selectOption(index));
            optionsContainer.appendChild(optionElement);
        });
        
        // Reset UI state
        document.getElementById('next-question').disabled = true;
        document.getElementById('quiz-feedback').style.display = 'none';
        document.getElementById('quiz-feedback').className = 'quiz-feedback';
    }

    selectOption(selectedIndex) {
        const question = this.quizQuestions[this.currentQuestionIndex];
        const options = document.querySelectorAll('.option');
        const feedback = document.getElementById('quiz-feedback');

        options.forEach(option => option.classList.remove('selected', 'correct', 'incorrect'));

        options[selectedIndex].classList.add('selected');

        if (selectedIndex === question.correctAnswer) {
            options[selectedIndex].classList.add('correct');
            feedback.textContent = `Correct! ${question.explanation}`;
            feedback.className = 'quiz-feedback correct';
            this.quizScore++;
        } else {
            options[selectedIndex].classList.add('incorrect');
            options[question.correctAnswer].classList.add('correct');
            feedback.textContent = `Incorrect. ${question.explanation}`;
            feedback.className = 'quiz-feedback incorrect';
        }
        
        feedback.style.display = 'block';
        document.getElementById('next-question').disabled = false;
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.showQuestion();
    }

    showQuizResults() {
        const score = (this.quizScore / this.quizQuestions.length) * 100;
        
        document.getElementById('question-text').textContent = 
            `Quiz Complete! Your score: ${this.quizScore}/${this.quizQuestions.length} (${Math.round(score)}%)`;
        
        document.getElementById('options-container').innerHTML = '';
        
        const feedback = document.getElementById('quiz-feedback');
        if (score >= 70) {
            feedback.textContent = 'Excellent! You have a good understanding of the material.';
            feedback.className = 'quiz-feedback correct';
            // Reward EXP for good performance
            addEXP(25);
            showNotification('+25 EXP earned for excellent quiz performance!', 'success');
        } else if (score >= 50) {
            feedback.textContent = 'Good effort! Consider re-reading the last few pages.';
            feedback.className = 'quiz-feedback';
            addEXP(10);
            showNotification('+10 EXP earned for completing the quiz!', 'info');
        } else {
            feedback.textContent = 'You might want to review the material before continuing.';
            feedback.className = 'quiz-feedback incorrect';
            addEXP(5);
            showNotification('+5 EXP earned for attempting the quiz.', 'warning');
        }
        
        feedback.style.display = 'block';
        document.getElementById('next-question').textContent = 'Finish';
        document.getElementById('next-question').onclick = () => this.closeQuiz();
        document.getElementById('next-question').disabled = false;
    }

    closeQuiz() {
        document.getElementById('quiz-modal').style.display = 'none';
        document.getElementById('start-quiz').disabled = true;
        document.getElementById('comprehension-status').querySelector('p').textContent = 
            `Next check: After page ${this.currentPage + this.quizInterval}`;
    }

    saveReadingProgress() {
        const user = getCurrentUser();
        if (!user) return;
        
        if (!user.readingProgress) user.readingProgress = {};
        
        user.readingProgress[this.currentBookId] = {
            currentPage: this.currentPage,
            lastRead: new Date().toISOString(),
            totalPages: this.totalPages
        };
        
        localStorage.setItem('athena_user', JSON.stringify(user));
    }

    showError(message) {
        const loadingElement = document.getElementById('loading-pdf');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="error-message">
                    <i class='bx bx-error-alt' style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>${message}</p>
                    <button onclick="window.location.href='athena.html'" class="back-btn">
                        Return to Library
                    </button>
                </div>
            `;
            loadingElement.style.display = 'block';
        } else {
            alert(message);
            window.location.href = 'athena.html';
        }
    }
}

// Initialize the book reader when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bookReader = new BookReader();
});

// Utility function to go back
function goBack() {
    window.history.back();
}