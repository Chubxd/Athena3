class BookDatabase {
    constructor() {
        this.books = this.initializeBooks();
        this.initializeDatabase();
    }

    initializeBooks() {
    return [
        
        {
            id: 1,
            title: "Pride and Prejudice",
            author: "Jane Austen",
            description: "Set in early 19th-century England, the novel follows the Bennet family...",
            cover: "images/prideandprejudice.jpg",
            pdfFile: "./books/pride-and-prejudice.pdf",
            category: "featured", 
            genre: "fiction",
            expCost: 0,
            unlocked: true,
            popularity: 85,
            type: "free"
        },
        {
            id: 2,
            title: "A Man Called Ove",
            author: "Fredrik Backman",
            description: "A story about a grumpy, isolated 59-year-old widower named Ove...",
            cover: "images/amancalledove.jpg",
            pdfFile: "./books/man-called-ove.pdf",
            category: "featured", 
            genre: "fiction",
            expCost: 0,
            unlocked: true,
            popularity: 82,
            type: "free"
        },
        {
            id: 3,
            title: "The Brothers Karamazov",
            author: "Fyodor Dostoevsky",
            description: "A philosophical novel by Fyodor Dostoevsky that explores profound questions...",
            cover: "images/thebrotherskarmazov.jpeg",
            pdfFile: "./books/the-brothers-karamazov.pdf",
            category: "featured", 
            genre: "philosophy",
            expCost: 0,
            unlocked: true,
            popularity: 90,
            type: "free"
        },
        {
            id: 4,
            title: "The Song of Achilles",
            author: "Madeline Miller",
            description: "The Song of Achilles is a retelling of the Trojan War...",
            cover: "images/songsofachilles.jpeg",
            pdfFile: "./books/song-of-achilles.pdf",
            category: "featured", 
            genre: "fiction",
            expCost: 0,
            unlocked: true,
            popularity: 88,
            type: "free"
        },
        {
            id: 5,
            title: "How Do You Live?",
            author: "Yoshino Genzaburo",
            description: "After the death of Koperu's father, a bank executive...",
            cover: "images/howdoyoulive.jpeg",
            pdfFile: "./books/how-do-you-live.pdf",
            category: "featured", 
            genre: "self-help",
            expCost: 0,
            unlocked: true,
            popularity: 80,
            type: "free"
        },
            
            {
                id: 6,
                title: "The Gruffalo",
                author: "Julia Donaldson",
                description: "A small, clever mouse who takes a walk through a deep, dark wood...",
                cover: "images/thegrufallo.jpeg",
                pdfFile: "./books/the-gruffalo.pdf",
                category: "kids",
                genre: "kids",
                expCost: 0,
                unlocked: true,
                popularity: 75,
                type: "free"
            },
            {
                id: 7,
                title: "Hansel and Gretel",
                author: "Brothers Grimm",
                description: "The story follows two siblings, Hansel and Gretel...",
                cover: "images/hanselgretel.jpeg",
                pdfFile: "./books/hansel-and-gretel.pdf",
                category: "kids",
                genre: "kids",
                expCost: 0,
                unlocked: true,
                popularity: 78,
                type: "free"
            },
            {
                id: 8,
                title: "Jack and the Beanstalk",
                author: "English Folktale",
                description: "English fairy tale about a poor boy named Jack...",
                cover: "images/beanstalk.jpeg",
                pdfFile: "./books/jack-and-the-beanstalk.pdf",
                category: "kids",
                genre: "kids",
                expCost: 0,
                unlocked: true,
                popularity: 76,
                type: "free"
            },
            {
                id: 9,
                title: "The Ugly Duckling",
                author: "Hans Christian Andersen",
                description: "The story follows a duckling born in a barnyard...",
                cover: "images/uglyduckling.jpeg",
                pdfFile: "./books/the-ugly-duckling.pdf",
                category: "kids",
                genre: "kids",
                expCost: 0,
                unlocked: true,
                popularity: 77,
                type: "free"
            },
            {
                id: 10,
                title: "The Tortoise and the Hare",
                author: "Aesop's Fable",
                description: "Tells the story of a race between a slow-moving tortoise...",
                cover: "images/tortoise.jpeg",
                pdfFile: "./books/the-tortoise-and-the-hare.pdf",
                category: "kids",
                genre: "kids",
                expCost: 0,
                unlocked: true,
                popularity: 79,
                type: "free"
            },
            
            {
                id: 11,
                title: "Meditations",
                author: "Marcus Aurelius",
                description: "A series of personal writings by the Roman Emperor, outlining his Stoic philosophy...",
                expCost: 500,
                genre: "philosophy",
                category: "philosophy",
                cover: "images/book-covers/meditations.jpg",
                unlocked: false,
                popularity: 95,
                type: "premium",
                pdfFile: "./books/meditations.pdf"
            },
            {
                id: 12,
                title: "Deep Work",
                author: "Cal Newport",
                description: "Rules for focused success in a distracted world. Learn to master concentration...",
                expCost: 400,
                genre: "self-help",
                category: "self-help",
                cover: "images/book-covers/deep-work.jpg",
                unlocked: false,
                popularity: 88,
                type: "premium",
                pdfFile: "./books/deep-work.pdf"
            },
            {
                id: 13,
                title: "Thinking, Fast and Slow",
                author: "Daniel Kahneman",
                description: "Explore the two systems that drive the way we think—fast, intuitive, and slow, deliberate.",
                expCost: 600,
                genre: "non-fiction",
                category: "non-fiction",
                cover: "images/book-covers/thinking.jpg",
                unlocked: false,
                popularity: 92,
                type: "premium",
                pdfFile: "./books/thinking-fast-slow.pdf"
            },
            {
                id: 14,
                title: "Atomic Habits",
                author: "James Clear",
                description: "Tiny changes, remarkable results. Learn how to build good habits and break bad ones.",
                expCost: 450,
                genre: "self-help",
                category: "self-help",
                cover: "images/book-covers/atomic.jpg",
                unlocked: false,
                popularity: 90,
                type: "premium",
                pdfFile: "./books/atomic-habits.pdf"
            },
            {
                id: 15,
                title: "1984",
                author: "George Orwell",
                description: "A dystopian social science fiction novel about totalitarian control and thought control.",
                expCost: 550,
                genre: "fiction",
                category: "fiction",
                cover: "images/book-covers/1984.jpg",
                unlocked: false,
                popularity: 94,
                type: "premium",
                pdfFile: "./books/1984.pdf"
            }
        ];
    }

    initializeDatabase() {
    
    const existingUser = JSON.parse(localStorage.getItem('athena_user') || 'null');
    
    if (!existingUser) {
        console.log('No user found - guest mode');
        return;
    }
    
    
    const freeBooks = this.getFreeBooks();
    const freeBookIds = freeBooks.map(book => book.id);
    
    let needsUpdate = false;
    freeBookIds.forEach(bookId => {
        if (!existingUser.unlockedBooks.includes(bookId)) {
            existingUser.unlockedBooks.push(bookId);
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        localStorage.setItem('athena_user', JSON.stringify(existingUser));
        console.log('Updated user with free books');
    }
}

    
    getBookById(bookId) {
        return this.books.find(book => book.id === parseInt(bookId));
    }

    getAllBooks() {
        return this.books;
    }

    getBooksByCategory(category) {
        return this.books.filter(book => book.category === category);
    }

    getBooksByGenre(genre) {
        return this.books.filter(book => book.genre === genre);
    }

    getFreeBooks() {
        return this.books.filter(book => book.type === 'free');
    }

    getPremiumBooks() {
        return this.books.filter(book => book.type === 'premium');
    }

    getFeaturedBooks() {
        return this.books.filter(book => book.type === 'free' && book.category === 'featured');
    }

    getKidsBooks() {
        return this.books.filter(book => book.type === 'free' && book.category === 'kids');
    }

    
    isBookUnlocked(bookId) {
    const user = this.getCurrentUser();
    const book = this.getBookById(bookId);
    
    
    if (book && book.type === 'free') {
        return true;
    }
    
    
    return user.unlockedBooks && user.unlockedBooks.includes(parseInt(bookId));
}

    unlockBook(bookId) {
        const user = this.getCurrentUser();
        if (!user.unlockedBooks.includes(parseInt(bookId))) {
            user.unlockedBooks.push(parseInt(bookId));
            localStorage.setItem('athena_user', JSON.stringify(user));
        }
    }

    
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('athena_user')) || {};
    }

    updateUser(userData) {
        localStorage.setItem('athena_user', JSON.stringify(userData));
    }

    
    formatEXP(exp) {
        return exp.toLocaleString();
    }
}

window.BookDatabase = BookDatabase;
window.bookDB = new BookDatabase();

window.getBookById = (id) => window.bookDB.getBookById(id);
window.getAllBooks = () => window.bookDB.getAllBooks();
window.getBooksByCategory = (category) => window.bookDB.getBooksByCategory(category);
window.isBookUnlocked = (id) => window.bookDB.isBookUnlocked(id);
window.booksData = window.bookDB.getAllBooks();