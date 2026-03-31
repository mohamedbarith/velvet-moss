import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../stores/cartStore';
import useAuthStore from '../stores/authStore';
import API, { getImageUrl } from '../lib/api';
import '../styles/pages.css';

// Removed legacy Stripe and mock UPI forms. Razorpay handles both intrinsically.
function RazorpayForm({ orderId, totalAmount, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Fetch Razorpay Key
            const { data: keyData } = await API.get('/payments/razorpay-key');
            
            // Create Razorpay Order securely from backend
            const { data: orderData } = await API.post('/payments/create-razorpay-order', { orderId });
            
            if (!orderData.success) throw new Error(orderData.message);

            var options = {
                key: keyData.keyId,
                amount: orderData.amount,
                currency: "INR",
                name: "Velvet Moss",
                description: "Order #" + orderId,
                image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=100&h=100&fit=crop&q=80",
                order_id: orderData.razorpayOrderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await API.post('/payments/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: orderId
                        });

                        if (verifyRes.data.success) {
                            toast.success("Payment verified successfully!");
                            onSuccess();
                        } else {
                            toast.error(verifyRes.data.message || "Payment verification failed");
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || err.message || "Verification failed");
                    }
                },
                theme: { color: "#2C4A3B" }
            };

            if (window.Razorpay) {
                var rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response){
                    toast.error(response.error.description || "Payment failed");
                });
                rzp.open();
            } else {
                toast.error("Razorpay SDK failed to load. Please check your connection.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Something went wrong initializing payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handlePayment}>
            <div className="checkout-form-section">
                <h3><span className="step-number">3</span> Pay with Razorpay</h3>
                <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Click below to securely complete your payment with Razorpay.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                    <Lock size={12} />
                    Secure payment via Razorpay gateway
                </div>
            </div>
            <button
                id="pay-btn"
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
                style={{ marginTop: '1rem' }}
            >
                {loading ? <span className="spinner spinner-sm" /> : <><Lock size={16} /> Pay Now</>}
            </button>
        </form>
    );
}



