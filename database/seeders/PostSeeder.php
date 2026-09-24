<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $posts = Post::factory(3)->for($user)->create();

            foreach ($posts as $post) {
                // Every third post is private (status 2), the rest stay public (status 1)
                if ($post->id % 3 === 0) {
                    $post->update(['post_status_id' => 2]);
                }

                foreach ($users->random(rand(0, 4)) as $commenter) {
                    $post->comments()->create([
                        'user_id' => $commenter->id,
                        'content' => fake()->sentence(),
                    ]);
                }
            }
        }
    }
}
