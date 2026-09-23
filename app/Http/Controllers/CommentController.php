<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller implements HasMiddleware
{
    public static function middleware() {
        return [
            new Middleware('auth:sanctum', except: ['index'])
        ];
    }

    public function index(Post $post)
    {
        return response()->json($post->comments);
    }

    public function store(Request $request, Post $post)
    {
        $request->validate(['content' => 'required|string']);

        $comment = $post->comments()->create([
            'content' => $request->content,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($comment, 201);
    }

    public function show(Post $post, Comment $comment)
    {
        return response()->json($comment);
    }

    public function destroy(Post $post, Comment $comment)
    {
        Gate::authorize('delete', $comment);
        $comment->delete();

        return response()->json(null, 204);
    }
}
