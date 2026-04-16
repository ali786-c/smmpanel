import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Rocket, ArrowLeft, Calendar, Clock, Loader2, BookOpen } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { Helmet } from "react-helmet-async";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  published_at: string;
  read_time: number;
  meta_title: string;
  meta_description: string;
  tags: string[];
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_BASE}/blog/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then(d => { if (d) setPost(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Article not found.</p>
        <Link to="/blog" className="text-primary hover:underline text-sm">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} — emazingSM Blog</title>
        {post.meta_description && <meta name="description" content={post.meta_description} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <nav className="glass-strong border-b border-border">
          <div className="container flex items-center justify-between h-16 px-4 mx-auto">
            <Link to="/" className="flex items-center gap-2">
              <Rocket className="w-6 h-6 text-primary" />
              <span className="text-xl font-heading font-bold">emazin<span className="text-primary">gSM</span></span>
            </Link>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
          </div>
        </nav>

        <article className="container px-4 mx-auto py-12 max-w-3xl">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{post.category}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(post.published_at).toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.read_time} min read
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-8">{post.title}</h1>

          <div
            className="prose prose-invert prose-sm max-w-none [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_a]:text-primary [&_blockquote]:border-primary/30"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border flex-wrap">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-lg glass text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
}
