const API_BASE_URL = "/api";

let authToken = localStorage.getItem("api_token") || "";

const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");

/* =========================================================
   HEADERS
   ========================================================= */

function getHeaders(includeAuth = true) {
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
    };

    if (includeAuth && authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    return headers;
}

/* =========================================================
   TABS
   ========================================================= */

function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.style.display = "none";
    });

    const selectedTab = document.getElementById(tabId);

    if (selectedTab) {
        selectedTab.style.display = "block";
    }

    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.classList.remove("active");
    });

    const buttons = {
        "posts-tab": "btn-posts-tab",
        "login-tab": "nav-login-btn",
        "register-tab": "nav-register-btn",
    };

    const activeButton = document.getElementById(buttons[tabId]);

    if (activeButton) {
        activeButton.classList.add("active");
    }
}

/* =========================================================
   AUTH UI
   ========================================================= */

function updateAuthUI(userName = null) {
    const statusBadge = document.getElementById("auth-status");

    const loginBtn = document.getElementById("nav-login-btn");

    const registerBtn = document.getElementById("nav-register-btn");

    const logoutBtn = document.getElementById("nav-logout-btn");

    if (authToken) {
        if (statusBadge) {
            statusBadge.innerText = `Statuss: Pieslēdzies${
                userName ? " kā " + userName : ""
            }`;
        }

        if (loginBtn) {
            loginBtn.style.display = "none";
        }

        if (registerBtn) {
            registerBtn.style.display = "none";
        }

        if (logoutBtn) {
            logoutBtn.style.display = "inline-block";
        }
    } else {
        if (statusBadge) {
            statusBadge.innerText = "Statuss: Nav pieteicies";
        }

        if (loginBtn) {
            loginBtn.style.display = "inline-block";
        }

        if (registerBtn) {
            registerBtn.style.display = "inline-block";
        }

        if (logoutBtn) {
            logoutBtn.style.display = "none";
        }
    }
}

/* =========================================================
   REGISTER
   ========================================================= */

async function register() {
    const name = document.getElementById("reg-name").value.trim();

    const email = document.getElementById("reg-email").value.trim();

    const password = document.getElementById("reg-password").value;

    const password_confirmation = document.getElementById(
        "reg-password-confirm",
    ).value;

    if (!name || !email || !password || !password_confirmation) {
        alert("Lūdzu, aizpildiet visus laukus.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: getHeaders(false),

            body: JSON.stringify({
                name,
                email,
                password,
                password_confirmation,
            }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;

            localStorage.setItem("api_token", authToken);

            updateAuthUI(data.user?.name);

            alert("Reģistrācija veiksmīga!");

            switchTab("posts-tab");
        } else {
            alert("Kļūda: " + JSON.stringify(data.errors || data.message));
        }
    } catch (error) {
        console.error("Kļūda reģistrējoties:", error);

        alert("Radās servera kļūda.");
    }
}

/* =========================================================
   LOGIN
   ========================================================= */

async function login() {
    const email = document.getElementById("login-email").value.trim();

    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Ievadiet e-pastu un paroli.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: getHeaders(false),

            body: JSON.stringify({
                email,
                password,
            }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;

            localStorage.setItem("api_token", authToken);

            updateAuthUI(data.user?.name);

            alert("Pieslēgšanās veiksmīga!");

            switchTab("posts-tab");
        } else {
            alert(
                "Kļūda: " +
                    (data.errors
                        ? JSON.stringify(data.errors)
                        : data.message || "Neizdevās pieslēgties"),
            );
        }
    } catch (error) {
        console.error("Kļūda pieslēdzoties:", error);

        alert("Radās servera kļūda.");
    }
}

/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: "POST",
            headers: getHeaders(true),
        });
    } catch (error) {
        console.error("Kļūda izejot:", error);
    } finally {
        authToken = "";

        localStorage.removeItem("api_token");

        updateAuthUI();

        switchTab("login-tab");
    }
}

/* =========================================================
   FETCH POSTS
   ========================================================= */

async function fetchPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: "GET",
            headers: getHeaders(false),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const posts = await response.json();

        renderPosts(posts);
    } catch (error) {
        console.error("Kļūda saņemot rakstus:", error);
    }
}

/* =========================================================
   CREATE POST
   ========================================================= */

