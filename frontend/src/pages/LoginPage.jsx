import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import '../styles/pages.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(form.email, form.password);
        if (result.success) {
            toast.success('Welcome back!', { icon: '🌿' });
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="auth-page">
            {/* Visual Side */}
            <div className="auth-side-visual">
                <div className="auth-visual-shapes">
                    <div className="auth-circle auth-circle-1" />
                    <div className="auth-circle auth-circle-2" />
                    <div className="auth-circle auth-circle-3" />
                </div>
                <div className="auth-side-visual-content">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿</div>
                    <h2>Welcome Back</h2>
                    <p>Sign in to browse your favorite handmade goods and track your orders.</p>
                </div>
            </div>

            {/* Form Side */}
            <div className="auth-side-form">
                <div className="auth-form-box">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <div className="logo-icon"><Leaf size={14} /></div>
                            Velvet Moss
                        </Link>
                        <h1>Sign In</h1>
                        <p>Enter your credentials to access your account</p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit} id="login-form">
                        <div className="input-group">
                            <label htmlFor="login-email">Email Address</label>
                            <input
                                id="login-email"
                                className="input"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="login-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    className="input"
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="Your password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                    autoComplete="current-password"
                                    style={{ paddingRight: '2.75rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', display: 'flex' }}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isLoading}
                            id="login-submit-btn"
                        >
                            {isLoading ? <span className="spinner spinner-sm" /> : 'Sign In'}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
