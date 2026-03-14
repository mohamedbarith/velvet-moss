import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import { getImageUrl } from '../lib/api';
import '../styles/pages.css';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=180&q=80';

export default function CartPage() {
    const {
        items, removeItem, updateQuantity, clearCart,
        subtotal, shippingCost, tax, total, gstRate, fetchSettings
    } = useCartStore();

    useEffect(() => {
        fetchSettings();
    }, []);

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="cart-empty">
                        <div className="cart-empty-icon"><ShoppingBag /></div>
                        <h2>Your cart is empty</h2>
                        <p>Add some beautiful handmade items to your cart and they'll appear here.</p>
                        <Link to="/products" className="btn btn-primary btn-lg">
                            <ShoppingBag size={18} /> Start Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <h1>Shopping Cart</h1>
                <p className="cart-subtitle">{items.length} item{items.length > 1 ? 's' : ''} in your cart</p>

                <div className="cart-layout">
                    {/* Items */}
                    <div className="cart-items">
                        {items.map((item) => {
                            const imageUrl = item.images?.[0]
                                ? getImageUrl(item.images[0])
                                : PLACEHOLDER;
                            return (
                                <div key={item.id} className="cart-item animate-fade-in">
                                    <div className="cart-item-image">
                                        <img src={imageUrl} alt={item.name} style={{ objectPosition: item?.imagePosition || 'center' }} />
                                    </div>
                                    <div className="cart-item-info">
                                        <p className="cart-item-category">{item.category}</p>
                                        <h3 className="cart-item-name">{item.name}</h3>
                                        <p className="cart-item-price">₹{item.price.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="cart-item-actions">
                                        <div className="qty-selector" style={{ transform: 'scale(0.9)' }}>
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                <Minus size={12} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}>
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <p style={{ fontWeight: 700, color: 'var(--clr-moss-dark)', minWidth: 80, textAlign: 'right' }}>
                                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                        </p>
                                        <button className="cart-item-remove" onClick={() => removeItem(item.id)} title="Remove">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={clearCart}>
                                <X size={14} /> Clear Cart
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <div className="cart-summary">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal().toLocaleString('en-IN')}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                {shippingCost() === 0
                                    ? <span className="free">FREE</span>
                                    : <span>₹{shippingCost()}</span>}
                            </div>
                            <div className="summary-row">
                                <span>GST ({gstRate}%)</span>
                                <span>₹{tax().toLocaleString('en-IN')}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>₹{total().toLocaleString('en-IN')}</span>
                            </div>

                            <Link to="/checkout" className="btn btn-primary w-full" style={{ marginTop: '1.25rem' }} id="proceed-checkout-btn">
                                Proceed to Checkout <ArrowRight size={14} />
                            </Link>

                            <Link to="/products" className="btn btn-ghost w-full" style={{ marginTop: '0.75rem' }}>
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