async function createPost() {
    const title = document.getElementById("post-title").value.trim();

    const body = document.getElementById("post-body").value.trim();

    if (!title || !body) {
        alert("Lūdzu, aizpildiet virsrakstu un tekstu.");
        return;
    }

    if (!authToken) {
        alert("Lai izveidotu rakstu, vispirms pieslēdzieties.");
        switchTab("login-tab");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: "POST",
            headers: getHeaders(true),

            body: JSON.stringify({
                title,
                body,
            }),
        });

        if (response.ok) {
            document.getElementById("post-title").value = "";

            document.getElementById("post-body").value = "";

            await fetchPosts();
        } else {
            const error = await response.json();

            alert("Kļūda izveidojot rakstu: " + JSON.stringify(error));
        }
    } catch (error) {
        console.error("Kļūda:", error);
    }
}

/* =========================================================
   DELETE POST
   ========================================================= */

async function deletePost(postId) {
    if (!confirm("Vai tiešām vēlaties dzēst šo rakstu?")) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: "DELETE",
            headers: getHeaders(true),
        });

        if (response.ok) {
            await fetchPosts();
        } else {
            alert("Neizdevās izdzēst rakstu.");
        }
    } catch (error) {
        console.error("Kļūda dzēšot rakstu:", error);
    }
}

/* =========================================================
   FETCH COMMENTS
   ========================================================= */

async function fetchComments(postId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/posts/${postId}/comments`,
            {
                method: "GET",
                headers: getHeaders(false),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const comments = await response.json();

        const container = document.getElementById(`comments-${postId}`);

        if (!container) {
            return;
        }

        if (comments.length === 0) {
            container.innerHTML = `
                <p class="no-comments">
                    Komentāru vēl nav.
                </p>
            `;

            return;
        }

        container.innerHTML = comments
            .map(
                (comment) => `

                <div class="comment">

                    <p>
                        ${escapeHtml(comment.content)}
                    </p>

                    <button
                        class="btn-danger"
                        onclick="deleteComment(
                            ${postId},
                            ${comment.id}
                        )"
                    >
                        Dzēst
                    </button>

                </div>

            `,
            )
            .join("");
    } catch (error) {
        console.error("Kļūda ielādējot komentārus:", error);
    }
}

/* =========================================================
   ADD COMMENT
   ========================================================= */

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);

    const content = input.value.trim();

    if (!content) {
        return;
    }

    if (!authToken) {
        alert("Lai pievienotu komentāru, pieslēdzieties.");

        switchTab("login-tab");

        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/posts/${postId}/comments`,
            {
                method: "POST",
                headers: getHeaders(true),

                body: JSON.stringify({
                    content,
                }),
            },
        );

        if (response.ok) {
            input.value = "";

            await fetchComments(postId);
        } else {
            alert("Kļūda pievienojot komentāru.");
        }
    } catch (error) {
        console.error("Kļūda:", error);
    }
}

/* =========================================================
   DELETE COMMENT
   ========================================================= */

async function deleteComment(postId, commentId) {
    if (!confirm("Dzēst šo komentāru?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/posts/${postId}/comments/${commentId}`,
            {
                method: "DELETE",
                headers: getHeaders(true),
            },
        );

        if (response.ok) {
            await fetchComments(postId);
        } else {
            alert("Kļūda dzēšot komentāru.");
        }
    } catch (error) {
        console.error("Kļūda dzēšot komentāru:", error);
    }
}

/* =========================================================
   RENDER POSTS
   ========================================================= */

function renderPosts(posts) {
    const container = document.getElementById("posts-list");

    container.innerHTML = "";

    if (!posts.length) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>Nav rakstu</strong>
                <span>
                    Izveidojiet pirmo rakstu.
                </span>
            </div>
        `;

        return;
    }

    posts.forEach((post) => {
        const div = document.createElement("div");

        div.className = "post-card";

        div.innerHTML = `

            <h3>
                ${escapeHtml(post.title)}

                <small>
                    ID: ${post.id}
                </small>
            </h3>


            <p>
                ${escapeHtml(post.body)}
            </p>


            <button
                class="btn-danger"
                onclick="deletePost(${post.id})"
            >
                Dzēst rakstu
            </button>


            <div class="comments-section">

                <h4>
                    KOMENTĀRI
                </h4>


                <div id="comments-${post.id}">
                    <i>Ielādē komentārus...</i>
                </div>


                <div class="comment-input-group">

                    <input
                        type="text"
                        id="comment-input-${post.id}"
                        placeholder="Rakstīt komentāru..."
                    >

                    <button
                        onclick="addComment(${post.id})"
                    >
                        Pievienot
                    </button>

                </div>

            </div>

        `;

        container.appendChild(div);

        fetchComments(post.id);
    });
}

/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();

    fetchPosts();
});
