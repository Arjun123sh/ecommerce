import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight">
          <span className="text-gradient">Lumina</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Shop
          </Link>
          {user ? (
            <>
              <Link to="/orders" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Orders
              </Link>
              <Link to="/profile" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <User className="mr-1 inline h-4 w-4" />
                Profile
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <LayoutDashboard className="mr-1 inline h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link to="/cart" className="relative">
                <ShoppingBag className="h-5 w-5 text-foreground" />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/products" onClick={() => setMobileOpen(false)} className="text-sm font-medium">Shop</Link>
            {user ? (
              <>
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="text-sm font-medium">Orders</Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm font-medium">Profile</Link>
                {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium">Admin</Link>}
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-sm font-medium flex items-center gap-2">
                  Cart {itemCount > 0 && <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{itemCount}</span>}
                </Link>
                <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="text-left text-sm font-medium text-destructive">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)}><Button variant="default" size="sm" className="w-full">Sign In</Button></Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
