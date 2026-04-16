import { useEffect, useState } from "react";

declare const __LARAVEL_API_URL__: string;
const API_BASE = `${__LARAVEL_API_URL__}/landing`;

export function useStats() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then(res => res.json())
      .then(d => {
        setData(d.data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

export function useTestimonials(page = 1, filters: Record<string, string> = {}) {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: '12',
      ...filters
    });
    
    fetch(`${API_BASE}/testimonials?${params.toString()}`)
      .then(res => res.json())
      .then(d => {
        setData(prev => page === 1 ? d.data : [...prev, ...d.data]);
        setMeta(d.meta);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [page, JSON.stringify(filters)]);

  return { data, meta, loading };
}

export function useFeaturedTestimonials() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/testimonials/featured`)
      .then(res => res.json())
      .then(d => {
        setData(d.data || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

export function usePlatforms() {
  const [data, setData] = useState<string[]>([]);
  
  useEffect(() => {
    fetch(`${API_BASE}/platforms`)
      .then(res => res.json())
      .then(d => setData(d.data || []))
      .catch(e => console.error(e));
  }, []);

  return { data };
}

export function useNiches() {
  const [data, setData] = useState<string[]>([]);
  
  useEffect(() => {
    fetch(`${API_BASE}/niches`)
      .then(res => res.json())
      .then(d => setData(d.data || []))
      .catch(e => console.error(e));
  }, []);

  return { data };
}
