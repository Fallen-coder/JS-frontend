import React, { useState, useEffect, ChangeEvent } from "react";

interface CommentItem {
  id: number;
  content: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
}

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("posts");
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem("api_token") || "");
  const [userName, setUserName] = useState<string>("");

  // Posts & Loading State
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<number, CommentItem[]>>({});
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);

  // Form Inputs
  const [newPostTitle, setNewPostTitle] = useState<string>("");
  const [newPostBody, setNewPostBody] = useState<string>("");
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");

  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState<string>("");

  useEffect(() => {
    if (authToken) {
      localStorage.setItem("api_token", authToken);
    } else {
      localStorage.removeItem("api_token");
    }
  }, [authToken]);

  useEffect(() => {
    fetchPostsAsync();
  }, []);

  const getHeaders = (includeAuth = true): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (includeAuth && authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    return headers;
  };

  const fetchPostsAsync = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "GET",
        headers: getHeaders(false),
      });

      if (!response.ok) throw new Error(`HTTP kļūda: ${response.status}`);

      const data = await response.json();
      setPosts(data || []);
      if (Array.isArray(data)) {
        data.forEach((p: Post) => fetchComments(p.id));
      }
    } catch (error) {
      console.error("Kļūda saņemot rakstus (Fetch API):", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchPostsXHR = () => {
    setIsLoadingPosts(true);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${API_BASE_URL}/posts`, true);

    const headers = getHeaders(false);
    for (const key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key)) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }

    xhr.onload = function () {
      setIsLoadingPosts(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setPosts(data || []);
          if (Array.isArray(data)) {
            data.forEach((p: Post) => fetchComments(p.id));
          }
        } catch (e) {
          console.error("JSON apstrādes kļūda:", e);
        }
      } else {
        console.error(`XHR kļūda: ${xhr.status}`);
        alert("Neizdevās saņemt datus (XHR).");
      }
    };

    xhr.onerror = function () {
      setIsLoadingPosts(false);
      console.error("Tīkla kļūda pieprasījumā.");
    };

    xhr.send();
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostBody.trim()) {
      alert("Aizpildiet virsrakstu un tekstu.");
      return;
    }

    if (!authToken) {
      alert("Lūdzu, vispirms pieslēdzieties!");
      setActiveTab("login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ title: newPostTitle, body: newPostBody }),
      });

      if (response.ok) {
        setNewPostTitle("");
        setNewPostBody("");
        fetchPostsAsync();
      } else {
        const err = await response.json();
        alert("Kļūda izveidojot rakstu: " + JSON.stringify(err));
      }
    } catch (error) {
      console.error("Kļūda izveidojot rakstu:", error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo rakstu?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: getHeaders(true),
      });

      if (response.ok) {
        fetchPostsAsync();
      } else {
        alert("Neizdevās dzēst rakstu.");
      }
    } catch (error) {
      console.error("Kļūda dzēšot rakstu:", error);
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        method: "GET",
        headers: getHeaders(false),
      });

      if (!response.ok) return;

      const data = await response.json();
      setCommentsMap((prev) => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error("Kļūda ielādējot komentārus:", error);
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = (commentInputs[postId] || "").trim();
    if (!content) return;

    if (!authToken) {
      alert("Vispirms pieslēdzieties!");
      setActiveTab("login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        fetchComments(postId);
      }
    } catch (error) {
      console.error("Kļūda pievienojot komentāru:", error);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!window.confirm("Dzēst komentāru?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: getHeaders(true),
      });

      if (response.ok) {
        fetchComments(postId);
      }
    } catch (error) {
      console.error("Kļūda dzēšot komentāru:", error);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          password_confirmation: regPasswordConfirm,
        }),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        setAuthToken(data.token);
        setUserName(data.user?.name || "");
        setActiveTab("posts");
      } else {
        alert("Kļūda: " + JSON.stringify(data.errors || data.message));
      }
    } catch (error) {
      console.error("Reģistrācijas kļūda:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        setAuthToken(data.token);
        setUserName(data.user?.name || "");
        setActiveTab("posts");
      } else {
        alert("Kļūda: " + (data.message || "Neizdevās pieslēgties"));
      }
    } catch (error) {
      console.error("Pieslēgšanās kļūda:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: getHeaders(true),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAuthToken("");
      setUserName("");
      setActiveTab("login");
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="nav-brand">API Testēšana</div>
        <div className="nav-links">
          <button
            type="button"
            className={`nav-btn ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Raksti
          </button>
          {!authToken ? (
            <>
              <button
                type="button"
                className={`nav-btn ${activeTab === "login" ? "active" : ""}`}
                onClick={() => setActiveTab("login")}
              >
                Ienākt
              </button>
              <button
                type="button"
                className={`nav-btn ${activeTab === "register" ? "active" : ""}`}
                onClick={() => setActiveTab("register")}
              >
                Reģistrēties
              </button>
            </>
          ) : (
            <button type="button" className="nav-btn btn-danger" onClick={handleLogout}>
              Iziet
            </button>
          )}
        </div>
      </nav>

      <main className="container">
        {activeTab === "register" && (
          <section className="tab-content section">
            <h2>Reģistrācija</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Vārds"
                value={regName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRegName(e.target.value)}
                autoComplete="name"
              />
              <input
                type="email"
                placeholder="E-pasts"
                value={regEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRegEmail(e.target.value)}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Parole"
                value={regPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRegPassword(e.target.value)}
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="Atkārtojiet paroli"
                value={regPasswordConfirm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRegPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" onClick={handleRegister}>
                Reģistrēties
              </button>
            </div>
          </section>
        )}

        {activeTab === "login" && (
          <section className="tab-content section">
            <h2>Autentifikācija</h2>
            <div className="status-badge">
              Statuss: {authToken ? `Pieslēdzies${userName ? " kā " + userName : ""}` : "Nav pieteicies"}
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="E-pasts"
                value={loginEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Parole"
                value={loginPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" onClick={handleLogin}>
                Pieslēgties
              </button>
            </div>
          </section>
        )}

        {activeTab === "posts" && (
          <section className="tab-content section">
            <h2>Raksti</h2>

            <div className="form-group">
              <h3>Izveidot jaunu rakstu</h3>
              <input
                type="text"
                placeholder="Virsraksts"
                value={newPostTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPostTitle(e.target.value)}
              />
              <textarea
                placeholder="Raksta teksts..."
                value={newPostBody}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewPostBody(e.target.value)}
              />
              <button type="button" onClick={handleCreatePost}>
                Saglabāt rakstu
              </button>
            </div>

            <div className="posts-header">
              <h3>Visi raksti</h3>
              <div className="method-buttons">
                <button className="btn-secondary" type="button" onClick={fetchPostsAsync}>
                  Atjaunot (Fetch API)
                </button>
                <button className="btn-secondary" type="button" onClick={fetchPostsXHR}>
                  Atjaunot (XMLHttpRequest)
                </button>
              </div>
            </div>

            <div id="posts-list">
              {isLoadingPosts ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                  <span>Ielādē datus...</span>
                </div>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Nav pieejamu rakstu.
                </div>
              ) : (
                posts.map((post) => {
                  const comments = commentsMap[post.id];
                  return (
                    <div key={post.id} className="post-card">
                      <h3>
                        {post.title} <small>ID: {post.id}</small>
                      </h3>
                      <p>{post.body}</p>
                      <button className="btn-danger" onClick={() => handleDeletePost(post.id)}>
                        Dzēst rakstu
                      </button>

                      <div className="comments-section">
                        <h4>KOMENTĀRI</h4>
                        <div>
                          {!comments ? (
                            <i>Ielādē komentārus...</i>
                          ) : comments.length === 0 ? (
                            <i>Komentāru nav.</i>
                          ) : (
                            comments.map((comment) => (
                              <div key={comment.id} className="comment">
                                <p>{comment.content}</p>
                                <button
                                  className="btn-danger"
                                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                >
                                  Dzēst
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="comment-input-group">
                          <input
                            type="text"
                            placeholder="Rakstīt komentāru..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                          />
                          <button onClick={() => handleAddComment(post.id)}>Pievienot</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}