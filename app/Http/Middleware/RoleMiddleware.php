<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        \Log::debug($role);
        if (!$request->user() || !$request->user()->roles()->whereIn('name', $roles)->exists()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
