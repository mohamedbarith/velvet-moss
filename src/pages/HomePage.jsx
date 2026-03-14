import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RotateCcw, Headphones } from 'lucide-react';
import API from '../lib/api';
import ProductCard from '../components/ProductCard';
import { MOCK_FEATURED } from '../data/mockProducts';
import '../styles/home.css';

const FEATURES = [
    { icon: <Truck size={22} />, title: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: <Shield size={22} />, title: 'Secure Payment', desc: 'Stripe encrypted checkout' },
    { icon: <RotateCcw size={22} />, title: 'Easy Returns', desc: '30-day return policy' },
    { icon: <Headphones size={22} />, title: '24/7 Support', desc: 'We are always here' },
];

const TESTIMONIALS = [
    {
        text: 'I ordered a hand-thrown pottery bowl and it was absolutely stunning. It arrived beautifully packed and even more gorgeous in person. Velvet Moss is my go-to for unique gifts!',
        author: 'Priya Sharma',
        loc: 'Mumbai',
        rating: 5,
    },
    {
        text: "The handwoven textile I purchased felt incredibly luxurious. You can tell every piece is made with true craftsmanship. I've already ordered three more things!",
        author: 'Arjun Mehta',
        loc: 'Bangalore',
        rating: 5,
    },
    {
        text: "Fantastic quality candles! They smell divine and burn so cleanly. I love that I'm supporting independent artisans with every purchase. 10/10 experience.",
        author: 'Sunita Nair',
        loc: 'Chennai',
        rating: 5,
    },
];

export default function HomePage() {
    const [featured, setFeatured] = useState([]);
    const [categories, setCategories] = useState(['Crafts', 'Gifts']);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Velvet Moss — Handcrafted Goods';
        API.get('/products?featured=true&limit=8')
            .then(({ data }) => setFeatured(data.products?.length ? data.products : MOCK_FEATURED))
            .catch(() => setFeatured(MOCK_FEATURED))
            .finally(() => setLoading(false));

        API.get('/settings').then(({ data }) => {
            if (data?.settings?.categories) {
                setCategories(data.settings.categories.split(',').map(s => s.trim()).filter(Boolean));
            }
        }).catch(console.error);

        // Fetch Recent Reviews
        API.get('/products/reviews/recent')
            .then(({ data }) => {
                if (data.reviews && data.reviews.length > 0) {
                    // Map db format to what the component expects
                    const formatted = data.reviews.map(r => ({
                        id: r.id,
                        text: r.comment,
                        author: r.name,
                        loc: 'Verified Buyer',
                        rating: r.rating
                    }));
                    setReviews(formatted);
                } else {
                    // Fallback to static if empty
                    setReviews(TESTIMONIALS);
                }
            })
            .catch(() => setReviews(TESTIMONIALS));
    }, []);

    return (
        <div className="home-page">
            {/* Hero */}
            <section className="hero">
                <div className="hero-bg" />
                <div className="hero-shapes">
                    <div className="hero-shape hero-shape-1" />
                    <div className="hero-shape hero-shape-2" />
                    <div className="hero-shape hero-shape-3" />
                </div>
                <div className="container">
                    <div className="hero-content">
                        <span className="hero-overline">✦ Handcrafted with Love</span>
                        <h1>
                            Discover <em>Artisan</em><br />
                            Craftsmanship
                        </h1>
                        <p>
                            Velvet Moss is Beautifully crafted gifts designed to make every moment special. Our collection features elegant, high-quality products perfect for celebrating love, joy, and memorable occasions.
                        </p>
                        <div className="hero-btns">
                            <Link to="/products" className="btn btn-clay btn-lg">
                                Shop Now <ArrowRight size={16} />
                            </Link>
                            <Link to="/products?featured=true" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                                View Featured
                            </Link>
                        </div>
                        <div className="hero-stats">
                            {[
                                { value: '200+', label: 'Handmade Products' },
                                { value: '850+', label: 'Crafted Gifts' },
                                { value: '100+', label: 'Happy Customers' },
                            ].map((s) => (
                                <div key={s.label}>
                                    <div className="hero-stat-value">{s.value}</div>
                                    <div className="hero-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Strip */}
            <section className="features-strip">
                <div className="container">
                    <div className="features-strip-inner">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="feature-item">
                                <div className="feature-icon">{f.icon}</div>
                                <div>
                                    <h4>{f.title}</h4>
                                    <p>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="categories-section">
                <div className="container">
                    <div className="section-title animate-fade-up">
                        <span className="overline">Browse by Category</span>
                        <h2>Shop by Craft</h2>
                        <p>Explore our curated collection of handmade goods across every medium</p>
                    </div>
                    <div className="categories-grid stagger">
                        {categories.map((c) => (
                            <Link to={`/products?category=${encodeURIComponent(c)}`} key={c} className="category-card" style={{ padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '1.25rem' }}>{c}</h4>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section style={{ padding: '0 0 5rem' }}>
                <div className="container">
                    <div className="section-title animate-fade-up">
                        <span className="overline">Handpicked for You</span>
                        <h2>Featured Products</h2>
                        <p>Our editors' top picks — artisan-made and absolutely beautiful</p>
                    </div>

                    {loading ? (
                        <div className="page-loading"><div className="spinner" /></div>
                    ) : featured.length === 0 ? (
                        <div className="text-center" style={{ padding: '3rem', color: 'var(--clr-text-muted)' }}>
                            <p>No featured products yet. Products will appear here once added.</p>
                            <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse All Products</Link>
                        </div>
                    ) : (
                        <div className="products-grid stagger">
                            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}

                    {!loading && featured.length > 0 && (
                        <div className="text-center" style={{ marginTop: '3rem' }}>
                            <Link to="/products" className="btn btn-secondary btn-lg">
                                View All Products <ArrowRight size={16} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials-section">
                <div className="container">
                    <div className="section-title animate-fade-up">
                        <span className="overline">Customer Love</span>
                        <h2>What Our Community Says</h2>
                        <p>Thousands of happy customers across India and beyond</p>
                    </div>
                    <div className="testimonials-grid stagger">
                        {reviews.map((t, idx) => (
                            <article key={t.id || idx} className="testimonial-card">
                                <div className="testimonial-quote">"</div>
                                <div className="stars" style={{ marginBottom: '0.75rem' }}>
                                    {Array(t.rating).fill(0).map((_, i) => <span key={i} className="star filled">★</span>)}
                                    {Array(5 - (t.rating || 5)).fill(0).map((_, i) => <span key={i + 5} className="star">★</span>)}
                                </div>
                                <p className="testimonial-text">{t.text}</p>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar">{t.author?.[0]}</div>
                                    <div className="testimonial-author-info">
                                        <strong>{t.author}</strong>
                                        <span>{t.loc}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
