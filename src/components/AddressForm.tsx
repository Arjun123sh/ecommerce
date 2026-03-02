import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Address } from "@/lib/auth";
import { MapPin, Trash2, Edit2, Check } from "lucide-react";

interface AddressFormProps {
  addresses?: Address[];
  onAddAddress: (address: Omit<Address, "_id">) => Promise<void>;
  onUpdateAddress?: (id: string, address: Omit<Address, "_id">) => Promise<void>;
  onDeleteAddress: (id: string) => Promise<void>;
  onSelectAddress?: (address: Address) => void;
  selectedAddressId?: string;
  showSelectOption?: boolean;
}

export function AddressForm({
  addresses = [],
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSelectAddress,
  selectedAddressId,
  showSelectOption = false,
}: AddressFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "US",
    isDefault: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ address: "", city: "", postalCode: "", country: "US", isDefault: false });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddAddress(formData);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (addr: Address) => {
    setFormData({
      address: addr.address,
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingId(addr._id);
    setIsAdding(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !onUpdateAddress) return;
    setIsSubmitting(true);
    try {
      await onUpdateAddress(editingId, formData);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {addresses.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Saved Addresses</h3>
          {addresses.map((addr) => (
            <Card key={addr._id} className={`cursor-pointer transition-all ${selectedAddressId === addr._id ? "border-primary ring-1 ring-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3" onClick={() => showSelectOption && onSelectAddress?.(addr)}>
                    {showSelectOption && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr._id ? "border-primary" : "border-muted-foreground"}`}>
                        {selectedAddressId === addr._id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{addr.address}</p>
                        {addr.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.postalCode}</p>
                      <p className="text-sm text-muted-foreground">{addr.country}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(addr)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteAddress(addr._id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isAdding ? (
        <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full gap-2">
          <MapPin className="h-4 w-4" />
          Add New Address
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Address" : "Shipping Address"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={editingId ? undefined : handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="10001"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="US"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">Set as default address</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                {editingId ? (
                  <Button type="button" onClick={handleUpdate} disabled={isSubmitting}>
                    <Check className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Updating..." : "Update Address"}
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Address"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
