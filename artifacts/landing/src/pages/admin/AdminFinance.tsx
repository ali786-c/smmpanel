import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight, Eye, CreditCard, User, X, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Input } from "@/components/ui/input";

export default function AdminFinance() {
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
 
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    apiFetch("/admin/finance").then(r => r.ok ? r.json() : null).then(ov => {
      setOverview(ov?.overview ?? ov ?? {});
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: "25"
    });
    if (debouncedSearch) params.set("search", debouncedSearch);

    apiFetch(`/admin/finance/transactions?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(tx => {
        setTransactions(tx?.data ?? tx?.transactions ?? []);
        setLastPage(tx?.last_page ?? 1);
      })
      .finally(() => setLoading(false));
  }, [currentPage, debouncedSearch]);

  if (loading && !transactions.length) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const o = overview ?? {};
  const statCards = [
    { label: "Total Revenue", value: `$${parseFloat(o.total_revenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-primary" },
    { label: "Gross Profit", value: `$${parseFloat(o.gross_profit ?? o.total_profit ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
    { label: "Total Deposits", value: `$${parseFloat(o.total_deposits ?? 0).toFixed(2)}`, icon: ArrowDownLeft, color: "text-blue-400" },
    { label: "Total Refunds", value: `$${parseFloat(o.total_refunds ?? 0).toFixed(2)}`, icon: ArrowUpRight, color: "text-destructive" },
  ];

  const chartData = (o.daily_revenue ?? []).map((d: any) => ({ ...d, profit: d.profit ?? 0 }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className={`text-xl font-heading font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Revenue & Profit Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="hsl(163,58%,50%)" radius={[2, 2, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="hsl(38,92%,50%)" radius={[2, 2, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="font-heading font-semibold">Recent Transactions</h3>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by user email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl border-border/50 bg-secondary/20 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                {["User","Type","Method","Amount","Status","Date", "Details"].map(h => <th key={h} className="pb-3 font-medium text-xs whitespace-nowrap px-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading && !transactions.length ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No transactions found</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                    <td className="py-3 px-2 text-xs font-medium">{tx.user_email ?? tx.user?.email ?? "—"}</td>
                  <td className="py-3 capitalize text-xs">{tx.type}</td>
                  <td className="py-3 text-xs text-muted-foreground">{tx.payment_method ?? "—"}</td>
                  <td className={`py-3 font-bold text-sm ${tx.amount >= 0 ? "text-primary" : "text-destructive"}`}>
                    {tx.amount >= 0 ? "+" : ""}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{tx.status}</span>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    {tx.payhub_details && (
                      <button 
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No transactions</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Page <span className="text-foreground font-medium">{currentPage}</span> of <span className="text-foreground font-medium">{lastPage}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg glass border border-border/50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                disabled={currentPage === lastPage}
                className="px-3 py-1.5 rounded-lg glass border border-border/50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-lg">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Transaction ID</span>
                  <p className="text-sm font-mono break-all">{selectedTx.id}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Status</span>
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedTx.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{selectedTx.status}</span>
                  </div>
                </div>
              </div>

              {selectedTx.payhub_details && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                    <CreditCard className="w-3.5 h-3.5" />
                    Card Information
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Card Brand</span>
                      <p className="text-sm flex items-center gap-2 capitalize">
                        {selectedTx.payhub_details.card_brand || "Unknown"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Last 4 Digits</span>
                      <p className="text-sm font-mono">•••• •••• •••• {selectedTx.payhub_details.card_last4 || "****"}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
                        <User className="w-3 h-3" /> Cardholder Name
                      </span>
                      <p className="text-sm font-medium">{selectedTx.payhub_details.card_holder_name || "Not provided"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Exchange Rate</span>
                      <p className="text-sm">1 USD = {parseFloat(selectedTx.payhub_details.exchange_rate).toFixed(4)} EUR</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Amount (EUR)</span>
                      <p className="text-sm font-bold text-primary">€{parseFloat(selectedTx.payhub_details.amount_eur).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-secondary/30 text-center">
              <button onClick={() => setSelectedTx(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
