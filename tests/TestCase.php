<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Send the following requests with a real Sanctum bearer token for the user.
     */
    protected function withTokenFor(User $user): static
    {
        // The auth guard caches the resolved user between requests in one test
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('test')->plainTextToken);
    }
}
