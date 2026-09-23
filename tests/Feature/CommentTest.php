<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_list_comments_of_a_post(): void
    {
        $post = Post::factory()->create();
        $post->comments()->create(['content' => 'Nice', 'user_id' => $post->user_id]);

        $this->getJson("/api/posts/{$post->id}/comments")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.content', 'Nice');
    }

    public function test_user_can_show_a_comment(): void
    {
        $post = Post::factory()->create();
        $comment = $post->comments()->create(['content' => 'Nice', 'user_id' => $post->user_id]);

        $this->withTokenFor($post->user)
            ->getJson("/api/posts/{$post->id}/comments/{$comment->id}")
            ->assertOk()
            ->assertJsonPath('content', 'Nice');
    }

    public function test_guest_cannot_comment(): void
    {
        $post = Post::factory()->create();

        $this->postJson("/api/posts/{$post->id}/comments", ['content' => 'Nice'])->assertUnauthorized();
    }

    public function test_user_can_comment(): void
    {
        $post = Post::factory()->create();
        $user = User::factory()->create();

        $this->withTokenFor($user)
            ->postJson("/api/posts/{$post->id}/comments", ['content' => 'Nice'])
            ->assertCreated()
            ->assertJsonPath('user_id', $user->id);

        $this->assertDatabaseHas('comments', ['post_id' => $post->id, 'content' => 'Nice']);
    }

    public function test_comment_requires_content(): void
    {
        $post = Post::factory()->create();

        $this->withTokenFor($post->user)
            ->postJson("/api/posts/{$post->id}/comments", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    }

    public function test_author_can_delete_comment(): void
    {
        $post = Post::factory()->create();
        $author = User::factory()->create();
        $comment = $post->comments()->create(['content' => 'Nice', 'user_id' => $author->id]);

        $this->withTokenFor($author)
            ->deleteJson("/api/posts/{$post->id}/comments/{$comment->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_other_user_cannot_delete_comment(): void
    {
        $post = Post::factory()->create();
        $comment = $post->comments()->create(['content' => 'Nice', 'user_id' => $post->user_id]);

        $this->withTokenFor(User::factory()->create())
            ->deleteJson("/api/posts/{$post->id}/comments/{$comment->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('comments', ['id' => $comment->id]);
    }
}
