<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receives_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Anna',
            'email' => 'anna@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'anna@example.com')
            ->assertJsonStructure(['user', 'token']);
        $this->assertDatabaseHas('users', ['email' => 'anna@example.com']);
    }

    public function test_register_validates_input(): void
    {
        $this->postJson('/api/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_user_can_login_and_use_token(): void
    {
        User::factory()->create(['email' => 'anna@example.com', 'password' => 'secret123']);

        $token = $this->postJson('/api/login', [
            'email' => 'anna@example.com',
            'password' => 'secret123',
        ])->assertOk()->json('token');

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', 'anna@example.com');
    }

    public function test_login_with_wrong_password_returns_no_token(): void
    {
        User::factory()->create(['email' => 'anna@example.com', 'password' => 'secret123']);

        $this->postJson('/api/login', [
            'email' => 'anna@example.com',
            'password' => 'wrong',
        ])->assertJsonMissingPath('token')
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_protected_route_rejects_missing_or_invalid_token(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->withToken('1|not-a-real-token')->getJson('/api/user')->assertUnauthorized();
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }
}
