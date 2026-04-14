<?php

namespace App\Http\Controllers;

use App\Models\Announcement;

class AnnouncementController extends Controller
{
    public function index()
    {
        $announcements = Announcement::where('is_active', true)
            ->orderByDesc('priority')
            ->orderByDesc('created_at')
            ->get();
        return response()->json($announcements);
    }
}
