import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import { cartApi } from "@/api/cart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, ArrowLeft, Minus, Plus } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return { ...res.data, id: res.data._id };
    },
    enabled: !!id
  });

  const handleAddToCart = async () => {
    if (isAdmin) {
      toast({ title: "Admins cannot purchase", description: "Admin accounts are not allowed to place orders.", variant: "destructive" });
      return;
    }
    addItem(product, quantity);

    if (user) {
      try {
        await cartApi.addToCart([{
          product: product.id,
          name: product.title,
          qty: quantity,
          image: product.productImage,
          price: product.price
        }]);
      } catch (error) {
        console.error("Failed to sync cart to backend:", error);
      }
    }

    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.title} has been added to your cart.`,
    });
  };

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  if (error || !product) return <div className="container py-20 text-center text-muted-foreground">Product not found.</div>;

  const outOfStock = product.stockQuantity <= 0;

  return (
    <div className="container py-8 animate-slide-up">
      <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Shop
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
          {product.productImage ? (
            <img src={product.productImage} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-6xl font-bold text-muted-foreground/20">Lumina</div>
          )}
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h1 className="font-display text-4xl font-bold">{product.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <div className="font-display text-4xl font-bold text-primary">${product.price.toFixed(2)}</div>

          {!outOfStock && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-border p-1">
                <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-display font-semibold">{quantity}</span>
                <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">{product.stockQuantity} in stock</span>
            </div>
          )}

          <Button
            size="lg"
            disabled={outOfStock || isAdmin}
            onClick={handleAddToCart}
            title={isAdmin ? "Admin accounts cannot purchase items" : undefined}
            className="gap-2 font-display text-lg font-semibold"
          >
            {isAdmin ? <ShieldAlert className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
            {isAdmin ? "Admin Cannot Purchase" : outOfStock ? "Sold Out" : "Add to Cart"}
          </Button>
          {isAdmin && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Admin accounts are restricted from purchasing items.
            </p>
          )}

          {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
            <p className="text-sm font-medium text-warning">⚡ Low stock — only {product.stockQuantity} left!</p>
          )}
        </div>
      </div>
    </div>
  );
}
