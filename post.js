window.onload = function() {
    checkAuthStatus();
    loadPost();
};

function getPostId() {
    var search = window.location.search;
    var params = {};
    
    if (search.charAt(0) === '?') {
        search = search.substring(1);
    }
    
    var pairs = search.split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params['id'];
}

function loadPost() {
    var postId = getPostId();
    if (!postId) {
        window.location.href = '/blog.html';
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", root_url + "/api/posts/" + postId, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var post = JSON.parse(xhr.responseText);
                    displayPost(post);
                } catch (e) {
                    displayError("Error parsing post data");
                }
            } else {
                displayError("Error loading post: " + xhr.statusText);
            }
        }
    };
    xhr.onerror = function() {
        displayError("Network error occurred");
    };
    xhr.send();
}

function displayPost(post) {
    if (!post || !post.title || !post.content) {
        displayError("Invalid post data");
        return;
    }
    
    document.title = post.title + " - Blog Post";
    document.getElementById('postTitle').textContent = post.title;
    
    var contentDiv = document.getElementById('postContent');
    contentDiv.innerHTML = post.content;
    
    // Initialize Prism.js highlighting
    if (typeof Prism !== 'undefined') {
        // Highlight all code blocks
        var codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(function(block) {
            Prism.highlightElement(block);
        });
    }
    
    var metaDiv = document.getElementById('postMeta');
    metaDiv.innerHTML = 'Posted: ' + formatDateTime(post.created) + 
                       (post.modified && post.modified !== post.created ? 
                       '<br>Last Modified: ' + formatDateTime(post.modified) : '');
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", root_url + "/api/check-auth", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.isAuthenticated) {
                document.getElementById('postControls').style.display = 'flex';
            }
        }
    };
    xhr.send();
}

function checkAuthStatus() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", root_url + "/api/check-auth", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var controls = document.getElementById("postControls");
            if (response.isAuthenticated === true && controls) {
                controls.style.display = "flex";
            }
        }
    };
    xhr.send();
}

function formatDateTime(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function editPost() {
    var postId = getPostId();
    window.location.href = '/blog.html?action=edit&id=' + postId;
}

function deletePost() {
    var postId = getPostId();
    if (confirm('Are you sure you want to delete this post?')) {
        var xhr = new XMLHttpRequest();
        xhr.open("DELETE", root_url + "/api/posts/" + postId, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                window.location.href = '/blog.html';
            }
        };
        xhr.send();
    }
}

function displayError(message) {
    document.title = "Error - Blog Post";
    document.getElementById('postTitle').textContent = "Error";
    document.getElementById('postContent').textContent = message;
    document.getElementById('postMeta').textContent = "";
    
    var controls = document.getElementById("postControls");
    if (controls) {
        controls.style.display = "none";
    }
}