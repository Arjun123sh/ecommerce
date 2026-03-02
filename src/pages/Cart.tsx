import { useCart } from "@/lib/cart";
import { useAuth, Address } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ShoppingBag, Save, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cartApi } from "@/api/cart";
import { addressApi } from "@/api/address";
import { useEffect, useState } from "react";
import { Product } from "@/lib/cart";
import api from "@/api/axios";
import { AddressForm } from "@/components/AddressForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Cart() {
  const { items, addItem, removeItem, updateQuantity, total, clearCart } = useCart();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSavingCart, setIsSavingCart] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ id: string; title: string } | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedItems');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [selectAll, setSelectAll] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedItems');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.length === 0 ? false : true;
      }
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('selectedItems', JSON.stringify([...selectedItems]));
  }, [selectedItems]);

  const selectedItemsList = items.filter(item => selectedItems.has(item.product.id));
  const selectedTotal = selectedItemsList.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const loadCartFromBackend = async () => {
    if (!user) return;
    if (items.length > 0) return;

    setIsLoadingCart(true);
    try {
      const { data } = await cartApi.getCart();
      if (data.cartItems && data.cartItems.length > 0) {
        data.cartItems.forEach((cartItem: any) => {
          const product: Product = {
            id: cartItem.product,
            title: cartItem.name,
            description: "",
            price: cartItem.price,
            category: "",
            stockQuantity: cartItem.qty,
            productImage: cartItem.image || ""
          };
          addItem(product, cartItem.qty);
        });
      }
      if (data.selectedItems && data.selectedItems.length > 0) {
        setSelectedItems(new Set(data.selectedItems));
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoadingCart(false);
    }
  };

  useEffect(() => {
    if (items.length > 0) {
      const currentIds = new Set(items.map(item => item.product.id));
      const savedRaw = localStorage.getItem('selectedItems');
      const hasSavedSelections = savedRaw !== null && savedRaw !== '[]';

      if (hasSavedSelections) {
        // Restore saved selections, filtered to only valid current items
        const savedIds: string[] = JSON.parse(savedRaw);
        const validSelected = savedIds.filter(id => currentIds.has(id));
        setSelectedItems(new Set(validSelected));
        setSelectAll(validSelected.length === items.length);
      } else {
        // No saved selections — default to selecting all
        setSelectedItems(new Set(items.map(item => item.product.id)));
        setSelectAll(true);
      }
    } else {
      setSelectedItems(new Set());
      setSelectAll(true);
      localStorage.setItem('selectedItems', JSON.stringify([]));
    }
  }, [items]);


  const toggleItemSelection = async (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === items.length);
    if (user) {
      try {
        await cartApi.updateSelectedItems([...newSelected]);
      } catch (error) {
        console.error("Failed to sync selectedItems:", error);
      }
    }
  };

  const toggleSelectAll = async () => {
    let newSelected: Set<string>;
    if (selectAll) {
      newSelected = new Set();
    } else {
      newSelected = new Set(items.map(item => item.product.id));
    }
    setSelectedItems(newSelected);
    setSelectAll(!selectAll);
    if (user) {
      try {
        await cartApi.updateSelectedItems([...newSelected]);
      } catch (error) {
        console.error("Failed to sync selectedItems:", error);
      }
    }
  };

  const syncCartToBackend = async () => {
    if (!user) return;
    console.log("Syncing cart to backend with items:", items);
    const cartItems = items.map(item => ({
      product: item.product.id,
      name: item.product.title,
      qty: item.quantity,
      image: item.product.productImage,
      price: item.product.price
    }));
    try {
      console.log("Sending cart items to backend:", cartItems);
      await cartApi.addToCart(cartItems, [...selectedItems]);
    } catch (error) {
      console.error("Failed to sync cart:", error);
    }
  };

  const handleAddItem = async (product: Product, quantity?: number) => {
    addItem(product, quantity);
    if (user) {
      await syncCartToBackend();
    }
  };

  const handleRemoveItem = async (productId: string) => {
    removeItem(productId);
    const newSelected = new Set(selectedItems);
    newSelected.delete(productId);
    setSelectedItems(newSelected);
    if (user) {
      try {
        await cartApi.removeFromCart(productId);
        await cartApi.updateSelectedItems([...newSelected]);
        toast({
          title: "Item removed",
          description: "The item has been removed from your cart.",
        });
      } catch (error) {
        console.error("Failed to remove from backend:", error);
      }
    }
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      handleRemoveItem(itemToRemove.id);
      setRemoveDialogOpen(false);
      setItemToRemove(null);
    }
  };

  const promptRemove = (productId: string, productTitle: string) => {
    setItemToRemove({ id: productId, title: productTitle });
    setRemoveDialogOpen(true);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
    if (user) {
      await syncCartToBackend();
    }
  };

  const handleSaveCart = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save your cart.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (isLoadingCart) {
      return (
        <div className="container flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your cart...</p>
        </div>
      );
    }

    if (items.length === 0) {
      toast({ title: "Cart is empty", description: "Add items to your cart first.", variant: "destructive" });
      return;
    }

    setIsSavingCart(true);
    try {
      const cartItems = items.map(item => ({
        product: item.product.id,
        name: item.product.title,
        qty: item.quantity,
        image: item.product.productImage,
        price: item.product.price
      }));

      await cartApi.addToCart(cartItems);
      toast({ title: "Cart saved", description: "Your cart has been saved successfully." });
    } catch (error: any) {
      toast({
        title: "Failed to save cart",
        description: error.response?.data?.message || "An error occurred while saving your cart.",
        variant: "destructive"
      });
    } finally {
      setIsSavingCart(false);
    }
  };

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const addrList = await addressApi.getAddresses();
      setAddresses(addrList || []);
      const defaultAddr = addrList?.find((a: Address) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr._id);
    } catch (error) {
      console.error("Failed to load addresses:", error);
    }
  };

  const handleProceedToCheckout = () => {
    if (isAdmin) {
      toast({ title: "Admins cannot purchase", description: "Admin accounts are not allowed to place orders.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to checkout.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    loadAddresses();
    setShowAddressDialog(true);
  };

  const handleAddAddress = async (address: Omit<Address, "_id">) => {
    try {
      const updated = await addressApi.addAddress(address);
      setAddresses(updated);
      const newAddr = updated.find((a: Address) => a.address === address.address);
      if (newAddr) setSelectedAddressId(newAddr._id);
    } catch (error: any) {
      toast({
        title: "Failed to add address",
        description: error.response?.data?.message || "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const updated = await addressApi.deleteAddress(id);
      setAddresses(updated);
      if (selectedAddressId === id) {
        const defaultAddr = updated?.find((a: Address) => a.isDefault);
        setSelectedAddressId(defaultAddr?._id || "");
      }
    } catch (error: any) {
      toast({
        title: "Failed to delete address",
        description: error.response?.data?.message || "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAddress = async (id: string, address: Omit<Address, "_id">) => {
    try {
      const updated = await addressApi.updateAddress(id, address);
      setAddresses(updated);
    } catch (error: any) {
      toast({
        title: "Failed to update address",
        description: error.response?.data?.message || "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    const selectedAddress = addresses.find(a => a._id === selectedAddressId);
    if (!selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a shipping address.",
        variant: "destructive",
      });
      return;
    }

    setShowAddressDialog(false);
    setIsCheckingOut(true);

    try {
      const orderItems = selectedItemsList.map((item) => ({
        product: item.product.id,
        name: item.product.title,
        qty: item.quantity,
        image: item.product.productImage,
        price: item.product.price,
      }));

      const { data } = await api.post("/orders", {
        orderItems,
        shippingAddress: {
          address: selectedAddress.address,
          city: selectedAddress.city,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
        },
        paymentMethod: "Stripe",
      });

      console.log("Order created:", data);

      if (data && data.clientSecret) {
        // 👉 Navigate to a Stripe Payment Page
        navigate(`/payment/${data.order._id}`, {
          state: { clientSecret: data.clientSecret },
        });
      }

    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description:
          error.response?.data?.message ||
          "An error occurred during checkout.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    if (user) {
      syncCartToBackend();
    }
  }, [items, user]); // Sync cart whenever items or user changes

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-20 animate-fade-in">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 font-display text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Discover something you'll love.</p>
        <Link to="/products" className="mt-6">
          <Button className="font-display font-semibold">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold">Your Cart</h1>
        {user && items.length > 0 && (
          <Button
            variant="outline"
            onClick={handleSaveCart}
            disabled={isSavingCart}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSavingCart ? "Saving..." : "Save Cart"}
          </Button>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {items.length > 1 && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
              <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                {selectAll ? "Deselect All" : "Select All"}
              </label>
              <span className="text-sm text-muted-foreground">
                ({selectedItems.size} of {items.length} items selected)
              </span>
            </div>
          )}
          {items.map(({ product, quantity }) => (
            <div key={product.id} className={`flex gap-6 rounded-lg border bg-card p-4 transition-all ${selectedItems.has(product.id) ? 'border-primary/50 hover:border-primary' : 'border-border opacity-60'}`}>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`item-${product.id}`}
                  checked={selectedItems.has(product.id)}
                  onChange={() => toggleItemSelection(product.id)}
                  className="w-4 h-4"
                />
              </div>
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                {product.productImage ? (
                  <img src={product.productImage} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-xl font-bold text-muted-foreground/30">Lumina</div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/products/${product.id}`} className="font-display text-lg font-semibold hover:text-primary transition-colors">
                      {product.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">${product.price.toFixed(2)} each</p>
                  </div>
                  <span className="font-display font-bold text-lg text-primary">${(product.price * quantity).toFixed(2)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 rounded-md border border-border p-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => handleUpdateQuantity(product.id, quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => handleUpdateQuantity(product.id, Math.min(product.stockQuantity, quantity + 1))}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => promptRemove(product.id, product.title)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky top-24 h-fit rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl font-bold">Order Summary</h2>
          {selectedItems.size !== items.length && selectedItems.size > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing total for {selectedItems.size} selected item{selectedItems.size !== 1 ? 's' : ''}
            </div>
          )}
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${selectedItems.size === items.length ? total.toFixed(2) : selectedTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">{selectedTotal >= 100 ? "Free" : "$9.99"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">${(selectedTotal * 0.15).toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex justify-between font-display text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">${(selectedTotal >= 100 ? selectedTotal + (selectedTotal * 0.15) : selectedTotal + 9.99 + (selectedTotal * 0.15)).toFixed(2)}</span>
            </div>
          </div>
          <Button
            className="mt-8 w-full font-display text-lg font-semibold"
            size="lg"
            onClick={handleProceedToCheckout}
            disabled={isCheckingOut || selectedItems.size === 0 || isAdmin}
          >
            {isAdmin
              ? <><ShieldAlert className="inline h-5 w-5 mr-2" />Admin Cannot Checkout</>
              : isCheckingOut ? "Processing..."
                : selectedItems.size === items.length ? "Proceed to Checkout"
                  : `Checkout (${selectedItems.size}) Items`}
          </Button>
          {isAdmin && (
            <p className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Admin accounts cannot place orders.
            </p>
          )}
          {selectedTotal < 100 && selectedTotal > 0 && (
            <div className="mt-4 rounded-md bg-secondary/50 p-3 text-center">
              <p className="text-sm font-medium text-foreground">
                Add ${(100 - selectedTotal).toFixed(2)} more for <span className="font-bold text-primary">Free Shipping</span>!
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{itemToRemove?.title}" from your cart?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemove}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shipping Address</DialogTitle>
            <DialogDescription>
              Select or add a shipping address for your order.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AddressForm
              addresses={addresses}
              onAddAddress={handleAddAddress}
              onUpdateAddress={handleUpdateAddress}
              onDeleteAddress={handleDeleteAddress}
              selectedAddressId={selectedAddressId}
              onSelectAddress={(addr) => setSelectedAddressId(addr._id)}
              showSelectOption={addresses.length > 0}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>Cancel</Button>
            <Button onClick={handleCheckout} disabled={isCheckingOut || !selectedAddressId}>
              {isCheckingOut ? "Processing..." : "Continue to Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
