import api from './axios';

export interface CartItem {
    product: string;
    name: string;
    qty: number;
    image?: string;
    price: number;
}

export const cartApi = {
    getCart: () => api.get('/cart'),
    
    addToCart: (cartItems: CartItem[], selectedItems?: string[]) => api.post('/cart', { cartItems, selectedItems }),
    
    updateSelectedItems: (selectedItems: string[]) => api.put('/cart/selected-items', { selectedItems }),
    
    removeFromCart: (productId: string) => api.delete(`/cart/${productId}`),
    
    clearCart: () => api.delete('/cart/clear'),
};
