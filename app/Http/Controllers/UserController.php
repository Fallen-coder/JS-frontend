<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function assignRole(Request $request, User $user)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->roles()->attach($request->role_id);

        return response()->json(['message' => 'Role assigned successfully.']);
    }

    public function removeRole(Request $request, User $user)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->roles()->detach($request->role_id);

        return response()->json(['message' => 'Role removed successfully.']);
    }
}
