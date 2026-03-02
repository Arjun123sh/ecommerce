import { useEffect, useState } from "react";
import { useAuth, Address } from "@/lib/auth";
import { addressApi } from "@/api/address";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressForm } from "@/components/AddressForm";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const addrList = await addressApi.getAddresses();
      setAddresses(addrList || []);
    } catch (error) {
      console.error("Failed to load addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (address: Omit<Address, "_id">) => {
    try {
      const updated = await addressApi.addAddress(address);
      setAddresses(updated);
    } catch (error) {
      console.error("Failed to add address:", error);
    }
  };

  const handleUpdateAddress = async (id: string, address: Omit<Address, "_id">) => {
    try {
      const updated = await addressApi.updateAddress(id, address);
      setAddresses(updated);
    } catch (error) {
      console.error("Failed to update address:", error);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const updated = await addressApi.deleteAddress(id);
      setAddresses(updated);
    } catch (error) {
      console.error("Failed to delete address:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{user?.name}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{user?.email}</p>
              </div>
              {user?.role && user.role !== 'user' && (
                <div>
                  <label className="text-sm text-muted-foreground">Role</label>
                  <p className="font-medium capitalize">{user?.role}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressForm
              addresses={addresses}
              onAddAddress={handleAddAddress}
              onUpdateAddress={handleUpdateAddress}
              onDeleteAddress={handleDeleteAddress}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
