<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class MediaController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'type' => 'required|in:image,video,audio,document'
        ]);

        $file = $request->file('file');
        $path = 'media/' . uniqid();

        if ($request->type === 'image') {
            // OPTIMIZATION: Resize & Convert to WebP
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);

            // Resize if too large (max 1200px width)
            if ($image->width() > 1200) {
                $image->scale(width: 1200);
            }

            // Encode to WebP with 80% quality
            $encoded = $image->toWebp(80);
            $filename = $path . '.webp';
            
            Storage::disk('s3')->put($filename, $encoded);
            $url = $this->getFileUrl($filename);
        } else {
            // Standard upload for other types
            $filename = Storage::disk('s3')->putFile('media', $file);
            $url = $this->getFileUrl($filename);
        }

        return response()->json([
            'url' => $url,
            'path' => $filename,
            'type' => $request->type
        ]);
    }

    /**
     * Build a public URL for a file stored in S3/MinIO.
     */
    protected function getFileUrl(string $path): string
    {
        $baseUrl = rtrim(config('filesystems.disks.s3.url', ''), '/');
        $bucket = config('filesystems.disks.s3.bucket', 'openzap');
        return "{$baseUrl}/{$bucket}/{$path}";
    }
}
