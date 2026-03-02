import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, DollarSign, ShoppingCart, AlertTriangle, CheckCircle2, Truck, TrendingUp, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function Admin() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [form, setForm] = useState({ title: "", description: "", price: "", stockQuantity: "", productImage: "", category: "Desk Organizers" });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing in .env");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Image upload failed");
      }

      const data = await res.json();
      setForm(prev => ({ ...prev, productImage: data.secure_url }));
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", description: "", price: "", stockQuantity: "", productImage: "", category: "Desk Organizers" });
    setEditingProduct(null);
  };

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await api.get('/products?pageSize=100'); // Fetch up to 100 for admin view
      return data.products;
    },
    enabled: isAdmin
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders');
      return data;
    },
    enabled: isAdmin
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => await api.post('/products', payload),
    onSuccess: () => {
      toast({ title: "Product created" });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: any }) => await api.put(`/products/${id}`, payload),
    onSuccess: () => {
      toast({ title: "Product updated" });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/products/${id}`),
    onSuccess: () => {
      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" })
  });

  const deliverMutation = useMutation({
    mutationFn: async (id: string) => await api.put(`/orders/${id}/deliver`),
    onSuccess: () => {
      toast({ title: "Order marked as delivered" });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" })
  });

  const products = productsData || [];
  const orders = ordersData?.orders || [];
  const totalRevenue = ordersData?.totalRevenue || 0;
  const totalOrders = ordersData?.totalOrders || 0;
  const lowStock = products.filter((p: any) => p.stockQuantity <= 5 && p.stockQuantity > 0);

  // ── Chart 1: Revenue Over Time (grouped by day) ──
  const revenueOverTime = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o: any) => {
      if (!o.isPaid) return;
      const date = new Date(o.paidAt || o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      map[date] = (map[date] || 0) + (o.totalPrice || 0);
    });
    return Object.entries(map)
      .sort((a, b) => new Date(a[0] + " 2025").getTime() - new Date(b[0] + " 2025").getTime())
      .slice(-10)
      .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }));
  }, [orders]);

  // ── Chart 2: Order Status (Donut) ──
  const orderStatusData = useMemo(() => {
    const paid = orders.filter((o: any) => o.isPaid).length;
    const pending = orders.filter((o: any) => !o.isPaid).length;
    const delivered = orders.filter((o: any) => o.isDelivered).length;
    const notDelivered = orders.filter((o: any) => o.isPaid && !o.isDelivered).length;
    return [
      { name: "Paid", value: paid, color: "#6366f1" },
      { name: "Pending Payment", value: pending, color: "#f59e0b" },
      { name: "Delivered", value: delivered, color: "#10b981" },
      { name: "Awaiting Delivery", value: notDelivered, color: "#6366f1" },
    ].filter(d => d.value > 0);
  }, [orders]);

  // ── Chart 3: Revenue by Category (Bar) ──
  const categoryRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o: any) => {
      if (!o.isPaid) return;
      (o.orderItems || []).forEach((item: any) => {
        const cat = item.category || "Other";
        map[cat] = (map[cat] || 0) + (item.price * item.qty);
      });
    });
    if (Object.keys(map).length === 0) {
      products.forEach((p: any) => {
        const cat = p.category || "Other";
        map[cat] = (map[cat] || 0) + p.price;
      });
    }
    return Object.entries(map)
      .map(([category, revenue]) => ({ category, revenue: parseFloat(revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, products]);

  if (!isAdmin) {
    return <div className="container py-20 text-center text-muted-foreground">Access denied. Admin only.</div>;
  }

  const handleSave = () => {
    const price = parseFloat(form.price);
    const stockQuantity = parseInt(form.stockQuantity);
    if (!form.title.trim() || isNaN(price) || price < 0 || isNaN(stockQuantity) || stockQuantity < 0) {
      toast({ title: "Invalid input", description: "Check all fields.", variant: "destructive" });
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      price,
      stockQuantity,
      productImage: form.productImage.trim() || undefined,
      category: form.category
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setForm({
      title: p.title,
      description: p.description ?? "",
      price: p.price.toString(),
      stockQuantity: p.stockQuantity.toString(),
      productImage: p.productImage ?? "",
      category: p.category ?? "Desk Organizers"
    });
    setDialogOpen(true);
  };

  if (loadingProducts || loadingOrders) return <div className="container py-20 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;

  return (
    <div className="container py-12 animate-fade-in max-w-6xl">
      <h1 className="font-display text-4xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: DollarSign, label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "text-primary" },
          { icon: ShoppingCart, label: "Total Orders", value: totalOrders.toString(), color: "text-foreground" },
          { icon: Package, label: "Total Products", value: products.length.toString(), color: "text-foreground" },
          { icon: AlertTriangle, label: "Low Stock Items", value: lowStock.length.toString(), color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/50">
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Financial Charts ── */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">

        {/* Chart 1: Revenue Over Time */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold">Revenue Over Time</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Paid orders by date</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              Last {revenueOverTime.length} days
            </div>
          </div>
          {revenueOverTime.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-dashed rounded-lg">
              No paid order data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueOverTime} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revGradient)" dot={{ fill: "#8b5cf6", r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2: Order Status Donut */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold">Order Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown of all orders</p>
          </div>
          {orderStatusData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
              No orders yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {orderStatusData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1e1b2e", border: "1px solid #3f3a55", borderRadius: 8, fontSize: 12, color: "#fff" }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {orderStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart 3: Revenue by Category */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="font-display text-lg font-bold">Revenue by Category</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {orders.some((o: any) => o.isPaid) ? "Based on paid order items" : "Based on product catalog pricing"}
          </p>
        </div>
        {categoryRevenue.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm border border-dashed rounded-lg">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={36}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
              />
              <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Low stock warning */}
      {lowStock.length > 0 && (
        <div className="mt-8 rounded-lg border border-warning/30 bg-warning/5 p-5">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-warning mb-3">
            <AlertTriangle className="h-5 w-5" /> Low Stock Alerts
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p: any) => (
              <span key={p._id} className="rounded-md bg-warning/10 border border-warning/20 px-3 py-1.5 text-sm font-medium text-warning">
                {p.title} <span className="opacity-70">({p.stockQuantity} left)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        {/* Products Management */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Inventory</h2>
            <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 font-display font-semibold">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={1000} className="resize-none h-24" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input type="number" min="0" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="Desk Organizers">Desk Organizers</option>
                        <option value="Lighting">Lighting</option>
                        <option value="Tech Accessories">Tech Accessories</option>
                        <option value="Seating">Seating</option>
                        <option value="Stationery">Stationery</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <Label>Product Image</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                        {uploadingImage && <span className="text-sm text-muted-foreground animate-pulse whitespace-nowrap">Uploading...</span>}
                      </div>
                      {form.productImage && (
                        <div className="relative inline-block mt-2">
                          <img src={form.productImage} alt="Preview" className="h-24 w-24 object-cover rounded-md border border-border" />
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[96px]">{form.productImage.split('/').pop()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button className="w-full font-display text-lg font-semibold mt-4" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 rounded-lg">
            {products.map((p: any) => (
              <div key={p._id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                    {p.productImage ? <img src={p.productImage} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground font-display font-bold">Lumina</div>}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-display font-semibold text-lg">{p.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">${p.price.toFixed(2)} · <span className={p.stockQuantity <= 5 ? "text-warning font-medium" : ""}>{p.stockQuantity} in stock</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEdit(p)} className="h-9 w-9"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => deleteMutation.mutate(p._id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">No products found. Add some to get started.</p>}
          </div>
        </section>

        {/* Orders Management */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Recent Orders</h2>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 rounded-lg">
            {orders.map((o: any) => (
              <div key={o._id} className="flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-display font-semibold text-lg">Order #{o._id.substring(o._id.length - 6).toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleDateString()} · {o.user?.name || "Guest"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg text-primary">${o.totalPrice.toFixed(2)}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {o.isPaid ? (
                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</span>
                      ) : (
                        <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending Payment</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-2 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-2">Status:</span>
                    {o.isDelivered ? (
                      <span className="font-medium text-foreground">Delivered on {new Date(o.deliveredAt).toLocaleDateString()}</span>
                    ) : (
                      <span className="font-medium text-muted-foreground">Not Delivered</span>
                    )}
                  </div>
                  {!o.isDelivered && o.isPaid && (
                    <Button size="sm" variant="outline" className="h-8 gap-1 border-primary/20 text-primary hover:bg-primary/5" onClick={() => deliverMutation.mutate(o._id)} disabled={deliverMutation.isPending}>
                      <Truck className="h-3 w-3" /> Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">No orders yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
