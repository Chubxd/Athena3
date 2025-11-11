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
        this.quizInterval = 5; // Check comprehension every 5 pages
        this.quizQuestions = [];
        this.currentQuestionIndex = 0;
        this.quizScore = 0;
        
        this.init();
    }

    async init() {
        // Set PDF.js worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        // Get book ID from URL parameters
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
        const book = getBookById(this.currentBookId);
        if (!book) {
            this.showError('Book not found');
            return;
        }

        // Update book info
        document.getElementById('book-title').textContent = book.title;
        document.getElementById('book-author').textContent = `by ${book.author}`;

        // Check if book is unlocked
        if (!isBookUnlocked(this.currentBookId)) {
            this.showError('You need to unlock this book first');
            return;
        }

        // Load PDF (in real app, this would be from your file storage)
        const pdfUrl = this.getPDFUrl(book);
        if (!pdfUrl) {
            this.showError('PDF file path not specified for this book');
            return;
        }
        await this.loadPDF(pdfUrl);
        
        // Update favorites button
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
        const fullUrl = new URL(url, window.location.href).href;
        console.log('=== PDF Loading Debug ===');
        console.log('Relative URL:', url);
        console.log('Full URL:', fullUrl);
        
        try {
            document.getElementById('loading-pdf').style.display = 'block';
            
            // First, verify the PDF is accessible with a simple GET request
            console.log('Step 1: Testing if PDF is accessible...');
            let testResponse;
            try {
                testResponse = await fetch(url, { 
                    method: 'GET',
                    headers: {
                        'Accept': 'application/pdf'
                    }
                });
                console.log('Fetch response status:', testResponse.status, testResponse.statusText);
                console.log('Content-Type:', testResponse.headers.get('content-type'));
                
                if (!testResponse.ok) {
                    throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}. The PDF file may not exist or the server is blocking access.`);
                }
                
                // Check if it's actually a PDF
                const contentType = testResponse.headers.get('content-type');
                if (contentType && !contentType.includes('pdf')) {
                    console.warn('Warning: Response is not a PDF. Content-Type:', contentType);
                }
                
                console.log('✓ PDF file is accessible via fetch');
            } catch (fetchError) {
                console.error('✗ Fetch test failed:', fetchError);
                throw new Error(`Cannot access PDF file: ${fetchError.message}\n\nTry opening this URL directly: ${fullUrl}`);
            }
            
            // Live Server sometimes returns 204 (No Content) for PDF requests
            // Workaround: Use XMLHttpRequest instead of fetch, or load as blob
            console.log('Step 2: Loading PDF as ArrayBuffer (workaround for Live Server 204 issue)...');
            let pdfDoc;
            
            try {
                // Try using XMLHttpRequest instead of fetch (better compatibility with Live Server)
                console.log('Attempting to load PDF with XMLHttpRequest...');
                const pdfArrayBuffer = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'arraybuffer';
                    
                    xhr.onload = function() {
                        console.log('XHR Status:', xhr.status, xhr.statusText);
                        console.log('XHR Response size:', xhr.response ? xhr.response.byteLength : 0, 'bytes');
                        console.log('XHR Content-Type:', xhr.getResponseHeader('content-type'));
                        
                        if (xhr.status === 200 || xhr.status === 0) {
                            if (xhr.response && xhr.response.byteLength > 0) {
                                resolve(xhr.response);
                            } else {
                                reject(new Error('PDF response is empty (0 bytes). The file may not exist or the server is not serving it correctly.'));
                            }
                        } else if (xhr.status === 204) {
                            reject(new Error('Server returned 204 (No Content). Live Server may not be configured to serve PDF files. Try using a different local server.'));
                        } else {
                            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                        }
                    };
                    
                    xhr.onerror = function() {
                        reject(new Error('Network error while fetching PDF'));
                    };
                    
                    xhr.onabort = function() {
                        reject(new Error('Request aborted'));
                    };
                    
                    xhr.send();
                });
                
                console.log('✓ PDF fetched as ArrayBuffer, size:', pdfArrayBuffer.byteLength, 'bytes');
                
                if (pdfArrayBuffer.byteLength === 0) {
                    throw new Error('PDF file is empty (0 bytes). Please check if the file exists and is not corrupted.');
                }
                
                // Now load it into PDF.js using the ArrayBuffer
                console.log('Step 3: Loading PDF into PDF.js...');
                const loadingTask = pdfjsLib.getDocument({
                    data: pdfArrayBuffer,  // Use data instead of url
                    verbosity: 1
                });
                
                pdfDoc = await loadingTask.promise;
                console.log('✓ PDF loaded successfully from ArrayBuffer');
                
            } catch (pdfError) {
                console.error('✗ PDF.js loading failed:', pdfError);
                console.error('Error name:', pdfError.name);
                console.error('Error message:', pdfError.message);
                
                // Try fetch as fallback
                console.log('Step 4: Fallback - trying with fetch API...');
                try {
                    const fetchResponse = await fetch(url, {
                        method: 'GET',
                        cache: 'no-cache'
                    });
                    
                    console.log('Fetch status:', fetchResponse.status, fetchResponse.statusText);
                    console.log('Fetch headers:', Object.fromEntries(fetchResponse.headers.entries()));
                    
                    if (!fetchResponse.ok && fetchResponse.status !== 200) {
                        throw new Error(`Fetch failed: HTTP ${fetchResponse.status}`);
                    }
                    
                    const pdfArrayBuffer = await fetchResponse.arrayBuffer();
                    console.log('Fetch ArrayBuffer size:', pdfArrayBuffer.byteLength, 'bytes');
                    
                    if (pdfArrayBuffer.byteLength === 0) {
                        throw new Error('PDF file is empty (0 bytes)');
                    }
                    
                    const loadingTask = pdfjsLib.getDocument({
                        data: pdfArrayBuffer,
                        verbosity: 1
                    });
                    
                    pdfDoc = await loadingTask.promise;
                    console.log('✓ PDF loaded successfully via fetch fallback');
                    
                } catch (fallbackError) {
                    console.error('✗ Fallback also failed:', fallbackError);
                    throw pdfError; // Throw original error
                }
            }
            
            this.pdfDoc = pdfDoc;
            this.totalPages = this.pdfDoc.numPages;
            console.log('✓ PDF loaded! Total pages:', this.totalPages);
            document.getElementById('total-pages').textContent = this.totalPages;
            
            // Load first page
            await this.renderPage(this.currentPage);
            
            // Load table of contents if available
            await this.loadTableOfContents();
            
            document.getElementById('loading-pdf').style.display = 'none';
            console.log('=== PDF Loading Complete ===');
            
        } catch (error) {
            console.error('=== PDF Loading Failed ===');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('URL attempted:', fullUrl);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to load book. Please try again later.';
            
            if (error.name === 'MissingPDFException') {
                errorMessage = `PDF file not found.\n\nURL: ${fullUrl}\n\nPlease verify the file exists in the books/ directory.`;
            } else if (error.name === 'UnexpectedResponseException' || error.message.includes('HTTP')) {
                errorMessage = `Server error while loading PDF.\n\nURL: ${fullUrl}\n\nPlease:\n1. Open the URL above directly in your browser to test\n2. Check the browser console (F12) for more details\n3. Verify your Live Server is running`;
            } else if (error.message && error.message.includes('CORS')) {
                errorMessage = 'CORS error: Make sure your local server allows cross-origin requests for PDF files.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}\n\nURL: ${fullUrl}\n\nCheck the browser console (F12) for more details.`;
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
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('athena_theme', isDark ? 'dark' : 'light');
        
        // Update theme icon
        const themeBtn = document.getElementById('toggle-theme');
        themeBtn.innerHTML = isDark ? '<i class="bx bx-sun"></i>' : '<i class="bx bx-moon"></i>';
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
        
        // Remove previous selections
        options.forEach(option => option.classList.remove('selected', 'correct', 'incorrect'));
        
        // Mark selected option
        options[selectedIndex].classList.add('selected');
        
        // Check answer
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
        // Simple error display - you can enhance this
        alert(message);
        // Optionally redirect back to library
        setTimeout(() => {
            window.location.href = 'athena.html';
        }, 2000);
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