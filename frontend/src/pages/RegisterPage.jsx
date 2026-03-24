import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import '../styles/pages.css';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, isLoading } = useAuthStore();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        const result = await register(form.name, form.email, form.password);
        if (result.success) {
            toast.success('Account created! Welcome to Velvet Moss 🌿');
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-side-visual">
                <div className="auth-visual-shapes">
                    <div className="auth-circle auth-circle-1" />
                    <div className="auth-circle auth-circle-2" />
                    <div className="auth-circle auth-circle-3" />
                </div>
                <div className="auth-side-visual-content">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
                    <h2>Join the Community</h2>
                    <p>Create your account and discover thousands of handcrafted treasures from independent artisans.</p>
                </div>
            </div>

            <div className="auth-side-form">
                <div className="auth-form-box">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <div className="logo-icon"><Leaf size={14} /></div>
                            Velvet Moss
                        </Link>
                        <h1>Create Account</h1>
                        <p>Join thousands of craft lovers on Velvet Moss</p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit} id="register-form">
                        <div className="input-group">
                            <label htmlFor="reg-name">Full Name</label>
                            <input
                                id="reg-name"
                                className="input"
                                type="text"
                                placeholder="Your full name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="reg-email">Email Address</label>
                            <input
                                id="reg-email"
                                className="input"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="reg-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="reg-password"
                                    className="input"
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                    style={{ paddingRight: '2.75rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', display: 'flex' }}
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="reg-confirm">Confirm Password</label>
                            <input
                                id="reg-confirm"
                                className="input"
                                type={showPwd ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                value={form.confirm}
                                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isLoading}
                            id="register-submit-btn"
                        >
                            {isLoading ? <span className="spinner spinner-sm" /> : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
