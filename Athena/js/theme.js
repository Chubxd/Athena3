const body = document.querySelector('body'),
    sidebar = document.querySelector('.sidebar'),
    toggle = document.querySelector('.toggle'),
    searchBtn = document.querySelector('.search-box'),
    modeSwitch = document.querySelector('.toggle-switch'),
    modeText = document.querySelector('.mode-text');


function initializeTheme() {
    const savedTheme = localStorage.getItem('athena_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }
    
    updateThemeText();
}


function updateThemeText() {
    if (modeText) {
        if (body.classList.contains('dark')) {
            modeText.innerText = "Light mode";
        } else {
            modeText.innerText = "Dark mode";
        }
    }
    
    
    const allThemeTexts = document.querySelectorAll('.mode-text');
    allThemeTexts.forEach(text => {
        if (body.classList.contains('dark')) {
            text.innerText = "Light mode";
        } else {
            text.innerText = "Dark mode";
        }
    });
}


function toggleTheme() {
    body.classList.toggle('dark');
    
    
    const isDark = body.classList.contains('dark');
    localStorage.setItem('athena_theme', isDark ? 'dark' : 'light');
    
    updateThemeText();
    
    
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { isDark: isDark }
    }));
    
    
    if (window.showNotification) {
        showNotification(`Switched to ${isDark ? 'Dark' : 'Light'} Mode`, 'info');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    
    
    if (toggle) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("close");
        });
    }

    if (modeSwitch) {
        modeSwitch.addEventListener("click", toggleTheme);
    }

    
    window.addEventListener('themeChanged', function(e) {
        updateThemeText();
    });
});


window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;


function setupThemeToggle(buttonElement, textElement) {
    if (buttonElement) {
        buttonElement.addEventListener('click', toggleTheme);
    }
    if (textElement) {
        
        if (body.classList.contains('dark')) {
            textElement.innerText = "Light Mode";
        } else {
            textElement.innerText = "Dark Mode";
        }
    }
}


document.addEventListener('DOMContentLoaded', function() {
    
    const accountThemeBtn = document.getElementById('toggle-theme-btn');
    const accountThemeText = document.getElementById('current-theme');
    
    if (accountThemeBtn) {
        accountThemeBtn.addEventListener('click', toggleTheme);
    }
    if (accountThemeText) {
        if (body.classList.contains('dark')) {
            accountThemeText.textContent = "Dark Mode";
        } else {
            accountThemeText.textContent = "Light Mode";
        }
    }
    
    
    const readerThemeBtn = document.getElementById('toggle-theme');
    if (readerThemeBtn) {
        readerThemeBtn.addEventListener('click', toggleTheme);
    }
});