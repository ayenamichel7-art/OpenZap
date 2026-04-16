<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiKeyController extends Controller
{
    /**
     * List user's API tokens.
     */
    public function index()
    {
        return response()->json(
            Auth::user()->tokens()->orderBy('created_at', 'desc')->get()
        );
    }

    /**
     * Create a new API token.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $token = Auth::user()->createToken($request->name);

        return response()->json([
            'message' => 'Clé API générée avec succès.',
            'token' => $token->plainTextToken,
            'token_record' => $token->accessToken
        ], 201);
    }

    /**
     * Revoke an API token.
     */
    public function destroy($tokenId)
    {
        $deleted = Auth::user()->tokens()->where('id', $tokenId)->delete();
        
        if ($deleted) {
            return response()->json(['message' => 'Clé API révoquée.']);
        }

        return response()->json(['message' => 'Clé non trouvée.'], 404);
    }
}
