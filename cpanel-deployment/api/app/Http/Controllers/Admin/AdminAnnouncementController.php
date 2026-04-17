<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminAnnouncementController extends Controller
{
    public function index()
    {
        return response()->json(Announcement::orderByDesc('priority')->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'priority' => 'nullable|integer',
        ]);

        $announcement = Announcement::create(array_merge($validated, ['id' => (string) Str::uuid()]));
        return response()->json($announcement, 201);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'priority' => 'nullable|integer',
        ]);

        $announcement->update(array_filter($validated, fn($v) => $v !== null));
        return response()->json($announcement);
    }

    public function destroy($id)
    {
        Announcement::findOrFail($id)->delete();
        return response()->json(['message' => 'Announcement deleted']);
    }
}
