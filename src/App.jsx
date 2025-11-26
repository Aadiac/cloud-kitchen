import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Plus, Minus, Trash2, ChefHat, MapPin, Phone, CheckCircle, 
  XCircle, Clock, Menu, Home, LogOut, User, Loader, Search, ArrowRight, 
  Eye, EyeOff, Calendar, Mail, FileText, Moon, Sun, ToggleLeft, ToggleRight, 
  Navigation, Star, Filter, X, TrendingUp, Bell, Bike, Utensils, Coffee, Pizza
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDnkS3ehdIRb1A5efBOJSb4D9fmYaRACQc",
  authDomain: "cloud-kitchen-4a032.firebaseapp.com",
  projectId: "cloud-kitchen-4a032",
  storageBucket: "cloud-kitchen-4a032.firebasestorage.app",
  messagingSenderId: "838817708772",
  appId: "1:838817708772:web:5a248231a4a82e3c650af1",
  measurementId: "G-P92TYQ4D0S"
};

// Initialize Firebase safely
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Init Error:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const MENU_PATH = 'menu_items'; 
const ORDERS_PATH = 'orders'; 
const ADMIN_EMAIL = "admin@kitchen.com";

// --- Helper Components ---

const DoodleLoader = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F6] transition-opacity duration-500">
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none flex flex-wrap justify-center items-center gap-16 p-10">
       <Pizza size={64} className="text-[#A0522D] animate-bounce" style={{ animationDuration: '3s' }} />
       <ChefHat size={64} className="text-[#2D8F5F] animate-pulse" style={{ animationDuration: '2s' }} />
       <Coffee size={56} className="text-[#A0522D] animate-bounce" style={{ animationDuration: '2.5s' }} />
       <Utensils size={72} className="text-[#2D8F5F] animate-pulse" style={{ animationDuration: '3s' }} />
    </div>
    <div className="relative z-10 text-center">
      <div className="w-24 h-24 bg-[#2D8F5F] rounded-full flex items-center justify-center shadow-2xl mb-6 mx-auto animate-pulse border-4 border-[#FAF9F6]">
        <ChefHat className="text-[#FAF9F6]" size={48} />
      </div>
      <h1 className="text-4xl font-black text-[#2D8F5F] tracking-tight drop-shadow-sm">CloudKitchen</h1>
      <div className="h-1 w-16 bg-[#A0522D] mx-auto my-3 rounded-full"></div>
      <p className="text-[#A0522D] font-bold text-xs tracking-widest uppercase">Fresh • Fast • Tasty</p>
    </div>
  </div>
);

const ErrorFallback = ({ error }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-red-50 text-center">
    <XCircle className="text-red-500 mb-4" size={48} />
    <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
    <p className="text-sm text-red-600 max-w-md break-words bg-white p-4 rounded shadow border border-red-100 mb-6">
      {error?.message || "Unknown Error"}
    </p>
    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-full font-bold shadow hover:bg-red-700 transition">Reload Page</button>
  </div>
);

const ShimmerCard = () => (
  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-4 animate-pulse">
    <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
    <div className="flex-1 space-y-3 py-1">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-8 bg-gray-200 rounded w-20 mt-2"></div>
    </div>
  </div>
);

