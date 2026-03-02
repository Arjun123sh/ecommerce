import api from "./axios";
import { Address } from "@/lib/auth";

export const addressApi = {
  getAddresses: async () => {
    const { data } = await api.get("/auth/profile");
    return data.addresses as Address[];
  },

  addAddress: async (address: Omit<Address, "_id">) => {
    const { data } = await api.post("/auth/addresses", address);
    return data.addresses as Address[];
  },

  updateAddress: async (id: string, address: Omit<Address, "_id">) => {
    const { data } = await api.put(`/auth/addresses/${id}`, address);
    return data.addresses as Address[];
  },

  deleteAddress: async (id: string) => {
    const { data } = await api.delete(`/auth/addresses/${id}`);
    return data.addresses as Address[];
  },
};
