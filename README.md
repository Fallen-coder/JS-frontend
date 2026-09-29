# Laravel API

A small REST API for a blog, built with Laravel 13 and Sanctum token auth. Users register and log in, write posts, comment on posts, and can be given roles.

## Data

| Table | What it holds |
|-------|---------------|
| `users` | Accounts (name, email, password) |
| `posts` | Belong to a user; have a title, a body and a status |
| `post_statuses` | `1 = public`, `2 = private` (inserted by the migration) |
| `comments` | Belong to a post and a user; have content |
| `roles` | `guest`, `admin` |
| `role_user` | Which users have which roles |

Only the owner of a post can update it, delete it or change its status. Only the author of a comment can delete it.

### Seed data

`php artisan db:seed` creates:

- **admin@example.com** (role `admin`) and **test@example.com** (role `guest`)
- 5 more random users
- 3 posts per user (21 total), roughly every third one private
- 0–4 random comments per post

Every seeded user's password is `password`.

## Setup

Requires PHP 8.3+ and Composer. SQLite is the default database.

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

The API is then at `http://localhost:8000/api`.

To wipe and reseed later:

```bash
php artisan migrate:fresh --seed
```

## Tests

```bash
php artisan test
```

## Endpoints

Routes marked 🔒 need an `Authorization: Bearer <token>` header. Get a token from `/login`.

| Method | Path | |
|--------|------|---|
| POST | `/register` | Create an account, returns a token |
| POST | `/login` | Returns a token |
| POST | `/logout` | 🔒 Revoke the current token |
| GET | `/user` | 🔒 The logged-in user |
| GET | `/posts` | List posts |
| GET | `/posts/{post}` | Show a post |
| POST | `/posts` | 🔒 Create a post |
| PUT/PATCH | `/posts/{post}` | 🔒 Update your post |
| DELETE | `/posts/{post}` | 🔒 Delete your post |
| PATCH | `/posts/{post}/status` | 🔒 Set `post_status_id` on your post |
| GET | `/posts/{post}/comments` | List a post's comments |
| GET | `/posts/{post}/comments/{comment}` | 🔒 Show a comment |
| POST | `/posts/{post}/comments` | 🔒 Add a comment |
| DELETE | `/posts/{post}/comments/{comment}` | 🔒 Delete your comment |
| POST | `/users/{user}/assign-role` | 🔒 Give a user a role (`role_id`) |
| POST | `/users/{user}/remove-role` | 🔒 Take a role away (`role_id`) |

Example:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Accept: application/json" \
  -d email=admin@example.com -d password=password
```
