// books.js - Single source of truth for all books
const booksData = [
    {
        id: 1,
        title: "Pride and Prejudice",
        author: "Jane Austen",
        description: "Set in early 19th-century England, the novel follows the Bennet family, particularly the five unmarried daughters, as they navigate societal pressures to marry well, with Elizabeth ultimately choosing marriage based on mutual respect and affection rather than wealth or convenience.",
        cover: "images/prideandprejudice.jpg",
        pdfFile: "./books/pride-and-prejudice.pdf",
        category: "featured",
        expCost: 0 // Free for now
    },
    {
        id: 2,
        title: "A Man Called Ove",
        author: "Fredrik Backman",
        description: "A story about a grumpy, isolated 59-year-old widower named Ove...",
        cover: "images/amancalledove.jpg",
        pdfFile: "./books/man-called-ove.pdf",
        category: "featured",
        expCost: 0
    },
    {
        id: 3,
        title: "The Brothers Karamazov",
        author: "Fyodor Dostoevsky",
        description: "A philosophical novel by Fyodor Dostoevsky that explores profound questions...",
        cover: "images/thebrotherskarmazov.jpeg",
        pdfFile: "./books/the-brothers-karamazov.pdf",
        category: "featured",
        expCost: 0
    },
    {
        id: 4,
        title: "The Song of Achilles",
        author: "Madeline Miller",
        description: "The Song of Achilles is a retelling of the Trojan War...",
        cover: "images/songsofachilles.jpeg",
        pdfFile: "./books/song-of-achilles.pdf",
        category: "featured",
        expCost: 0
    },
    {
        id: 5,
        title: "How Do You Live?",
        author: "Yoshino Genzaburo",
        description: "After the death of Koperu's father, a bank executive...",
        cover: "images/howdoyoulive.jpeg",
        pdfFile: "./books/how-do-you-live.pdf",
        category: "featured",
        expCost: 0
    },
    {
        id: 6,
        title: "The Gruffalo",
        author: "Julia Donaldson",
        description: "A small, clever mouse who takes a walk through a deep, dark wood...",
        cover: "images/thegrufallo.jpeg",
        pdfFile: "./books/the-gruffalo.pdf",
        category: "kids",
        expCost: 0
    },
    {
        id: 7,
        title: "Hansel and Gretel",
        author: "Brothers Grimm",
        description: "The story follows two siblings, Hansel and Gretel...",
        cover: "images/hanselgretel.jpeg",
        pdfFile: "./books/hansel-and-gretel.pdf",
        category: "kids",
        expCost: 0
    },
    {
        id: 8,
        title: "Jack and the Beanstalk",
        author: "English Folktale",
        description: "English fairy tale about a poor boy named Jack...",
        cover: "images/beanstalk.jpeg",
        pdfFile: "./books/jack-and-the-beanstalk.pdf",
        category: "kids",
        expCost: 0
    },
    {
        id: 9,
        title: "The Ugly Duckling",
        author: "Hans Christian Andersen",
        description: "The story follows a duckling born in a barnyard...",
        cover: "images/uglyduckling.jpeg",
        pdfFile: "./books/the-ugly-duckling.pdf",
        category: "kids",
        expCost: 0
    },
    {
        id: 10,
        title: "The Tortoise and the Hare",
        author: "Aesop's Fable",
        description: "Tells the story of a race between a slow-moving tortoise...",
        cover: "images/tortoise.jpeg",
        pdfFile: "./books/the-tortoise-and-the-hare.pdf",
        category: "kids",
        expCost: 0
    }
];

// Utility functions
function getBookById(bookId) {
    return booksData.find(book => book.id === parseInt(bookId));
}

function getAllBooks() {
    return booksData;
}

function getBooksByCategory(category) {
    return booksData.filter(book => book.category === category);
}

function isBookUnlocked(bookId) {
    return true; // All books unlocked for now
}

// Make functions globally available
window.getBookById = getBookById;
window.getAllBooks = getAllBooks;
window.getBooksByCategory = getBooksByCategory;
window.isBookUnlocked = isBookUnlocked;
window.booksData = booksData;