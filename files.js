function checkAuthStatus(e){checkCookiesEnabled()?fetch(`${root_url}/api/check-auth?t=${Date.now()}`,{method:"GET",credentials:"include",headers:{"Content-Type":"application/json"}}).then((e=>e.json())).then((t=>{console.log("Auth check response:",t);var o=document.getElementById("userStatus"),a=document.getElementById("uploadSection");if(!0===t.isAuthenticated)o.textContent="Administrator",a&&(a.style.display="block"),e&&e(t);else if(!0===t.isGuest)o.textContent="Guest User",a&&(a.style.display="none"),e&&e(t);else{var n=document.getElementById("authModal");n&&(n.style.display="flex")}})).catch((e=>{console.error("Auth check error:",e)})):console.error("Cookies are disabled")}function continueAsGuest(){return continueAsGuest_Modal()}function loadFiles(){var e=new XMLHttpRequest;e.open("GET",root_url+"/api/files",!0),e.onreadystatechange=function(){4===e.readyState&&200===e.status&&displayFiles(JSON.parse(e.responseText))},e.send()}function displayFiles(e){var t=document.getElementById("fileList");t&&(t.innerHTML="",(e=e.filter((function(e){return 0!==e.name.indexOf("blog_media_")}))).forEach((function(e){var o=document.createElement("div");o.className="file-item";var a=getFileIconClass(e.name.split(".").pop().toLowerCase()),n=document.createElement("div");n.className="file-info";var i=document.createElement("i");i.className="fas "+a+" file-icon",n.appendChild(i);var l=document.createElement("div");l.className="file-details";var c=document.createElement("div");c.className="file-name",c.textContent=e.name,l.appendChild(c);var r=document.createElement("div");r.className="file-meta",r.innerHTML="Size: "+formatFileSize(e.size)+"<br>Uploaded: "+formatDateTime(e.created)+"<br>Modified: "+formatDateTime(e.modified),l.appendChild(r),n.appendChild(l),o.appendChild(n);var s=document.createElement("div");s.className="file-actions";var d=document.createElement("a");d.className="file-download",d.href=root_url+"/api/files/download/"+e.name,d.title="Download file";var f=document.createElement("i");if(f.className="fas fa-download",d.appendChild(f),s.appendChild(d),window.isAdmin){var u=document.createElement("button");u.className="action-btn delete-btn",u.onclick=function(){deleteFile(e.name)};var m=document.createElement("i");m.className="fas fa-trash",u.appendChild(m),s.appendChild(u)}o.appendChild(s),t.appendChild(o)})))}function getFileIconClass(e){return{pdf:"fa-file-pdf",doc:"fa-file-word",docx:"fa-file-word",xls:"fa-file-excel",xlsx:"fa-file-excel",ppt:"fa-file-powerpoint",pptx:"fa-file-powerpoint",jpg:"fa-file-image",jpeg:"fa-file-image",png:"fa-file-image",gif:"fa-file-image",mp3:"fa-file-audio",wav:"fa-file-audio",mp4:"fa-file-video",mov:"fa-file-video",zip:"fa-file-archive",rar:"fa-file-archive",txt:"fa-file-alt",json:"fa-file-code",js:"fa-file-code",css:"fa-file-code",html:"fa-file-code"}[e]||"fa-file"}function formatFileSize(e){if(0===e)return"0 Bytes";var t=Math.floor(Math.log(e)/Math.log(1024));return parseFloat((e/Math.pow(1024,t)).toFixed(2))+" "+["Bytes","KB","MB","GB"][t]}function formatDateTime(e){if(!e)return"Unknown";var t=new Date(e);if(isNaN(t.getTime()))return"Unknown";var o=new Date,a=new Date(o);a.setDate(a.getDate()-1);var n=t.getHours(),i=t.getMinutes(),l=n>=12?"PM":"AM",c=(n=(n%=12)||12)+":"+(i=i<10?"0"+i:i)+" "+l;if(t.toDateString()===o.toDateString())return"Today at "+c;if(t.toDateString()===a.toDateString())return"Yesterday at "+c;return["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][t.getMonth()]+" "+t.getDate()+(t.getFullYear()!==o.getFullYear()?", "+t.getFullYear():"")+" at "+c}function downloadFile(e){window.location.href=root_url+"/api/files/download/"+e}function logout(){fetch(`${root_url}/api/logout`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"}}).then((e=>{document.cookie.split(";").forEach((function(e){document.cookie=e.replace(/^ +/,"").replace(/=.*/,"=;expires="+(new Date).toUTCString()+";path=/")})),window.location.href="/"})).catch((e=>{console.error("Logout error:",e),window.location.href="/"}))}function deleteFile(e){confirm("Are you sure you want to delete this file?")&&fetch(`${root_url}/api/files/${e}`,{method:"DELETE",credentials:"include",headers:{"Content-Type":"application/json"}}).then((e=>{e.ok?(showNotification("success","Success","File deleted successfully"),loadFiles()):showNotification("error","Error","Failed to delete file")})).catch((e=>{showNotification("error","Error","Network error occurred"),console.error("Delete error:",e)}))}function showNotification(e,t,o,a){const n=document.getElementById("notificationModal"),i=document.getElementById("notificationIcon"),l=document.getElementById("notificationTitle"),c=document.getElementById("notificationMessage");n.querySelector(".btn-primary");switch(n.querySelector(".modal-content").classList.remove("animate-in"),n.querySelector(".modal-content").offsetWidth,n.querySelector(".modal-content").classList.add("animate-in"),e){case"success":i.className="fas fa-check-circle notification-icon success";break;case"error":i.className="fas fa-exclamation-circle notification-icon error";break;case"warning":i.className="fas fa-exclamation-triangle notification-icon warning";break;case"info":i.className="fas fa-info-circle notification-icon info"}l.textContent=t,c.textContent=o,n.style.display="flex",n._callback=a,n.onclick=function(t){t.target===n&&"warning"!==e&&"error"!==e&&closeNotification()}}function closeNotification(){const e=document.getElementById("notificationModal"),t=e._callback;e._callback=null,e.style.display="none",t&&t()}window.onload=function(){var e=document.getElementById("fileList");e&&(e.innerHTML='<div class="loading">Checking access...</div>'),setTimeout((function(){checkAuthStatus((function(){loadFiles()}))}),300)},document.getElementById("uploadForm")&&(document.getElementById("uploadForm").onsubmit=function(e){e.preventDefault();var t=document.querySelector('input[type="file"]');if(t.files[0]){var o=new FormData;o.append("file",t.files[0]),fetch(root_url+"/api/files/upload",{method:"POST",body:o,credentials:"include"}).then((e=>{e.ok?showNotification("success","Success","File uploaded successfully",(function(){location.reload()})):showNotification("error","Error","Upload failed: "+e.statusText)})).catch((e=>{console.error("Error:",e),showNotification("error","Error","Upload failed: Network Error")}))}else showNotification("warning","Warning","Please select a file first")},document.getElementById("fileInput").onchange=function(){var e=this.files[0]?this.files[0].name:"No file chosen";document.querySelector(".file-name-display").textContent=e});
