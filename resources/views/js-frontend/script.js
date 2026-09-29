// Konfigurācija un autorizācijas saite uz API
const API_BASE_URL = "http://127.0.0.1:8000/api"; // Nomainiet pret sava Laravel servisa adresi
let authToken = localStorage.getItem("api_token") || "";

/* =========================================================
   GALVENES (HEADERS)
   ========================================================= */
function getHeaders(includeAuth = true) {
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    if (includeAuth && authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    return headers;
}

/* =========================================================
   4. UZDEVUMS: SPINNERA PARĀDĪŠANA UN PASLĒPŠANA
   ========================================================= */
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
            <span>Ielādē datus...</span>
        </div>
    `;
}

function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const loader = container.querySelector('.spinner-container');
    if (loader) {
        loader.remove();
    }
}

/* =========================================================
   3. UZDEVUMS - METODE 1: FETCH API AR ASYNC/AWAIT
   ========================================================= */
async function fetchPostsAsync() {
    const containerId = "posts-list";
    showLoading(containerId);

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: "GET",
            headers: getHeaders(false)
        });

        if (!response.ok) {
            throw new Error(`HTTP kļūda: ${response.status}`);
        }

        const posts = await response.json();
        renderPosts(posts); // Datu izvadīšana ar DOM manipulācijām
    } catch (error) {
        console.error("Kļūda saņemot rakstus (Fetch API):", error);
        document.getElementById(containerId).innerHTML = `
            <div style="color: var(--danger); text-align: center; padding: 20px;">
                Kļūda ielādējot datus.
            </div>
        `;
    } finally {
        hideLoading(containerId);
    }
}

/* =========================================================
   3. UZDEVUMS - METODE 2: XMLHTTPREQUEST (XHR)
   ========================================================= */
function fetchPostsXHR() {
    const containerId = "posts-list";
    showLoading(containerId);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${API_BASE_URL}/posts`, true);

    const headers = getHeaders(false);
    for (const key in headers) {
        xhr.setRequestHeader(key, headers[key]);
    }

    xhr.onload = function () {
        hideLoading(containerId);
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const posts = JSON.parse(xhr.responseText);
                renderPosts(posts); // Datu izvadīšana ar DOM manipulācijām
            } catch (e) {
                console.error("JSON apstrādes kļūda:", e);
            }
        } else {
            console.error(`XHR kļūda: ${xhr.status}`);
            document.getElementById(containerId).innerHTML = `
                <div style="color: var(--danger); text-align: center; padding: 20px;">
                    Neizdevās saņemt datus (XHR).
                </div>
            `;
        }
    };

    xhr.onerror = function () {
        hideLoading(containerId);
        console.error("Tīkla kļūda pieprasījumā.");
    };

    xhr.send();
}

/* =========================================================
   3. UZDEVUMS: DOM MANIPULĀCIJAS (ATTĒLOŠANA HTML FORMĀTĀ)
   ========================================================= */
