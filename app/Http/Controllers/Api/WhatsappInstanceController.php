<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappInstance;
use App\Services\EvolutionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WhatsappInstanceController extends Controller
{
    protected $evolution;

    public function __construct(EvolutionService $evolution)
    {
        $this->evolution = $evolution;
    }

    public function index()
    {
        return Auth::user()->whatsappInstances;
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:whatsapp_instances,name'
        ]);

        $instanceName = $request->name;
        $result = $this->evolution->createInstance($instanceName);

        if (!$result || !isset($result['hash'])) {
            return response()->json(['message' => 'Failed to create instance on Evolution API'], 500);
        }

        $instance = Auth::user()->whatsappInstances()->create([
            'name' => $instanceName,
            'instance_id' => $instanceName, // Evolution uses name as ID usually
            'status' => 'pending',
            'token' => $result['hash']
        ]);

        return response()->json([
            'instance' => $instance,
            'qr' => $result['qrcode'] ?? null
        ]);
    }

    public function show(WhatsappInstance $instance)
    {
        $this->authorize('view', $instance);
        
        $status = $this->evolution->getInstanceStatus($instance->name);
        
        return response()->json([
            'database' => $instance,
            'evolution' => $status
        ]);
    }

    public function connect(WhatsappInstance $instance)
    {
        $this->authorize('update', $instance);
        
        $qr = $this->evolution->getQrCode($instance->name);
        
        return response()->json($qr);
    }

    public function pairingCode(Request $request, WhatsappInstance $instance)
    {
        $this->authorize('update', $instance);
        $request->validate(['phone' => 'required|string']);

        $code = $this->evolution->getPairingCode($instance->name, $request->phone);

        return response()->json($code);
    }

    public function groups(WhatsappInstance $instance)
    {
        $this->authorize('view', $instance);
        return response()->json($this->evolution->fetchGroups($instance->name));
    }

    public function update(Request $request, WhatsappInstance $instance)
    {
        $this->authorize('update', $instance);

        $validated = $request->validate([
            'daily_limit' => 'nullable|integer|min:1|max:10000',
        ]);

        $instance->update($validated);

        return response()->json([
            'message' => 'Configuration du Gardien mise à jour.',
            'instance' => $instance
        ]);
    }

    public function destroy(WhatsappInstance $instance)
    {
        $this->authorize('delete', $instance);
        
        // Clean up the instance in Evolution API as well
        try {
            $this->evolution->deleteInstance($instance->name);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Evolution API cleanup failed for instance {$instance->name}: " . $e->getMessage());
        }

        $instance->delete();

        return response()->json(['message' => 'Instance supprimée.']);
    }
}
