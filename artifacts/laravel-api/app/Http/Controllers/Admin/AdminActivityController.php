<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class AdminActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with(['actor:id,email'])
            ->orderByDesc('created_at');

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }
        if ($request->has('actor_id')) {
            $query->where('actor_id', $request->actor_id);
        }
        if ($request->has('target_type')) {
            $query->where('target_type', $request->target_type);
        }

        return response()->json($query->paginate($request->get('per_page', 25)));
    }
}
