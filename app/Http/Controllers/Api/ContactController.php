<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->contacts();

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        if ($request->tag) {
            $query->whereJsonContains('tags', $request->tag);
        }

        return $query->latest()->paginate(100);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'tags' => 'nullable|array'
        ]);

        return Auth::user()->contacts()->create($validated);
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'contacts' => 'required|array',
            'contacts.*.phone' => 'required|string',
            'contacts.*.name' => 'nullable|string'
        ]);

        $contactsToUpsert = [];
        $userId = Auth::id();

        foreach ($request->contacts as $data) {
            $phone = preg_replace('/[^0-9]/', '', $data['phone']);
            if (empty($phone)) continue;

            $contactsToUpsert[] = [
                'user_id' => $userId,
                'phone' => $phone,
                'name' => $data['name'] ?? null,
                'tags' => json_encode($data['tags'] ?? []),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            // Chunking to avoid massive single insert
            if (count($contactsToUpsert) >= 500) {
                Contact::upsert($contactsToUpsert, ['user_id', 'phone'], ['name', 'tags', 'updated_at']);
                $imported += count($contactsToUpsert);
                $contactsToUpsert = [];
            }
        }

        if (!empty($contactsToUpsert)) {
            Contact::upsert($contactsToUpsert, ['user_id', 'phone'], ['name', 'tags', 'updated_at']);
            $imported += count($contactsToUpsert);
        }

        return response()->json([
            'message' => "{$imported} contacts importés avec succès.",
        ]);
    }

    public function importGoogleSheet(Request $request)
    {
        $request->validate(['url' => 'required|url']);
        
        $url = $request->url;
        
        // Fix #21: Secure URL validation to prevent SSRF
        $parsedUrl = parse_url($url);
        $host = $parsedUrl['host'] ?? '';
        
        $allowedHosts = ['docs.google.com', 'spreadsheets.google.com', 'google.com'];
        $isSafe = false;
        foreach ($allowedHosts as $allowedHost) {
            if ($host === $allowedHost || str_ends_with($host, '.' . $allowedHost)) {
                $isSafe = true;
                break;
            }
        }

        if (!$isSafe) {
            return response()->json(['error' => "URL invalide. Seuls les Google Sheets officiels sont autorisés."], 403);
        }
        
        // Convert to export URL
        if (str_contains($url, '/edit')) {
            $url = explode('/edit', $url)[0] . '/export?format=csv';
        }

        try {
            // Use Laravel HTTP client with timeout and limit to prevent hangs or large file attacks
            $response = \Illuminate\Support\Facades\Http::timeout(10)->get($url);
            
            if (!$response->successful()) {
                throw new \Exception("Échec du téléchargement du fichier.");
            }

            $csv = $response->body();
            $lines = explode("\n", $csv);
            $contactsToUpsert = [];
            $userId = Auth::id();

            foreach ($lines as $index => $line) {
                if ($index === 0 || empty(trim($line))) continue; // Skip header/empty
                
                $data = str_getcsv($line);
                if (count($data) >= 1) {
                    $phone = preg_replace('/[^0-9]/', '', $data[0]);
                    if (empty($phone)) continue;

                    $contactsToUpsert[] = [
                        'user_id' => $userId,
                        'phone' => $phone,
                        'name' => $data[1] ?? null,
                        'tags' => json_encode([]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    if (count($contactsToUpsert) >= 500) {
                        Contact::upsert($contactsToUpsert, ['user_id', 'phone'], ['name', 'updated_at']);
                        $count += count($contactsToUpsert);
                        $contactsToUpsert = [];
                    }
                }
            }

            if (!empty($contactsToUpsert)) {
                Contact::upsert($contactsToUpsert, ['user_id', 'phone'], ['name', 'updated_at']);
                $count += count($contactsToUpsert);
            }

            return response()->json(['message' => "$count contacts importés depuis Google Sheets."]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Google Sheets Import Error: " . $e->getMessage());
            return response()->json(['error' => "Impossible de lire le sheet: " . $e->getMessage()], 422);
        }
    }

    public function show(Contact $contact)
    {
        $this->authorize('view', $contact);
        return $contact;
    }

    public function update(Request $request, Contact $contact)
    {
        $this->authorize('update', $contact);
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'tags' => 'nullable|array'
        ]);

        $contact->update($validated);
        return $contact;
    }

    public function destroy(Contact $contact)
    {
        $this->authorize('delete', $contact);
        $contact->delete();
        return response()->json(['message' => 'Contact deleted.']);
    }
}
