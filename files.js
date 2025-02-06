window.onload = function() {
    // Show loading state immediately
    var fileList = document.getElementById("fileList");
    if (fileList) {
        fileList.innerHTML = '<div class="loading">Checking access...</div>';
    }

    // Add a small delay before checking auth
    setTimeout(function() {
        checkAuthStatus(function() {
            loadFiles();
        });
    }, 300); // 300ms delay
};

function checkAuthStatus(callback) {
    if (!checkCookiesEnabled()) {
        console.error('Cookies are disabled');
        return;
    }

    fetch(`${root_url}/api/check-auth?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Auth check response:', data);
        var userStatus = document.getElementById("userStatus");
        var uploadSection = document.getElementById("uploadSection");
        
        if (data.isAuthenticated === true) {
            userStatus.textContent = "Administrator";
            if (uploadSection) {
                uploadSection.style.display = "block";
            }
            if (callback) callback(data);
        } else if (data.isGuest === true) {
            userStatus.textContent = "Guest User";
            if (uploadSection) {
                uploadSection.style.display = "none";
            }
            if (callback) callback(data);
        } else {
            // Show modal instead of immediate redirect
            var modal = document.getElementById("authModal");
            if (modal) {
                modal.style.display = "flex";
            }
        }
    })
    .catch(error => {
        console.error('Auth check error:', error);
    });
}

// Add guest continuation function
function continueAsGuest() {
    // fetch(`${root_url}/api/guest`, {
    //     method: 'POST',
    //     credentials: 'include',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     console.log('Guest login response:', data);
    //     if (data.success) {
    //         location.reload();
    //     }
    // })
    // .catch(error => {
    //     console.error('Guest login error:', error);
    // });
    return continueAsGuest_Modal();
}

function loadFiles() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", root_url + "/api/files", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var files = JSON.parse(xhr.responseText);
            displayFiles(files);
        }
    };
    xhr.send();
}

function displayFiles(files) {
    var fileList = document.getElementById("fileList");
    if (!fileList) return;
    
    fileList.innerHTML = "";
    
    // Filter out blog media files - IE11 compatible
    files = files.filter(function(file) {
        return file.name.indexOf('blog_media_') !== 0;
    });
    
    files.forEach(function(file) {
        var fileDiv = document.createElement("div");
        fileDiv.className = "file-item";
        
        // Get file extension
        var ext = file.name.split('.').pop().toLowerCase();
        
        // Create file icon based on type
        var iconClass = getFileIconClass(ext);
        
        // Create file info div
        var fileInfo = document.createElement("div");
        fileInfo.className = "file-info";
        
        // Add icon
        var icon = document.createElement("i");
        icon.className = "fas " + iconClass + " file-icon";
        fileInfo.appendChild(icon);
        
        // Add file details
        var details = document.createElement("div");
        details.className = "file-details";
        
        var fileName = document.createElement("div");
        fileName.className = "file-name";
        fileName.textContent = file.name;
        details.appendChild(fileName);
        
        var fileMeta = document.createElement("div");
        fileMeta.className = "file-meta";
        fileMeta.innerHTML = 
            'Size: ' + formatFileSize(file.size) + '<br>' +
            'Uploaded: ' + formatDateTime(file.created) + '<br>' +
            'Modified: ' + formatDateTime(file.modified);
        details.appendChild(fileMeta);
        
        fileInfo.appendChild(details);
        fileDiv.appendChild(fileInfo);
        
        // Add file actions
        var actions = document.createElement("div");
        actions.className = "file-actions";
        
        // Download button
        var downloadBtn = document.createElement("a");
        downloadBtn.className = "file-download";
        downloadBtn.href = root_url + "/api/files/download/" + file.name;
        downloadBtn.title = "Download file";
        var downloadIcon = document.createElement("i");
        downloadIcon.className = "fas fa-download";
        downloadBtn.appendChild(downloadIcon);
        actions.appendChild(downloadBtn);
        
        // Delete button (for admin only)
        if (window.isAdmin) {
            var deleteBtn = document.createElement("button");
            deleteBtn.className = "action-btn delete-btn";
            deleteBtn.onclick = function() {
                deleteFile(file.name);
            };
            var deleteIcon = document.createElement("i");
            deleteIcon.className = "fas fa-trash";
            deleteBtn.appendChild(deleteIcon);
            actions.appendChild(deleteBtn);
        }
        
        fileDiv.appendChild(actions);
        fileList.appendChild(fileDiv);
    });
}

function getFileIconClass(ext) {
    var iconMap = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'gif': 'fa-file-image',
        'mp3': 'fa-file-audio',
        'wav': 'fa-file-audio',
        'mp4': 'fa-file-video',
        'mov': 'fa-file-video',
        'zip': 'fa-file-archive',
        'rar': 'fa-file-archive',
        'txt': 'fa-file-alt',
        'json': 'fa-file-code',
        'js': 'fa-file-code',
        'css': 'fa-file-code',
        'html': 'fa-file-code'
    };
    
    return iconMap[ext] || 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';
    
    var date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    
    var today = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format time
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var timeString = hours + ':' + minutes + ' ' + ampm;
    
    // Format date
    if (date.toDateString() === today.toDateString()) {
        return "Today at " + timeString;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday at " + timeString;
    } else {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[date.getMonth()] + ' ' + date.getDate() + 
               (date.getFullYear() !== today.getFullYear() ? ', ' + date.getFullYear() : '') +
               ' at ' + timeString;
    }
}

function downloadFile(filename) {
    window.location.href = root_url + "/api/files/download/" + filename;
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

// For admin only
if (document.getElementById("uploadForm")) {
    document.getElementById('uploadForm').onsubmit = function(e) {
        e.preventDefault();
        
        var fileInput = document.querySelector('input[type="file"]');
        
        if (!fileInput.files[0]) {
            showNotification('warning', 'Warning', 'Please select a file first');
            return;
        }
        
        var formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        fetch(root_url + "/api/files/upload", {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        .then(response => {
            if (response.ok) {
                showNotification('success', 'Success', 'File uploaded successfully', function() {
                    location.reload();
                });
            } else {
                showNotification('error', 'Error', 'Upload failed: ' + response.statusText);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('error', 'Error', 'Upload failed: Network Error');
        });
    };

    // Update file name display when file is selected
    document.getElementById('fileInput').onchange = function() {
        var fileName = this.files[0] ? this.files[0].name : 'No file chosen';
        document.querySelector('.file-name-display').textContent = fileName;
    };
}

// Add delete function
function deleteFile(filename) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    fetch(`${root_url}/api/files/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            showNotification('success', 'Success', 'File deleted successfully');
            loadFiles(); // Refresh the file list
        } else {
            showNotification('error', 'Error', 'Failed to delete file');
        }
    })
    .catch(error => {
        showNotification('error', 'Error', 'Network error occurred');
        console.error('Delete error:', error);
    });
}

// Add these notification functions
function showNotification(type, title, message, callback) {
    const modal = document.getElementById('notificationModal');
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    const okButton = modal.querySelector('.btn-primary');

    // Reset any existing animations
    modal.querySelector('.modal-content').classList.remove('animate-in');
    void modal.querySelector('.modal-content').offsetWidth; // Force reflow
    modal.querySelector('.modal-content').classList.add('animate-in');

    // Set icon and color based on type
    switch(type) {
        case 'success':
            icon.className = 'fas fa-check-circle notification-icon success';
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-circle notification-icon error';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle notification-icon warning';
            break;
        case 'info':
            icon.className = 'fas fa-info-circle notification-icon info';
            break;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.style.display = 'flex';

    // Store callback for later use
    modal._callback = callback;

    // Prevent clicking outside to close for warnings and errors
    modal.onclick = function(e) {
        if (e.target === modal && type !== 'warning' && type !== 'error') {
            closeNotification();
        }
    };
}

function closeNotification() {
    const modal = document.getElementById('notificationModal');
    const callback = modal._callback;
    modal._callback = null;
    modal.style.display = 'none';
    if (callback) callback();
}