import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingCart, Minus, Plus, Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import API, { getImageUrl } from '../lib/api';
import useCartStore from '../stores/cartStore';
import useAuthStore from '../stores/authStore';
import { StarRating, PLACEHOLDER } from '../components/ProductCard';
import { getMockById, MOCK_PRODUCTS } from '../data/mockProducts';
import '../styles/product-detail.css';

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [qty, setQty] = useState(1);
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewLoading, setReviewLoading] = useState(false);

    const addItem = useCartStore((s) => s.addItem);
    const { isLoggedIn } = useAuthStore();

    useEffect(() => {
        setLoading(true);
        API.get(`/products/${id}`)
            .then(({ data }) => {
                setProduct(data.product);
                document.title = `${data.product.name} — Velvet Moss`;
            })
            .catch(() => {
                // Fallback to mock data when backend is offline
                const mock = getMockById(id) || MOCK_PRODUCTS[0];
                setProduct(mock);
                document.title = `${mock.name} — Velvet Moss`;
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleAddToCart = () => {
        addItem(product, qty);
        toast.success(`${product.name} added to cart!`, { icon: '🌿' });
    };

    const handleReview = async (e) => {
        e.preventDefault();
        if (!isLoggedIn()) return navigate('/login');
        if (!reviewText.trim()) return toast.error('Please write a review comment');
        setReviewLoading(true);
        try {
            const { data } = await API.post(`/products/${id}/reviews`, {
                rating: reviewRating,
                comment: reviewText,
            });
            setProduct(data.product);
            setReviewText('');
            setReviewRating(5);
            toast.success('Review added!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add review');
        } finally {
            setReviewLoading(false);
        }
    };

    if (loading) return (
        <div className="product-detail">
            <div className="container">
                {/* Skeleton Breadcrumb */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    <div className="skeleton" style={{ width: '40px', height: '14px' }} />
                    <ChevronRight size={12} color="var(--clr-text-muted)" />
                    <div className="skeleton" style={{ width: '40px', height: '14px' }} />
                    <ChevronRight size={12} color="var(--clr-text-muted)" />
                    <div className="skeleton" style={{ width: '80px', height: '14px' }} />
                </div>

                <div className="product-detail-layout">
                    {/* Skeleton Gallery */}
                    <div className="product-gallery">
                        <div className="gallery-main skeleton" style={{ background: 'var(--clr-border-light)' }} />
                        <div className="gallery-thumbs">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="gallery-thumb skeleton" style={{ border: 'none' }} />
                            ))}
                        </div>
                    </div>

                    {/* Skeleton Info */}
                    <div className="product-info">
                        <div className="skeleton" style={{ width: '100px', height: '14px', marginBottom: '0.5rem' }} />
                        <div className="skeleton" style={{ width: '80%', height: '40px', marginBottom: '0.75rem' }} />
                        
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div className="skeleton" style={{ width: '120px', height: '20px' }} />
                        </div>

                        <div className="skeleton" style={{ width: '140px', height: '32px', marginBottom: '0.75rem' }} />
                        <div className="skeleton" style={{ width: '80px', height: '26px', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem' }} />

                        <hr className="divider-thin" style={{ borderColor: 'transparent' }} />

                        <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '0.5rem' }} />
                        <div className="skeleton" style={{ width: '90%', height: '14px', marginBottom: '0.5rem' }} />
                        <div className="skeleton" style={{ width: '95%', height: '14px', marginBottom: '1.5rem' }} />

                        <div className="skeleton" style={{ width: '60px', height: '14px', marginBottom: '0.5rem' }} />
                        <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem' }} />

                        <div className="product-add-actions">
                            <div className="skeleton btn-lg" style={{ width: '160px', height: '50px', borderRadius: 'var(--radius-full)' }} />
                            <div className="skeleton btn-lg" style={{ width: '160px', height: '50px', borderRadius: 'var(--radius-full)' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    if (!product) return null;

    const images = product.images?.length
        ? product.images.map(getImageUrl)
        : [PLACEHOLDER];

    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const stockStatus = product.stock === 0
        ? { label: 'Out of Stock', cls: 'out-of-stock' }
        : product.stock < 10
            ? { label: `Only ${product.stock} left`, cls: 'low-stock' }
            : { label: 'In Stock', cls: 'in-stock' };

    return (
        <div className="product-detail">
            <div className="container">
                {/* Breadcrumb */}
                <nav className="breadcrumb" aria-label="breadcrumb">
                    <Link to="/">Home</Link>
                    <ChevronRight size={12} />
                    <Link to="/products">Shop</Link>
                    <ChevronRight size={12} />
                    <Link to={`/products?category=${product.category}`}>{product.category}</Link>
                    <ChevronRight size={12} />
                    <span>{product.name}</span>
                </nav>

                <div className="product-detail-layout">
                    {/* Gallery */}
                    <div className="product-gallery">
                        <div className="gallery-main">
                            <img src={images[activeImage]} alt={product.name} style={{ '--img-pos': product?.imagePosition || 'center', objectPosition: 'var(--img-pos)' }} />
                        </div>
                        {images.length > 1 && (
                            <div className="gallery-thumbs">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        className={`gallery-thumb ${i === activeImage ? 'active' : ''}`}
                                        onClick={() => setActiveImage(i)}
                                    >
                                        <img src={img} alt="" style={{ '--img-pos': product?.imagePosition || 'center', objectPosition: 'var(--img-pos)' }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="product-info animate-fade-up">
                        <p className="product-info-category">{product.category}</p>
                        <h1>{product.name}</h1>

                        <div className="product-info-rating">
                            <StarRating rating={product.avgRating} count={product.numReviews} />
                            <a href="#reviews">{product.numReviews} reviews</a>
                        </div>

                        <div className="product-info-price">
                            <span className="info-price-current">₹{product.price.toLocaleString('en-IN')}</span>
                            {product.originalPrice > product.price && (
                                <>
                                    <span className="info-price-original">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                                    <span className="info-price-discount">{discount}% off</span>
                                </>
                            )}
                        </div>

                        <div className={`stock-indicator ${stockStatus.cls}`}>
                            <span className={`stock-dot ${stockStatus.cls === 'in-stock' ? 'pulse' : ''}`} />
                            {stockStatus.label}
                        </div>

                        {product.tags?.length > 0 && (
                            <div className="product-info-tags">
                                {product.tags.map((t) => <span key={t} className="tag-pill">#{t}</span>)}
                            </div>
                        )}

                        <hr className="divider-thin" />

                        <p className="product-info-description">{product.description}</p>

                        {product.stock > 0 && (
                            <>
                                {/* Quantity Selector */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--clr-text-muted)' }}>
                                        QUANTITY
                                    </label>
                                    <div className="qty-selector">
                                        <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={14} /></button>
                                        <span className="qty-value">{qty}</span>
                                        <button className="qty-btn" onClick={() => setQty(Math.min(product.stock, qty + 1))}><Plus size={14} /></button>
                                    </div>
                                </div>

                                <div className="product-add-actions">
                                    <button className="btn btn-primary btn-lg" onClick={handleAddToCart} id="add-to-cart-btn">
                                        <ShoppingCart size={18} /> Add to Cart
                                    </button>
                                    <Link
                                        to="/cart"
                                        className="btn btn-clay btn-lg"
                                        onClick={() => addItem(product, qty)}
                                        id="buy-now-btn"
                                    >
                                        Buy Now
                                    </Link>
                                </div>
                            </>
                        )}

                        {product.stock === 0 && (
                            <p style={{ color: 'var(--clr-error)', fontWeight: 600, marginTop: '1rem' }}>
                                This product is currently out of stock. Check back soon!
                            </p>
                        )}
                    </div>
                </div>

                {/* Reviews */}
                <section id="reviews" className="reviews-section animate-fade-up">
                    <h2>Customer Reviews</h2>
                    <div className="reviews-summary">
                        <div className="review-avg-rating">
                            <div className="review-avg-number">{Number(product.avgRating).toFixed(1)}</div>
                            <div className="review-avg-stars">
                                <StarRating rating={product.avgRating} count={0} />
                            </div>
                            <div className="review-avg-count">{product.numReviews} reviews</div>
                        </div>
                    </div>

                    {product.reviews?.length === 0 && (
                        <p style={{ color: 'var(--clr-text-muted)', padding: '1rem 0' }}>
                            No reviews yet. Be the first to review this product!
                        </p>
                    )}

                    {product.reviews?.map((r) => (
                        <div key={r.id} className="review-card">
                            <div className="review-header">
                                <div className="review-avatar">{r.name[0]}</div>
                                <div>
                                    <div className="review-author">{r.name}</div>
                                    <div className="review-date">
                                        {new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <StarRating rating={r.rating} count={0} />
                            </div>
                            <p className="review-text">{r.comment}</p>
                        </div>
                    ))}

                    {/* Add Review */}
                    <div className="add-review-form">
                        <h4>Write a Review</h4>
                        <form onSubmit={handleReview}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                                    Rating
                                </label>
                                <div className="star-picker">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`star-pick-btn ${s <= reviewRating ? 'filled' : ''}`}
                                            onClick={() => setReviewRating(s)}
                                        >★</button>
                                    ))}
                                </div>
                            </div>
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>Your Review</label>
                                <textarea
                                    className="input"
                                    placeholder="Share your thoughts about this product..."
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={reviewLoading} id="submit-review-btn">
                                {reviewLoading ? <span className="spinner spinner-sm" /> : <><Send size={14} /> Submit Review</>}
                            </button>
                            {!isLoggedIn() && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem' }}>
                                    <Link to="/login" style={{ color: 'var(--clr-moss)' }}>Sign in</Link> to leave a review
                                </p>
                            )}
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}
