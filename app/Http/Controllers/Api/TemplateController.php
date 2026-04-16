<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TemplateController extends Controller
{
    public function index()
    {
        return Template::where('user_id', Auth::id())->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'nullable|string',
            'media_urls' => 'nullable|array',
            'category' => 'nullable|string|in:marketing,utility,notification',
        ]);

        $template = Template::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'content' => $validated['content'] ?? null,
            'media_urls' => $validated['media_urls'] ?? [],
            'category' => $validated['category'] ?? 'marketing',
        ]);

        return response()->json($template, 201);
    }

    public function show(Template $template)
    {
        $this->authorize('view', $template);
        return response()->json($template);
    }

    public function update(Request $request, Template $template)
    {
        $this->authorize('update', $template);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'content' => 'nullable|string',
            'media_urls' => 'nullable|array',
            'category' => 'nullable|string|in:marketing,utility,notification',
        ]);

        $template->update($validated);
        return response()->json($template);
    }

    public function destroy(Template $template)
    {
        $this->authorize('delete', $template);

        $template->delete();
        return response()->json(null, 204);
    }
}
