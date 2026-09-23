<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_assign_role(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin']);

        $this->postJson("/api/users/{$user->id}/assign-role", ['role_id' => $role->id])->assertUnauthorized();
    }

    public function test_role_can_be_assigned_and_removed(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin']);

        $this->withTokenFor($user)
            ->postJson("/api/users/{$user->id}/assign-role", ['role_id' => $role->id])
            ->assertOk();
        $this->assertTrue($user->roles()->where('name', 'admin')->exists());

        $this->withTokenFor($user)
            ->postJson("/api/users/{$user->id}/remove-role", ['role_id' => $role->id])
            ->assertOk();
        $this->assertFalse($user->roles()->exists());
    }

    public function test_role_must_exist(): void
    {
        $user = User::factory()->create();

        $this->withTokenFor($user)
            ->postJson("/api/users/{$user->id}/assign-role", ['role_id' => 999])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role_id']);
    }
}
