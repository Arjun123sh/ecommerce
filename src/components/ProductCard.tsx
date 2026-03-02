import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Eye, Minus, Plus, ShieldAlert, LogIn } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  productImage: string;
  created_at: string;
}

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickQuantity, setQuickQuantity] = useState(1);
  const outOfStock = product.stockQuantity <= 0;
  const isGuest = !user;

  const handleAddToCart = () => {
    if (isGuest) {
      toast({ title: "Login required", description: "Please log in to add items to your cart.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (isAdmin) {
      toast({ title: "Admins cannot purchase", description: "Admin accounts are not allowed to place orders.", variant: "destructive" });
      return;
    }
    addItem(product, 1);
    toast({
      title: "Added to cart",
      description: `${product.title} has been added to your cart.`,
    });
  };

  const handleQuickAdd = () => {
    if (isGuest) {
      navigate("/auth");
      setDialogOpen(false);
      return;
    }
    if (isAdmin) return;
    addItem(product, quickQuantity);
    toast({
      title: "Added to cart",
      description: `${quickQuantity} x ${product.title} has been added to your cart.`,
    });
    setDialogOpen(false);
    setQuickQuantity(1);
  };

  return (
    <div className="group animate-fade-in overflow-hidden rounded-lg border border-border bg-card transition-all hover:glow-border">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-secondary">
          {product.productImage ? (
            <img
              src={product.productImage}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl font-bold text-muted-foreground/30">
              Lumina
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
            {product.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1" disabled={outOfStock}>
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">{product.title}</DialogTitle>
                  <DialogDescription className="mt-2">
                    {product.description || "No description available."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-display font-bold text-primary">${product.price.toFixed(2)}</span>
                    {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                      <span className="text-sm font-medium text-warning">Only {product.stockQuantity} left!</span>
                    )}
                  </div>
                  {!isGuest && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Quantity:</span>
                      <div className="flex items-center gap-2 rounded-lg border border-border p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQuickQuantity(Math.max(1, quickQuantity - 1))}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold">{quickQuantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQuickQuantity(Math.min(product.stockQuantity, quickQuantity + 1))}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button className="w-full gap-2" onClick={handleQuickAdd} disabled={outOfStock || isAdmin}>
                    {isGuest ? <LogIn className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    {isGuest ? "Login to Shop" : isAdmin ? "Admin Cannot Purchase" : "Add to Cart"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              disabled={outOfStock || isAdmin}
              onClick={handleAddToCart}
              title={isGuest ? "Login to add items to cart" : isAdmin ? "Admin accounts cannot purchase items" : undefined}
              className="gap-1"
            >
              {isGuest ? <LogIn className="h-4 w-4" /> : isAdmin ? <ShieldAlert className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {outOfStock ? "Sold Out" : isGuest ? "Login" : isAdmin ? "Admin" : "Add"}
            </Button>
          </div>
        </div>
        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <p className="mt-2 text-xs font-medium text-warning">Only {product.stockQuantity} left!</p>
        )}
      </div>
    </div>
  );
}
