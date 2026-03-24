import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package } from 'lucide-react';
import API, { getImageUrl } from '../lib/api';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';
import '../styles/pages.css';

const STATUS_BADGE_MAP = {
    processing: 'badge-warning',
    confirmed: 'badge-moss',
    shipped: 'badge-clay',
    delivered: 'badge-success',
    cancelled: 'badge-error',
};

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const { isLoggedIn } = useAuthStore();

    const fetchOrder = () => {
        API.get(`/orders/${id}`)
            .then(({ data }) => {
                setOrder(data.order);
                document.title = `Order #${String(data.order.id).padStart(6, '0')} — Velvet Moss`;
            })
            .catch(() => navigate('/orders'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!isLoggedIn()) { navigate('/login'); return; }
        fetchOrder();
    }, [id]);

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
        setCancelling(true);
        try {
            await API.put(`/orders/${id}/cancel`);
            toast.success('Order cancelled successfully');
            fetchOrder();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;
    if (!order) return null;

    const PLACEHOLDER = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=100&q=80';

    return (
        <div style={{ padding: '3rem 0 5rem' }}>
            <div className="container">
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/orders" className="btn btn-ghost btn-sm">
                        <ChevronLeft size={14} /> Back to Orders
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
                    {/* Order Details */}
                    <div>
                        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                                        Order #{String(order.id).padStart(6, '0')}
                                    </h1>
                                    <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span className={`badge ${STATUS_BADGE_MAP[order.orderStatus] || 'badge-gray'}`} style={{ textTransform: 'uppercase' }}>
                                        {order.orderStatus}
                                    </span>
                                </div>
                            </div>

                            {/* Items */}
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Order Items</h3>
                            {order.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--clr-border-light)', alignItems: 'center' }}>
                                    <div style={{ width: 70, height: 70, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--clr-warm-white)', flexShrink: 0 }}>
                                        <img
                                            src={item.image ? getImageUrl(item.image) : PLACEHOLDER}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: item?.imagePosition || 'center' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{item.name}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Qty: {item.quantity}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 700, color: 'var(--clr-moss-dark)', marginBottom: order.orderStatus === 'delivered' ? '0.5rem' : '0' }}>
                                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                        </p>
                                        {order.orderStatus === 'delivered' && (
                                            <Link
                                                to={`/products/${item.productId}#reviews`}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                            >
                                                Leave Review
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Shipping Address</h3>
                                <p style={{ lineHeight: 1.7, color: 'var(--clr-text)' }}>
                                    <strong>{order.shippingAddress.fullName}</strong><br />
                                    {order.shippingAddress.street}<br />
                                    {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}<br />
                                    {order.shippingAddress.country}<br />
                                    📞 {order.shippingAddress.phone}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: '90px' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--clr-border-light)' }}>
                            Order Summary
                        </h3>
                        <div className="summary-row"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
                        <div className="summary-row"><span>Shipping</span><span>{order.shippingCost === 0 ? <span style={{ color: 'var(--clr-success)', fontWeight: 600 }}>FREE</span> : `₹${order.shippingCost}`}</span></div>
                        <div className="summary-row"><span>GST{order.subtotal > 0 && ` (${Math.round((order.tax / order.subtotal) * 100)}%)`}</span><span>₹{order.tax?.toLocaleString('en-IN')}</span></div>
                        <div className="summary-row total"><span>Total</span><span>₹{order.totalAmount?.toLocaleString('en-IN')}</span></div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--clr-border-light)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>Payment Method</p>
                            <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{order.paymentMethod}</p>
                        </div>

                        {order.orderStatus === 'delivered' && order.deliveredAt && (
                            <div style={{ marginTop: '1rem', background: 'rgba(39,174,96,0.08)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--clr-success)' }}>
                                ✅ Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN')}
                            </div>
                        )}

                        {(order.orderStatus === 'processing' || order.orderStatus === 'confirmed') && (
                            <button
                                className="btn btn-danger btn-block"
                                style={{ marginTop: '1rem' }}
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                            >
                                {cancelling ? <span className="spinner spinner-sm" /> : 'Cancel Order'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
