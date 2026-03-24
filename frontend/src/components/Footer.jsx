import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Instagram, Twitter, Facebook, Youtube, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/footer.css';

const footerLinks = {
    shop: [
        { label: 'All Products', to: '/products' },
        { label: 'Crafts', to: '/products?category=Crafts' },
        { label: 'Gifts', to: '/products?category=Gifts' }
    ],
    support: [
        { label: 'My Orders', to: '/orders' },
        { label: 'My Account', to: '/profile' },
        { label: 'Contact Us', to: '/contact' },
        { label: 'FAQs', to: '/contact' },
        { label: 'Shipping Info', to: '/contact' },
        { label: 'Returns', to: '/contact' },
    ],
};

export default function Footer() {
    const [email, setEmail] = useState('');

    const handleNewsletter = (e) => {
        e.preventDefault();
        if (!email) return;
        toast.success(`🌿 You're subscribed! Welcome to the moss family.`);
        setEmail('');
    };

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="footer-brand">
                        <Link to="/" className="logo">
                            <div className="logo-icon"><Leaf size={14} color="#fff" /></div>
                            Velvet<span> Moss</span>
                        </Link>
                        <p>
                            A curated marketplace for handmade goods crafted with love and intention.
                            Each piece supports independent artisans and sustainable living.
                        </p>
                        <div className="footer-socials">
                            <a href="#" className="social-link" aria-label="Instagram"><Instagram size={14} /></a>
                            <a href="#" className="social-link" aria-label="Twitter"><Twitter size={14} /></a>
                            <a href="#" className="social-link" aria-label="Facebook"><Facebook size={14} /></a>
                            <a href="#" className="social-link" aria-label="YouTube"><Youtube size={14} /></a>
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div className="footer-col">
                        <h4>Shop</h4>
                        <ul>
                            {footerLinks.shop.map((l) => (
                                <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="footer-col">
                        <h4>Support</h4>
                        <ul>
                            {footerLinks.support.map((l) => (
                                <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer-col footer-newsletter">
                        <h4>Stay Inspired</h4>
                        <p>Join our community for new arrivals, artisan stories, and exclusive offers.</p>
                        <form className="newsletter-form" onSubmit={handleNewsletter}>
                            <input
                                type="email"
                                placeholder="Your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button type="submit"><ArrowRight size={14} /></button>
                        </form>
                    </div>
                </div>

                {/* Bottom */}
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Velvet Moss. All rights reserved.</p>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link to="/contact">Privacy Policy</Link>
                        <Link to="/contact">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
