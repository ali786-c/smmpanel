<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $query = BlogPost::where('status', 'published')
            ->orderByDesc('published_at');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'ilike', '%' . $request->search . '%')
                    ->orWhere('excerpt', 'ilike', '%' . $request->search . '%');
            });
        }

        $posts = $query->select([
            'id', 'title', 'slug', 'excerpt', 'category', 'tags',
            'read_time', 'published_at', 'meta_title', 'meta_description',
        ])->paginate($request->get('per_page', 12));

        return response()->json($posts);
    }

    public function show($slug)
    {
        $post = BlogPost::where('slug', $slug)->where('status', 'published')->firstOrFail();
        return response()->json($post);
    }

    public function categories()
    {
        $cats = BlogPost::where('status', 'published')
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();
        return response()->json($cats);
    }
}