// UPDATED: Now accepts cart and updateQuantity to allow adding from the modal
const FoodDetailModal = ({ item, onClose, cart, updateQuantity }) => {
  if (!item) return null;
  const qty = cart.find(c => c.id === item.id)?.qty || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-[#FAF9F6] dark:bg-[#2a2a2a] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all hover:scale-105 duration-500" style={{ perspective: '1000px' }}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full text-gray-800 hover:bg-white shadow-lg active:scale-90 transition"><X size={20}/></button>
        <div className="h-64 overflow-hidden relative">
          <img src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" alt={item.name || "Food"} />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{item.name}</h2>
            <div className={`flex items-center justify-center w-6 h-6 border-2 rounded-sm ${item.type === 'veg' ? 'border-green-600' : 'border-red-600'}`}>
              <div className={`w-3 h-3 rounded-full ${item.type === 'veg' ? 'bg-green-600' : 'bg-red-600'}`}></div>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-4">
            <Star size={16} className="fill-yellow-400 text-yellow-400"/>
            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{item.rating || 4.5}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">{item.description}</p>
          
          <div className="flex justify-between items-center">
            <div className="text-3xl font-extrabold text-[#2D8F5F]">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price || 0)}
            </div>
            
            {/* Add Button inside Modal */}
            {qty === 0 ? (
                <button onClick={() => updateQuantity(item, 1)} className="bg-[#2D8F5F] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-[#24734d] transition active:scale-95">
                    ADD
                </button>
            ) : (
                <div className="flex items-center gap-4 bg-[#2D8F5F] text-white rounded-lg px-3 py-2 shadow-lg">
                    <button onClick={() => updateQuantity(item, -1)} className="hover:bg-white/20 rounded p-1"><Minus size={20}/></button>
                    <span className="font-bold text-lg w-6 text-center">{qty}</span>
                    <button onClick={() => updateQuantity(item, 1)} className="hover:bg-white/20 rounded p-1"><Plus size={20}/></button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CAROUSEL_ITEMS = [
  { id: 1, title: "Kerala Meals", sub: "Authentic Taste", img: "https://img.sanishtech.com/u/07185d20881b009c84cc098902cd1ffb.png" },
  { id: 2, title: "Spicy Maggi", sub: "Midnight Craving", img: "https://img.sanishtech.com/u/d98b00fd3b59424381b78606a24f8938.png" },
  { id: 3, title: "Porotta & Beef", sub: "Chef's Special", img: "https://img.sanishtech.com/u/3958d1f749d7261eefa07006160cf0ae.png" }
];

export default function CloudKitchenPremium() {
  const [appError, setAppError] = useState(null);
  try {
    if (appError) return <ErrorFallback error={appError} />;
    return <MainApp setAppError={setAppError} />;
  } catch (err) {
    return <ErrorFallback error={err} />;
  }
}

function MainApp({ setAppError }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('menu'); 
  
  const [menu, setMenu] = useState([]);
  
  // UPDATED: Initialize cart from localStorage if available
  const [cart, setCart] = useState(() => {
    try {
        const saved = localStorage.getItem('cloudKitchenCart');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [orders, setOrders] = useState([]);
  const [userOrder, setUserOrder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [showCartSheet, setShowCartSheet] = useState(false); 

  const [filterType, setFilterType] = useState('all'); 
  const [sortType, setSortType] = useState('default'); 

  const [trackEmail, setTrackEmail] = useState(''); 
  const [checkoutInfo, setCheckoutInfo] = useState({ 
    phone: '', email: '', deliveryDate: '', deliveryTime: '', instructions: '' 
  });
  // DEFAULTS: Bengaluru and Kodichikanahalli
  const [addrDetails, setAddrDetails] = useState({ 
    flat: '', street: 'Kodichikanahalli', landmark: '', city: 'Bengaluru' 
  });
  const [attachGps, setAttachGps] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', image: '', category: 'Main', type: 'veg', rating: '4.5', available: true });
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const cartIconRef = useRef(null);

  // --- Effects ---
  
  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('cloudKitchenCart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) {}
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        setCurrentView('admin-orders');
      } else {
        setIsAdmin(false);
        if (['admin-orders', 'admin-menu'].includes(currentView)) setCurrentView('menu');
      }
      setTimeout(() => setLoading(false), 2000);
    });

    const menuRef = collection(db, 'artifacts', appId, 'public', 'data', MENU_PATH);
    const unsubMenu = onSnapshot(menuRef, (snap) => {
      const menuData = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => item.name && item.price !== undefined);
      setMenu(menuData);
    }, (err) => console.error("Menu Error:", err));

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try { Notification.requestPermission(); } catch(e) {}
    }

    return () => { unsubscribe(); unsubMenu(); };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', ORDERS_PATH);
    return onSnapshot(ordersRef, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(data ? data.sort((a, b) => b.createdAt - a.createdAt) : []);
    });
  }, [isAdmin]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % CAROUSEL_ITEMS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // --- Logic ---
  const formatPrice = (p) => {
    if (p === undefined || p === null || isNaN(p)) return '₹0';
    try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(p); } catch (e) { return '₹' + p; }
  };

  const trackOrder = (emailOverride) => {
    const emailToSearch = typeof emailOverride === 'string' ? emailOverride : trackEmail;
    if (!emailToSearch || !emailToSearch.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', ORDERS_PATH);
    onSnapshot(ordersRef, (snap) => {
      const allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const myOrders = allData.filter(o => o.userEmail && o.userEmail.toLowerCase() === emailToSearch.toLowerCase()).sort((a, b) => b.createdAt - a.createdAt);
      if (myOrders.length > 0) setUserOrder(myOrders[0]);
      else { setUserOrder(null); alert("No active orders found."); }
    });
  };

  const updateQuantity = (item, delta) => {
    setCart(prevCart => {
      const existing = prevCart.find(c => c.id === item.id);
      let newCart;
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) newCart = prevCart.filter(c => c.id !== item.id);
        else newCart = prevCart.map(c => c.id === item.id ? { ...c, qty: newQty } : c);
      } else if (delta > 0) {
        newCart = [...prevCart, { ...item, qty: 1 }];
      } else {
        return prevCart;
      }
      if (cartIconRef.current && delta > 0) {
        cartIconRef.current.classList.add('animate-bounce');
        setTimeout(() => cartIconRef.current?.classList.remove('animate-bounce'), 500);
      }
      return newCart;
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const cleanEmail = checkoutInfo.email.trim();
    
    // VALIDATION - STRICT CHECKS
    if (!cleanEmail.includes('@')) { alert("Valid Email is mandatory."); return; }
    if (!checkoutInfo.phone || checkoutInfo.phone.length < 10) { alert("Valid Phone number is mandatory."); return; }
    if (!addrDetails.flat) { alert("Flat / House No is mandatory."); return; }
    if (!addrDetails.street) { alert("Street is mandatory."); return; }
    if (!addrDetails.city) { alert("City is mandatory."); return; }
    if (!checkoutInfo.deliveryDate || !checkoutInfo.deliveryTime) { alert("Delivery Date and Time are mandatory."); return; }
    
    const shortId = Math.floor(1000 + Math.random() * 9000).toString();
    const fullAddress = `Flat: ${addrDetails.flat}, ${addrDetails.street}, ${addrDetails.landmark}, ${addrDetails.city}`;
    const total = cart.reduce((s, i) => s + ((i.price||0) * i.qty), 0);

    try {
      const newOrder = {
        shortId, items: cart, total, address: fullAddress, gps: gpsCoords,
        customerPhone: checkoutInfo.phone, userEmail: cleanEmail,
        deliveryDate: checkoutInfo.deliveryDate, deliveryTime: checkoutInfo.deliveryTime,
        instructions: checkoutInfo.instructions, status: 'Pending',
        createdAt: Date.now(), dateString: new Date().toLocaleString()
      };
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', ORDERS_PATH), newOrder);
      setUserOrder({ ...newOrder, id: docRef.id });
      setCart([]);
      localStorage.removeItem('cloudKitchenCart'); // Clear cart from local storage on success
      setShowCartSheet(false);
      setTrackEmail(cleanEmail);
      setCurrentView('track');
      setTimeout(() => trackOrder(cleanEmail), 1500);
    } catch (err) { alert("Order Failed: " + err.message); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', MENU_PATH), {
      ...newItem, price: parseFloat(newItem.price) || 0, rating: parseFloat(newItem.rating) || 4.5,
      createdAt: Date.now(), available: true, image: newItem.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
    });
    setNewItem({ name: '', price: '', description: '', image: '', category: 'Main', type: 'veg', rating: '4.5', available: true });
  };

  const toggleAvailability = async (item) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', MENU_PATH, item.id), { available: !item.available });
  };

  const getFilteredMenu = () => {
    let filtered = (menu || []).filter(i => i && i.available);
    if (selectedCategory !== 'All') filtered = filtered.filter(i => i.category === selectedCategory);
    if (searchTerm) filtered = filtered.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterType !== 'all') filtered = filtered.filter(i => i.type === filterType);
    if (sortType === 'price-asc') filtered.sort((a,b) => (a.price||0) - (b.price||0));
    if (sortType === 'price-desc') filtered.sort((a,b) => (b.price||0) - (a.price||0));
    if (sortType === 'rating') filtered.sort((a,b) => (b.rating||0) - (a.rating||0));
    return filtered;
  };

  const calculateEarnings = () => {
    return (orders || []).filter(o => o.status !== 'Denied').reduce((sum, o) => sum + (o.total || 0), 0);
  };

  const generateWhatsApp = (order) => {
    const itemsList = (order.items || []).map(i => `- ${i.name} (x${i.qty})`).join('\n');
    const orderId = order.shortId || (order.id ? order.id.slice(-4) : 'XXXX');
    const text = `*Order #${orderId} Update* \n\nHello! Your order is *${order.status}*.\nDelivery: ${order.deliveryDate} @ ${order.deliveryTime}\n\n*Items:*\n${itemsList}\n\n*Total: ${formatPrice(order.total)}*\n\nInstructions: ${order.instructions || 'None'}\n\nThank you for ordering!`;
    return `https://wa.me/${order.customerPhone}?text=${encodeURIComponent(text)}`;
  };

  const generateEmailLink = (order) => {
    const orderId = order.shortId || (order.id ? order.id.slice(-4) : 'XXXX');
    const subject = `Order #${orderId} Update - CloudKitchen`;
    const itemsList = (order.items || []).map(i => `${i.name} (x${i.qty}) - ${formatPrice(i.price * i.qty)}`).join('\n');
    const body = `Hello,\n\nYour order #${orderId} is now ${order.status}.\n\nDelivery: ${order.deliveryDate} at ${order.deliveryTime}\n\nItems:\n${itemsList}\n\nTotal Price: ${formatPrice(order.total)}\n\nInstructions: ${order.instructions || "None"}\n\nThank you for ordering with us!`;
    return `mailto:${order.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (firebaseConfig.apiKey === "YOUR_API_KEY") { setLoginError("CONFIG ERROR"); return; }
    try { await signInWithEmailAndPassword(auth, adminCreds.email, adminCreds.password); } catch (err) { setLoginError("Login Failed: " + err.message); }
  };

  const handleGpsCheck = (e) => {
    if (e.target.checked) {
      setAttachGps(true); setIsLocating(true);
      if (!navigator.geolocation) { alert("GPS not supported"); setIsLocating(false); setAttachGps(false); return; }
      navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            if(data.address) {
              setAddrDetails(prev => ({ ...prev, street: data.address.road || prev.street, city: data.address.city || prev.city, landmark: data.address.suburb || prev.landmark }));
            }
          } catch(err) {}
          setIsLocating(false);
        }, () => { alert("GPS failed."); setIsLocating(false); setAttachGps(false); }, { enableHighAccuracy: true }
      );
    } else { setAttachGps(false); setGpsCoords(null); }
  };

  if (loading) return <DoodleLoader />;

  // --- VIEWS ---

  if (currentView === 'admin-login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6]">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold text-[#2D8F5F] mb-6">Admin Login</h2>
          {loginError && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{loginError}</div>}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-3 border rounded" value={adminCreds.email} onChange={e=>setAdminCreds({...adminCreds, email:e.target.value})}/>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-3 border rounded pr-10" value={adminCreds.password} onChange={e=>setAdminCreds({...adminCreds, password:e.target.value})}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={18}/></button>
            </div>
            <button className="w-full bg-[#2D8F5F] text-white p-3 rounded font-bold">Login</button>
          </form>
          <button onClick={() => setCurrentView('menu')} className="w-full mt-4 text-sm text-[#2D8F5F] font-bold">Back to Menu</button>
        </div>
      </div>
    );
  }

  if (currentView === 'admin-orders' || currentView === 'admin-menu') {
    return (
      <div className={`min-h-screen p-4 md:p-8 ${darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-[#FAF9F6]'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2 text-[#2D8F5F]"><ChefHat/> Admin Panel</h1>
            <div className="flex bg-white dark:bg-[#333] p-1 rounded-lg shadow-sm">
                <button onClick={() => setCurrentView('admin-orders')} className={`px-6 py-2 rounded-md font-bold text-sm ${currentView === 'admin-orders' ? 'bg-[#2D8F5F] text-white' : 'text-gray-500'}`}>Live Orders</button>
                <button onClick={() => setCurrentView('admin-menu')} className={`px-6 py-2 rounded-md font-bold text-sm ${currentView === 'admin-menu' ? 'bg-[#2D8F5F] text-white' : 'text-gray-500'}`}>Menu Manager</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white rounded-full text-black"><Moon size={20}/></button>
              <button onClick={() => {signOut(auth); setIsAdmin(false); setCurrentView('menu');}} className="bg-gray-200 text-black px-4 py-2 rounded font-bold">Logout</button>
            </div>
          </div>

          {currentView === 'admin-orders' && (
            <div className="space-y-6">
                <div className="bg-[#2D8F5F] text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                    <div><p className="opacity-80 text-sm font-bold uppercase">Total Revenue</p><h2 className="text-4xl font-bold mt-1">{formatPrice(calculateEarnings())}</h2></div>
                    <TrendingUp size={32}/>
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                    {orders.length === 0 ? <p className="text-gray-500">No active orders.</p> : orders.map(o => (
                        <div key={o.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-black relative">
                        <div className="flex justify-between mb-2 pr-8">
                            <span className="font-bold text-[#2D8F5F]">#{o.shortId || (o.id ? o.id.slice(-4) : '...')}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${o.status==='Pending'?'bg-yellow-100 text-yellow-800':o.status==='Accepted'?'bg-green-100 text-green-800':o.status==='Delivered'?'bg-blue-100 text-blue-800':'bg-red-100 text-red-800'}`}>{o.status}</span>
                        </div>
                        <button onClick={() => deleteDoc(doc(db,'artifacts',appId,'public','data',ORDERS_PATH,o.id))} className="absolute top-4 right-4 text-red-400"><Trash2 size={18}/></button>
                        <div className="mb-3 border-b border-dashed pb-2">
                            {(o.items||[]).map((i,idx) => (<div key={idx} className="flex justify-between text-sm"><span>{i.qty}x {i.name}</span><span>{formatPrice(i.price*i.qty)}</span></div>))}
                            <div className="mt-2 pt-2 flex justify-between font-bold text-[#2D8F5F]"><span>Total</span><span>{formatPrice(o.total)}</span></div>
                        </div>
                        <div className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded space-y-1">
                            <p className="flex items-center gap-2"><User size={14}/> {o.userEmail}</p>
                            <p className="flex items-center gap-2"><Phone size={14}/> {o.customerPhone}</p>
                            <p className="flex items-center gap-2"><Calendar size={14}/> {o.deliveryDate} @ {o.deliveryTime}</p>
                            <p className="flex items-start gap-2 mt-2"><MapPin size={14} className="mt-1"/> <span className="whitespace-pre-wrap">{o.address}</span></p>
                            {o.gps && <a href={`https://maps.google.com/?q=${o.gps?.lat},${o.gps?.lng}`} target="_blank" className="text-blue-500 underline text-xs">GPS Location</a>}
                        </div>
                        <div className="flex gap-2">
                            {o.status === 'Pending' ? (
                                <><button onClick={()=>updateDoc(doc(db,'artifacts',appId,'public','data',ORDERS_PATH,o.id),{status:'Accepted'})} className="flex-1 bg-[#2D8F5F] text-white py-2 rounded">Accept</button>
                                <button onClick={()=>updateDoc(doc(db,'artifacts',appId,'public','data',ORDERS_PATH,o.id),{status:'Denied'})} className="flex-1 bg-red-100 text-red-600 py-2 rounded">Deny</button></>
                            ) : (
                                <>
                                <a href={generateWhatsApp(o)} target="_blank" className="flex-1 bg-green-500 text-white py-2 rounded flex justify-center gap-2"><CheckCircle size={16}/> WhatsApp</a>
                                <a href={generateEmailLink(o)} className="flex-1 bg-blue-500 text-white py-2 rounded flex justify-center gap-2"><Mail size={16}/> Email</a>
                                {o.status === 'Accepted' && <button onClick={()=>updateDoc(doc(db,'artifacts',appId,'public','data',ORDERS_PATH,o.id),{status:'Delivered'})} className="flex-1 bg-black text-white py-2 rounded flex justify-center gap-2"><Bike size={16}/> Delivered</button>}
                                </>
                            )}
                        </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {currentView === 'admin-menu' && (
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm text-black h-fit sticky top-4">
                <h3 className="font-bold mb-4">Add Item</h3>
                <form onSubmit={handleAddItem} className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="Name" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})}/>
                    <div className="grid grid-cols-2 gap-2">
                    <input className="w-full p-2 border rounded" type="number" placeholder="Price" value={newItem.price} onChange={e=>setNewItem({...newItem, price:e.target.value})}/>
                    <input className="w-full p-2 border rounded" placeholder="Rating" value={newItem.rating} onChange={e=>setNewItem({...newItem, rating:e.target.value})}/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                    <select className="w-full p-2 border rounded" value={newItem.category} onChange={e=>setNewItem({...newItem, category:e.target.value})}>
                        <option>Main</option><option>Snack</option><option>Drink</option><option>Dessert</option>
                    </select>
                    <select className="w-full p-2 border rounded" value={newItem.type} onChange={e=>setNewItem({...newItem, type:e.target.value})}>
                        <option value="veg">Veg</option><option value="non-veg">Non-Veg</option>
                    </select>
                    </div>
                    <input className="w-full p-2 border rounded" placeholder="Description" value={newItem.description} onChange={e=>setNewItem({...newItem, description:e.target.value})}/>
                    <input className="w-full p-2 border rounded" placeholder="Image URL" value={newItem.image} onChange={e=>setNewItem({...newItem, image:e.target.value})}/>
                    <button className="w-full bg-[#2D8F5F] text-white py-2 rounded font-bold">Add</button>
                </form>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm text-black">
                    <h3 className="font-bold mb-4 text-xl text-[#2D8F5F]">Current Menu</h3>
                    <div className="space-y-2">
                        {menu.map(m => (
                        <div key={m.id} className={`flex justify-between items-center p-3 border-b last:border-0 ${!m.available ? 'opacity-50 bg-gray-50' : ''}`}>
                            <div className="flex items-center gap-3">
                            <img src={m.image} className="w-12 h-12 rounded-lg object-cover" />
                            <div><p className="font-bold text-sm">{m.name}</p><p className="text-xs">{formatPrice(m.price)}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                            <button onClick={() => toggleAvailability(m)}>{m.available ? <ToggleRight className="text-green-500" size={28}/> : <ToggleLeft className="text-gray-400" size={28}/>}</button>
                            <button onClick={() => deleteDoc(doc(db,'artifacts',appId,'public','data',MENU_PATH,m.id))} className="text-red-400"><Trash2 size={18}/></button>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- USER MENU ---
  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-[#FAF9F6] text-[#333333]'}`}>
      <div className={`sticky top-0 z-30 px-4 py-3 flex justify-between items-center shadow-sm ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('menu')}>
          <ChefHat className="text-[#2D8F5F]" size={24}/>
          <span className="font-extrabold text-lg">CloudKitchen</span>
        </div>
        <div className="flex items-center gap-4">
           <div className={`flex items-center transition-all ${isSearchOpen ? 'w-40 bg-gray-100 dark:bg-[#333] rounded-full px-3 py-1' : 'w-8'}`}>
             <Search size={20} className="cursor-pointer" onClick={() => setIsSearchOpen(!isSearchOpen)}/>
             {isSearchOpen && <input autoFocus placeholder="Search..." className="bg-transparent border-none outline-none ml-2 w-full text-sm text-black dark:text-white" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>}
           </div>
           <button onClick={() => setDarkMode(!darkMode)}><Moon size={20}/></button>
           <div className="relative cursor-pointer" onClick={() => setShowCartSheet(true)}>
             <ShoppingBag />
             {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{cart.length}</span>}
           </div>
           <button onClick={() => setCurrentView('admin-login')} className="text-xs font-bold border px-2 py-1 rounded">Admin</button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        {currentView === 'menu' && (
          <div className="space-y-6">
            <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl">
              {CAROUSEL_ITEMS.map((slide, idx) => (
                <div key={slide.id} className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={slide.img} className="w-full h-full object-cover" alt={slide.title}/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6 text-white">
                    <h2 className="text-3xl font-bold">{slide.title}</h2>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {['All', 'Main', 'Snack', 'Drink', 'Dessert'].map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap ${selectedCategory === cat ? 'bg-[#2D8F5F] text-white' : 'bg-white text-gray-600 border'}`}>{cat}</button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button onClick={() => setFilterType(filterType === 'veg' ? 'all' : 'veg')} className={`p-2 rounded-lg border ${filterType === 'veg' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}><div className="w-3 h-3 bg-green-600 rounded-full"></div></button>
                <button onClick={() => setFilterType(filterType === 'non-veg' ? 'all' : 'non-veg')} className={`p-2 rounded-lg border ${filterType === 'non-veg' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}><div className="w-3 h-3 bg-red-600 rounded-full"></div></button>
              </div>
              <select className={`text-sm p-2 rounded-lg border bg-transparent ${darkMode ? 'border-[#444]' : 'border-gray-200'}`} value={sortType} onChange={(e) => setSortType(e.target.value)}>
                <option value="default">Sort By</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            <div className="space-y-4">
              {menu.length === 0 && <ShimmerCard/>}
              {getFilteredMenu().map(item => {
                const qty = cart.find(c => c.id === item.id)?.qty || 0;
                return (
                  <div key={item.id} className={`p-3 rounded-xl shadow-sm border flex gap-4 items-center ${darkMode ? 'bg-[#2a2a2a] border-[#333]' : 'bg-white border-gray-100'}`}>
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0" onClick={() => setSelectedItem(item)}>
                      <img src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" alt={item.name}/>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <div>
                          <h3 className="font-bold">{item.name}</h3>
                          <div className="flex items-center gap-1 text-xs mt-1"><Star size={10} className="text-yellow-500 fill-yellow-500"/> {item.rating}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[#2D8F5F] font-bold">{formatPrice(item.price)}</span>
                          <div className={`w-3 h-3 rounded-full border mt-1 ${item.type==='veg'?'border-green-600 bg-green-600':'border-red-600 bg-red-600'}`}></div>
                        </div>
                      </div>
                      <p className="text-xs opacity-60 mb-3 line-clamp-2">{item.description}</p>
                      
                      {qty === 0 ? (
                        <button onClick={() => updateQuantity(item, 1)} className="bg-white text-[#2D8F5F] border border-[#2D8F5F] px-6 py-2 rounded-lg text-sm font-extrabold shadow-sm uppercase tracking-wide hover:bg-[#2D8F5F] hover:text-white transition-colors active:scale-95">
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 bg-[#2D8F5F] text-white rounded-lg px-2 py-1 w-max shadow-lg shadow-green-200/50">
                          <button onClick={() => updateQuantity(item, -1)} className="p-1 hover:bg-white/20 rounded active:scale-95 transition"><Minus size={16}/></button>
                          <span className="font-bold w-4 text-center">{qty}</span>
                          <button onClick={() => updateQuantity(item, 1)} className="p-1 hover:bg-white/20 rounded active:scale-95 transition"><Plus size={16}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'track' && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Track Order</h2>
            {!userOrder ? (
              <div className="flex gap-2">
                <input className="flex-1 p-3 border rounded text-black" placeholder="Email" value={trackEmail} onChange={e=>setTrackEmail(e.target.value)}/>
                <button onClick={() => trackOrder()} className="bg-[#2D8F5F] text-white px-6 rounded font-bold">Find</button>
              </div>
            ) : (
              <div className="bg-white text-black p-6 rounded-xl shadow border-t-4 border-[#2D8F5F]">
                <h3 className="text-2xl font-bold text-[#2D8F5F] mb-2">{userOrder.status}</h3>
                <p>Order #{userOrder.shortId}</p>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-bold"><span>Total</span><span>{formatPrice(userOrder.total)}</span></div>
                </div>
              </div>
            )}
            <button onClick={() => setCurrentView('menu')} className="text-[#2D8F5F] font-bold mt-4">Back to Menu</button>
          </div>
        )}

        {showCartSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowCartSheet(false)}>
            <div className={`w-full max-w-xl p-6 rounded-t-3xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">Checkout</h2>
              {cart.length === 0 ? (
                <p className="text-center py-10 opacity-50">Cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                      <div><p className="font-bold">{item.name}</p><p className="text-xs opacity-60">{formatPrice(item.price * item.qty)}</p></div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item, -1)}><Minus size={16}/></button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQuantity(item, 1)}><Plus size={16}/></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-xl text-[#2D8F5F]"><span>Total</span><span>{formatPrice(cart.reduce((s, i) => s + ((i.price||0) * i.qty), 0))}</span></div>
                  
                  <div className="space-y-3 pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-xs mb-1 font-semibold">Date</label>
                        <input type="date" className="w-full p-3 border rounded text-black" onChange={e=>setCheckoutInfo({...checkoutInfo, deliveryDate:e.target.value})}/>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs mb-1 font-semibold">Time</label>
                        <input type="time" className="w-full p-3 border rounded text-black" onChange={e=>setCheckoutInfo({...checkoutInfo, deliveryTime:e.target.value})}/>
                      </div>
                    </div>
                    <input placeholder="Email (Mandatory)" className="w-full p-3 border rounded text-black" onChange={e=>setCheckoutInfo({...checkoutInfo, email:e.target.value})}/>
                    <input placeholder="Phone" className="w-full p-3 border rounded text-black" onChange={e=>setCheckoutInfo({...checkoutInfo, phone:e.target.value})}/>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          type="checkbox" 
                          id="gps-toggle"
                          checked={attachGps} 
                          onChange={handleGpsCheck}
                          className="w-4 h-4 accent-[#2D8F5F]"
                        />
                        <label htmlFor="gps-toggle" className="text-xs font-bold text-[#2D8F5F] cursor-pointer">
                          {isLocating ? 'Locating...' : 'Use Current Location (GPS)'}
                        </label>
                      </div>
                      <input placeholder="Flat / House No" className="w-full p-3 border rounded text-black" value={addrDetails.flat} onChange={e=>setAddrDetails({...addrDetails, flat:e.target.value})}/>
                      <input placeholder="Street" className="w-full p-3 border rounded text-black" value={addrDetails.street} onChange={e=>setAddrDetails({...addrDetails, street:e.target.value})}/>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Landmark" className="p-3 border rounded text-black" onChange={e=>setAddrDetails({...addrDetails, landmark:e.target.value})}/>
                        <input placeholder="City" className="p-3 border rounded text-black" value={addrDetails.city} onChange={e=>setAddrDetails({...addrDetails, city:e.target.value})}/>
                      </div>
                    </div>
                    <textarea placeholder="Cooking Instructions" rows="2" className="w-full p-3 border rounded text-black" onChange={e=>setCheckoutInfo({...checkoutInfo, instructions:e.target.value})}/>
                    
                    <button onClick={placeOrder} className="w-full bg-[#2D8F5F] text-white py-4 rounded-xl font-bold text-lg mt-4">Confirm Order</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <FoodDetailModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)}
            cart={cart}
            updateQuantity={updateQuantity}
        />
      </div>
    </div>
  );
}