export default function CheckoutPage() {
    const navigate = useNavigate();
    const { items, subtotal, shippingCost, tax, total, clearCart, gstRate, fetchSettings } = useCartStore();
    const { isLoggedIn, user, updateUser } = useAuthStore();
    const [step, setStep] = useState(1); // 1=address, 2=review, 3=payment
    const [orderId, setOrderId] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');

    // UI state for multiple addresses
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    const [address, setAddress] = useState({
        fullName: '', phone: '', street: '', city: '', state: '', pincode: '', country: 'India',
    });

    useEffect(() => {
        document.title = 'Checkout — Velvet Moss';
        fetchSettings();
        if (!isLoggedIn()) navigate('/login');
        if (items.length === 0) navigate('/cart');

        if (user) {
            if (user.addresses && user.addresses.length > 0) {
                // If the user has saved addresses, select the first one by default
                setSelectedAddressId(user.addresses[0].id);
                setShowNewAddressForm(false);
            } else {
                // No saved addresses, fall back to showing form and populating known fields
                setShowNewAddressForm(true);
                setAddress(prev => ({
                    ...prev,
                    fullName: user.name || prev.fullName,
                    phone: user.phone || prev.phone,
                }));
            }
        }
    }, [user]);

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        
        if (showNewAddressForm) {
            // Validate form
            const required = ['fullName', 'phone', 'street', 'city', 'state', 'pincode'];
            for (const field of required) {
                if (!address[field]) return toast.error(`Please fill in ${field}`);
            }

            try {
                // Determine API endpoint to call
                // Assuming `/api/auth/addresses` exists as per our new backend structure
                const response = await API.post('/auth/addresses', address);
                if (response.data.success) {
                    updateUser(response.data.user); // update zustand with new array
                    const newAddrArr = response.data.user.addresses;
                    if (newAddrArr && newAddrArr.length > 0) {
                        setSelectedAddressId(newAddrArr[newAddrArr.length - 1].id);
                    }
                    setShowNewAddressForm(false);
                    setStep(2);
                }
            } catch (err) {
                 toast.error(err.response?.data?.message || 'Failed to save new address');
            }
        } else {
            if (!selectedAddressId) return toast.error('Please select an address');
            setStep(2);
        }
    };

    const handleRemoveAddress = async (id) => {
        try {
            const response = await API.delete(`/auth/addresses/${id}`);
            if (response.data.success) {
                updateUser(response.data.user);
                toast.success('Address removed');
                if (selectedAddressId === id) {
                    setSelectedAddressId(null);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove address');
        }
    };

    const handleCreateOrder = async () => {
        setLoading(true);
        try {
            // Find selected address object to send to backend
            let finalAddress = null;
            if (showNewAddressForm) {
                finalAddress = address;
            } else {
                finalAddress = user?.addresses?.find(a => a.id === selectedAddressId);
            }

            if (!finalAddress) throw new Error("No address selected");

            const orderItems = items.map((i) => ({ product: i.id, quantity: i.quantity }));
            const { data } = await API.post('/orders', {
                items: orderItems,
                shippingAddress: finalAddress,
                paymentMethod: paymentMethod,
            });
            setOrderId(data.order.id);
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        clearCart();
        setSuccess(true);
    };

    if (success) {
        return (
            <div className="checkout-page">
                <div className="container">
                    <div className="text-center animate-scale-in" style={{ maxWidth: 500, margin: '5rem auto', padding: '3rem', background: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
                        <CheckCircle2 size={60} color="var(--clr-success)" style={{ margin: '0 auto 1rem' }} />
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Order Confirmed!</h1>
                        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
                            Thank you for your purchase! Your handmade goods are on their way.
                            You'll receive a confirmation email shortly.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/orders" className="btn btn-primary">View My Orders</Link>
                            <Link to="/products" className="btn btn-secondary">Continue Shopping</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=100&q=80';

    return (
        <div className="checkout-page">
            <div className="container">
                <h1 style={{ marginBottom: '2rem' }}>Checkout</h1>

                <div className="checkout-layout">
                    {/* Left Forms */}
                    <div>
                        {/* Step 1: Shipping Address */}
                        <div className="checkout-form-section" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}><span className="step-number">1</span> Shipping Address</h3>
                                {step === 1 && user?.addresses && user.addresses.length > 0 && !showNewAddressForm && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => setShowNewAddressForm(true)}>
                                        + New Address
                                    </button>
                                )}
                            </div>

                            {step === 1 ? (
                                <form onSubmit={handleAddressSubmit} id="checkout-address-form">
                                    
                                    {/* Exisitng Addresses List */}
                                    {!showNewAddressForm && user?.addresses && user.addresses.length > 0 && (
                                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                                            {user.addresses.map(addr => (
                                                <div 
                                                    key={addr.id} 
                                                    style={{ 
                                                        border: `2px solid ${selectedAddressId === addr.id ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                                                        borderRadius: 'var(--radius-md)',
                                                        padding: '1rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '1rem',
                                                        background: selectedAddressId === addr.id ? 'var(--clr-primary-light)' : 'transparent',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => setSelectedAddressId(addr.id)}
                                                >
                                                    <input 
                                                        type="radio" 
                                                        name="selectedAddress" 
                                                        checked={selectedAddressId === addr.id}
                                                        onChange={() => setSelectedAddressId(addr.id)}
                                                        style={{ marginTop: '4px', width: '16px', height: '16px', accentColor: 'var(--clr-primary)' }}
                                                    />
                                                    <div>
                                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{addr.fullName} ({addr.phone})</p>
                                                        <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                                                            {addr.street}, {addr.city}, {addr.state} - {addr.pincode}<br/>
                                                            {addr.country}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ color: 'var(--clr-danger)', marginLeft: 'auto', padding: '0.25rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveAddress(addr.id);
                                                        }}
                                                        title="Remove Address"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* New Address Form */}
                                    {showNewAddressForm && (
                                        <>
                                            {user?.addresses && user.addresses.length > 0 && (
                                                <button 
                                                    type="button" 
                                                    className="btn btn-ghost btn-sm" 
                                                    style={{ marginBottom: '1rem' }}
                                                    onClick={() => setShowNewAddressForm(false)}
                                                >
                                                    ← Back to saved addresses
                                                </button>
                                            )}
                                            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                                                <div className="input-group">
                                                    <label>Full Name</label>
                                                    <input className="input" placeholder="Your full name" value={address.fullName}
                                                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })} required />
                                                </div>
                                                <div className="input-group">
                                                    <label>Phone</label>
                                                    <input className="input" type="tel" placeholder="10-digit number" value={address.phone}
                                                        onChange={(e) => setAddress({ ...address, phone: e.target.value })} required />
                                                </div>
                                            </div>
                                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                                <label>Street Address</label>
                                                <input className="input" placeholder="House no., street, area" value={address.street}
                                                    onChange={(e) => setAddress({ ...address, street: e.target.value })} required />
                                            </div>
                                            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                                                <div className="input-group">
                                                    <label>City</label>
                                                    <input className="input" placeholder="City" value={address.city}
                                                        onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
                                                </div>
                                                <div className="input-group">
                                                    <label>State</label>
                                                    <input className="input" placeholder="State" value={address.state}
                                                        onChange={(e) => setAddress({ ...address, state: e.target.value })} required />
                                                </div>
                                            </div>
                                            <div className="form-grid-2">
                                                <div className="input-group">
                                                    <label>Pincode</label>
                                                    <input className="input" placeholder="6-digit pincode" value={address.pincode}
                                                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })} required />
                                                </div>
                                                <div className="input-group">
                                                    <label>Country</label>
                                                    <input className="input" value={address.country} readOnly style={{ background: 'var(--clr-cream)' }} />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1.25rem' }} id="address-next-btn">
                                        {showNewAddressForm ? 'Save Address & Continue →' : 'Continue to Review →'}
                                    </button>
                                </form>
                            ) : (
                                <div>
                                    {(() => {
                                        const finalAddr = showNewAddressForm ? address : user?.addresses?.find(a => a.id === selectedAddressId);
                                        return finalAddr ? (
                                            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--clr-text)' }}>
                                                {finalAddr.fullName}, {finalAddr.phone}<br />
                                                {finalAddr.street}, {finalAddr.city}, {finalAddr.state} – {finalAddr.pincode}<br />
                                                {finalAddr.country}
                                            </p>
                                        ) : null;
                                    })()}
                                    <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setStep(1)}>
                                        Change Address
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Review Order */}
                        {step >= 2 && (
                            <div className="checkout-form-section" style={{ marginBottom: '1.5rem' }}>
                                <h3><span className="step-number">2</span> Review Order</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>
                                    Review your items before payment
                                </p>
                                {items.map((item) => (
                                    <div key={item.id} className="checkout-item">
                                        <div className="checkout-item-img">
                                            <img src={item.images?.[0] ? getImageUrl(item.images[0]) : PLACEHOLDER_IMG} alt={item.name} style={{ objectPosition: item?.imagePosition || 'center' }} />
                                        </div>
                                        <div>
                                            <p className="checkout-item-name">{item.name}</p>
                                            <p className="checkout-item-qty">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="checkout-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                    </div>
                                ))}

                                <div style={{ marginBottom: '1.5rem', marginTop: '1.5rem', padding: '1.25rem', background: 'var(--clr-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Select Payment Method</h4>
                                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' }}>
                                        <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} style={{ width: 16, height: 16, marginRight: 10 }} />
                                        <span>Secure Online Payment (Razorpay, UPI, Cards)</span>
                                    </label>
                                </div>

                                {step === 2 && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ marginTop: '1rem' }}
                                        onClick={handleCreateOrder}
                                        disabled={loading}
                                        id="confirm-order-btn"
                                    >
                                        {loading ? <span className="spinner spinner-sm" /> : 'Confirm & Pay →'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && orderId && (
                            <>
                                {paymentMethod === 'razorpay' && (
                                    <RazorpayForm orderId={orderId} totalAmount={total()} onSuccess={handlePaymentSuccess} />
                                )}
                            </>
                        )}
                    </div>

                    {/* Right: Order Summary */}
                    <div className="checkout-order-summary">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h3>
                        <div className="checkout-items-list">
                            {items.map((item) => (
                                <div key={item.id} className="checkout-item">
                                    <div className="checkout-item-img">
                                        <img src={item.images?.[0] ? getImageUrl(item.images[0]) : PLACEHOLDER_IMG} alt={item.name} style={{ objectPosition: item?.imagePosition || 'center' }} />
                                    </div>
                                    <div>
                                        <p className="checkout-item-name">{item.name}</p>
                                        <p className="checkout-item-qty">× {item.quantity}</p>
                                    </div>
                                    <span className="checkout-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--clr-border-light)' }}>
                            <div className="summary-row"><span>Subtotal</span><span>₹{subtotal().toLocaleString('en-IN')}</span></div>
                            <div className="summary-row"><span>Shipping</span><span>{shippingCost() === 0 ? <span style={{ color: 'var(--clr-success)', fontWeight: 600 }}>FREE</span> : `₹${shippingCost()}`}</span></div>
                            <div className="summary-row"><span>GST ({gstRate}%)</span><span>₹{tax().toLocaleString('en-IN')}</span></div>
                            <div className="summary-row total"><span>Total</span><span>₹{total().toLocaleString('en-IN')}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
