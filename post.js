let clientIp = null;
let isPolling = false;
let isAdmin = false;
let lastPostData = null; // Cache last post data
const POLL_INTERVAL = 3000; // 3 seconds
let pollTimeoutId = null;

window.onload = function() {
    // Immediately hide all admin controls
    document.querySelectorAll('.admin-only').forEach(element => {
        element.style.display = 'none';
    });
    
    checkAuthStatus().then(() => {
        getClientIp();
        loadPost();
        startPolling();
    });
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

function getClientIp() {
    fetch(`${root_url}/api/client-ip`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        clientIp = data.ip;
    })
    .catch(error => console.error('Error getting client IP:', error));
}

function loadPost() {
    const postId = getPostId();
    if (!postId) {
        displayError('No post ID specified');
        return;
    }

    checkAuthStatus().then(() => {
        fetch(`${root_url}/api/posts/${postId}`, {
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(post => {
            displayPost(post);
        })
        .catch(error => {
            console.error('Error:', error);
            displayError('Failed to load post: ' + error.message);
        });
    });
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
        var codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(function(block) {
            Prism.highlightElement(block);
        });
    }
    
    var metaDiv = document.getElementById('postMeta');
    if (metaDiv) {
        metaDiv.innerHTML = 'Posted: ' + formatDateTime(post.created) + 
                           (post.modified ? '<br>Last Modified: ' + formatDateTime(post.modified) : '');
    }

    // Update reaction counts and active states
    const reactions = ['like', 'heart', 'star'];
    reactions.forEach(type => {
        const button = document.querySelector(`[data-reaction="${type}"]`);
        const countSpan = document.getElementById(`${type}Count`);
        if (button && countSpan) {
            countSpan.textContent = post[type + 's'] || 0;
            if (clientIp && post.reactions?.[type]?.[clientIp]) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });

    // Display comments
    const commentsList = document.getElementById('commentsList');
    if (commentsList && post.comments) {
        const commentsHtml = post.comments.length > 0 
            ? post.comments.map(comment => `
                <div class="comment" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <div class="comment-author">${comment.author || 'Anonymous'}</div>
                        <div class="comment-date">${formatDateTime(comment.created)}</div>
                        ${comment.deleted 
                            ? '<div class="comment-deleted">This comment has been deleted by administrator</div>'
                            : `<div class="comment-content">${comment.content}</div>`
                        }
                    </div>
                    ${isAdmin && !comment.deleted ? `
                        <div class="comment-actions admin-only">
                            <button onclick="deleteComment('${comment.id}')" class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('')
            : '<div class="no-comments">No comments yet</div>';

        commentsList.innerHTML = commentsHtml;
    }

    // Update admin controls visibility
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = isAdmin ? 'flex' : 'none';
    });

    lastPostData = post; // Cache initial data
}

function checkAuthStatus() {
    return fetch(`${root_url}/api/check-auth`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        isAdmin = data.isAuthenticated && !data.isGuest; // More strict check
        
        // Update user status display
        const userStatus = document.getElementById('userStatus');
        if (userStatus) {
            userStatus.textContent = isAdmin ? 'Administrator' : 'Not logged in';
        }

        // Hide/show all admin controls
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = isAdmin ? 'flex' : 'none';
        });

        // Also remove onclick handlers if not admin
        if (!isAdmin) {
            document.querySelectorAll('.admin-only button').forEach(button => {
                button.onclick = null;
            });
        }

        return data;
    })
    .catch(error => {
        console.error('Auth status error:', error);
        isAdmin = false;
        // Hide all admin controls on error
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'none';
        });
    });
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
    const postId = getPostId();
    if (confirm('Are you sure you want to delete this post?')) {
        fetch(`${root_url}/api/posts/${postId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/blog.html';
            } else {
                throw new Error('Delete failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showModal('Delete failed: ' + error.message, 'Error', 'error');
        });
    }
}

function displayError(message) {
    document.title = "Error - Blog Post";
    document.getElementById('postTitle').textContent = "Error";
    document.getElementById('postContent').textContent = message;
    document.getElementById('postMeta').textContent = "";
    
    // Hide all interactive elements for deleted/error posts
    const elementsToHide = [
        '.reactions-section',
        '.comments-section',
        '.admin-only'
    ];
    
    elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.style.display = 'none');
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

// Update reaction handling
function handleReaction(type) {
    const button = document.querySelector(`[data-reaction="${type}"]`);
    if (button.classList.contains('disabled')) {
        showModal('Please wait before reacting again', 'Notice', 'info');
        return;
    }

    // Disable all reaction buttons temporarily
    document.querySelectorAll('.reaction-btn').forEach(btn => btn.classList.add('disabled'));

    const postId = getPostId();
    fetch(`${root_url}/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to add reaction');
        return response.json();
    })
    .then(data => {
        // Update counts and active states
        Object.entries(data.userReactions).forEach(([reactionType, isActive]) => {
            const btn = document.querySelector(`[data-reaction="${reactionType}"]`);
            if (btn) {
                btn.classList.toggle('active', isActive);
            }
            const countSpan = document.getElementById(`${reactionType}Count`);
            if (countSpan) {
                countSpan.textContent = data[reactionType + 's'] || 0;
            }
        });
    })
    .catch(error => {
        console.error('Reaction error:', error);
        showModal('Failed to add reaction', 'Error', 'error');
    })
    .finally(() => {
        // Re-enable all reaction buttons
        document.querySelectorAll('.reaction-btn').forEach(btn => btn.classList.remove('disabled'));
    });
}

