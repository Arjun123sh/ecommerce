import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Package, Truck, CreditCard } from "lucide-react";

// Using the provided Stripe test publishable key from environment or default
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_TYooMQauvdEDq54NiTphI7jx");

function CheckoutForm({ orderId, clientSecret }: { orderId: string, clientSecret: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (error) {
            toast({
                title: "Payment failed",
                description: error.message || "Something went wrong.",
                variant: "destructive",
            });
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // Confirm payment with our backend
            try {
                await api.put(`/orders/${orderId}/pay`, {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    update_time: new Date().toISOString(),
                    email_address: "payment@lumina.com", // Stripe usually provides this, but mocked for now without webhook
                });
                toast({
                    title: "Payment successful!",
                    description: "Your order is confirmed.",
                });
                // Reload to show paid state
                window.location.reload();
            } catch (err) {
                toast({ title: "Error", description: "Payment recorded, but backend update failed.", variant: "destructive" });
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <PaymentElement />
            <Button
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className="w-full font-display font-semibold"
                size="lg"
            >
                {isProcessing ? "Processing..." : "Pay Now"}
            </Button>
        </form>
    );
}

export default function OrderDetails() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    // Try to get clientSecret from router state (if they just came from Cart)
    const [clientSecret] = useState(location.state?.clientSecret || null);

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const { data } = await api.get(`/orders/${id}`);
            return data;
        },
        enabled: !!id
    });

    if (isLoading) return <div className="container py-20 text-center">Loading order details...</div>;
    if (!order) return <div className="container py-20 text-center">Order not found.</div>;

    return (
        <div className="container max-w-5xl py-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <h1 className="font-display text-4xl font-bold">Order Details</h1>
                {order.isPaid ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        <CheckCircle2 className="h-4 w-4" /> Paid
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                        <CreditCard className="h-4 w-4" /> Awaiting Payment
                    </span>
                )}
            </div>

            <div className="grid gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <section className="rounded-lg border border-border bg-card p-6">
                        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold mb-6">
                            <Package className="h-5 w-5 text-muted-foreground" /> Order Items
                        </h2>
                        <div className="space-y-4">
                            {order.orderItems.map((item: any) => (
                                <div key={item.product} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-secondary">
                                        {item.image ? (
                                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center font-display text-xs text-muted-foreground">Lumina</div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col justify-center">
                                        <p className="font-semibold">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.qty} x ${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="font-bold text-lg">${(item.qty * item.price).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-lg border border-border bg-card p-6">
                        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold mb-6">
                            <Truck className="h-5 w-5 text-muted-foreground" /> Shipping Details
                        </h2>
                        <div className="space-y-1 text-muted-foreground">
                            <p><strong className="text-foreground">Name:</strong> {order.user?.name || "Customer"}</p>
                            <p><strong className="text-foreground">Email:</strong> {order.user?.email || "N/A"}</p>
                            <p className="mt-2"><strong className="text-foreground">Address:</strong></p>
                            <p>{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-border">
                            <h3 className="font-semibold mb-2 text-foreground">Delivery Status</h3>
                            {order.isDelivered ? (
                                <p className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-md w-fit">
                                    <CheckCircle2 className="h-4 w-4" /> Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                                </p>
                            ) : (
                                <p className="flex items-center gap-2 text-rose-700 bg-rose-100 p-3 rounded-md w-fit">
                                    <Truck className="h-4 w-4" /> Not Delivered Yet
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                <div className="h-fit space-y-6">
                    <section className="rounded-lg border border-border bg-card p-6">
                        <h2 className="font-display text-2xl font-bold mb-6">Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>${order.itemsPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${order.shippingPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${order.taxPrice.toFixed(2)}</span></div>
                        </div>
                        <div className="mt-6 border-t border-border pt-4">
                            <div className="flex justify-between font-display text-xl font-bold">
                                <span>Total</span>
                                <span className="text-primary">${order.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    {!order.isPaid && clientSecret && (
                        <section className="rounded-lg border border-border bg-card p-6">
                            <h2 className="font-display text-xl font-bold mb-4">Complete Payment</h2>
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                                <CheckoutForm orderId={order._id} clientSecret={clientSecret} />
                            </Elements>
                        </section>
                    )}

                    {!order.isPaid && !clientSecret && (
                        <div className="rounded-lg border border-warning bg-warning/10 p-4 text-warning-foreground">
                            Payment was not initialized. Please try recreating the order from your cart.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
