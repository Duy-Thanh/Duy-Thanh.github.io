const root_url = "https://3.27.30.118";
const xhr_options = {
    credentials: 'include',  // This enables sending cookies with requests
    headers: {
        'Content-Type': 'application/json'
    },
    mode: 'cors'            // This enables CORS
};

// Add this function to check if cookies are enabled
function checkCookiesEnabled() {
    try {
        document.cookie = "testcookie=1";
        var ret = document.cookie.indexOf("testcookie=") !== -1;
        document.cookie = "testcookie=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
        return ret;
    } catch (e) {
        return false;
    }
}

// Add this function to handle guest login blocking
function continueAsGuest_Modal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content animate-in">
            <h3>
                <i class="fas fa-exclamation-circle" style="color: var(--warning)"></i>
                Guest Access Disabled
            </h3>
            <p>From 2/6/2025, the Guest login to access File System will be disabled. This feature is used for Admin only. Please use your own account which have Administrator role to access the File System.</p>
            <div class="modal-buttons">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-check"></i>
                    I Understand
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Prevent default navigation
    return false;
}

// Header scroll effect
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    
    function handleScroll() {
        if (window.scrollY > 50) {
            header.classList.add('collapsed');
        } else {
            header.classList.remove('collapsed');
        }
    }

    // // Optimized scroll handler with requestAnimationFrame
    // let ticking = false;
    // window.addEventListener('scroll', () => {
    //     if (!ticking) {
    //         requestAnimationFrame(() => {
    //             handleScroll();
    //             ticking = false;
    //         });
    //         ticking = true;
    //     }
    // }, { passive: true });

    // Initial check
    handleScroll();
    
    // Set active nav item
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-controls .btn').forEach(btn => {
        const href = btn.getAttribute('href');
        if (href && currentPath.includes(href.replace('/', ''))) {
            btn.classList.add('active');
        }
    });
    
    // Update user status styling
    const userStatus = document.getElementById('userStatus');
    if (userStatus && userStatus.textContent.includes('Administrator')) {
        userStatus.classList.add('admin');
        userStatus.innerHTML = '<i class="fas fa-user-shield"></i> ' + userStatus.textContent;
    }
});