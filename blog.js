// Polyfill for forEach on NodeList for IE11
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Utility function to get query parameters
function getQueryParams() {
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
    
    return params;
}

// Add these variables at the top
let isPolling = false;
let pollTimeoutId = null;
const POLL_INTERVAL = 3000; // 3 seconds
let lastPostsData = null;

// Initialize when the page loads
window.onload = function() {
    checkAuthStatus();
    
    // Check if we're editing a post
    var params = getQueryParams();
    var action = params['action'];
    var postId = params['id'];
    
    if (action === 'edit' && postId) {
        loadPostForEdit(postId);
        // Hide the posts section
        var postsSection = document.querySelector('.posts-section');
        if (postsSection) {
            postsSection.style.display = 'none';
        }
    } else {
        // Normal post list view
        loadPosts();
    }

    startPolling();
};

function checkAuthStatus() {
    fetch(`${root_url}/api/check-auth`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(response => {
        const userStatus = document.getElementById("userStatus");
        const postSection = document.getElementById("postSection");
        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");
        
        if (response.isAuthenticated === true) {
            userStatus.textContent = "Administrator";
            if (postSection) postSection.style.display = "block";
            if (loginBtn) loginBtn.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "inline-block";
            loadPosts();
        } else {
            userStatus.textContent = "";
            if (postSection) postSection.style.display = "none";
            if (loginBtn) {
                loginBtn.style.display = "inline-block";
                loginBtn.onclick = () => window.location.href = '/login.html?redirect=blog';
            }
            if (logoutBtn) logoutBtn.style.display = "none";
            loadPosts();
        }
    })
    .catch(error => console.error('Auth check error:', error));
}

function loadPosts() {
    const postList = document.getElementById('postList');
    if (!postList) return;

    postList.innerHTML = `
        <div class="loading animate-fade-in">
            <i class="fas fa-spinner fa-spin"></i>
            Loading posts...
        </div>
    `;

    fetch(`${root_url}/api/posts`, {
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load posts');
        return response.json();
    })
    .then(posts => {
        displayPosts(posts);
        lastPostsData = posts;
    })
    .catch(error => {
        console.error('Error:', error);
        postList.innerHTML = `
            <div class="error-message animate-fade-in">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load posts: ${error.message}</p>
                <button onclick="loadPosts()" class="btn btn-secondary">
                    <i class="fas fa-sync"></i>
                    Retry
                </button>
            </div>
        `;
    });
}

function displayPosts(posts) {
    const postList = document.getElementById('postList');
    if (!postList) return;

    // Get existing post IDs
    const existingPostIds = Array.from(postList.querySelectorAll('.post-card'))
        .map(el => el.dataset.postId);

    if (posts.length === 0) {
        postList.innerHTML = `
            <div class="no-posts animate-fade-in">
                <i class="fas fa-newspaper"></i>
                <p>No posts yet</p>
            </div>
        `;
        return;
    }

    const postsHtml = posts.map(post => {
        const isNew = !existingPostIds.includes(post.id);
        return createPostElement(post, isNew);
    }).join('');

    postList.innerHTML = postsHtml;
}

function formatDateTime(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function editPost(postId) {
    window.location.href = `/post.html?id=${postId}&edit=true`;
}

function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    fetch(`${root_url}/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete post');
        }
        showNotification('success', 'Success', 'Post deleted successfully');
        loadPosts(); // Reload the posts list
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Failed to delete post');
    });
}

function logout() {
    fetch(`${root_url}/api/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Clear any client-side cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        // Redirect regardless of response
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Still redirect on error after clearing cookies
        window.location.href = '/';
    });
}