// Add comment submission
function submitComment() {
    const postId = getPostId();
    const content = document.getElementById('commentInput').value;
    const author = document.getElementById('commentName').value;

    if (!content.trim()) {
        showModal('Please write a comment', 'Notice', 'warning');
        return;
    }

    fetch(`${root_url}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            content: content.trim(),
            author: author.trim() || 'Anonymous'
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to post comment');
        return response.json();
    })
    .then(() => {
        document.getElementById('commentInput').value = '';
        document.getElementById('commentName').value = '';
        loadPost();
        showModal('Comment posted successfully!', 'Success', 'success');
    })
    .catch(error => {
        console.error('Comment error:', error);
        showModal('Failed to post comment', 'Error', 'error');
    });
}

// Add polling mechanism
function startPolling() {
    if (!isPolling) {
        isPolling = true;
        pollForUpdates();
    }
}

function stopPolling() {
    isPolling = false;
    if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
        pollTimeoutId = null;
    }
}

function pollForUpdates() {
    if (!isPolling) return;

    const postId = getPostId();
    if (!postId) return;

    fetch(`${root_url}/api/posts/${postId}`, {
        credentials: 'include'
    })
    .then(response => {
        if (response.status === 404) {
            // Post was deleted
            showModal('This post has been deleted', 'Post Deleted', 'warning');
            setTimeout(() => {
                window.location.href = '/blog.html';
            }, 2000);
            return;
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(post => {
        if (!post) return; // Post was deleted case
        
        if (hasContentChanged(post)) {
            displayPost(post);
            lastPostData = post;
        }
    })
    .catch(error => {
        console.error('Polling error:', error);
        if (error.message.includes('404')) {
            // Additional 404 check
            showModal('This post has been deleted', 'Post Deleted', 'warning');
            setTimeout(() => {
                window.location.href = '/blog.html';
            }, 2000);
            return;
        }
    })
    .finally(() => {
        if (isPolling) {
            pollTimeoutId = setTimeout(pollForUpdates, POLL_INTERVAL);
        }
    });
}

// Update hasContentChanged to handle deleted posts
function hasContentChanged(newPost) {
    if (!lastPostData) return true;
    if (!newPost) return true; // Post was deleted

    // Compare reactions
    const reactionTypes = ['likes', 'hearts', 'stars'];
    const reactionsChanged = reactionTypes.some(type => 
        newPost[type] !== lastPostData[type]
    );

    // Compare comments
    const commentsChanged = JSON.stringify(newPost.comments) !== JSON.stringify(lastPostData.comments);

    return reactionsChanged || commentsChanged;
}

function updateReactionsAndComments(post) {
    // Update reaction counts and states
    const reactions = ['like', 'heart', 'star'];
    reactions.forEach(type => {
        const button = document.querySelector(`[data-reaction="${type}"]`);
        const countSpan = document.getElementById(`${type}Count`);
        if (button && countSpan) {
            // Only update if count has changed
            const newCount = post[type + 's'] || 0;
            if (countSpan.textContent !== newCount.toString()) {
                countSpan.textContent = newCount;
                // Add a brief highlight animation
                countSpan.classList.add('highlight');
                setTimeout(() => countSpan.classList.remove('highlight'), 1000);
            }
            
            if (clientIp && post.reactions?.[type]?.[clientIp]) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });

    // Update comments
    const commentsList = document.getElementById('commentsList');
    if (commentsList && post.comments) {
        // Get current comment IDs
        const currentCommentIds = Array.from(commentsList.querySelectorAll('.comment'))
            .map(el => el.dataset.commentId);
        
        // Check if any comments were deleted or modified
        const hasChanges = post.comments.some(comment => {
            const existingComment = commentsList.querySelector(`[data-comment-id="${comment.id}"]`);
            return !existingComment || 
                   (existingComment && comment.deleted !== existingComment.classList.contains('deleted')) ||
                   (existingComment && !comment.deleted && existingComment.querySelector('.comment-content')?.textContent !== comment.content);
        });

        // Only update if there are changes
        if (hasChanges) {
            const newCommentsHtml = post.comments.length > 0 
                ? post.comments.map(comment => `
                    <div class="comment ${comment.deleted ? 'deleted' : ''}" data-comment-id="${comment.id}">
                        <div class="comment-header">
                            <div class="comment-author">${comment.author || 'Anonymous'}</div>
                            <div class="comment-date">${formatDateTime(comment.created)}</div>
                            ${comment.deleted 
                                ? '<div class="comment-deleted">This comment has been deleted by administrator</div>'
                                : `<div class="comment-content">${comment.content}</div>`
                            }
                        </div>
                        ${isAdmin && !comment.deleted ? `
                            <div class="comment-actions">
                                <button onclick="deleteComment('${comment.id}')" class="btn btn-danger btn-sm">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')
                : '<div class="no-comments">No comments yet</div>';

            commentsList.innerHTML = newCommentsHtml;
        }
    }
}

// Clean up when leaving the page
window.onbeforeunload = function() {
    isPolling = false;
    if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
    }
};

// Add function to delete comments
function deleteComment(commentId) {
    showModal(
        'Are you sure you want to delete this comment?', 
        'Confirm Delete', 
        'warning',
        `
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-danger" onclick="confirmDeleteComment('${commentId}')">Delete</button>
        `
    );
}

function confirmDeleteComment(commentId) {
    const postId = getPostId();
    fetch(`${root_url}/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to delete comment');
        return response.json();
    })
    .then(() => {
        closeModal();
        loadPost();
        showModal('Comment deleted successfully', 'Success', 'success');
    })
    .catch(error => {
        console.error('Delete error:', error);
        showModal('Failed to delete comment', 'Error', 'error');
    });
}

// Update modal functions to use notification style
function showModal(message, title = 'Notice', type = 'info', buttons = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    const modalButtons = document.querySelector('.modal-buttons');
    
    // Set icon based on type
    let iconClass = 'fa-info-circle';
    switch(type) {
        case 'error':
            iconClass = 'fa-exclamation-circle';
            break;
        case 'success':
            iconClass = 'fa-check-circle';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            break;
    }
    
    modalIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    modalIcon.className = `notification-icon ${type}`;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Set custom buttons if provided, otherwise show default OK button
    if (buttons) {
        modalButtons.innerHTML = buttons;
    } else {
        modalButtons.innerHTML = `<button class="btn btn-primary" onclick="closeModal()">OK</button>`;
    }
    
    modal.style.display = 'flex';
    
    // Close modal on background click
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
    
    // Close on Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }, { once: true });
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}