import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../lib/api';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/contact', form);
            toast.success('Message sent! We\'ll get back to you soon 🌿');
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '3rem 0 5rem' }}>
            <div className="container">
                {/* Header */}
                <div className="section-title" style={{ marginBottom: '3rem' }}>
                    <span className="overline">Get In Touch</span>
                    <h1>Contact Us</h1>
                    <p>Have a question about an order or a product? Our support team is here to help.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem', alignItems: 'start' }}>
                    {/* Info */}
                    <div>
                        <div style={{ background: 'var(--gradient-hero)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: '#fff', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Talk to us</h3>
                            {[
                                { icon: <Mail size={18} />, label: 'Email', val: 'hello@velvetmoss.in' },
                                { icon: <Phone size={18} />, label: 'Phone', val: '+91 98765 43210' },
                                { icon: <MapPin size={18} />, label: 'Location', val: 'Mumbai, India' },
                                { icon: <Clock size={18} />, label: 'Working Hours', val: 'Mon–Sat: 10 AM – 6 PM IST' },
                            ].map((item) => (
                                <div key={item.label} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.6rem', color: 'var(--clr-clay-light)' }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)', marginBottom: '0.2rem' }}>{item.label}</p>
                                        <p style={{ color: '#fff', fontWeight: 500 }}>{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                            <h4 style={{ marginBottom: '0.75rem' }}>Frequently Asked</h4>
                            {[
                                'How long does shipping take?',
                                'Can I return a handmade product?',
                                'Do you ship internationally?',
                                'How do I track my order?',
                            ].map((q) => (
                                <div key={q} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--clr-border-light)', fontSize: '0.875rem', color: 'var(--clr-moss)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {q} <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>→</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form */}
                    <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Send a Message</h3>
                        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            We usually respond within 24 hours on working days.
                        </p>

                        <form onSubmit={handleSubmit} id="contact-form">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="input-group">
                                    <label>Your Name</label>
                                    <input className="input" placeholder="Full name" value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>Email</label>
                                    <input className="input" type="email" placeholder="you@example.com" value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                </div>
                            </div>
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>Subject</label>
                                <input className="input" placeholder="What's this about?" value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                            </div>
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Message</label>
                                <textarea className="input" rows={5} placeholder="Tell us more..." value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} id="contact-submit-btn">
                                {loading ? <span className="spinner spinner-sm" /> : <><Send size={16} /> Send Message</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
