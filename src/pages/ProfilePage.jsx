import { useEffect, useState } from 'react';
import { User, Package, Lock, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../lib/api';
import useAuthStore from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/pages.css';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, updateUser, isLoggedIn } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: '', address: '' });
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isLoggedIn()) navigate('/login');
        document.title = 'My Account — Velvet Moss';
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await API.put('/auth/profile', profileForm);
            updateUser(data.user);
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            return toast.error('New passwords do not match');
        }
        setLoading(true);
        try {
            await API.put('/auth/change-password', {
                currentPassword: pwdForm.currentPassword,
                newPassword: pwdForm.newPassword,
            });
            toast.success('Password changed successfully!');
            setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <User size={15} /> },
        { id: 'orders', label: 'Orders', icon: <Package size={15} /> },
        { id: 'password', label: 'Password', icon: <Lock size={15} /> },
    ];

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-layout">
                    {/* Sidebar */}
                    <aside className="profile-sidebar">
                        <div className="profile-avatar-section">
                            <div className="profile-avatar">{user?.name?.[0] || 'U'}</div>
                            <p className="profile-name">{user?.name}</p>
                            <p className="profile-email">{user?.email}</p>
                        </div>
                        <nav className="profile-nav">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`profile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    id={`profile-tab-${tab.id}`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content */}
                    <div className="profile-content animate-fade-in">
                        {activeTab === 'profile' && (
                            <>
                                <h2>Edit Profile</h2>
                                <form onSubmit={handleProfileSubmit} id="profile-form">
                                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                                        <label>Full Name</label>
                                        <input
                                            className="input"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                                        <label>Email</label>
                                        <input className="input" value={user?.email} readOnly style={{ background: 'var(--clr-cream)' }} />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                                        <label>Phone</label>
                                        <input
                                            className="input"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            placeholder="Your phone number"
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                        <label>Default Address</label>
                                        <textarea
                                            className="input"
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            placeholder="Your default shipping address"
                                            rows={3}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? <span className="spinner spinner-sm" /> : 'Save Changes'}
                                    </button>
                                </form>
                            </>
                        )}

                        {activeTab === 'orders' && (
                            <>
                                <h2>My Orders</h2>
                                <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
                                    View and track your orders
                                </p>
                                <Link to="/orders" className="btn btn-primary">
                                    View All Orders <ChevronRight size={14} />
                                </Link>
                            </>
                        )}

                        {activeTab === 'password' && (
                            <>
                                <h2>Change Password</h2>
                                <form onSubmit={handlePasswordSubmit} id="change-password-form" style={{ maxWidth: 420 }}>
                                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                                        <label>Current Password</label>
                                        <input
                                            className="input"
                                            type="password"
                                            value={pwdForm.currentPassword}
                                            onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                                        <label>New Password</label>
                                        <input
                                            className="input"
                                            type="password"
                                            value={pwdForm.newPassword}
                                            onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                        <label>Confirm New Password</label>
                                        <input
                                            className="input"
                                            type="password"
                                            value={pwdForm.confirmPassword}
                                            onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? <span className="spinner spinner-sm" /> : 'Update Password'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
