import { Link } from 'react-router-dom';
import { ShoppingCart, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../stores/cartStore';
import { getImageUrl } from '../lib/api';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80';

const CATEGORY_ICONS = {
    Crafts: '🧶', Gifts: '🎁', Arts: '🎨', Home: '🏡',
};

function StarRating({ rating, count }) {
    return (
        <div className="product-card-rating">
            <span className="stars">
                {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`star ${s <= Math.round(rating) ? 'filled' : ''}`}>★</span>
                ))}
            </span>
            {count > 0 && <span className="product-rating-count">({count})</span>}
        </div>
    );
}

export default function ProductCard({ product }) {
    const addItem = useCartStore((s) => s.addItem);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock === 0) return;
        addItem(product, 1);
        toast.success(`${product.name} added to cart!`, {
            icon: '🌿',
            style: {
                borderRadius: '12px',
                background: '#fff',
                color: '#3a3a3a',
            },
        });
    };

    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : PLACEHOLDER;

    return (
        <Link to={`/products/${product.id}`} className="product-card">
            {/* Image */}
            <div className="product-card-image">
                <img src={imageUrl} alt={product.name} loading="lazy" style={{ '--img-pos': product?.imagePosition || 'center' }} />
                {discount > 0 && (
                    <div className="product-card-badge">
                        <span className="badge badge-error">-{discount}%</span>
                    </div>
                )}
                {product.isFeatured && !discount && (
                    <div className="product-card-badge">
                        <span className="badge badge-moss">Featured</span>
                    </div>
                )}
                <button
                    className="product-card-quick-add"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                >
                    {product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
                </button>
            </div>

            {/* Body */}
            <div className="product-card-body">
                <p className="product-card-category" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', fontWeight: 600, color: 'var(--clr-moss)' }}>
                    {CATEGORY_ICONS[product.category] || '🌿'} {product.category}
                </p>
                <h3 className="product-card-name">{product.name}</h3>
                <StarRating rating={product.avgRating} count={product.numReviews} />
                <div className="product-card-footer">
                    <div className="product-price">
                        <span className="price-current">₹{product.price.toLocaleString('en-IN')}</span>
                        {product.originalPrice > product.price && (
                            <span className="price-original">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                    </div>
                    <button
                        className="product-add-btn"
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        title={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </Link>
    );
}

export { StarRating, CATEGORY_ICONS, PLACEHOLDER };
