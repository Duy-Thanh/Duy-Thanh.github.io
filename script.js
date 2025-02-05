function getQueryParam(param) {
    var search = window.location.search;
    var params = {};
    
    // Remove the '?' at the start
    if (search.charAt(0) === '?') {
        search = search.substring(1);
    }
    
    // Split into key/value pairs
    var pairs = search.split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params[param];
}

function continueAsGuest() {
    // First clear any existing cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });

    fetch(`${root_url}/api/guest`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            var redirect = getQueryParam('redirect');
            window.location.replace(redirect === 'files' ? '/files.html' : '/files.html');
        }
    })
    .catch(error => console.error('Guest login error:', error));
}

function handleLogin() {
    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value.trim();
    var messageElement = document.getElementById("message");
    
    fetch(`${root_url}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageElement.style.color = "green";
            messageElement.textContent = "Login successful!";
            
            // Add a small delay before redirecting
            setTimeout(function() {
                var redirect = getQueryParam('redirect');
                if (redirect === 'files') {
                    window.location.href = '/files.html';
                } else if (redirect === 'blog') {
                    window.location.href = '/blog.html';
                } else {
                    window.location.href = '/files.html';
                }
            }, 300);
        } else {
            messageElement.textContent = data.message || "Login failed";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageElement.textContent = "An error occurred. Please try again.";
    });
}

// Add event listener for form submission
window.onload = function() {
    var form = document.getElementById("loginForm");
    var guestAccess = document.querySelector('.guest-access');
    var loginMessage = document.getElementById('loginMessage');
    var guestMessage = document.getElementById('guestMessage');
    
    // Update UI based on redirect parameter
    if (getQueryParam('redirect') === 'blog') {
        if (guestAccess) {
            guestAccess.style.display = 'none';
        }
        if (guestMessage) {
            guestMessage.style.display = 'none';
        }
        if (loginMessage) {
            loginMessage.textContent = 'You need to log in to manage blog posts';
        }
    }

    if (form) {
        form.onsubmit = function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false; // For IE
            }
            handleLogin();
        };
    }
};
