const root_url="https://nekkochan0x7.zapto.org",xhr_options={credentials:"include",headers:{"Content-Type":"application/json"},mode:"cors"};function checkCookiesEnabled(){try{document.cookie="testcookie=1";var e=-1!==document.cookie.indexOf("testcookie=");return document.cookie="testcookie=1; expires=Thu, 01-Jan-1970 00:00:01 GMT",e}catch(e){return!1}}function continueAsGuest_Modal(){const e=document.createElement("div");return e.className="modal",e.innerHTML='\n        <div class="modal-content animate-in">\n            <h3>\n                <i class="fas fa-exclamation-circle" style="color: var(--warning)"></i>\n                Guest Access Disabled\n            </h3>\n            <p>From 2/6/2025, the Guest login to access File System will be disabled. This feature is used for Admin only. Please use your own account which have Administrator role to access the File System.</p>\n            <div class="modal-buttons">\n                <button class="btn btn-primary" onclick="this.closest(\'.modal\').remove()">\n                    <i class="fas fa-check"></i>\n                    I Understand\n                </button>\n            </div>\n        </div>\n    ',document.body.appendChild(e),!1}document.addEventListener("DOMContentLoaded",(function(){const e=document.querySelector(".header");window.scrollY>50?e.classList.add("collapsed"):e.classList.remove("collapsed");const t=window.location.pathname;document.querySelectorAll(".nav-controls .btn").forEach((e=>{const n=e.getAttribute("href");n&&t.includes(n.replace("/",""))&&e.classList.add("active")}));const n=document.getElementById("userStatus");n&&n.textContent.includes("Administrator")&&(n.classList.add("admin"),n.innerHTML='<i class="fas fa-user-shield"></i> '+n.textContent)}));
