import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();

  // Debounced search optimization
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Categories list
  const categories = ['Desk Organizers', 'Lighting', 'Tech Accessories', 'Seating', 'Stationery'];

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', debouncedSearch, categoryFilter, sortBy],
    queryFn: async () => {
      let url = `/products?keyword=${debouncedSearch}`;
      if (categoryFilter && categoryFilter !== "all") {
        url += `&category=${categoryFilter}`;
      }
      if (sortBy === "price-asc") url += `&sort=lowest`;
      if (sortBy === "price-desc") url += `&sort=highest`;

      const res = await api.get(url);
      return res.data;
    },
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Failed to load products",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="container py-8 flex-col flex animate-fade-in">
      <h1 className="font-display text-3xl font-bold">Lumina Shop</h1>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search Lumina workspace products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" maxLength={100} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low → High</SelectItem>
            <SelectItem value="price-desc">Price: High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="mt-12 text-center text-muted-foreground">Loading premium products...</div>
      ) : error ? (
        <div className="mt-12 text-center text-destructive">Error loading products.</div>
      ) : !data || data.products.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">No products found.</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.products.map((p: any) => <ProductCard key={p._id} product={{ ...p, id: p._id, created_at: p.createdAt }} />)}
        </div>
      )}
    </div>
  );
}
