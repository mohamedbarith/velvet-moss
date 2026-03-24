import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import API, { getImageUrl } from '../lib/api';
import useAuthStore from '../stores/authStore';
import '../styles/pages.css';

const STATUS_BADGE_MAP = {
    processing: 'badge-warning',
    confirmed: 'badge-moss',
    shipped: 'badge-blue',
    delivered: 'badge-success',
    cancelled: 'badge-error',
};
const PAYMENT_BADGE_MAP = {
    pending: 'badge-warning',
    paid: 'badge-success',
    failed: 'badge-error',
    refunded: 'badge-gray',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isLoggedIn } = useAuthStore();

    useEffect(() => {
        document.title = 'My Orders — Velvet Moss';
        if (!isLoggedIn()) return;
        API.get('/orders/my')
            .then(({ data }) => setOrders(data.orders || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    return (
        <div className="orders-page">
            <div className="container">
                <h1>My Orders</h1>

                {orders.length === 0 ? (
                    <div className="text-center" style={{ padding: '5rem 2rem' }}>
                        <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</p>
                        <h3>No orders yet</h3>
                        <p style={{ color: 'var(--clr-text-muted)', margin: '0.75rem 0 2rem' }}>
                            You haven't placed any orders yet. Start shopping!
                        </p>
                        <Link to="/products" className="btn btn-primary">Browse Products</Link>
                    </div>
                ) : (
                    <div>
                        {orders.map((order) => (
                            <div key={order.id} className="order-card animate-fade-in">
                                <div className="order-card-header">
                                    <div className="order-id">
                                        Order <strong>#{String(order.id).padStart(6, '0')}</strong>
                                        <span style={{ marginLeft: '0.5rem', color: 'var(--clr-text-muted)' }}>
                                            · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span className={`badge ${STATUS_BADGE_MAP[order.orderStatus] || 'badge-gray'}`} style={{ textTransform: 'uppercase' }}>
                                            {order.orderStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="order-items-preview">
                                    {order.items.slice(0, 4).map((item, i) => (
                                        <div key={i} className="order-item-thumb">
                                            <img
                                                src={item.image ? getImageUrl(item.image) : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=100&q=80'}
                                                alt={item.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: item?.imagePosition || 'center' }}
                                            />
                                        </div>
                                    ))}
                                    {order.items.length > 4 && (
                                        <div className="order-more-count">+{order.items.length - 4}</div>
                                    )}
                                </div>

                                <div className="order-card-footer">
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: '0.25rem' }}>
                                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                        </p>
                                        <p className="order-total">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                                    </div>
                                    <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm">
                                        View Details <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
