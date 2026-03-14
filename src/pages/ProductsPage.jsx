import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import API from '../lib/api';
import ProductCard from '../components/ProductCard';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import '../styles/products.css';
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
];

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [categories, setCategories] = useState(['Crafts', 'Gifts']);
    const searchTimer = useRef(null);

    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = Number(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ sort, page, limit: 12 });
            if (category) params.set('category', category);
            if (search) params.set('search', search);
            if (minPrice) params.set('minPrice', minPrice);
            if (maxPrice) params.set('maxPrice', maxPrice);
            if (searchParams.get('featured')) params.set('featured', 'true');

            const { data } = await API.get(`/products?${params}`);
            if (data.products?.length) {
                setProducts(data.products);
                setPagination(data.pagination);
            } else {
                throw new Error('No products from API');
            }
        } catch {
            // Fallback: filter mock products client-side
            let filtered = [...MOCK_PRODUCTS];
            if (category) filtered = filtered.filter(p => p.category === category);
            if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
            if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
            if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
            if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
            else if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
            else if (sort === 'rating') filtered.sort((a, b) => b.avgRating - a.avgRating);
            setProducts(filtered);
            setPagination({ total: filtered.length, page: 1, totalPages: 1, limit: filtered.length });
        } finally {
            setLoading(false);
        }
    }, [category, sort, page, search, minPrice, maxPrice]);

    useEffect(() => {
        document.title = 'Shop — Velvet Moss';
        fetchProducts();
        API.get('/settings').then(({ data }) => {
            if (data?.settings?.categories) {
                setCategories(data.settings.categories.split(',').map(s => s.trim()).filter(Boolean));
            }
        }).catch(console.error);
    }, [fetchProducts]);

    const updateParam = (key, value) => {
        const p = new URLSearchParams(searchParams);
        if (!value) p.delete(key); else p.set(key, value);
        p.delete('page');
        setSearchParams(p);
    };

    const handleSearch = (e) => {
        clearTimeout(searchTimer.current);
        const val = e.target.value;
        searchTimer.current = setTimeout(() => updateParam('search', val), 400);
    };

    const clearAll = () => setSearchParams({});

    return (
        <div className="products-page">
            <div className="container">
                <div className="products-page-header">
                    <h1>Handmade Shop</h1>
                    <p>Discover thousands of unique, handcrafted items</p>
                </div>

                <div className="products-layout">
                    {/* Filters Sidebar */}
                    <aside className={`filters-sidebar ${showFilters ? 'mobile-open' : ''}`}>
                        <div className="filters-title">
                            <h3>Filters</h3>
                            <button className="filters-clear" onClick={clearAll}>Clear All</button>
                        </div>

                        {/* Category */}
                        <div className="filter-group">
                            <p className="filter-group-title">Category</p>
                            <div className="filter-radio-group">
                                <label className="filter-option">
                                    <input
                                        type="radio"
                                        name="category"
                                        value=""
                                        checked={!category}
                                        onChange={() => updateParam('category', '')}
                                    />
                                    All Categories
                                </label>
                                {categories.map((c) => (
                                    <label key={c} className="filter-option">
                                        <input
                                            type="radio"
                                            name="category"
                                            value={c}
                                            checked={category === c}
                                            onChange={() => updateParam('category', c)}
                                        />
                                        {c}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <hr className="filter-divider" />

                        {/* Price Range */}
                        <div className="filter-group">
                            <p className="filter-group-title">Price Range</p>
                            <div className="price-range-inputs">
                                <input
                                    className="price-input"
                                    type="number"
                                    placeholder="Min"
                                    defaultValue={minPrice}
                                    onBlur={(e) => updateParam('minPrice', e.target.value)}
                                />
                                <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>–</span>
                                <input
                                    className="price-input"
                                    type="number"
                                    placeholder="Max"
                                    defaultValue={maxPrice}
                                    onBlur={(e) => updateParam('maxPrice', e.target.value)}
                                />
                            </div>
                        </div>
                    </aside>

                    {/* Main */}
                    <main className="products-main">
                        {/* Toolbar */}
                        <div className="products-toolbar">
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
                                <div className="products-search">
                                    <Search size={15} className="products-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        defaultValue={search}
                                        onChange={handleSearch}
                                        id="products-search-input"
                                    />
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowFilters((v) => !v)}
                                    style={{ display: 'none' }}
                                    id="filters-mobile-toggle"
                                >
                                    <SlidersHorizontal size={14} /> Filters
                                </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {pagination && (
                                    <span className="products-count">
                                        {pagination.total} {pagination.total === 1 ? 'item' : 'items'}
                                    </span>
                                )}
                                <select
                                    className="sort-select"
                                    value={sort}
                                    onChange={(e) => updateParam('sort', e.target.value)}
                                    id="products-sort-select"
                                >
                                    {SORT_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {(category || minPrice || maxPrice || search) && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                {category && (
                                    <span className="badge badge-moss" style={{ cursor: 'pointer' }} onClick={() => updateParam('category', '')}>
                                        {category} <X size={10} style={{ marginLeft: 4 }} />
                                    </span>
                                )}
                                {search && (
                                    <span className="badge badge-clay" style={{ cursor: 'pointer' }} onClick={() => updateParam('search', '')}>
                                        "{search}" <X size={10} style={{ marginLeft: 4 }} />
                                    </span>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="page-loading"><div className="spinner" /></div>
                        ) : products.length === 0 ? (
                            <div className="text-center" style={{ padding: '4rem 2rem' }}>
                                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</p>
                                <h3>No products found</h3>
                                <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
                                    Try adjusting your filters or search terms
                                </p>
                                <button className="btn btn-primary" onClick={clearAll}>Clear Filters</button>
                            </div>
                        ) : (
                            <div className="products-grid stagger">
                                {products.map((p) => <ProductCard key={p.id} product={p} />)}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="page-btn"
                                    disabled={page <= 1}
                                    onClick={() => updateParam('page', page - 1)}
                                >‹</button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pagination.totalPages)
                                    .map((p, idx, arr) => (
                                        <>
                                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                <span key={`dot-${p}`} style={{ color: 'var(--clr-text-muted)', padding: '0 4px' }}>…</span>
                                            )}
                                            <button
                                                key={p}
                                                className={`page-btn ${p === page ? 'active' : ''}`}
                                                onClick={() => updateParam('page', p)}
                                            >{p}</button>
                                        </>
                                    ))}
                                <button
                                    className="page-btn"
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => updateParam('page', page + 1)}
                                >›</button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
