import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/api/axios";
import { cartApi } from "@/api/cart";
import { useCart } from "@/lib/cart";
import { useNavigate, useParams } from "react-router-dom";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const { clearCart, removeItem } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        toast({
          title: "Payment failed",
          description: result.error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log("Payment result:", result);

      if (result.paymentIntent?.status === "succeeded") {
        // 🔥 Update order as paid in backend
        await api.post(`/orders/${orderId}/pay`, {
          paymentIntentId: result.paymentIntent.id,
        });

        // ✅ Clear only the purchased items from cart
        const savedRaw = localStorage.getItem("selectedItems");
        if (savedRaw) {
          try {
            const purchasedItemIds: string[] = JSON.parse(savedRaw);
            purchasedItemIds.forEach(id => removeItem(id));
            await Promise.all(purchasedItemIds.map(id => cartApi.removeFromCart(id)));
            localStorage.removeItem("selectedItems");
          } catch (err) {
            console.error("Failed to clear purchased items from cart:", err);
          }
        } else {
          clearCart();
          localStorage.removeItem("selectedItems");
          try {
            await cartApi.clearCart();
          } catch (err) {
            console.error("Failed to clear cart on backend:", err);
          }
        }

        toast({
          title: "Payment successful",
          description: "Your order has been placed successfully!",
        });

        navigate("/order-success");
      }
    } catch (error: any) {
      toast({
        title: "Payment error",
        description:
          error.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto p-6 bg-card rounded-lg shadow-md space-y-6"
    >
      <h2 className="text-2xl font-bold font-display">
        Complete Your Payment
      </h2>

      <PaymentElement />

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full font-semibold text-lg"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
}