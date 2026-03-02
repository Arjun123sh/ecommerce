import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function OrderSuccess() {
  const location = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { orderId?: string };
    if (state?.orderId) {
      setOrderId(state.orderId);
    }
  }, [location]);

  return (
    <div className="container flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
        <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
      </div>
      
      <h1 className="mt-6 font-display text-4xl font-bold">Order Placed Successfully!</h1>
      
      <p className="mt-4 text-center text-muted-foreground max-w-md">
        Thank you for your purchase. We've sent a confirmation email with your order details.
        {orderId && <span className="block mt-2 font-medium text-foreground">Order ID: {orderId}</span>}
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-lg border border-border bg-card p-4">
        <Package className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">Estimated delivery: 3-5 business days</span>
      </div>

      <div className="mt-8 flex gap-4">
        <Link to="/orders">
          <Button variant="outline" className="gap-2">
            View Orders
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/products">
          <Button className="font-display font-semibold">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
