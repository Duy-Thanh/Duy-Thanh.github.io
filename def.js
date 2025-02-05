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