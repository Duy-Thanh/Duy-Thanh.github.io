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

    var xhr = new XMLHttpRequest();
    xhr.open("POST", root_url + "/api/guest", true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // Check for redirect parameter using IE11 compatible method
                var redirect = getQueryParam('redirect');
                
                // Redirect based on parameter or default to files
                window.location.replace(redirect === 'files' ? '/files.html' : '/files.html');
            }
        }
    };
    
    xhr.send(JSON.stringify({}));
}

function handleLogin() {
    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value.trim();
    var messageElement = document.getElementById("message");
    
    var xhr = new XMLHttpRequest();
    xhr.open("POST", root_url + "/api/login", true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            try {
                var data = JSON.parse(xhr.responseText);
                if (data.success) {
                    messageElement.style.color = "green";
                    messageElement.textContent = "Login successful!";
                    
                    // Add a small delay before redirecting to ensure session is set
                    setTimeout(function() {
                        var redirect = getQueryParam('redirect');
                        if (redirect === 'files') {
                            window.location.href = '/files.html';
                        } else if (redirect === 'blog') {
                            window.location.href = '/blog.html';
                        } else {
                            window.location.href = '/files.html';
                        }
                    }, 300); // 300ms delay
                } else {
                    messageElement.textContent = data.message || "Login failed";
                }
            } catch (error) {
                messageElement.textContent = "An error occurred. Please try again.";
            }
        }
    };

    xhr.send(JSON.stringify({
        username: username,
        password: password
    }));
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
