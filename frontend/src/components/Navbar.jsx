import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Leaf, Package, Heart, LogOut, Settings, ChevronDown } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useCartStore from '../stores/cartStore';
import '../styles/navbar.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const authRef = useRef(null);
    const navigate = useNavigate();

    const { user, logout, isLoggedIn, isAdmin } = useAuthStore();
    const totalItems = useCartStore((s) => s.totalItems());

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (authRef.current && !authRef.current.contains(e.target)) {
                setAuthOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        setAuthOpen(false);
        navigate('/');
    };

    return (
        <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container">
                <nav className="navbar-inner">
                    {/* Logo */}
                    <Link to="/" className="navbar-logo">
                        <div className="navbar-logo-icon"><Leaf size={18} /></div>
                        <span>Velvet<span> Moss</span></span>
                    </Link>

                    {/* Desktop Links */}
                    <ul className="navbar-links">
                        <li><NavLink to="/">Home</NavLink></li>
                        <li><NavLink to="/products">Shop</NavLink></li>
                        <li><NavLink to="/contact">Contact</NavLink></li>
                        {isAdmin() && <li><NavLink to="/admin">Admin</NavLink></li>}
                    </ul>

                    {/* Actions */}
                    <div className="navbar-actions">
                        {/* Cart */}
                        <button
                            className="navbar-icon-btn"
                            onClick={() => navigate('/cart')}
                            title="Cart"
                            id="nav-cart-btn"
                        >
                            <ShoppingBag size={20} />
                            {totalItems > 0 && (
                                <span className="cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>
                            )}
                        </button>

                        {/* Auth */}
                        {isLoggedIn() ? (
                            <div className="auth-menu" ref={authRef}>
                                <button
                                    className="navbar-icon-btn"
                                    onClick={() => setAuthOpen((v) => !v)}
                                    id="nav-user-btn"
                                >
                                    <User size={20} />
                                    <ChevronDown size={12} style={{ marginLeft: 2 }} />
                                </button>
                                {authOpen && (
                                    <div className="auth-dropdown animate-scale-in">
                                        <div className="auth-dropdown-header">
                                            <p>Signed in as</p>
                                            <strong>{user?.name}</strong>
                                        </div>
                                        <Link to="/profile" className="auth-dropdown-link" onClick={() => setAuthOpen(false)}>
                                            <User size={15} /> My Account
                                        </Link>
                                        <Link to="/orders" className="auth-dropdown-link" onClick={() => setAuthOpen(false)}>
                                            <Package size={15} /> My Orders
                                        </Link>
                                        {isAdmin() && (
                                            <>
                                                <hr />
                                                <Link to="/admin" className="auth-dropdown-link" onClick={() => setAuthOpen(false)}>
                                                    <Settings size={15} /> Admin Panel
                                                </Link>
                                            </>
                                        )}
                                        <hr />
                                        <button className="auth-dropdown-link danger w-full" onClick={handleLogout}>
                                            <LogOut size={15} /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
                        )}

                        {/* Hamburger */}
                        <button
                            className={`navbar-hamburger ${mobileOpen ? 'open' : ''}`}
                            onClick={() => setMobileOpen((v) => !v)}
                            id="nav-hamburger"
                            aria-label="Menu"
                        >
                            <span /><span /><span />
                        </button>
                    </div>
                </nav>

                {/* Mobile Nav */}
                <div className={`navbar-mobile ${mobileOpen ? 'open' : ''}`}>
                    <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
                    <Link to="/products" onClick={() => setMobileOpen(false)}>Shop</Link>
                    <Link to="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
                    {isLoggedIn() && (
                        <>
                            <Link to="/profile" onClick={() => setMobileOpen(false)}>My Account</Link>
                            <Link to="/orders" onClick={() => setMobileOpen(false)}>My Orders</Link>
                            {isAdmin() && <Link to="/admin" onClick={() => setMobileOpen(false)}>Admin Panel</Link>}
                        </>
                    )}
                    {!isLoggedIn() && <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>}
                    {isLoggedIn() && (
                        <button onClick={handleLogout} style={{ color: 'var(--clr-error)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '0.65rem 0', fontWeight: 500, fontSize: '0.95rem' }}>
                            Sign Out
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
