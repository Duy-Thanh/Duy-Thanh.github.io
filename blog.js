function getQueryParams(){var e=window.location.search,t={};"?"===e.charAt(0)&&(e=e.substring(1));for(var n=e.split("&"),o=0;o<n.length;o++){var i=n[o].split("=");t[decodeURIComponent(i[0])]=decodeURIComponent(i[1]||"")}return t}window.NodeList&&!NodeList.prototype.forEach&&(NodeList.prototype.forEach=Array.prototype.forEach);let isPolling=!1,pollTimeoutId=null;const POLL_INTERVAL=3e3;let lastPostsData=null;function checkAuthStatus(){fetch(`${root_url}/api/check-auth`,{method:"GET",credentials:"include",headers:{"Content-Type":"application/json"}}).then((e=>e.json())).then((e=>{const t=document.getElementById("userStatus"),n=document.getElementById("postSection"),o=document.getElementById("loginBtn"),i=document.getElementById("logoutBtn");!0===e.isAuthenticated?(t.textContent="Administrator",n&&(n.style.display="block"),o&&(o.style.display="none"),i&&(i.style.display="inline-block"),loadPosts()):(t.textContent="",n&&(n.style.display="none"),o&&(o.style.display="inline-block",o.onclick=()=>window.location.href="/login.html?redirect=blog"),i&&(i.style.display="none"),loadPosts())})).catch((e=>console.error("Auth check error:",e)))}function loadPosts(){const e=document.getElementById("postList");e&&(e.innerHTML='\n        <div class="loading animate-fade-in">\n            <i class="fas fa-spinner fa-spin"></i>\n            Loading posts...\n        </div>\n    ',fetch(`${root_url}/api/posts`,{credentials:"include"}).then((e=>{if(!e.ok)throw new Error("Failed to load posts");return e.json()})).then((e=>{displayPosts(e),lastPostsData=e})).catch((t=>{console.error("Error:",t),e.innerHTML=`\n            <div class="error-message animate-fade-in">\n                <i class="fas fa-exclamation-circle"></i>\n                <p>Failed to load posts: ${t.message}</p>\n                <button onclick="loadPosts()" class="btn btn-secondary">\n                    <i class="fas fa-sync"></i>\n                    Retry\n                </button>\n            </div>\n        `})))}function displayPosts(e){const t=document.getElementById("postList");if(!t)return;const n=Array.from(t.querySelectorAll(".post-card")).map((e=>e.dataset.postId));if(0===e.length)return void(t.innerHTML='\n            <div class="no-posts animate-fade-in">\n                <i class="fas fa-newspaper"></i>\n                <p>No posts yet</p>\n            </div>\n        ');const o=e.map((e=>createPostElement(e,!n.includes(e.id)))).join("");t.innerHTML=o}function formatDateTime(e){var t=new Date(e);return t.toLocaleDateString()+" "+t.toLocaleTimeString()}function editPost(e){window.location.href=`/post.html?id=${e}&edit=true`}function deletePost(e){confirm("Are you sure you want to delete this post?")&&fetch(`${root_url}/api/posts/${e}`,{method:"DELETE",credentials:"include"}).then((e=>{if(!e.ok)throw new Error("Failed to delete post");showNotification("success","Success","Post deleted successfully"),loadPosts()})).catch((e=>{console.error("Error:",e),showNotification("error","Error","Failed to delete post")}))}function logout(){fetch(`${root_url}/api/logout`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"}}).then((e=>{document.cookie.split(";").forEach((function(e){document.cookie=e.replace(/^ +/,"").replace(/=.*/,"=;expires="+(new Date).toUTCString()+";path=/")})),window.location.href="/"})).catch((e=>{console.error("Logout error:",e),window.location.href="/"}))}function loadPostForEdit(e){fetch(`${root_url}/api/posts/${e}`,{method:"GET",credentials:"include"}).then((e=>e.json())).then((e=>{document.getElementById("titleInput").value=e.title,document.getElementById("contentInput").innerHTML=e.content;const t=document.getElementById("editorTitle");if(t&&(t.textContent="Edit Post"),"undefined"!=typeof Prism){document.querySelectorAll("pre code").forEach((e=>Prism.highlightElement(e)))}const n=document.getElementById("postSection");n&&(n.style.display="block");const o=document.getElementById("postForm");o&&(o.onsubmit=e=>{e.preventDefault(),updatePost(e)})})).catch((e=>{console.error("Error:",e),alert("Failed to load post for editing")}))}function updatePost(e){e.preventDefault();const t=new URLSearchParams(window.location.search).get("id"),n=document.getElementById("titleInput").value,o=document.getElementById("contentInput").innerHTML;if(!n||!o)return void showNotification("warning","Warning","Please fill in both title and content");const i=e.target.querySelector('button[type="submit"]'),a=i.innerHTML;i.innerHTML='<i class="fas fa-spinner fa-spin"></i> Updating...',i.disabled=!0,fetch(`${root_url}/api/posts/${t}`,{method:"PUT",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({title:n,content:o})}).then((async e=>{const t=await e.text();if(console.log("Server response:",t),!e.ok)throw new Error(t||`HTTP error! status: ${e.status}`);try{return JSON.parse(t)}catch(n){if(t.includes("success")||e.ok)return{success:!0};throw new Error("Invalid response format")}})).then((e=>{console.log("Update successful:",e),showNotification("success","Success","Post updated successfully"),setTimeout((()=>{window.location.href=`/post.html?id=${t}`}),1500)})).catch((e=>{console.error("Update error:",e),showNotification("error","Error","Failed to update post: "+e.message)})).finally((()=>{i.innerHTML=a,i.disabled=!1}))}function formatText(e){document.execCommand(e,!1,null)}function submitPost(e){e.preventDefault();const t=document.getElementById("titleInput").value,n=document.getElementById("contentInput").innerHTML;if(!t||!n)return void showNotification("warning","Warning","Please fill in both title and content");const o=e.target.querySelector('button[type="submit"]'),i=o.innerHTML;o.innerHTML='<i class="fas fa-spinner fa-spin"></i> Publishing...',o.disabled=!0,fetch(root_url+"/api/posts",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({title:t,content:n})}).then((e=>e.ok?e.json():e.text().then((e=>{throw new Error(e||"Network response was not ok")})))).then((e=>{showNotification("success","Success","Post published successfully"),document.getElementById("titleInput").value="",document.getElementById("contentInput").innerHTML="",loadPosts()})).catch((e=>{console.error("Error:",e),showNotification("error","Error",e.message||"Failed to publish post")})).finally((()=>{o.innerHTML=i,o.disabled=!1}))}function showNotification(e,t,n){const o=document.createElement("div");o.className="modal",o.style.display="flex",o.innerHTML=`\n        <div class="modal-content notification-modal animate-in">\n            <div class="notification-icon">\n                <i class="fas ${"success"===e?"fa-check-circle":"warning"===e?"fa-exclamation-triangle":"error"===e?"fa-exclamation-circle":"fa-info-circle"} notification-icon ${e}"></i>\n            </div>\n            <h3>${t}</h3>\n            <p>${n}</p>\n            <div class="modal-buttons">\n                <button onclick="this.closest('.modal').remove()" class="btn btn-primary">\n                    <i class="fas fa-check"></i>\n                    OK\n                </button>\n            </div>\n        </div>\n    `,document.body.appendChild(o)}function insertCode(){var e=window.getSelection().getRangeAt(0),t=e.toString();if(t){var n=document.createElement("div");n.className="code-language-modal",n.innerHTML='<div class="modal-content"><h4>Select Programming Language</h4><select class="language-select"><option value="">Select language...</option><option value="javascript">JavaScript</option><option value="python">Python</option><option value="java">Java</option><option value="cpp">C++</option><option value="csharp">C#</option><option value="php">PHP</option><option value="ruby">Ruby</option><option value="html">HTML</option><option value="css">CSS</option><option value="sql">SQL</option></select><div class="modal-buttons"><button class="ok-btn">OK</button><button class="cancel-btn">Cancel</button></div></div>',document.body.appendChild(n);var o=n.querySelector(".language-select");n.querySelector(".ok-btn").onclick=function(){var i=o.value;if(i){var a=document.createElement("pre");a.className="line-numbers";var l=document.createElement("code");l.className="language-"+i;var r=t.replace(/\r\n/g,"\n").replace(/\n/g,"\n").replace(/\t/g,"    ");l.textContent=r,a.appendChild(l),e.deleteContents(),e.insertNode(a);var s=document.createElement("br");a.parentNode.insertBefore(s,a.nextSibling),Prism.highlightElement(l),document.body.removeChild(n)}else alert("Please select a language")},n.querySelector(".cancel-btn").onclick=function(){document.body.removeChild(n)}}else alert("Please select some text first")}function insertImage(){const e=prompt("Enter image URL:");if(!e)return;const t=document.createElement("img");t.src=e,t.alt="Image";document.getElementById("contentInput");window.getSelection().getRangeAt(0).insertNode(t)}function insertVideo(){var e=prompt("Enter video URL (YouTube or direct video file):");if(e){var t;if(e.includes("youtube.com")||e.includes("youtu.be")){var n=e.split("v=")[1]||e.split("/").pop();(t=document.createElement("iframe")).src="https://www.youtube.com/embed/"+n,t.width="560",t.height="315",t.frameBorder="0",t.allowFullscreen=!0}else(t=document.createElement("video")).src=e,t.controls=!0,t.width="560";window.getSelection().getRangeAt(0).insertNode(t)}}function insertAudio(){const e=prompt("Enter audio URL:");if(!e)return;const t=document.createElement("audio");t.src=e,t.controls=!0;window.getSelection().getRangeAt(0).insertNode(t)}window.onload=function(){checkAuthStatus();var e=getQueryParams(),t=e.action,n=e.id;if("edit"===t&&n){loadPostForEdit(n);var o=document.querySelector(".posts-section");o&&(o.style.display="none")}else loadPosts();startPolling()};var currentMediaType="image";function openFileModal(e){currentMediaType=e,document.getElementById("fileModal").style.display="flex";var t=document.getElementById("mediaFileInput");if(t)switch(e){case"image":t.accept="image/*";break;case"video":t.accept="video/*";break;case"audio":t.accept="audio/*"}updateModalTitle(),setTimeout((function(){loadMediaFiles()}),100)}function closeFileModal(){var e=document.getElementById("fileModal");if(e){e.style.display="none";var t=document.getElementById("mediaFileList");t&&(t.innerHTML="")}}function loadMediaFiles(){var e=new XMLHttpRequest;e.open("GET",root_url+"/api/files",!0),e.onload=function(){if(200===e.status)try{displayMediaFiles(JSON.parse(e.responseText))}catch(e){console.error("Error parsing files:",e),document.getElementById("mediaFileList").innerHTML="Error loading files"}else document.getElementById("mediaFileList").innerHTML="Error loading files"},e.onerror=function(){document.getElementById("mediaFileList").innerHTML="Error loading files"},e.send()}function displayMediaFiles(e){var t=document.getElementById("mediaFileList");t&&(t.innerHTML='<div class="loading">Loading '+currentMediaType+" files...</div>",e=e.filter((function(e){if(0!==e.name.indexOf("blog_media_"))return!1;switch(currentMediaType){case"image":return e.name.match(/\.(jpg|jpeg|png|gif|ico|bmp|webp)$/i);case"video":return e.name.match(/\.(mp4|webm|ogg|mov|avi)$/i);case"audio":return e.name.match(/\.(mp3|wav|ogg|m4a)$/i);default:return!1}})),t.innerHTML="",0!==e.length?e.forEach((function(e){var n=document.createElement("div");n.className="media-item";var o=document.createElement("div");if(o.className="media-preview-container","image"===currentMediaType){var i=document.createElement("img");i.src=root_url+"/api/files/download/"+e.name,i.className="media-preview",i.alt=e.name.replace("blog_media_",""),o.appendChild(i)}else if("video"===currentMediaType){var a=document.createElement("video");a.src=root_url+"/api/files/download/"+e.name,a.className="media-preview",o.appendChild(a)}else if("audio"===currentMediaType){var l=document.createElement("i");l.className="fas fa-music media-preview-icon",o.appendChild(l)}var r=document.createElement("div");r.className="media-name",r.textContent=e.name.replace("blog_media_",""),n.appendChild(o),n.appendChild(r),n.addEventListener("click",(function(){insertMediaFile(e)})),t.appendChild(n)})):t.innerHTML='<div class="no-files">No '+currentMediaType+" files found</div>")}function insertMediaFile(e){var t=document.getElementById("contentInput");if(t){var n=null,o=root_url+"/api/files/download/"+e.name;if(e.name.match(/\.(jpg|jpeg|png|gif|ico|bmp|webp)$/i)?((n=document.createElement("img")).src=o,n.alt=e.name.replace("blog_media_",""),n.className="media-content"):e.name.match(/\.(mp4|webm|ogg|mov|avi)$/i)?((n=document.createElement("video")).src=o,n.controls=!0,n.className="media-content"):e.name.match(/\.(mp3|wav|ogg|m4a)$/i)&&((n=document.createElement("audio")).src=o,n.controls=!0,n.className="media-content"),!n)return console.error("Could not create element for file:",e),void alert("Unsupported file type. Please use image, video, or audio files.");var i,a=window.getSelection();try{i=a.getRangeAt(0)}catch(e){(i=document.createRange()).selectNodeContents(t),i.collapse(!1),a.removeAllRanges(),a.addRange(i)}n instanceof HTMLImageElement?(n.onload=l,n.onerror=function(){console.error("Failed to load image:",o),alert("Failed to load image file")}):n instanceof HTMLVideoElement?(n.onloadedmetadata=l,n.onerror=function(){console.error("Failed to load video:",o),alert("Failed to load video file")}):l()}function l(){i.insertNode(n);var e=document.createElement("br");(i=document.createRange()).setStartAfter(n),i.collapse(!0),i.insertNode(e),i.setStartAfter(e),i.collapse(!0),a.removeAllRanges(),a.addRange(i),closeFileModal()}}function updateModalTitle(){var e=document.querySelector(".modal-header h3");e&&(e.textContent=currentMediaType.charAt(0).toUpperCase()+currentMediaType.slice(1)+" Files")}function cleanupContent(e){var t=document.createElement("div");return t.innerHTML=e,t.querySelectorAll("pre code").forEach((function(e){e.className.includes("language-")||(e.className="language-plaintext"),e.textContent=e.textContent.replace(/\u200B/g,"").replace(/\u00A0/g," ")})),t.querySelectorAll("pre").forEach((function(e){e.className.includes("line-numbers")||(e.className="line-numbers")})),t.innerHTML}function createPostElement(e,t=!1){let n="Date unknown";try{if(e.created){const t=new Date(e.created);isNaN(t.getTime())||(n=t.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}))}console.log("Post date data:",{created:e.created,modified:e.modified,date:n})}catch(t){console.error("Date parsing error:",t,e)}return`\n        <div class="post-card ${t?"new-post":""}" \n             data-post-id="${e.id}" \n             style="animation-delay: ${.3*Math.random()}s">\n            <div class="post-header">\n                <h2 class="post-title">\n                    <a href="/post.html?id=${e.id}">${e.title}</a>\n                </h2>\n                <div class="post-meta">\n                    <span class="post-date" title="${n}">\n                        <i class="far fa-calendar-alt"></i>\n                        ${n}\n                    </span>\n                    ${e.modified?`<span class="post-modified"title="Last modified"><i class="fas fa-edit"></i>${formatDateTime(e.modified)}</span>`:""}\n                </div>\n            </div>\n            <div class="post-preview">\n                ${createPostPreview(e.content)}\n            </div>\n            <div class="post-footer">\n                <a href="/post.html?id=${e.id}" class="btn btn-secondary">\n                    <i class="fas fa-book-reader"></i>\n                    Read More\n                </a>\n                ${e.isAuthor?`<div class="post-actions"><button onclick="editPost('${e.id}')"class="btn btn-icon"title="Edit"><i class="fas fa-edit"></i></button><button onclick="deletePost('${e.id}')"class="btn btn-icon danger"title="Delete"><i class="fas fa-trash"></i></button></div>`:""}\n            </div>\n        </div>\n    `}function createPostPreview(e){const t=document.createElement("div");t.innerHTML=e,t.querySelectorAll("script").forEach((e=>e.remove()));let n=t.textContent||t.innerText;return n.length>200&&(n=n.substring(0,200)+"..."),`<p class="preview-text">${n}</p>`}function startPolling(){isPolling=!0,pollForUpdates()}function pollForUpdates(){isPolling&&fetch(`${root_url}/api/posts`,{credentials:"include"}).then((e=>{if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return e.json()})).then((e=>{hasPostsChanged(e)&&(displayPosts(e),lastPostsData=e)})).catch((e=>{console.error("Polling error:",e)})).finally((()=>{isPolling&&(pollTimeoutId=setTimeout(pollForUpdates,3e3))}))}function hasPostsChanged(e){if(!lastPostsData)return!0;return JSON.stringify(e.map((e=>({id:e.id,modified:e.modified,title:e.title}))))!==JSON.stringify(lastPostsData.map((e=>({id:e.id,modified:e.modified,title:e.title}))))}document.addEventListener("DOMContentLoaded",(function(){var e=document.getElementById("mediaFileInput");e&&(e.onchange=function(e){var t=e.target.files[0]?e.target.files[0].name:"No file chosen";document.querySelector(".file-name-display").textContent=t});var t=document.getElementById("mediaUploadForm");t&&(t.onsubmit=function(e){e.preventDefault();var t=document.getElementById("mediaFileInput");if(t.files[0]){var n=new FormData;n.append("file",t.files[0]);var o=new XMLHttpRequest;o.open("POST",root_url+"/api/blog-media/upload",!0),o.onload=function(){if(200===o.status){var e=JSON.parse(o.responseText);e.success?(t.value="",document.querySelector(".file-name-display").textContent="No file chosen",insertMediaFile({name:e.filename}),loadMediaFiles()):alert("Upload failed: "+(e.message||"Unknown error"))}else alert("Upload failed: "+o.statusText)},o.onerror=function(){alert("Upload failed: Network Error")},o.send(n)}else alert("Please select a file first")})})),document.addEventListener("DOMContentLoaded",(function(){var e=document.getElementById("contentInput");e&&(e.addEventListener("input",(function(){for(var e=this.querySelectorAll("pre code"),t=0;t<e.length;t++)Prism.highlightElement(e[t])})),e.addEventListener("paste",(function(e){var t;if(e.preventDefault(),t=window.clipboardData&&window.clipboardData.getData?window.clipboardData.getData("Text"):e.clipboardData&&e.clipboardData.getData?e.clipboardData.getData("text/plain"):"",document.selection)(n=document.selection.createRange()).text=t;else if(window.getSelection){var n;(n=window.getSelection().getRangeAt(0)).deleteContents(),n.insertNode(document.createTextNode(t))}})))})),window.onbeforeunload=function(){isPolling=!1,pollTimeoutId&&clearTimeout(pollTimeoutId)};