function renderPosts(posts) {
    const container = document.getElementById("posts-list");
    container.innerHTML = "";

    if (!posts || !posts.length) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                Nav pieejamu rakstu.
            </div>
        `;
        return;
    }

    posts.forEach((post) => {
        // Dinamiska DOM elementu izveide
        const card = document.createElement("div");
        card.className = "post-card";

        card.innerHTML = `
            <h3>${escapeHtml(post.title)} <small>ID: ${post.id}</small></h3>
            <p>${escapeHtml(post.body)}</p>
            <button class="btn-danger" onclick="deletePost(${post.id})">Dzēst rakstu</button>

            <div class="comments-section">
                <h4>KOMENTĀRI</h4>
                <div id="comments-${post.id}">
                    <i>Ielādē komentārus...</i>
                </div>
                <div class="comment-input-group">
                    <input type="text" id="comment-input-${post.id}" placeholder="Rakstīt komentāru...">
                    <button onclick="addComment(${post.id})">Pievienot</button>
                </div>
            </div>
        `;

        container.appendChild(card);
        fetchComments(post.id);
    });
}

/* =========================================================
   KOMENTĀRU IELĀDE UN DOM MANIPULĀCIJAS
   ========================================================= */
async function fetchComments(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: "GET",
            headers: getHeaders(false)
        });

        if (!response.ok) return;

        const comments = await response.json();
        const container = document.getElementById(`comments-${postId}`);
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = `<i>Komentāru nav.</i>`;
            return;
        }

        container.innerHTML = comments
            .map(
                (comment) => `
                <div class="comment">
                    <p>${escapeHtml(comment.content)}</p>
                    <button class="btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteComment(${postId}, ${comment.id})">Dzēst</button>
                </div>
            `
            )
            .join("");
    } catch (error) {
        console.error("Kļūda ielādējot komentārus:", error);
    }
}

/* =========================================================
   RAKSTA UN KOMENTĀRU IZVEIDE / DZĒŠANA
   ========================================================= */
async function createPost() {
    const title = document.getElementById("post-title").value.trim();
    const body = document.getElementById("post-body").value.trim();

    if (!title || !body) {
        alert("Aizpildiet virsrakstu un tekstu.");
        return;
    }

    if (!authToken) {
        alert("Lūdzu, vispirms pieslēdzieties!");
        switchTab("login-tab");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify({ title, body })
        });

        if (response.ok) {
            document.getElementById("post-title").value = "";
            document.getElementById("post-body").value = "";
            fetchPostsAsync();
        } else {
            const err = await response.json();
            alert("Kļūda izveidojot rakstu: " + JSON.stringify(err));
        }
    } catch (error) {
        console.error("Kļūda izveidojot rakstu:", error);
    }
}

async function deletePost(postId) {
    if (!confirm("Vai tiešām vēlaties dzēst šo rakstu?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: "DELETE",
            headers: getHeaders(true)
        });

        if (response.ok) {
            fetchPostsAsync();
        } else {
            alert("Neizdevās dzēst rakstu.");
        }
    } catch (error) {
        console.error("Kļūda dzēšot rakstu:", error);
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();

    if (!content) return;

    if (!authToken) {
        alert("Vispirms pieslēdzieties!");
        switchTab("login-tab");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            input.value = "";
            fetchComments(postId);
        }
    } catch (error) {
        console.error("Kļūda pievienojot komentāru:", error);
    }
}

async function deleteComment(postId, commentId) {
    if (!confirm("Dzēst komentāru?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
            method: "DELETE",
            headers: getHeaders(true)
        });

        if (response.ok) {
            fetchComments(postId);
        }
    } catch (error) {
        console.error("Kļūda dzēšot komentāru:", error);
    }
}

/* =========================================================
   AUTENTIFIKĀCIJA UN NAVIGĀCIJA
   ========================================================= */
async function register() {
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const password_confirmation = document.getElementById("reg-password-confirm").value;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: getHeaders(false),
            body: JSON.stringify({ name, email, password, password_confirmation })
        });

        const data = await response.json();
        if (response.ok && data.token) {
            authToken = data.token;
            localStorage.setItem("api_token", authToken);
            updateAuthUI(data.user?.name);
            switchTab("posts-tab");
        } else {
            alert("Kļūda: " + JSON.stringify(data.errors || data.message));
        }
    } catch (error) {
        console.error("Reģistrācijas kļūda:", error);
    }
}

async function login() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: getHeaders(false),
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok && data.token) {
            authToken = data.token;
            localStorage.setItem("api_token", authToken);
            updateAuthUI(data.user?.name);
            switchTab("posts-tab");
        } else {
            alert("Kļūda: " + (data.message || "Neizdevās pieslēgties"));
        }
    } catch (error) {
        console.error("Pieslēgšanās kļūda:", error);
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: "POST",
            headers: getHeaders(true)
        });
    } catch (e) {
        console.error(e);
    } finally {
        authToken = "";
        localStorage.removeItem("api_token");
        updateAuthUI();
        switchTab("login-tab");
    }
}

function updateAuthUI(userName = null) {
    const statusBadge = document.getElementById("auth-status");
    const loginBtn = document.getElementById("nav-login-btn");
    const registerBtn = document.getElementById("nav-register-btn");
    const logoutBtn = document.getElementById("nav-logout-btn");

    if (authToken) {
        if (statusBadge) statusBadge.innerText = `Statuss: Pieslēdzies${userName ? " kā " + userName : ""}`;
        if (loginBtn) loginBtn.style.display = "none";
        if (registerBtn) registerBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
    } else {
        if (statusBadge) statusBadge.innerText = "Statuss: Nav pieteicies";
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (registerBtn) registerBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";
    }
}

function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach((tab) => (tab.style.display = "none"));
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.style.display = "block";

    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
    const activeBtnMap = {
        "posts-tab": "btn-posts-tab",
        "login-tab": "nav-login-btn",
        "register-tab": "nav-register-btn"
    };
    const activeBtn = document.getElementById(activeBtnMap[tabId]);
    if (activeBtn) activeBtn.classList.add("active");
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

/* SĀKOTNĒJĀ INICIALIZĀCIJA */
document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    fetchPostsAsync(); // Noklusējuma ielāde izmantojot Fetch API
});