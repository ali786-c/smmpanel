// Supabase stub — this landing artifact uses the Laravel backend, not Supabase.
// Components that previously called supabase will fall back to static defaults.
export const supabase = {
  from: (_table: string) => ({
    select: (_cols: string, _opts?: any) => ({
      eq: (_col: string, _val: any) => Promise.resolve({ data: [], count: 0, error: null }),
      in: (_col: string, _vals: any[]) => ({ then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb) }),
      then: (cb: any) => Promise.resolve({ data: [], count: 0, error: null }).then(cb),
    }),
    then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb),
  }),
  channel: (_name: string) => ({
    on: () => ({ subscribe: () => ({}) }),
  }),
  removeChannel: (_ch: any) => {},
};
