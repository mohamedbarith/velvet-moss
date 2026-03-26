import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingBag, Users, MessageSquare,
    LogOut, Leaf, TrendingUp, AlertTriangle, Edit2, Trash2, Plus, X, Check,
    Settings as SettingsIcon, Save, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import API, { getImageUrl } from '../lib/api';
import useAuthStore from '../stores/authStore';
import '../styles/admin.css';

const STATUS_OPTIONS = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-info">
                <p>{label}</p>
                <div className="stat-value">{value}</div>
            </div>
        </div>
    );
}

// ─── Product Modal ─────────────────────────────────────────
function ProductModal({ product, onClose, onSave, categories }) {
    const [form, setForm] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
        originalPrice: product?.originalPrice || '',
        category: product?.category || categories[0] || 'Crafts',
        stock: product?.stock || '',
        tags: product?.tags?.join(', ') || '',
        isFeatured: product?.isFeatured || false,
        imagePosition: product?.imagePosition || 'center',
    });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const parsePos = (pos) => {
        if (!pos) return { x: 50, y: 50 };
        if (pos === 'center') return { x: 50, y: 50 };
        if (pos === 'top') return { x: 50, y: 0 };
        if (pos === 'bottom') return { x: 50, y: 100 };
        if (pos === 'left') return { x: 0, y: 50 };
        if (pos === 'right') return { x: 100, y: 50 };
        const parts = pos.split(' ');
        if (parts.length === 2 && !isNaN(parseInt(parts[0]))) {
            return { x: parseInt(parts[0]), y: parseInt(parts[1]) };
        }
        return { x: 50, y: 50 };
    };
    const [imgPos, setImgPos] = useState(parsePos(product?.imagePosition));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalImages = [];

            if (images.length > 0) {
                for (const img of images) {
                    const uploadFd = new FormData();
                    uploadFd.append('image', img);
                    const uploadRes = await API.post('/upload', uploadFd);
                    finalImages.push(uploadRes.data.imageUrl);
                }
            } else if (product?.images) {
                finalImages = product.images;
            }

            const payload = {
                ...form,
                images: finalImages
            };

            let data;
            if (product) {
                const res = await API.put(`/products/${product.id}`, payload);
                data = res.data;
            } else {
                const res = await API.post('/products', payload);
                data = res.data;
            }
            toast.success(data.message);
            onSave();
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            toast.error(err.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-modal-overlay">
            <div className="admin-modal">
                <div className="admin-modal-header">
                    <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="admin-modal-body">
                    <form onSubmit={handleSubmit} id="product-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label>Product Name *</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label>Category *</label>
                                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {categories.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Description *</label>
                            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label>Price (₹) *</label>
                                <input className="input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label>Original Price (₹)</label>
                                <input className="input" type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Stock *</label>
                                <input className="input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Tags (comma-separated)</label>
                                <input className="input" placeholder="handmade, pottery, ceramic" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                            </div>
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Manual Image Focal Point</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--clr-cream)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 600 }}>Horizontal (X-Axis)</label>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-moss)' }}>{imgPos.x}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={imgPos.x}
                                            onChange={e => {
                                                const obj = { ...imgPos, x: e.target.value };
                                                setImgPos(obj);
                                                setForm({ ...form, imagePosition: `${obj.x}% ${obj.y}%` });
                                            }}
                                            style={{ width: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 600 }}>Vertical (Y-Axis)</label>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-moss)' }}>{imgPos.y}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={imgPos.y}
                                            onChange={e => {
                                                const obj = { ...imgPos, y: e.target.value };
                                                setImgPos(obj);
                                                setForm({ ...form, imagePosition: `${obj.x}% ${obj.y}%` });
                                            }}
                                            style={{ width: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <div className="image-upload-area" onClick={() => document.getElementById('product-images').click()}>
                                    <Plus size={24} color="var(--clr-text-muted)" style={{ margin: '0 auto' }} />
                                    <p>Click to upload images</p>
                                </div>
                                <input id="product-images" type="file" multiple accept="image/*" style={{ display: 'none' }}
                                    onChange={e => setImages(Array.from(e.target.files))} />
                                {product?.images && product.images.length > 0 && images.length === 0 && (
                                    <div className="uploaded-images">
                                        {product.images.map((img, i) => (
                                            <div key={i} className="uploaded-img-thumb">
                                                <img src={getImageUrl(img)} alt="" style={{ objectPosition: form.imagePosition }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {images.length > 0 && (
                                    <div className="uploaded-images">
                                        {images.map((f, i) => (
                                            <div key={i} className="uploaded-img-thumb">
                                                <img src={URL.createObjectURL(f)} alt="" style={{ objectPosition: form.imagePosition }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.75rem' }}>
                                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                                    Mark as Featured
                                </label>
                            </div>
                        </div>
                        <div className="admin-modal-footer" style={{ padding: '0', paddingTop: '1rem' }}>
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading} id="save-product-btn">
                                {loading ? <span className="spinner spinner-sm" /> : <><Check size={14} /> {product ? 'Update' : 'Create'} Product</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Admin Modal ───────────────────────────────────────────
function AdminModal({ onClose, onSave }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await API.post('/admin/users/admin', form);
            toast.success(data.message || 'Admin added successfully');
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add admin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-modal-overlay">
            <div className="admin-modal" style={{ maxWidth: '400px' }}>
                <div className="admin-modal-header">
                    <h2>Add New Admin</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="admin-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Name *</label>
                            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Email *</label>
                            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Password *</label>
                            <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>
                        <div className="admin-modal-footer" style={{ padding: '0', paddingTop: '1rem' }}>
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner spinner-sm" /> : <><Plus size={14} /> Add Admin</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Admin Dashboard ──────────────────────────────────────
export default function AdminPage() {
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuthStore();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [settings, setSettings] = useState({ shipping: '99', gst: '18', categories: 'Crafts, Gifts' });
    const [loading, setLoading] = useState(true);
    const [productModal, setProductModal] = useState(null); // null | 'new' | product
    const [deleteConfirm, setDeleteConfirm] = useState(null); // null | product id
    const [deleteOrderConfirm, setDeleteOrderConfirm] = useState(null); // null | order id
    const [deleteReviewConfirm, setDeleteReviewConfirm] = useState(null); // null | review id
    const [adminModal, setAdminModal] = useState(false);

    useEffect(() => {
        if (!isAdmin()) {
            toast.error('Access denied. Admins only.');
            navigate('/');
        }
        document.title = 'Admin — Velvet Moss';
    }, []);

    useEffect(() => {
        fetchSection();
    }, [activeSection]);

    const fetchSection = async () => {
        setLoading(true);
        try {
            if (activeSection === 'dashboard') {
                const { data } = await API.get('/admin/dashboard');
                setStats(data.stats);
                setRecentOrders(data.recentOrders || []);
                setLowStock(data.lowStockProducts || []);
            } else if (activeSection === 'products') {
                const { data } = await API.get('/products?limit=50');
                setProducts(data.products || []);
            } else if (activeSection === 'orders') {
                const { data } = await API.get('/admin/orders?limit=50');
                setOrders(data.orders || []);
            } else if (activeSection === 'users') {
                const { data } = await API.get('/admin/users');
                setUsers(data.users || []);
            } else if (activeSection === 'contacts') {
                const { data } = await API.get('/admin/contacts');
                setContacts(data.contacts || []);
            } else if (activeSection === 'reviews') {
                const { data } = await API.get('/admin/reviews');
                setReviews(data.reviews || []);
            } else if (activeSection === 'settings') {
                const { data } = await API.get('/settings');
                if (data.settings) {
                    setSettings({
                        shipping: data.settings.shipping || '99',
                        gst: data.settings.gst || '18',
                        categories: data.settings.categories || 'Crafts, Gifts'
                    });
                }
            }
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            await API.delete(`/products/${id}`);
            toast.success('Product deleted');
            setDeleteConfirm(null);
            fetchSection();
        } catch (err) {
            console.error('DELETE ERROR:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to delete');
        }
    };

    const handleDeleteOrder = async (id) => {
        try {
            await API.delete(`/admin/orders/${id}`);
            toast.success('Order deleted');
            setDeleteOrderConfirm(null);
            fetchSection();
        } catch (err) {
            console.error('DELETE ORDER ERROR:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to delete order');
        }
    };

    const handleOrderStatus = async (orderId, orderStatus) => {
        try {
            await API.put(`/admin/orders/${orderId}`, { orderStatus });
            toast.success('Order status updated');
            fetchSection();
        } catch {
            toast.error('Update failed');
        }
    };

    const handleToggleUser = async (userId) => {
        try {
            const { data } = await API.put(`/admin/users/${userId}/toggle`);
            toast.success(data.message);
            fetchSection();
        } catch {
            toast.error('Failed');
        }
    };

    const handleMarkRead = async (contactId) => {
        await API.put(`/admin/contacts/${contactId}/read`);
        fetchSection();
    };

    const handleToggleReviewHomepage = async (id) => {
        try {
            const { data } = await API.put(`/admin/reviews/${id}/homepage`);
            toast.success(data.message);
            fetchSection();
        } catch {
            toast.error('Failed to update review status');
        }
    };

    const handleDeleteReview = async (id) => {
        try {
            await API.delete(`/admin/reviews/${id}`);
            toast.success('Review deleted');
            setDeleteReviewConfirm(null);
            fetchSection();
        } catch {
            toast.error('Failed to delete review');
        }
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await API.put('/settings', { settings });
            toast.success('Settings updated');
            fetchSection();
        } catch (err) {
            toast.error('Failed to update settings');
            setLoading(false);
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'products', label: 'Products', icon: <Package size={16} /> },
        { id: 'orders', label: 'Orders', icon: <ShoppingBag size={16} /> },
        { id: 'users', label: 'Users', icon: <Users size={16} /> },
        { id: 'reviews', label: 'Reviews', icon: <Star size={16} /> },
        { id: 'contacts', label: 'Messages', icon: <MessageSquare size={16} /> },
        { id: 'settings', label: 'Settings', icon: <SettingsIcon size={16} /> },
    ];

    return (
        <div className="admin-page">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <Leaf size={18} color="var(--clr-moss-light)" />
                    <span className="logo">Velvet<span> Moss</span></span>
                    <span className="admin-badge">Admin</span>
                </div>
                <nav className="admin-nav">
                    <p className="admin-nav-section">Main Menu</p>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`admin-nav-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(item.id)}
                            id={`admin-nav-${item.id}`}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                    <p className="admin-nav-section">Account</p>
                    <Link to="/" className="admin-nav-item">
                        <Leaf size={16} /> View Store
                    </Link>
                    <button className="admin-nav-item" onClick={() => { logout(); navigate('/'); }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </nav>
                <div className="admin-sidebar-footer">
                    <p style={{ fontSize: '0.75rem', color: '#555' }}>Signed in as</p>
                    <p style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 600 }}>{user?.name}</p>
                </div>
            </aside>

            {/* Main */}
            <div className="admin-main">
                <div className="admin-topbar">
                    <h1 style={{ textTransform: 'capitalize' }}>{activeSection}</h1>
                    <div className="admin-topbar-actions">
                        {activeSection === 'products' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setProductModal('new')} id="add-product-btn">
                                <Plus size={14} /> Add Product
                            </button>
                        )}
                        {activeSection === 'users' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setAdminModal(true)} id="add-admin-btn">
                                <Plus size={14} /> Add Admin
                            </button>
                        )}
                    </div>
                </div>

                <div className="admin-content">
                    {loading && <div className="page-loading"><div className="spinner" /></div>}

                    {/* Dashboard */}
                    {!loading && activeSection === 'dashboard' && stats && (
                        <div className="animate-fade-up">
                            <div className="admin-stats-grid">
                                <StatCard icon={<Users size={22} />} label="Total Users" value={stats.totalUsers} color="blue" />
                                <StatCard icon={<Package size={22} />} label="Products" value={stats.totalProducts} color="green" />
                                <StatCard icon={<ShoppingBag size={22} />} label="Total Orders" value={stats.totalOrders} color="clay" />
                                <StatCard icon={<TrendingUp size={22} />} label="Revenue" value={`₹${stats.totalRevenue?.toLocaleString('en-IN')}`} color="violet" />
                            </div>

                            {/* Recent Orders */}
                            <div className="admin-table-container" style={{ marginBottom: '1.5rem' }}>
                                <div className="admin-table-header">
                                    <h3>Recent Orders</h3>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('orders')}>View All</button>
                                </div>
                                <table className="admin-table">
                                    <thead><tr>
                                        <th>Order ID</th><th>Customer</th><th>Amount</th>
                                        <th>Status</th><th>Payment</th><th>Date</th>
                                    </tr></thead>
                                    <tbody>
                                        {recentOrders.map((o) => (
                                            <tr key={o.id}>
                                                <td><code style={{ fontSize: '0.75rem' }}>#{String(o.id).padStart(6, '0')}</code></td>
                                                <td>{o.user?.name}</td>
                                                <td>₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                                                <td><span className="badge badge-moss">{o.orderStatus}</span></td>
                                                <td><span className={`badge ${o.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{o.paymentStatus}</span></td>
                                                <td style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
                                                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Low Stock */}
                            {lowStock.length > 0 && (
                                <div className="admin-table-container">
                                    <div className="admin-table-header">
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <AlertTriangle size={16} color="var(--clr-clay)" /> Low Stock Alert
                                        </h3>
                                    </div>
                                    <table className="admin-table low-stock-table">
                                        <thead><tr><th>Product</th><th>Stock Left</th></tr></thead>
                                        <tbody>
                                            {lowStock.map((p) => (
                                                <tr key={p.id}>
                                                    <td>{p.name}</td>
                                                    <td>{p.stock} units</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Products */}
                    {!loading && activeSection === 'products' && (
                        <div className="admin-table-container animate-fade-up">
                            <div className="admin-table-header">
                                <h3>All Products ({products.length})</h3>
                            </div>
                            <table className="admin-table">
                                <thead><tr>
                                    <th>Product</th><th>Category</th><th>Price</th>
                                    <th>Stock</th><th>Featured</th><th>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {products.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="admin-product-row">
                                                    <div className="admin-product-img">
                                                        <img
                                                            src={p.images?.[0] ? getImageUrl(p.images[0]) : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=100&q=80'}
                                                            alt={p.name}
                                                            style={{ objectPosition: p.imagePosition || 'center' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="admin-product-name">{p.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-clay">{p.category}</span></td>
                                            <td>₹{p.price?.toLocaleString('en-IN')}</td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: p.stock < 10 ? 'var(--clr-clay)' : 'var(--clr-text)' }}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td>{p.isFeatured ? <span className="badge badge-success">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setProductModal(p)} title="Edit">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteConfirm(p.id)} title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Orders */}
                    {!loading && activeSection === 'orders' && (
                        <div className="admin-table-container animate-fade-up">
                            <div className="admin-table-header">
                                <h3>All Orders ({orders.length})</h3>
                            </div>
                            <table className="admin-table">
                                <thead><tr>
                                    <th>Order ID</th><th>Customer</th><th>Items</th>
                                    <th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th>
                                </tr></thead>
                                <tbody>
                                    {orders.map((o) => (
                                        <tr key={o.id}>
                                            <td><code style={{ fontSize: '0.75rem' }}>#{String(o.id).padStart(6, '0')}</code></td>
                                            <td>
                                                <div>
                                                    <p style={{ fontWeight: 500 }}>{o.user?.name}</p>
                                                    <p style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>{o.user?.email}</p>
                                                </div>
                                            </td>
                                            <td>{o.items?.length}</td>
                                            <td>₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                                            <td><span className={`badge ${o.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{o.paymentStatus}</span></td>
                                            <td>
                                                <select
                                                    className="status-select"
                                                    value={o.orderStatus}
                                                    onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                                                >
                                                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                                                {new Date(o.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                            <td>
                                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteOrderConfirm(o.id)} title="Delete Order">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Users */}
                    {!loading && activeSection === 'users' && (
                        <div className="admin-table-container animate-fade-up">
                            <div className="admin-table-header">
                                <h3>Users ({users.length})</h3>
                            </div>
                            <table className="admin-table">
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 500 }}>{u.name}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`badge ${u.role === 'admin' ? 'badge-moss' : 'badge-gray'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                                                {new Date(u.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                            <td>
                                                <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleToggleUser(u.id)}>
                                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Contacts */}
                    {!loading && activeSection === 'contacts' && (
                        <div className="admin-table-container animate-fade-up">
                            <div className="admin-table-header">
                                <h3>Contact Messages ({contacts.length})</h3>
                            </div>
                            <table className="admin-table">
                                <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    {contacts.map((c) => (
                                        <tr key={c.id} style={{ background: c.isRead ? undefined : 'rgba(74,103,65,0.04)' }}>
                                            <td style={{ fontWeight: 500 }}>{c.name}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{c.email}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{c.subject}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                                                {c.message}
                                            </td>
                                            <td>
                                                {c.isRead
                                                    ? <span className="badge badge-gray">Read</span>
                                                    : <button className="btn btn-ghost btn-sm" onClick={() => handleMarkRead(c.id)}>Mark Read</button>
                                                }
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                                                {new Date(c.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Reviews */}
                    {!loading && activeSection === 'reviews' && (
                        <div className="admin-table-container animate-fade-up">
                            <div className="admin-table-header">
                                <h3>Customer Reviews ({reviews.length})</h3>
                            </div>
                            <table className="admin-table">
                                <thead><tr><th>Reviewer</th><th>Product ID</th><th>Rating</th><th>Comment</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {reviews.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 500 }}>{r.name}</td>
                                            <td>#{r.productId}</td>
                                            <td><span style={{ color: 'var(--clr-accent)' }}>{'★'.repeat(r.rating)}</span></td>
                                            <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                                                {r.comment}
                                            </td>
                                            <td>
                                                <span className={`badge ${r.showOnHomepage ? 'badge-moss' : 'badge-gray'}`}>
                                                    {r.showOnHomepage ? 'On Homepage' : 'Hidden'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className={`btn btn-sm ${r.showOnHomepage ? 'btn-ghost' : 'btn-secondary'}`} onClick={() => handleToggleReviewHomepage(r.id)}>
                                                        {r.showOnHomepage ? 'Remove' : 'Feature'}
                                                    </button>
                                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteReviewConfirm(r.id)} title="Delete Review">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Settings */}
                    {!loading && activeSection === 'settings' && (
                        <div className="admin-table-container animate-fade-up" style={{ maxWidth: '600px', padding: '2rem' }}>
                            <div className="admin-table-header" style={{ marginBottom: '1.5rem', borderBottom: 'none', padding: 0 }}>
                                <h3>Store Settings</h3>
                            </div>
                            <form onSubmit={handleSettingsSubmit}>
                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>GST Percentage (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.gst}
                                        onChange={(e) => setSettings({ ...settings, gst: e.target.value })}
                                        min="0"
                                        max="100"
                                        step="1"
                                        required
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem' }}>
                                        This percentage will be applied to all new orders during checkout.
                                    </p>
                                </div>
                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>Flat Shipping Charge (₹)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.shipping}
                                        onChange={(e) => setSettings({ ...settings, shipping: e.target.value })}
                                        min="0"
                                        step="1"
                                        required
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem' }}>
                                        This flat shipping charge will be applied to all new orders during checkout. Set to 0 for Free Shipping.
                                    </p>
                                </div>
                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>Product Categories (comma-separated)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={settings.categories}
                                        onChange={(e) => setSettings({ ...settings, categories: e.target.value })}
                                        placeholder="Crafts, Gifts, Arts, Home Decor"
                                        required
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem' }}>
                                        These categories will show up in the Shop and on the Homepage.
                                    </p>
                                </div>
                                <div style={{ borderTop: '1px solid var(--clr-border-light)', paddingTop: '1.5rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        <Save size={16} /> Save Settings
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Modal */}
            {productModal && (
                <ProductModal
                    product={productModal === 'new' ? null : productModal}
                    onClose={() => setProductModal(null)}
                    onSave={fetchSection}
                    categories={settings.categories.split(',').map(s => s.trim()).filter(Boolean)}
                />
            )}

            {/* Admin Modal */}
            {adminModal && (
                <AdminModal
                    onClose={() => setAdminModal(false)}
                    onSave={fetchSection}
                />
            )}

            {/* Custom Confirm Delete Product Modal */}
            {deleteConfirm && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <AlertTriangle size={48} color="var(--clr-clay)" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Confirm Delete</h2>
                        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to delete this product? This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDeleteProduct(deleteConfirm)}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Delete Order Modal */}
            {deleteOrderConfirm && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <AlertTriangle size={48} color="var(--clr-clay)" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Confirm Order Deletion</h2>
                        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to permanently delete order #{String(deleteOrderConfirm).padStart(6, '0')}? This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-ghost" onClick={() => setDeleteOrderConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDeleteOrder(deleteOrderConfirm)}>
                                Yes, Delete Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Delete Review Modal */}
            {deleteReviewConfirm && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <AlertTriangle size={48} color="var(--clr-clay)" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Confirm Delete</h2>
                        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to permanently delete this customer review? It will be removed immediately.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-ghost" onClick={() => setDeleteReviewConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDeleteReview(deleteReviewConfirm)}>
                                Yes, Delete Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
