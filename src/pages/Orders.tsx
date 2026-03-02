import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { useAuth } from "@/lib/auth";
import { Package, Truck, CheckCircle2, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Orders() {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/myorders');
      return data;
    },
    enabled: !!user
  });

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground animate-pulse">Loading orders...</div>;

  return (
    <div className="container max-w-4xl py-12 animate-fade-in">
      <h1 className="font-display text-4xl font-bold">Your Orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
            <Package className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold">No orders yet</h2>
          <p className="mt-2 text-muted-foreground max-w-sm">When you place an order, it will appear here so you can track its status.</p>
          <Link to="/products" className="mt-8">
            <Button size="lg" className="font-display font-semibold">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order: any) => (
            <div key={order._id} className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30">
              <div className="bg-secondary/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border gap-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Order Placed</p>
                    <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                    <p className="text-sm font-medium">${order.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Order #</p>
                  <p className="text-sm font-medium font-mono">{order._id.substring(order._id.length - 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                  <div className="space-y-4">
                    <h3 className="font-display text-lg font-bold flex items-center gap-2">
                      <Package className="h-5 w-5" /> Items
                    </h3>
                    <div className="space-y-3">
                      {order.orderItems.map((item: any) => (
                        <div key={item.product} className="flex items-center gap-4">
                          <div className="h-12 w-12 flex-shrink-0 rounded bg-secondary overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center font-display text-xs font-bold text-muted-foreground/30">L</div>
                            )}
                          </div>
                          <div>
                            <Link to={`/products/${item.product}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                              {item.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.qty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-4 rounded-lg bg-secondary/10 p-4 border border-border">
                    <h3 className="font-display text-lg font-bold">Status</h3>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {order.isPaid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-amber-600 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium text-sm ${order.isPaid ? "text-green-700" : "text-amber-700"}`}>
                            {order.isPaid ? "Payment Successful" : "Awaiting Payment"}
                          </p>
                          {order.isPaid ? (
                            <p className="text-xs text-muted-foreground mt-1">Paid on {new Date(order.paidAt).toLocaleDateString()}</p>
                          ) : (
                            <Link to={`/order/${order._id}`}>
                              <Button variant="outline" size="sm" className="mt-2 h-7 text-xs border-amber-600/20 text-amber-700 hover:bg-amber-50">
                                Complete Payment
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 pt-3 border-t border-border">
                        {order.isDelivered ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <Truck className="h-5 w-5 text-primary mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium text-sm ${order.isDelivered ? "text-green-700" : "text-foreground"}`}>
                            {order.isDelivered ? "Delivered" : "Processing Delivery"}
                          </p>
                          {order.isDelivered ? (
                            <p className="text-xs text-muted-foreground mt-1">On {new Date(order.deliveredAt).toLocaleDateString()}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">We're getting your order ready.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Link to={`/order/${order._id}`}>
                    <Button variant="outline" className="font-display font-semibold">View Order Details</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
