import { useState, useRef, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAGE4HYkV7FYPVeqMRr0v8xcA7WKvMakSA",
  authDomain: "masrati-store-5d794.firebaseapp.com",
  projectId: "masrati-store-5d794",
  storageBucket: "masrati-store-5d794.firebasestorage.app",
  messagingSenderId: "935344749483",
  appId: "1:935344749483:web:70dda404ef247fd79630ee"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const WHATSAPP_NUMBER = "9647815633866";
const ADMIN_PASSWORD = "masrati2025";

const defaultProducts = [
  { name: "عطر لوكشري الفاخر", price: 299, category: "عطور", image: null, colors: ["#f5c6d0", "#c9a96e", "#2c2c2c"], sizes: ["30ml", "50ml", "100ml"], description: "عطر فاخر بمسك وورد الطائف" },
  { name: "حقيبة يد كلاسيكية", price: 450, category: "حقائب", image: null, colors: ["#f2c4b0", "#c9a96e", "#1a1a1a"], sizes: ["S", "M", "L"], description: "حقيبة جلدية فاخرة بتصميم أنيق" },
  { name: "طقم مجوهرات ذهبي", price: 850, category: "اكسسوارات", image: null, colors: ["#c9a96e", "#e8e8e8", "#f5c6d0"], sizes: ["XS", "S", "M", "L"], description: "طقم ذهبي فاخر للمناسبات الخاصة" },
  { name: "ساعة فضية راقية", price: 650, category: "اكسسوارات", image: null, colors: ["#e8e8e8", "#c9a96e", "#1a1a1a"], sizes: ["قياس واحد"], description: "ساعة أنيقة بحزام جلدي فاخر" },
];

const categories = ["الكل", "عطور", "حقائب", "اكسسوارات"];

function AdminLoginModal({ onSuccess, onClose }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (pass === ADMIN_PASSWORD) { onSuccess(); }
    else { setError(true); setShake(true); setTimeout(() => setShake(false), 500); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className={`login-panel ${shake ? "shake" : ""}`} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: "linear-gradient(135deg,#00803c,#005a2b)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 30, boxShadow: "0 4px 20px rgba(0,128,60,0.4)" }}>🔐</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>لوحة المدير</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>أدخل كلمة السر للمتابعة</div>
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <input className="form-input" type={showPass ? "text" : "password"} placeholder="كلمة السر"
            value={pass} onChange={e => { setPass(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ border: error ? "2px solid #e55" : "2px solid #333", paddingLeft: 44, fontSize: 16, letterSpacing: showPass ? 0 : 4, background: "#1e1e1e", color: "#fff" }} autoFocus />
          <button onClick={() => setShowPass(!showPass)}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#666" }}>
            {showPass ? "🙈" : "👁"}
          </button>
        </div>
        {error && <div style={{ background: "#2a0000", color: "#ff6b6b", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 12, border: "1px solid #ff000033" }}>❌ كلمة السر غير صحيحة</div>}
        <button onClick={handleLogin} style={{ width: "100%", background: "linear-gradient(135deg,#00803c,#005a2b)", color: "#fff", border: "none", padding: 14, borderRadius: 12, fontSize: 15, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", marginTop: 4 }}>🔓 دخول</button>
        <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", marginTop: 12, fontFamily: "inherit" }}>إلغاء</button>
      </div>
    </div>
  );
}

export default function MasratiStore() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [selectedColor, setSelectedColor] = useState({});
  const [selectedSize, setSelectedSize] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "عطور", colors: [], sizes: [], description: "", image: null });
  const [colorInput, setColorInput] = useState("#c9a96e");
  const [sizeInput, setSizeInput] = useState("");
  const [notification, setNotification] = useState(null);
  const fileRef = useRef();
  const editFileRef = useRef();

  // ✅ تحميل المنتجات من Firebase بشكل فوري
  useEffect(() => {
    const initialized = localStorage.getItem("masrati_initialized");
    const unsub = onSnapshot(collection(db, "products"), async (snapshot) => {
      if (snapshot.empty && !initialized) {
        // أول مرة فقط — أضف المنتجات الافتراضية
        for (const p of defaultProducts) {
          await addDoc(collection(db, "products"), p);
        }
        localStorage.setItem("masrati_initialized", "true");
      } else {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(data);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const showNotif = (msg, type = "success") => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 2800); };

  const handleAdminClick = () => { if (isAdmin) setAddProductOpen(true); else setShowLogin(true); };
  const handleLoginSuccess = () => { setIsAdmin(true); setShowLogin(false); setAddProductOpen(true); showNotif("✓ مرحباً بك يا مدير الموقع 👑", "gold"); };
  const handleLogout = () => { setIsAdmin(false); showNotif("تم تسجيل الخروج", "info"); };

  const sendToWhatsApp = () => {
    if (!cart.length) return;
    const lines = cart.map((item, i) => `${i + 1}. ${item.name}\n   المقاس: ${item.size} | الكمية: ${item.qty}\n   السعر: ${(item.price * item.qty).toLocaleString()} د.ع`);
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const msg = `🛍 *طلب جديد من مجمع مسرتي*\n━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}\n\n━━━━━━━━━━━━━━━━\n💰 *المجموع: ${total.toLocaleString()} د.ع*\n\nأرجو تأكيد الطلب، شكراً ♥`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    setCart([]); setCartOpen(false); showNotif("✓ جاري التوجيه للواتساب!");
  };

  const addToCart = (product) => {
    const color = selectedColor[product.id] || product.colors[0];
    const size = selectedSize[product.id] || product.sizes[0];
    const key = `${product.id}-${color}-${size}`;
    setCart(prev => { const ex = prev.find(i => i.key === key); if (ex) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i); return [...prev, { ...product, color, size, qty: 1, key }]; });
    showNotif("✓ تمت الإضافة للسلة");
  };

  const removeFromCart = key => setCart(prev => prev.filter(i => i.key !== key));

  // ✅ حذف من Firebase
  const deleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
      showNotif("🗑 تم حذف المنتج", "info");
    } catch { showNotif("❌ خطأ في الحذف", "info"); }
  };

  // ✅ إضافة لـ Firebase
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        colors: newProduct.colors.length ? newProduct.colors : ["#c9a96e"],
        sizes: newProduct.sizes.length ? newProduct.sizes : ["M"],
      });
      setNewProduct({ name: "", price: "", category: "عطور", colors: [], sizes: [], description: "", image: null });
      setAddProductOpen(false);
      showNotif("✓ تم إضافة المنتج بنجاح");
    } catch { showNotif("❌ خطأ في الإضافة", "info"); }
  };

  const handleImageUpload = (e, productId) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (productId) setProducts(prev => prev.map(p => p.id === productId ? { ...p, image: ev.target.result } : p));
      else setNewProduct(prev => ({ ...prev, image: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const filtered = activeCategory === "الكل" ? products : products.filter(p => p.category === activeCategory);
  const catEmoji = cat => cat === "عطور" ? "🧴" : cat === "حقائب" ? "👜" : "💍";

  return (
    <div dir="rtl" style={{ fontFamily: "'Noto Serif Arabic',Georgia,serif", minHeight: "100vh", background: "#141414" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Arabic:wght@400;600;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--green:#00803c;--green-dark:#005a2b;--green-light:#00a34e;--gold:#c9a96e;--gold-dark:#a07840;--bg:#141414;--bg2:#1a1a1a;--bg3:#222;--bg4:#2a2a2a;--border:#2e2e2e;--text:#fff;--text2:#aaa;--text3:#666}
        html{scroll-behavior:smooth}
        body{background:var(--bg);-webkit-tap-highlight-color:transparent}

        .hero{background:linear-gradient(160deg,#0a1a0e 0%,#0d2217 40%,#1a3a22 100%);padding:44px 20px 32px;text-align:center;position:relative;overflow:hidden;border-bottom:2px solid var(--green)}
        .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,128,60,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,128,60,0.06) 1px,transparent 1px);background-size:32px 32px}
        .hero-glow{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:300px;height:200px;background:radial-gradient(circle,rgba(0,128,60,0.2),transparent 70%);pointer-events:none}
        .hero-badge{background:rgba(0,128,60,0.15);border:1px solid rgba(0,128,60,0.4);color:var(--green-light);font-size:11px;font-weight:700;padding:5px 16px;border-radius:20px;display:inline-flex;align-items:center;gap:6px;margin-bottom:14px;position:relative;z-index:1;letter-spacing:1px}
        .hero-badge::before{content:'';width:6px;height:6px;background:var(--green-light);border-radius:50%;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)}}
        .hero-logo{width:64px;height:64px;border-radius:14px;background:linear-gradient(135deg,var(--green),var(--green-dark));display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:26px;font-weight:900;color:#fff;position:relative;z-index:1;box-shadow:0 0 30px rgba(0,128,60,0.5)}
        .hero-title{font-size:clamp(26px,8vw,48px);font-weight:900;color:#fff;position:relative;z-index:1;line-height:1.1}
        .hero-title span{color:var(--gold)}
        .hero-divider{display:flex;align-items:center;gap:10px;justify-content:center;margin:12px 0;position:relative;z-index:1}
        .hero-divider::before{background:linear-gradient(to right,transparent,var(--gold))}
        .hero-divider::after{background:linear-gradient(to left,transparent,var(--gold))}
        .hero-divider::before,.hero-divider::after{content:'';flex:1;max-width:60px;height:1px}
        .hero-divider span{color:var(--gold);font-size:14px}
        .hero-slogan{font-size:14px;color:var(--gold);letter-spacing:1px;position:relative;z-index:1}
        .hero-tags{display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap;position:relative;z-index:1}
        .hero-tag{background:rgba(255,255,255,0.05);border:1px solid rgba(201,169,110,0.25);color:var(--gold);font-size:11px;padding:5px 14px;border-radius:20px}

        nav{background:#0d0d0d;border-bottom:2px solid var(--green);position:sticky;top:0;z-index:100;box-shadow:0 2px 20px rgba(0,128,60,0.15)}
        .nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 16px;height:56px;gap:8px}
        .nav-brand{font-size:16px;font-weight:900;color:#fff;white-space:nowrap;flex-shrink:0}
        .nav-brand span{color:var(--gold)}
        .admin-badge{background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#111;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
        .nav-actions{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}
        .btn-green{background:var(--green);color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:700;transition:all 0.2s;min-height:40px;white-space:nowrap}
        .btn-green:active{transform:scale(0.96)}
        .btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#111;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:700;transition:all 0.2s;min-height:40px;white-space:nowrap}
        .btn-gold:active{transform:scale(0.96)}
        .btn-outline{background:rgba(255,255,255,0.05);color:#aaa;border:1px solid #333;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:600}
        .cart-badge{background:var(--green);color:#fff;border-radius:50%;width:19px;height:19px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}

        .cats-wrap{background:#111;border-bottom:1px solid var(--border);overflow-x:auto;-webkit-overflow-scrolling:touch}
        .cats{max-width:1100px;margin:0 auto;display:flex;gap:6px;padding:10px 16px;white-space:nowrap}
        .cat-btn{border:1px solid var(--border);background:var(--bg4);color:var(--text2);padding:7px 16px;border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:600;transition:all 0.2s;min-height:36px;white-space:nowrap}
        .cat-btn.active{background:var(--green);color:#fff;border-color:var(--green)}

        .main{max-width:1100px;margin:0 auto;padding:20px 14px 48px}
        .section-title{color:#fff;font-size:16px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .section-title::after{content:'';flex:1;height:1px;background:linear-gradient(to right,var(--border),transparent)}

        /* Loading */
        .loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px}
        .loading-spinner{width:48px;height:48px;border:3px solid var(--border);border-top-color:var(--green);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading-text{color:var(--text3);font-size:14px}

        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
        @media(min-width:500px){.grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}}
        @media(min-width:800px){.grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}}

        .card{background:var(--bg3);border-radius:14px;overflow:hidden;border:1px solid var(--border);transition:transform 0.25s,border-color 0.25s,box-shadow 0.25s;position:relative}
        @media(hover:hover){.card:hover{transform:translateY(-5px);border-color:var(--green);box-shadow:0 8px 30px rgba(0,128,60,0.2)}}
        .card-badge{position:absolute;top:8px;right:8px;background:var(--green);color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;z-index:5}
        .card-del-btn{position:absolute;top:8px;left:8px;background:rgba(220,50,50,0.85);color:#fff;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;z-index:10}
        .card-img{width:100%;height:160px;background:linear-gradient(135deg,#1a2a1a,#0d1f14);display:flex;align-items:center;justify-content:center;font-size:46px;position:relative;overflow:hidden}
        @media(min-width:500px){.card-img{height:190px}}
        .card-img img{width:100%;height:100%;object-fit:cover}
        .upload-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s}
        .card-img:hover .upload-overlay{opacity:1}
        .upload-btn-sm{background:rgba(255,255,255,0.95);color:#111;border:none;padding:7px 14px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:700}
        .upload-icon-btn{position:absolute;bottom:8px;left:8px;background:rgba(0,128,60,0.9);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer}
        .card-body{padding:12px}
        .card-cat{font-size:10px;color:var(--green-light);font-weight:700;letter-spacing:1px;margin-bottom:3px}
        .card-name{font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;line-height:1.3}
        .card-desc{font-size:12px;color:var(--text3);margin-bottom:10px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .card-colors{display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap}
        .color-dot{width:18px;height:18px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:transform 0.15s}
        .color-dot.active{border-color:#fff;transform:scale(1.25)}
        .card-sizes{display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap}
        .size-btn{border:1px solid var(--border);background:var(--bg4);color:var(--text2);padding:3px 8px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;transition:all 0.15s;min-height:26px}
        .size-btn.active{border-color:var(--green);background:var(--green);color:#fff}
        .card-footer{display:flex;align-items:center;justify-content:space-between;gap:6px}
        .price{font-size:16px;font-weight:900;color:var(--gold);white-space:nowrap}
        .price span{font-size:11px;font-weight:400;color:var(--text3)}
        @media(min-width:500px){.price{font-size:18px}}
        .add-btn{background:var(--green);color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:700;transition:all 0.2s;white-space:nowrap;min-height:36px}
        .add-btn:active{transform:scale(0.95)}

        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
        .panel{background:#1a1a1a;border-radius:24px 24px 0 0;border-top:2px solid var(--green);padding:24px 18px 32px;width:100%;max-width:500px;max-height:88vh;overflow-y:auto;-webkit-overflow-scrolling:touch}
        .login-panel{background:#1a1a1a;border:1px solid var(--green);border-radius:20px;padding:32px 24px;width:90%;max-width:360px;margin:auto}
        .panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .panel-title{font-size:20px;font-weight:900;color:#fff;display:flex;align-items:center;gap:8px}
        .close-btn{background:var(--bg4);border:1px solid var(--border);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}

        .cart-item{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid var(--border);align-items:center}
        .cart-thumb{width:52px;height:52px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;flex-shrink:0}
        .cart-thumb img{width:100%;height:100%;object-fit:cover}
        .cart-info{flex:1;min-width:0}
        .cart-name{font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cart-meta{font-size:11px;color:var(--text3);display:flex;gap:6px;margin-top:2px;align-items:center}
        .cart-price{font-size:15px;font-weight:700;color:var(--gold);margin-top:2px}
        .qty-btn{background:var(--bg4);border:1px solid var(--border);color:#fff;width:26px;height:26px;border-radius:7px;cursor:pointer;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .remove-btn{background:#2a0000;border:1px solid #440000;color:#ff6b6b;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center}
        .cart-total-box{background:linear-gradient(135deg,#0a1a0e,#0d2217);border:1px solid var(--green);border-radius:14px;padding:14px;margin-top:18px;display:flex;justify-content:space-between;align-items:center}
        .wa-btn{width:100%;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;border:none;padding:16px;border-radius:14px;font-size:15px;font-family:inherit;font-weight:700;cursor:pointer;margin-top:14px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 20px rgba(37,211,102,0.3)}
        .wa-btn:active{opacity:0.9;transform:scale(0.98)}
        .wa-icon-circle{width:26px;height:26px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px}

        .form-group{margin-bottom:14px}
        .form-label{display:block;font-size:13px;font-weight:700;color:#ccc;margin-bottom:5px}
        .form-input{width:100%;border:2px solid var(--border);border-radius:10px;padding:10px 13px;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s;background:var(--bg3);color:#fff}
        .form-input:focus{border-color:var(--green)}
        .form-select{width:100%;border:2px solid var(--border);border-radius:10px;padding:10px 13px;font-size:14px;font-family:inherit;outline:none;background:var(--bg3);color:#fff}
        .color-row{display:flex;align-items:center;gap:8px}
        .colors-preview{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
        .color-tag{width:28px;height:28px;border-radius:50%;border:2px solid #333;cursor:pointer;position:relative;flex-shrink:0}
        .color-tag::after{content:'×';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;opacity:0;background:rgba(0,0,0,0.5);border-radius:50%}
        .color-tag:hover::after{opacity:1}
        .sizes-preview{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
        .size-tag{background:rgba(0,128,60,0.15);border:1px solid var(--green);color:var(--green-light);padding:5px 12px;border-radius:8px;font-size:12px;cursor:pointer;font-weight:600}
        .upload-area{border:2px dashed var(--green);border-radius:12px;padding:20px;text-align:center;cursor:pointer;background:rgba(0,128,60,0.05)}
        .upload-img-preview{width:100%;height:130px;object-fit:cover;border-radius:10px;margin-bottom:10px}
        .submit-btn{width:100%;background:linear-gradient(135deg,var(--green),var(--green-dark));color:#fff;border:none;padding:15px;border-radius:12px;font-size:15px;font-family:inherit;font-weight:700;cursor:pointer;margin-top:8px;box-shadow:0 4px 16px rgba(0,128,60,0.3)}
        .submit-btn:disabled{opacity:0.4}

        .notif{position:fixed;top:66px;left:50%;transform:translateX(-50%);color:#fff;padding:11px 22px;border-radius:30px;font-size:13px;font-weight:700;z-index:999;box-shadow:0 4px 18px rgba(0,0,0,0.4);animation:slideDown 0.3s ease;white-space:nowrap}
        .notif.success{background:var(--green)}
        .notif.info{background:#333}
        .notif.gold{background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#111}
        @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-18px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .shake{animation:shake 0.4s ease}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}

        .empty-cart{text-align:center;padding:48px 0;color:var(--text3)}
        .empty-cart .icon{font-size:48px;margin-bottom:12px}
        .wa-float{position:fixed;bottom:20px;left:20px;background:#25D366;color:#fff;width:52px;height:52px;border-radius:50%;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.5);cursor:pointer;z-index:90;text-decoration:none;border:2px solid rgba(255,255,255,0.2)}

        footer{background:#0a0a0a;border-top:1px solid var(--border);text-align:center;padding:28px 20px}
        .footer-brand{font-size:20px;font-weight:900;color:var(--gold);margin-bottom:8px}
        .footer-brand span{color:var(--green-light)}
        .footer-line{width:60px;height:2px;background:linear-gradient(to right,transparent,var(--green),transparent);margin:10px auto}
        footer p{font-size:12px;color:var(--text3);margin-top:4px}
        .footer-flag{display:flex;justify-content:center;gap:0;margin:10px auto;width:36px;height:24px;overflow:hidden;border-radius:4px}
        .flag-r{flex:1;background:#000}
        .flag-w{flex:1;background:#fff}
        .flag-g{flex:1;background:var(--green)}

        /* Firebase badge */
        .firebase-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,160,0,0.1);border:1px solid rgba(255,160,0,0.3);color:#ffa000;font-size:11px;padding:4px 12px;border-radius:20px;margin-top:8px}
      `}</style>

      {notification && <div className={`notif ${notification.type}`}>{notification.msg}</div>}

      {/* HERO */}
      <div className="hero">
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-badge">✦ متجر عراقي فاخر ✦</div>
        <div className="hero-logo">م</div>
        <div className="hero-title">مجمع <span>مسرتي</span></div>
        <div className="hero-divider"><span>✦</span>للإكسسوارات والعطور<span>✦</span></div>
        <div className="hero-slogan">♥ لمسة من الأناقة... لكل لحظة ♥</div>
        <div className="hero-tags">
          {["🧴 عطور فاخرة","💍 اكسسوارات","👜 حقائب","🇮🇶 عراقي أصيل"].map(t => (
            <span key={t} className="hero-tag">{t}</span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div className="nav-brand">مسرتي <span>✦</span></div>
            {isAdmin && <div className="admin-badge">👑 مدير</div>}
          </div>
          <div className="nav-actions">
            {isAdmin && <button className="btn-outline" onClick={handleLogout}>خروج</button>}
            <button className="btn-gold" onClick={handleAdminClick}>{isAdmin ? "➕ منتج" : "🔐 المدير"}</button>
            <button className="btn-green" onClick={() => setCartOpen(true)}>
              🛍 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* CATEGORIES */}
      <div className="cats-wrap">
        <div className="cats">
          {categories.map(c => (
            <button key={c} className={`cat-btn ${activeCategory === c ? "active" : ""}`} onClick={() => setActiveCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        <div className="section-title">🛍 المنتجات المتاحة</div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <div className="loading-text">جاري تحميل المنتجات...</div>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((product, idx) => (
              <div key={product.id} className="card">
                {idx < 2 && <div className="card-badge">{idx === 0 ? "🔥 الأكثر مبيعاً" : "⭐ مميز"}</div>}
                {isAdmin && <button className="card-del-btn" onClick={() => deleteProduct(product.id)}>🗑</button>}
                <div className="card-img">
                  {product.image ? <img src={product.image} alt={product.name} /> : <span>{catEmoji(product.category)}</span>}
                  {isAdmin && (
                    <>
                      <div className="upload-overlay">
                        <button className="upload-btn-sm" onClick={() => { editFileRef.current.dataset.pid = product.id; editFileRef.current.click(); }}>📷 تغيير</button>
                      </div>
                      <button className="upload-icon-btn" onClick={() => { editFileRef.current.dataset.pid = product.id; editFileRef.current.click(); }}>📷</button>
                    </>
                  )}
                </div>
                <div className="card-body">
                  <div className="card-cat">{product.category}</div>
                  <div className="card-name">{product.name}</div>
                  <div className="card-desc">{product.description}</div>
                  <div className="card-colors">
                    {(product.colors || []).map(c => (
                      <div key={c} className={`color-dot ${(selectedColor[product.id] || (product.colors || [])[0]) === c ? "active" : ""}`}
                        style={{ background: c }} onClick={() => setSelectedColor(prev => ({ ...prev, [product.id]: c }))} />
                    ))}
                  </div>
                  <div className="card-sizes">
                    {(product.sizes || []).map(s => (
                      <button key={s} className={`size-btn ${(selectedSize[product.id] || (product.sizes || [])[0]) === s ? "active" : ""}`}
                        onClick={() => setSelectedSize(prev => ({ ...prev, [product.id]: s }))}>{s}</button>
                    ))}
                  </div>
                  <div className="card-footer">
                    <div className="price">{(product.price || 0).toLocaleString()} <span>د.ع</span></div>
                    <button className="add-btn" onClick={() => addToCart(product)}>🛒 أضف</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <input type="file" ref={editFileRef} style={{ display: "none" }} accept="image/*"
        onChange={e => { handleImageUpload(e, editFileRef.current.dataset.pid); e.target.value = ""; }} />

      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="wa-float">💬</a>

      {showLogin && <AdminLoginModal onSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />}

      {/* CART */}
      {cartOpen && (
        <div className="overlay" onClick={() => setCartOpen(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-title"><span>🛍</span> سلة التسوق</div>
              <button className="close-btn" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {!cart.length
              ? <div className="empty-cart"><div className="icon">🛒</div><p>السلة فارغة حالياً</p></div>
              : <>
                {cart.map(item => (
                  <div key={item.key} className="cart-item">
                    <div className="cart-thumb">{item.image ? <img src={item.image} alt={item.name} /> : <span>{catEmoji(item.category)}</span>}</div>
                    <div className="cart-info">
                      <div className="cart-name">{item.name}</div>
                      <div className="cart-meta">
                        <span style={{ background: item.color, width: 12, height: 12, borderRadius: "50%", display: "inline-block", border: "1px solid #333", flexShrink: 0 }} />
                        <span>{item.size}</span>
                      </div>
                      <div className="cart-price">{(item.price * item.qty).toLocaleString()} د.ع</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button className="qty-btn" onClick={() => setCart(prev => prev.map(i => i.key === item.key ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}>−</button>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                        <button className="qty-btn" onClick={() => setCart(prev => prev.map(i => i.key === item.key ? { ...i, qty: i.qty + 1 } : i))}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.key)}>🗑</button>
                    </div>
                  </div>
                ))}
                <div className="cart-total-box">
                  <span style={{ fontWeight: 700, color: "#aaa", fontSize: 14 }}>المجموع الكلي</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "var(--gold)" }}>{cartTotal.toLocaleString()} د.ع</span>
                </div>
                <button className="wa-btn" onClick={sendToWhatsApp}>
                  <div className="wa-icon-circle">💬</div>
                  إتمام الشراء عبر واتساب
                </button>
              </>
            }
          </div>
        </div>
      )}

      {/* ADD PRODUCT */}
      {addProductOpen && isAdmin && (
        <div className="overlay" onClick={() => setAddProductOpen(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-title"><span style={{ color: "var(--gold)" }}>✦</span> إضافة منتج</div>
              <button className="close-btn" onClick={() => setAddProductOpen(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">صورة المنتج</label>
              <div className="upload-area" onClick={() => fileRef.current.click()}>
                {newProduct.image ? <img src={newProduct.image} className="upload-img-preview" alt="preview" />
                  : <><div style={{ fontSize: 32, marginBottom: 6 }}>📷</div><p style={{ fontSize: 12, color: "#555" }}>اضغط لرفع صورة</p></>}
              </div>
              <input type="file" ref={fileRef} style={{ display: "none" }} accept="image/*" onChange={e => handleImageUpload(e, null)} />
            </div>
            <div className="form-group">
              <label className="form-label">اسم المنتج *</label>
              <input className="form-input" placeholder="مثال: عطر ورد الطائف" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">السعر (د.ع) *</label>
              <input className="form-input" type="number" inputMode="numeric" placeholder="299" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">الفئة</label>
              <select className="form-select" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                <option>عطور</option><option>حقائب</option><option>اكسسوارات</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">وصف المنتج</label>
              <input className="form-input" placeholder="وصف قصير للمنتج" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">الألوان</label>
              <div className="color-row">
                <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} style={{ width: 44, height: 40, border: "none", cursor: "pointer", borderRadius: 8, flexShrink: 0 }} />
                <button className="btn-green" style={{ flex: 1, borderRadius: 8 }} onClick={() => { if (!newProduct.colors.includes(colorInput)) setNewProduct(p => ({ ...p, colors: [...p.colors, colorInput] })); }}>+ لون</button>
              </div>
              <div className="colors-preview">{newProduct.colors.map(c => <div key={c} className="color-tag" style={{ background: c }} onClick={() => setNewProduct(p => ({ ...p, colors: p.colors.filter(x => x !== c) }))} />)}</div>
            </div>
            <div className="form-group">
              <label className="form-label">المقاسات</label>
              <div className="color-row">
                <input className="form-input" placeholder="S أو 50ml" value={sizeInput} onChange={e => setSizeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && sizeInput.trim()) { setNewProduct(p => ({ ...p, sizes: [...p.sizes, sizeInput.trim()] })); setSizeInput(""); } }}
                  style={{ flex: 1 }} />
                <button className="btn-green" style={{ borderRadius: 8 }} onClick={() => { if (sizeInput.trim()) { setNewProduct(p => ({ ...p, sizes: [...p.sizes, sizeInput.trim()] })); setSizeInput(""); } }}>+ مقاس</button>
              </div>
              <div className="sizes-preview">{newProduct.sizes.map(s => <div key={s} className="size-tag" onClick={() => setNewProduct(p => ({ ...p, sizes: p.sizes.filter(x => x !== s) }))}>{s} ✕</div>)}</div>
            </div>
            <button className="submit-btn" onClick={handleAddProduct} disabled={!newProduct.name || !newProduct.price}>✦ إضافة المنتج للمتجر</button>
          </div>
        </div>
      )}

      <footer>
        <div className="footer-flag"><div className="flag-r"/><div className="flag-w"/><div className="flag-g"/></div>
        <div className="footer-brand">✦ مجمع <span>مسرتي</span> ✦</div>
        <div className="footer-line" />
        <p>للإكسسوارات والعطور الفاخرة — العراق</p>
        <p>♥ لمسة من الأناقة... لكل لحظة ♥</p>
        <div style={{ marginTop: 10 }}><span className="firebase-badge">🔥 مدعوم بـ Firebase</span></div>
        <p style={{ marginTop: 8, fontSize: 11 }}>واتساب: +964 781 563 3866</p>
      </footer>
    </div>
  );
}
