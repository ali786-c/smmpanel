import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Rocket, ArrowLeft, BookOpen, Calendar, Clock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  published_at: string;
  read_time: number;
  meta_title: string;
  meta_description: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20)
      .then(({ data }: any) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass-strong border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            <span className="text-xl font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      <div className="container px-4 mx-auto py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Marketing <span className="text-primary">Insights</span> Blog
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Expert articles on social media strategy, audience growth, content promotion, and campaign optimization.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Articles are being published daily. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.id} className="glass rounded-2xl p-6 hover:glow transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{post.category}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.read_time} min read
                  </span>
                </div>
                <h2 className="font-heading font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(post.published_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-primary flex items-center gap-1 group-hover:underline">
                    Read more <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
