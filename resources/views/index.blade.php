<!DOCTYPE html>
<html lang="lv">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="csrf-token"
        content="{{ csrf_token() }}"
    >

    <title>Laravel API Klients</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>

    <!-- NAVIGATION -->
    <nav class="navbar">

        <div class="nav-brand">
            API Testēšana
        </div>

        <div class="nav-links">

            <button
                class="nav-btn active"
                id="btn-posts-tab"
                type="button"
                onclick="switchTab('posts-tab')"
            >
                Raksti
            </button>

            <button
                class="nav-btn"
                id="nav-login-btn"
                type="button"
                onclick="switchTab('login-tab')"
            >
                Ienākt
            </button>

            <button
                class="nav-btn"
                id="nav-register-btn"
                type="button"
                onclick="switchTab('register-tab')"
            >
                Reģistrēties
            </button>

            <button
                class="nav-btn btn-danger"
                id="nav-logout-btn"
                type="button"
                style="display: none;"
                onclick="logout()"
            >
                Iziet
            </button>

        </div>

    </nav>


    <!-- MAIN CONTENT -->
    <main class="container">

        <!-- REGISTER -->
        <section
            id="register-tab"
            class="tab-content section"
            style="display: none;"
        >

            <h2>Reģistrācija</h2>

            <div class="form-group">

                <input
                    type="text"
                    id="reg-name"
                    placeholder="Vārds"
                    autocomplete="name"
                >

                <input
                    type="email"
                    id="reg-email"
                    placeholder="E-pasts"
                    autocomplete="email"
                >

                <input
                    type="password"
                    id="reg-password"
                    placeholder="Parole"
                    autocomplete="new-password"
                >

                <input
                    type="password"
                    id="reg-password-confirm"
                    placeholder="Atkārtojiet paroli"
                    autocomplete="new-password"
                >

                <button
                    type="button"
                    onclick="register()"
                >
                    Reģistrēties
                </button>

            </div>

        </section>


        <!-- LOGIN -->
        <section
            id="login-tab"
            class="tab-content section"
            style="display: none;"
        >

            <h2>Autentifikācija</h2>

            <div
                id="auth-status"
                class="status-badge"
            >
                Statuss: Nav pieteicies
            </div>

            <div class="form-group">

                <input
                    type="email"
                    id="login-email"
                    placeholder="E-pasts"
                    autocomplete="email"
                >

                <input
                    type="password"
                    id="login-password"
                    placeholder="Parole"
                    autocomplete="current-password"
                >

                <button
                    type="button"
                    onclick="login()"
                >
                    Pieslēgties
                </button>

            </div>

        </section>


        <!-- POSTS -->
        <section
            id="posts-tab"
            class="tab-content section"
        >

            <h2>Raksti</h2>


            <!-- CREATE POST -->
            <div class="form-group">

                <h3>Izveidot jaunu rakstu</h3>

                <input
                    type="text"
                    id="post-title"
                    placeholder="Virsraksts"
                >

                <textarea
                    id="post-body"
                    placeholder="Raksta teksts..."
                ></textarea>

                <button
                    type="button"
                    onclick="createPost()"
                >
                    Saglabāt rakstu
                </button>

            </div>


            <!-- POSTS HEADER -->
            <div class="posts-header">

                <h3>Visi raksti</h3>

                <button
                    class="btn-secondary"
                    type="button"
                    onclick="fetchPosts()"
                >
                    Atjaunot sarakstu
                </button>

            </div>


            <!-- POSTS LIST -->
            <div id="posts-list"></div>

        </section>

</main>

</body>
</html>