function loadPostForEdit(postId) {
    fetch(`${root_url}/api/posts/${postId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(post => {
        document.getElementById('titleInput').value = post.title;
        document.getElementById('contentInput').innerHTML = post.content;
        
        const editorTitle = document.getElementById('editorTitle');
        if (editorTitle) {
            editorTitle.textContent = 'Edit Post';
        }
        
        if (typeof Prism !== 'undefined') {
            const codeBlocks = document.querySelectorAll('pre code');
            codeBlocks.forEach(block => Prism.highlightElement(block));
        }
        
        const postSection = document.getElementById('postSection');
        if (postSection) {
            postSection.style.display = 'block';
        }
        
        const form = document.getElementById('postForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                updatePost(e);
            };
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load post for editing');
    });
}

function updatePost(event) {
    event.preventDefault();
    
    const postId = new URLSearchParams(window.location.search).get('id');
    const title = document.getElementById('titleInput').value;
    const content = document.getElementById('contentInput').innerHTML;
    
    if (!title || !content) {
        showNotification('warning', 'Warning', 'Please fill in both title and content');
        return;
    }

    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    submitButton.disabled = true;

    fetch(`${root_url}/api/posts/${postId}`, {
        method: 'PUT', // Changed back to PUT from PATCH
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            title: title,
            content: content
        })
    })
    .then(async response => {
        const text = await response.text();
        console.log('Server response:', text);
        
        if (!response.ok) {
            throw new Error(text || `HTTP error! status: ${response.status}`);
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            if (text.includes('success') || response.ok) {
                return { success: true };
            }
            throw new Error('Invalid response format');
        }
    })
    .then(data => {
        console.log('Update successful:', data);
        showNotification('success', 'Success', 'Post updated successfully');
        // Redirect to the post view after successful update
        setTimeout(() => {
            window.location.href = `/post.html?id=${postId}`;
        }, 1500);
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification('error', 'Error', 'Failed to update post: ' + error.message);
    })
    .finally(() => {
        // Reset button state
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    });
}

function formatText(command) {
    document.execCommand(command, false, null);
}

function submitPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('titleInput').value;
    const content = document.getElementById('contentInput').innerHTML;
    
    if (!title || !content) {
        showNotification('warning', 'Warning', 'Please fill in both title and content');
        return;
    }

    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    submitButton.disabled = true;

    fetch(root_url + '/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            title: title,
            content: content
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => {
        showNotification('success', 'Success', 'Post published successfully');
        // Clear form
        document.getElementById('titleInput').value = '';
        document.getElementById('contentInput').innerHTML = '';
        // Reload posts
        loadPosts();
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'Error', error.message || 'Failed to publish post');
    })
    .finally(() => {
        // Reset button state
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    });
}

// Add notification function if not already present
function showNotification(type, title, message) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content notification-modal animate-in">
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                              type === 'warning' ? 'fa-exclamation-triangle' : 
                              type === 'error' ? 'fa-exclamation-circle' : 
                              'fa-info-circle'} notification-icon ${type}"></i>
            </div>
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="modal-buttons">
                <button onclick="this.closest('.modal').remove()" class="btn btn-primary">
                    <i class="fas fa-check"></i>
                    OK
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function insertCode() {
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);
    var selectedText = range.toString();
    
    if (!selectedText) {
        alert('Please select some text first');
        return;
    }
    
    // Create modal for language selection
    var modal = document.createElement('div');
    modal.className = 'code-language-modal';
    modal.innerHTML = 
        '<div class="modal-content">' +
            '<h4>Select Programming Language</h4>' +
            '<select class="language-select">' +
                '<option value="">Select language...</option>' +
                '<option value="javascript">JavaScript</option>' +
                '<option value="python">Python</option>' +
                '<option value="java">Java</option>' +
                '<option value="cpp">C++</option>' +
                '<option value="csharp">C#</option>' +
                '<option value="php">PHP</option>' +
                '<option value="ruby">Ruby</option>' +
                '<option value="html">HTML</option>' +
                '<option value="css">CSS</option>' +
                '<option value="sql">SQL</option>' +
            '</select>' +
            '<div class="modal-buttons">' +
                '<button class="ok-btn">OK</button>' +
                '<button class="cancel-btn">Cancel</button>' +
            '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
    var languageSelect = modal.querySelector('.language-select');
    
    modal.querySelector('.ok-btn').onclick = function() {
        var language = languageSelect.value;
        if (!language) {
            alert('Please select a language');
            return;
        }
        
        // Create the code block with Prism.js classes
        var pre = document.createElement('pre');
        pre.className = 'line-numbers';
        var code = document.createElement('code');
        code.className = 'language-' + language;
        
        // Process the text to preserve indentation and line breaks
        var processedText = selectedText
            .replace(/\r\n/g, '\n')  // Normalize line endings
            .replace(/\n/g, '\n')    // Ensure line breaks are preserved
            .replace(/\t/g, '    '); // Convert tabs to spaces
        
        code.textContent = processedText;
        pre.appendChild(code);
        
        // Replace the selected text with the code block
        range.deleteContents();
        range.insertNode(pre);
        
        // Add a line break after the code block
        var br = document.createElement('br');
        pre.parentNode.insertBefore(br, pre.nextSibling);
        
        // Initialize Prism highlighting
        Prism.highlightElement(code);
        
        // Remove modal
        document.body.removeChild(modal);
    };
    
    modal.querySelector('.cancel-btn').onclick = function() {
        document.body.removeChild(modal);
    };
}

function insertImage() {
    const url = prompt('Enter image URL:');
    if (!url) return;
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Image';
    
    const contentDiv = document.getElementById('contentInput');
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.insertNode(img);
}

function insertVideo() {
    var url = prompt('Enter video URL (YouTube or direct video file):');
    if (!url) return;
    
    var element;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Convert to embed URL
        var videoId = url.split('v=')[1] || url.split('/').pop();
        element = document.createElement('iframe');
        element.src = 'https://www.youtube.com/embed/' + videoId;
        element.width = '560';
        element.height = '315';
        element.frameBorder = '0';
        element.allowFullscreen = true;
    } else {
        element = document.createElement('video');
        element.src = url;
        element.controls = true;
        element.width = '560';
    }
    
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);
    range.insertNode(element);
}

function insertAudio() {
    const url = prompt('Enter audio URL:');
    if (!url) return;
    
    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.insertNode(audio);
}

// Add a variable to track current media type
var currentMediaType = 'image'; // Default to image

// Functions
function openFileModal(type) {
    currentMediaType = type;
    var modal = document.getElementById('fileModal');
    modal.style.display = 'flex';
    
    // Update file input accept attribute
    var mediaFileInput = document.getElementById('mediaFileInput');
    if (mediaFileInput) {
        switch(type) {
            case 'image':
                mediaFileInput.accept = 'image/*';
                break;
            case 'video':
                mediaFileInput.accept = 'video/*';
                break;
            case 'audio':
                mediaFileInput.accept = 'audio/*';
                break;
        }
    }
    
    // Update modal title immediately
    updateModalTitle();
    
    // Load media files with a small delay to ensure modal is visible
    setTimeout(function() {
        loadMediaFiles();
    }, 100);
}

function closeFileModal() {
    var modal = document.getElementById('fileModal');
    if (modal) {
        modal.style.display = 'none';
        // Clear the file list when closing
        var mediaList = document.getElementById('mediaFileList');
        if (mediaList) {
            mediaList.innerHTML = '';
        }
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // File input change handler
    var mediaFileInput = document.getElementById('mediaFileInput');
    if (mediaFileInput) {
        mediaFileInput.onchange = function(e) {
            var fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
            document.querySelector('.file-name-display').textContent = fileName;
        };
    }

    // Form submission handler
    var mediaUploadForm = document.getElementById('mediaUploadForm');
    if (mediaUploadForm) {
        mediaUploadForm.onsubmit = function(e) {
            e.preventDefault();
            
            var fileInput = document.getElementById('mediaFileInput');
            if (!fileInput.files[0]) {
                alert('Please select a file first');
                return;
            }
            
            var formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', root_url + "/api/blog-media/upload", true);

            xhr.onload = function() {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        // Reset the form
                        fileInput.value = '';
                        document.querySelector('.file-name-display').textContent = 'No file chosen';
                        
                        // Insert the uploaded file
                        insertMediaFile({ name: response.filename });
                        
                        // Reload media files list
                        loadMediaFiles();
                    } else {
                        alert('Upload failed: ' + (response.message || 'Unknown error'));
                    }
                } else {
                    alert('Upload failed: ' + xhr.statusText);
                }
            };
            
            xhr.onerror = function() {
                alert('Upload failed: Network Error');
            };
            
            xhr.send(formData);
        };
    }
});

function loadMediaFiles() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', root_url + "/api/files", true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                var files = JSON.parse(xhr.responseText);
                displayMediaFiles(files);
            } catch (error) {
                console.error('Error parsing files:', error);
                document.getElementById('mediaFileList').innerHTML = 'Error loading files';
            }
        } else {
            document.getElementById('mediaFileList').innerHTML = 'Error loading files';
        }
    };
    
    xhr.onerror = function() {
        document.getElementById('mediaFileList').innerHTML = 'Error loading files';
    };
    
    xhr.send();
}

function displayMediaFiles(files) {
    var mediaList = document.getElementById('mediaFileList');
    if (!mediaList) return;
    
    mediaList.innerHTML = '<div class="loading">Loading ' + currentMediaType + ' files...</div>';
    
    // Filter for blog media files and current media type
    files = files.filter(function(file) {
        if (file.name.indexOf('blog_media_') !== 0) return false;
        
        switch(currentMediaType) {
            case 'image':
                return file.name.match(/\.(jpg|jpeg|png|gif|ico|bmp|webp)$/i);
            case 'video':
                return file.name.match(/\.(mp4|webm|ogg|mov|avi)$/i);
            case 'audio':
                return file.name.match(/\.(mp3|wav|ogg|m4a)$/i);
            default:
                return false;
        }
    });
    
    // Clear loading message
    mediaList.innerHTML = '';
    
    if (files.length === 0) {
        mediaList.innerHTML = '<div class="no-files">No ' + currentMediaType + ' files found</div>';
        return;
    }
    
    files.forEach(function(file) {
        var item = document.createElement('div');
        item.className = 'media-item';
        
        var previewContainer = document.createElement('div');
        previewContainer.className = 'media-preview-container';
        
        // Create preview based on media type
        if (currentMediaType === 'image') {
            var img = document.createElement('img');
            img.src = root_url + "/api/files/download/" + file.name;
            img.className = 'media-preview';
            img.alt = file.name.replace('blog_media_', '');
            previewContainer.appendChild(img);
        } else if (currentMediaType === 'video') {
            var video = document.createElement('video');
            video.src = root_url + "/api/files/download/" + file.name;
            video.className = 'media-preview';
            previewContainer.appendChild(video);
        } else if (currentMediaType === 'audio') {
            var icon = document.createElement('i');
            icon.className = 'fas fa-music media-preview-icon';
            previewContainer.appendChild(icon);
        }
        
        var nameDiv = document.createElement('div');
        nameDiv.className = 'media-name';
        nameDiv.textContent = file.name.replace('blog_media_', '');
        
        item.appendChild(previewContainer);
        item.appendChild(nameDiv);
        
        item.addEventListener('click', function() {
            insertMediaFile(file);
        });
        
        mediaList.appendChild(item);
    });
}

// Separate function to handle media insertion
function insertMediaFile(file) {
    var contentInput = document.getElementById('contentInput');
    if (!contentInput) return;
    
    var element = null;
    var fileUrl = root_url + "/api/files/download/" + file.name;

    // Create element based on file type - expanded file type support
    if (file.name.match(/\.(jpg|jpeg|png|gif|ico|bmp|webp)$/i)) {
        element = document.createElement('img');
        element.src = fileUrl;
        element.alt = file.name.replace('blog_media_', '');
        element.className = 'media-content'; // Add class for styling
    } else if (file.name.match(/\.(mp4|webm|ogg|mov|avi)$/i)) {
        element = document.createElement('video');
        element.src = fileUrl;
        element.controls = true;
        element.className = 'media-content';
    } else if (file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        element = document.createElement('audio');
        element.src = fileUrl;
        element.controls = true;
        element.className = 'media-content';
    }
    
    // Check if element was created successfully
    if (!element) {
        console.error('Could not create element for file:', file);
        alert('Unsupported file type. Please use image, video, or audio files.');
        return;
    }
    
    // Get current selection or create new one
    var selection = window.getSelection();
    var range;
    
    try {
        range = selection.getRangeAt(0);
    } catch (e) {
        range = document.createRange();
        range.selectNodeContents(contentInput);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // Function to handle the actual insertion
    function insertElement() {
        // Insert the media element
        range.insertNode(element);
        
        // Add a line break
        var br = document.createElement('br');
        range = document.createRange();
        range.setStartAfter(element);
        range.collapse(true);
        range.insertNode(br);
        
        // Update selection
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Close modal
        closeFileModal();
    }
    
    // Handle different types of media
    if (element instanceof HTMLImageElement) {
        element.onload = insertElement;
        element.onerror = function() {
            console.error('Failed to load image:', fileUrl);
            alert('Failed to load image file');
        };
    } else if (element instanceof HTMLVideoElement) {
        element.onloadedmetadata = insertElement;
        element.onerror = function() {
            console.error('Failed to load video:', fileUrl);
            alert('Failed to load video file');
        };
    } else {
        // For audio or other elements, insert immediately
        insertElement();
    }
}

// Update the modal title based on media type
function updateModalTitle() {
    var modalTitle = document.querySelector('.modal-header h3');
    if (modalTitle) {
        modalTitle.textContent = currentMediaType.charAt(0).toUpperCase() + 
                               currentMediaType.slice(1) + ' Files';
    }
}

// Add this function to clean up content
function cleanupContent(content) {
    // Create a temporary div to handle HTML content
    var temp = document.createElement('div');
    temp.innerHTML = content;
    
    // Fix code blocks
    temp.querySelectorAll('pre code').forEach(function(block) {
        // Ensure proper class names
        if (!block.className.includes('language-')) {
            block.className = 'language-plaintext';
        }
        // Clean up content
        block.textContent = block.textContent
            .replace(/\u200B/g, '') // Remove zero-width spaces
            .replace(/\u00A0/g, ' '); // Replace non-breaking spaces
    });
    
    // Fix pre elements
    temp.querySelectorAll('pre').forEach(function(pre) {
        if (!pre.className.includes('line-numbers')) {
            pre.className = 'line-numbers';
        }
    });
    
    return temp.innerHTML;
}

// Add event listener for content changes
document.addEventListener('DOMContentLoaded', function() {
    var contentInput = document.getElementById('contentInput');
    if (contentInput) {
        contentInput.addEventListener('input', function() {
            // Re-highlight code blocks when content changes
            var codeBlocks = this.querySelectorAll('pre code');
            for (var i = 0; i < codeBlocks.length; i++) {
                Prism.highlightElement(codeBlocks[i]);
            }
        });
        
        // Handle paste events to preserve formatting for IE11
        contentInput.addEventListener('paste', function(e) {
            e.preventDefault();
            var text;
            
            // Handle clipboard data for IE11 and modern browsers
            if (window.clipboardData && window.clipboardData.getData) {
                // For IE11
                text = window.clipboardData.getData('Text');
            } else if (e.clipboardData && e.clipboardData.getData) {
                // For modern browsers
                text = e.clipboardData.getData('text/plain');
            } else {
                // Fallback
                text = '';
            }
            
            // Insert text at cursor position
            if (document.selection) {
                // For IE11
                var range = document.selection.createRange();
                range.text = text;
            } else if (window.getSelection) {
                // For modern browsers
                var range = window.getSelection().getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
            }
        });
    }
});

// Add the createPostElement function
function createPostElement(post, isNew = false) {
    // Format the date using 'created' field
    let dateStr = 'Date unknown';
    try {
        if (post.created) {
            const date = new Date(post.created);
            if (!isNaN(date.getTime())) {
                dateStr = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }
        
        // Debug log to see what date field we have
        console.log('Post date data:', {
            created: post.created,
            modified: post.modified,
            date: dateStr
        });
        
    } catch (e) {
        console.error('Date parsing error:', e, post);
    }

    return `
        <div class="post-card ${isNew ? 'new-post' : ''}" 
             data-post-id="${post.id}" 
             style="animation-delay: ${Math.random() * 0.3}s">
            <div class="post-header">
                <h2 class="post-title">
                    <a href="/post.html?id=${post.id}">${post.title}</a>
                </h2>
                <div class="post-meta">
                    <span class="post-date" title="${dateStr}">
                        <i class="far fa-calendar-alt"></i>
                        ${dateStr}
                    </span>
                    ${post.modified ? `
                        <span class="post-modified" title="Last modified">
                            <i class="fas fa-edit"></i>
                            ${formatDateTime(post.modified)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="post-preview">
                ${createPostPreview(post.content)}
            </div>
            <div class="post-footer">
                <a href="/post.html?id=${post.id}" class="btn btn-secondary">
                    <i class="fas fa-book-reader"></i>
                    Read More
                </a>
                ${post.isAuthor ? `
                    <div class="post-actions">
                        <button onclick="editPost('${post.id}')" class="btn btn-icon" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deletePost('${post.id}')" class="btn btn-icon danger" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Add helper function to create post preview
function createPostPreview(content) {
    // Create a temporary div to parse HTML content
    const temp = document.createElement('div');
    temp.innerHTML = content;
    
    // Remove any script tags for security
    temp.querySelectorAll('script').forEach(script => script.remove());
    
    // Get text content
    let text = temp.textContent || temp.innerText;
    
    // Truncate to 200 characters
    if (text.length > 200) {
        text = text.substring(0, 200) + '...';
    }
    
    return `<p class="preview-text">${text}</p>`;
}

// Add polling functions
function startPolling() {
    isPolling = true;
    pollForUpdates();
}

function pollForUpdates() {
    if (!isPolling) return;

    fetch(`${root_url}/api/posts`, {
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(posts => {
        if (hasPostsChanged(posts)) {
            displayPosts(posts);
            lastPostsData = posts;
        }
    })
    .catch(error => {
        console.error('Polling error:', error);
    })
    .finally(() => {
        if (isPolling) {
            pollTimeoutId = setTimeout(pollForUpdates, POLL_INTERVAL);
        }
    });
}

function hasPostsChanged(newPosts) {
    if (!lastPostsData) return true;
    
    // Compare post IDs and modification times
    const currentPosts = JSON.stringify(newPosts.map(p => ({
        id: p.id,
        modified: p.modified,
        title: p.title
    })));
    
    const lastPosts = JSON.stringify(lastPostsData.map(p => ({
        id: p.id,
        modified: p.modified,
        title: p.title
    })));
    
    return currentPosts !== lastPosts;
}

// Add cleanup on page unload
window.onbeforeunload = function() {
    isPolling = false;
    if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
    }
};