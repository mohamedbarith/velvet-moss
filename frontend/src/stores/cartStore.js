import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../lib/api';

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            gstRate: 18,
            shippingRate: 99,

            fetchSettings: async () => {
                try {
                    const { data } = await API.get('/settings');
                    if (data?.settings?.shipping !== undefined) {
                        set({ shippingRate: parseFloat(data.settings.shipping) });
                    }
                    if (data?.settings?.gst !== undefined) {
                        set({ gstRate: parseFloat(data.settings.gst) });
                    }
                } catch (err) {
                    console.error('Failed to fetch store settings', err);
                }
            },

            addItem: (product, quantity = 1) => {
                const items = get().items;
                const existing = items.find((i) => i.id === product.id);
                if (existing) {
                    set({
                        items: items.map((i) =>
                            i.id === product.id
                                ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...items, { ...product, quantity }] });
                }
            },

            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) });
            },

            updateQuantity: (id, quantity) => {
                if (quantity < 1) {
                    set({ items: get().items.filter((i) => i.id !== id) });
                    return;
                }
                set({
                    items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
                });
            },

            clearCart: () => set({ items: [] }),

            subtotal: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
            totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
            shippingCost: () => get().shippingRate,
            tax: () => parseFloat((get().subtotal() * (get().gstRate / 100)).toFixed(2)),
            total: () => get().subtotal() + get().shippingCost() + get().tax(),
        }),
        { name: 'vm_cart' }
    )
);

export default useCartStore;
