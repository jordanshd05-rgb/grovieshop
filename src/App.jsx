/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, set, push, onValue } from "firebase/database";
import { auth, db } from "./firebase";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  Leaf,
  CheckCircle2,
  QrCode,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  Menu,
  X,
  Info,
  Check,
  ShieldCheck,
  Heart,
  Award,
  LayoutGrid,
  Cookie,
  Coffee,
  Trees,
  TrendingUp,
  MapPin,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
export const ASSET_CONFIG = {
  logo: {
    useRealLogo: true,
    // Ubah ke true jika ingin memakai file gambar asli
    imagePath: "images/logo.png"
    // Ganti dengan path logo Anda nanti
  },
  heroBanner: "images/Utama.jpeg",
  // FOTO HERO UTAMA (Bisa diubah manual)
  promoBanners: {
    leftBig: "images/Banyak.jpeg",
    // FOTO PROMO BESAR (Bisa diubah manual)
    rightSmall: "images/Banyak.jpeg"
    // FOTO PROMO KECIL (Bisa diubah manual)
  },
  products: [
    {
      id: 1,
      name: "Sirup Mangrove Original",
      price: 25e3,
      category: "Minuman",
      flavor: "Asam Segar",
      description: "Sirup segar kaya vitamin C khas Kota Langsa.",
      image: "images/Sirup.jpeg",
      // FOTO PRODUK 1 (Bisa diubah manual)
      badge: "Best Seller"
    },
    {
      id: 2,
      name: "Dodol Mangrove Klasik",
      price: 2e4,
      category: "Makanan",
      flavor: "Manis Legit",
      description: "Camilan tradisional bertekstur lembut dan kenyal.",
      image: "images/Dodol.jpeg",
      // FOTO PRODUK 2 (Bisa diubah manual)
      badge: "Special Offer"
    },
    {
      id: 3,
      name: "Selai Mangrove Gurih",
      price: 18e3,
      category: "Makanan",
      flavor: "Manis Gurih",
      description: "Teman terbaik untuk roti panggang sarapan pagi Anda.",
      image: "images/Selai.jpeg",
      // FOTO PRODUK 3 (Bisa diubah manual)
      badge: "Best Seller"
    },
    {
      id: 4,
      name: "Kerupuk Mangrove Gurih",
      price: 18e3,
      category: "Makanan",
      flavor: "Gurih",
      description: "Teman terbaik untuk untuk santai anda.",
      image: "images/Kerupuk.jpeg",
      // FOTO PRODUK 4 (Bisa diubah manual)
      badge: "Best Seller"
    }
  ]
};
export default function App() {
  const [currentTab, setCurrentTab] = useState("katalog");
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");
  const [orders, setOrders] = useState([]);
  const [shippingAddress, setShippingAddress] = useState("");

  const generateOrderId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "MNG-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setCart([]);
        setShippingAddress("");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const ordersRef = ref(db, `orders/${user.uid}`);
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedOrders = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        })).reverse();
        setOrders(loadedOrders);
      } else {
        setOrders([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      triggerToast("Berhasil masuk! Selamat datang kembali.");
      setShowLoginModal(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      setAuthError(error.message || "Gagal masuk. Silakan periksa kembali email dan password Anda.");
      triggerToast("Gagal masuk. Periksa email/password.", "error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await signOut(auth);
      triggerToast("Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.", "success");
      setIsRegistering(false);
      setPassword("");
    } catch (error) {
      setAuthError(error.message || "Gagal mendaftar. Gunakan email lain atau pastikan password min. 6 karakter.");
      triggerToast("Gagal mendaftar.", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      triggerToast("Berhasil keluar.");
      if (currentTab === "pesanan") {
        setCurrentTab("katalog");
      }
    } catch (error) {
      triggerToast("Gagal keluar.", "error");
    }
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mainContentRef = useRef(null);
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setTimeout(() => {
      mainContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedFlavor, setSelectedFlavor] = useState("Semua");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState("pending");
  const [countdown, setCountdown] = useState(600);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [toast, setToast] = useState(null);
  const [sliderItems, setSliderItems] = useState(10);
  const triggerToast = (message, type = "success") => {
    setToast({ message, type });
  };
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3e3);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    let timer;
    if (isCheckoutModalOpen && checkoutStatus !== "success" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1e3);
    }
    return () => clearInterval(timer);
  }, [isCheckoutModalOpen, checkoutStatus, countdown]);
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);
  const totalCartItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);
  const ecoMetrics = useMemo(() => {
    const seedlings = totalCartItems;
    const carbonOffset = Number((seedlings * 21.8).toFixed(1));
    const wageHours = Number((seedlings * 0.5).toFixed(1));
    return { seedlings, carbonOffset, wageHours };
  }, [totalCartItems]);
  const filteredProducts = useMemo(() => {
    return ASSET_CONFIG.products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Semua" || product.category === selectedCategory;
      let matchesFlavor = true;
      if (selectedFlavor !== "Semua") {
        matchesFlavor = product.flavor.toLowerCase().includes(selectedFlavor.toLowerCase());
      }
      return matchesSearch && matchesCategory && matchesFlavor;
    });
  }, [searchQuery, selectedCategory, selectedFlavor]);
  const handleAddToCart = (product) => {
    if (!user) {
      triggerToast("Silakan masuk terlebih dahulu untuk menambahkan produk ke keranjang.", "info");
      setShowLoginModal(true);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        triggerToast(`Jumlah ${product.name} ditambah di keranjang!`);
        return prev.map(
          (item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      triggerToast(`Berhasil menambahkan ${product.name} ke keranjang!`);
      return [...prev, { product, quantity: 1 }];
    });
  };
  const handleDecreaseQuantity = (productId) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing) {
        if (existing.quantity === 1) {
          triggerToast(`Produk dihapus dari keranjang.`, "info");
          return prev.filter((item) => item.product.id !== productId);
        }
        return prev.map(
          (item) => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev;
    });
  };
  const handleRemoveItem = (productId) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (item) {
        triggerToast(`${item.product.name} dihapus dari keranjang.`, "info");
      }
      return prev.filter((i) => i.product.id !== productId);
    });
  };
  const handleCheckout = () => {
    if (cart.length === 0) {
      triggerToast("Keranjang belanja Anda masih kosong!", "info");
      return;
    }
    if (!user) {
      triggerToast("Silakan masuk terlebih dahulu untuk melanjutkan checkout.", "info");
      setIsCartOpen(false);
      setShowLoginModal(true);
      return;
    }
    if (!shippingAddress.trim()) {
      triggerToast("Silakan isi alamat pengiriman lengkap Anda terlebih dahulu.", "info");
      return;
    }
    setCountdown(600);
    setCheckoutStatus("pending");
    setIsCheckoutModalOpen(true);
    setIsCartOpen(false);
  };
  const handleVerifyPayment = () => {
    if (!user) {
      triggerToast("Sesi Anda habis. Silakan masuk kembali.", "error");
      return;
    }
    setCheckoutStatus("verifying");
    const orderId = generateOrderId();
    const invoiceNo = "INV/" + new Date().getFullYear() + "/MNG/" + Math.floor(1e5 + Math.random() * 9e5);
    const dateStr = new Date().toLocaleString("id-ID", { hour12: false });
    const itemsData = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image
    }));
    const orderData = {
      orderId: orderId,
      invoiceNo: invoiceNo,
      items: itemsData,
      total: cartTotal,
      tanggal: dateStr,
      status: "In Process",
      alamat: shippingAddress,
      ecoDonation: ecoMetrics.seedlings,
      carbonSaved: ecoMetrics.carbonOffset
    };
    setTimeout(() => {
      const userOrdersRef = ref(db, `orders/${user.uid}`);
      push(userOrdersRef, orderData)
        .then(() => {
          const receipt = {
            invoiceNo,
            transactionId: orderId,
            date: dateStr,
            items: [...cart],
            subtotal: cartTotal,
            alamat: shippingAddress,
            ecoDonation: ecoMetrics.seedlings,
            carbonSaved: ecoMetrics.carbonOffset
          };
          setActiveReceipt(receipt);
          setCheckoutStatus("success");
          setCart([]);
          setShippingAddress("");
          triggerToast("Pembayaran Berhasil! Pesanan Anda telah tersimpan.", "success");
        })
        .catch((err) => {
          console.error("Firebase database error:", err);
          triggerToast("Gagal menyimpan pesanan ke database.", "error");
          setCheckoutStatus("pending");
        });
    }, 2000);
  };
  const renderLogo = () => {
    return (
      <div className="flex items-center space-x-3">
        {ASSET_CONFIG.logo.useRealLogo ? (
          /* Jika useRealLogo true, kotak oranye ikon daun diganti dengan file gambar asli */
          <img 
            src={ASSET_CONFIG.logo.imagePath} 
            alt="Mangrovise Logo Asset" 
            className="w-9 h-9 object-contain rounded-xl shadow-md shrink-0"
            onError={(e) => {
              // Jika gambar gagal dimuat, otomatis pasang fallback ikon daun
              e.currentTarget.style.display = 'none';
              const fallbackIcon = document.getElementById('fallback-icon');
              if (fallbackIcon) fallbackIcon.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Kotak ikon daun bawaan (hanya muncul jika useRealLogo false, atau sebagai cadangan) */}
        <div 
          id="fallback-icon" 
          className="w-9 h-9 bg-accent-ochre rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
          style={{ display: ASSET_CONFIG.logo.useRealLogo ? 'none' : 'flex' }}
        >
          <Leaf className="w-5 h-5 text-white animate-pulse" />
        </div>

        {/* Teks Logo - Tidak akan hilang karena ditaruh di luar kondisi gambar */}
        <div className="text-left">
          <span className="block font-serif font-bold text-lg leading-none text-white tracking-wide">
            Mangro<span className="text-accent-ochre font-sans font-semibold">Vise</span>
          </span>
          <span className="text-[9px] font-mono text-stone-300 font-semibold tracking-wider block uppercase">Langsa Mangrove Co.</span>
        </div>
      </div>
    );
  };
  return <div className="min-h-screen bg-warm-bg text-stone-850 font-sans selection:bg-accent-ochre selection:text-white relative">
      
      {
    /* 2. TOP ANNOUNCEMENT LINE */
  }
      <div className="bg-emerald-950 text-stone-200 py-2.5 px-4 text-xs font-medium text-center tracking-wider shrink-0 overflow-hidden relative border-b border-emerald-900/40">
        <div className="inline-flex items-center space-x-2">
          <span className="bg-accent-ochre text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Eko-Restorasi
          </span>
          <span className="text-stone-300">Inisiatif Toko Online Lestari: Setiap pembelian menyumbang bibit bakau di pesisir Langsa, Aceh.</span>
        </div>
      </div>

      {/* 3. STICKY NAVBAR MAIN HEADER WRAPPER */}
      <div className="sticky top-0 z-50 bg-mangrove-deep/95 backdrop-blur-md border-b border-emerald-900/40 shadow-lg px-4 sm:px-6 lg:px-8">
        <header className="max-w-7xl mx-auto flex items-center justify-between py-4 relative z-10">
          <div className="flex items-center">
            {renderLogo()}
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <button
              onClick={() => handleTabChange("katalog")}
              className={`hover:text-accent-ochre transition-colors relative py-1 flex items-center gap-1.5 ${currentTab === "katalog" ? "text-accent-ochre font-bold" : "text-stone-200"}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Katalog</span>
              {currentTab === "katalog" && <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-ochre rounded-full" />}
            </button>
            
            <button
              onClick={() => handleTabChange("tentang")}
              className={`hover:text-accent-ochre transition-colors relative py-1 flex items-center gap-1.5 ${currentTab === "tentang" ? "text-accent-ochre font-bold" : "text-stone-200"}`}
            >
              <Trees className="w-4 h-4" />
              <span>Tentang Kami</span>
              {currentTab === "tentang" && <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-ochre rounded-full" />}
            </button>
            
            <button
              onClick={() => handleTabChange("impact")}
              className={`hover:text-accent-ochre transition-colors relative py-1 flex items-center gap-1.5 ${currentTab === "impact" ? "text-accent-ochre font-bold" : "text-stone-200"}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Kalkulator Dampak</span>
              {currentTab === "impact" && <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-ochre rounded-full" />}
            </button>

            {user && (
              <button
                onClick={() => handleTabChange("pesanan")}
                className={`hover:text-accent-ochre transition-colors relative py-1 flex items-center gap-1.5 ${currentTab === "pesanan" ? "text-accent-ochre font-bold" : "text-stone-200"}`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Pesanan Saya</span>
                {currentTab === "pesanan" && <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-ochre rounded-full" />}
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-accent-ochre hover:bg-accent-ochre/90 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2 relative group"
              aria-label="Buka Keranjang"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-bold font-mono px-1">{totalCartItems}</span>
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-mangrove-deep text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {totalCartItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="hidden md:flex items-center space-x-3 text-left">
                <div className="text-right leading-none">
                  <span className="block text-[9px] text-stone-300 font-medium">Akun Pembeli</span>
                  <span className="text-xs font-bold text-white max-w-[120px] truncate block mt-0.5">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-950/40 hover:bg-red-900/50 text-red-200 border border-red-800/30 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="hidden md:block bg-accent-ochre hover:bg-accent-ochre/90 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Masuk
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden bg-white/10 hover:bg-white/20 border border-white/10 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden rounded-2xl bg-mangrove-deep/95 backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden relative z-10 mb-4 p-4 text-left"
            >
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    handleTabChange("katalog");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold transition-all ${currentTab === "katalog" ? "bg-accent-ochre text-white shadow-md" : "text-stone-200 hover:bg-white/5"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Katalog Belanja</span>
                </button>
                
                <button
                  onClick={() => {
                    handleTabChange("tentang");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold transition-all ${currentTab === "tentang" ? "bg-accent-ochre text-white shadow-md" : "text-stone-200 hover:bg-white/5"}`}
                >
                  <Trees className="w-4 h-4" />
                  <span>Tentang Kami</span>
                </button>
                
                <button
                  onClick={() => {
                    handleTabChange("impact");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold transition-all ${currentTab === "impact" ? "bg-accent-ochre text-white shadow-md" : "text-stone-200 hover:bg-white/5"}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Kalkulator Dampak</span>
                </button>

                {user && (
                  <button
                    onClick={() => {
                      handleTabChange("pesanan");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold transition-all ${currentTab === "pesanan" ? "bg-accent-ochre text-white shadow-md" : "text-stone-200 hover:bg-white/5"}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Pesanan Saya</span>
                  </button>
                )}

                {user ? (
                  <div className="pt-3 border-t border-white/10 mt-3 space-y-3">
                    <div className="px-4 py-2 bg-white/5 rounded-xl text-left">
                      <span className="block text-[9px] text-stone-400 font-mono uppercase tracking-widest">Login Sebagai:</span>
                      <span className="text-xs font-bold text-white block truncate">{user.email}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/50 text-red-200 border border-red-800/30 transition-all cursor-pointer"
                    >
                      Keluar Akun
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-accent-ochre text-white shadow-md transition-all mt-3 cursor-pointer"
                  >
                    Masuk Akun
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. HERO SECTION WITH ORGANIC CURVED HEADER */}
      <div className="relative bg-mangrove-deep text-white pt-16 pb-24 md:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-[3.5rem] sm:rounded-b-[5rem] lg:rounded-b-[7rem] shadow-2xl">
        {
    /* Background Decorative Organic Glows */
  }
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-800/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-accent-ochre/10 rounded-full blur-[120px] pointer-events-none" />

        {
    /* Hero Main Content */
  }
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 px-4">
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center space-x-2 bg-emerald-800/40 text-emerald-300 text-xs px-3.5 py-1.5 rounded-full font-semibold border border-emerald-700/30">
              <Trees className="w-3.5 h-3.5 text-accent-ochre animate-pulse" />
              <span>Restorasi Mangrove Bersama Nelayan Langsa</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-[1.1] tracking-tight">
              Kelezatan Otentik Pesisir Langsa yang <span className="text-accent-ochre">Menghidupkan Ekologi</span>
            </h1>
            
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Mangrovise menghadirkan produk pangan premium berbahan dasar buah mangrove pilihan dari hutan konservasi Kota Langsa, Aceh. Setiap gigitan dan tegukan Anda mengalirkan dukungan finansial langsung bagi ibu nelayan pesisir serta penanaman bibit mangrove baru.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
    onClick={() => handleTabChange("katalog")}
    className="bg-accent-ochre hover:opacity-95 text-white text-sm font-bold px-8 py-4 rounded-xl shadow-lg shadow-accent-ochre/20 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
  >
                <span>Jelajahi Produk Kami</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
    onClick={() => handleTabChange("impact")}
    className="bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
  >
                <TrendingUp className="w-4 h-4 text-accent-ochre" />
                <span>Lihat Kalkulator Kontribusi</span>
              </button>
            </div>

            {
    /* Quick Micro-Stats */
  }
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 max-w-lg">
              <div>
                <span className="block text-xl sm:text-2xl font-mono font-bold text-accent-ochre">100%</span>
                <span className="block text-xs text-stone-300">Bahan Alami Pilihan</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-mono font-bold text-accent-ochre">1.500+</span>
                <span className="block text-xs text-stone-300">Bibit Tersertifikasi</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-mono font-bold text-accent-ochre">5 Kelompok</span>
                <span className="block text-xs text-stone-300">Wanita Nelayan Mitra</span>
              </div>
            </div>
          </div>

          {
    /* Hero Banner Visual Showcase with golden-organic accents */
  }
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md">
              {
    /* Outer decorative circular frame */
  }
              <div className="absolute -inset-4 rounded-[2.5rem] border-2 border-dashed border-accent-ochre/30 animate-[spin_60s_linear_infinite] pointer-events-none" />
              
              <div className="relative bg-stone-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10 aspect-[4/5]">
                <img
    src={ASSET_CONFIG.heroBanner}
    alt="Mangrovise Premium Organic Products Showcase"
    className="w-full h-full object-cover brightness-95 hover:scale-105 transition-transform duration-700"
    referrerPolicy="no-referrer"
  />
                
                {
    /* Embedded Glassmorphic badge */
  }
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-mangrove-deep/80 backdrop-blur-md border border-white/10 text-left space-y-1 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-accent-ochre animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-accent-ochre">Produk Unggulan</span>
                  </div>
                  <p className="text-xs text-stone-100 font-bold leading-snug">
                    Olahan pangan alami & sirup premium dari buah mangrove pilihan pesisir Langsa.
                  </p>
                </div>
              </div>

              {
    /* Float-badge 1: Micro-Impact */
  }
              <div className="absolute -top-6 -left-6 bg-white text-stone-900 p-3 rounded-2xl shadow-xl border border-stone-100 flex items-center space-x-2.5 z-10">
                <div className="w-8 h-8 bg-mangrove-light text-mangrove-deep rounded-xl flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="text-left leading-none">
                  <span className="block text-[10px] text-stone-400 font-bold uppercase">1 Kemasan</span>
                  <span className="text-xs font-bold text-mangrove-deep">+1 Bibit Bakau</span>
                </div>
              </div>

              {
    /* Float-badge 2: Safe Halal Traditional */
  }
              <div className="absolute -bottom-6 -right-6 bg-white text-stone-900 p-3.5 rounded-2xl shadow-xl border border-stone-100 flex items-center space-x-2.5 z-10">
                <div className="w-8 h-8 bg-amber-50 text-accent-ochre rounded-xl flex items-center justify-center">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <div className="text-left leading-none">
                  <span className="block text-[10px] text-stone-400 font-bold uppercase">Kualitas</span>
                  <span className="text-xs font-bold text-stone-900">Higienis & Halal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {
    /* 4. "3 ALASAN MEMILIH GROVIESHOP" MACRO FEATURES ROW */
  }
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center -mt-8 relative z-20">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-stone-200/50 space-y-12">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-ochre flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-accent-ochre" /> Nilai Tambah Ekologis & Sosial
            </span>
            <h2 className="text-3xl font-serif font-bold text-stone-950 tracking-tight">
              3 Pilar Keberlanjutan Mangrovise
            </h2>
            <p className="text-sm text-stone-500">
              Setiap rupiah yang Anda belanjakan dirancang untuk memberikan dampak positif berkelanjutan bagi lingkungan pesisir dan masyarakat sekitar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {
    /* Feature 1 */
  }
            <div className="bg-warm-bg/60 p-8 rounded-3xl border border-stone-200/50 hover:border-accent-ochre/30 transition-all group hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-ochre/5 rounded-bl-full pointer-events-none" />
              <div className="bg-amber-100 text-accent-ochre p-4 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Leaf className="w-7 h-7 text-accent-ochre" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900 mb-3">Konservasi Nyata</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Setiap kemasan produk olahan mangrove yang terjual langsung menyisihkan dana untuk pengadaan dan penanaman 1 bibit pohon bakau baru di daerah rawan abrasi Kota Langsa.
              </p>
            </div>

            {
    /* Feature 2 */
  }
            <div className="bg-warm-bg/60 p-8 rounded-3xl border border-stone-200/50 hover:border-accent-ochre/30 transition-all group hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-mangrove-deep/5 rounded-bl-full pointer-events-none" />
              <div className="bg-mangrove-light text-mangrove-deep p-4 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-mangrove-deep" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900 mb-3">Pemberdayaan Wanita</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Kami bekerja sama erat dengan kelompok koperasi wanita pesisir nelayan tradisional Langsa, menjamin kedaulatan ekonomi mereka melalui upah kerja yang adil dan berkelanjutan.
              </p>
            </div>

            {
    /* Feature 3 */
  }
            <div className="bg-warm-bg/60 p-8 rounded-3xl border border-stone-200/50 hover:border-accent-ochre/30 transition-all group hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-ochre/5 rounded-bl-full pointer-events-none" />
              <div className="bg-amber-100 text-accent-ochre p-4 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-accent-ochre" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900 mb-3">Kualitas Pangan Premium</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Menggunakan ekstraksi buah mangrove alami bebas pestisida, diproses secara modern dan higienis yang memenuhi standar keamanan pangan untuk cita rasa segar orisinal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {
    /* 5. APP TABS: KATALOG, TENTANG, IMPACT CALCULATOR */
  }
      <main ref={mainContentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 scroll-mt-24">
        
        {
    /* TAB 1: E-COMMERCE BENTO-GRID CATALOG */
  }
        {currentTab === "katalog" && <div className="space-y-12">
            
            {
    /* Filter & Search Bar Row */
  }
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-6">
              {
    /* Top Row: Title, Subtitle, and Search Bar */
  }
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
                <div className="text-left space-y-1">
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight">Katalog Hasil Olahan Lestari</h3>
                  <p className="text-xs text-stone-500">Pilih cita rasa mangrove otentik dan sumbangkan bibit bakau Anda.</p>
                </div>
                
                {
    /* Search Field */
  }
                <div className="relative w-full md:w-80 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
    type="text"
    placeholder="Cari sirup, dodol..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-accent-ochre focus:ring-1 focus:ring-accent-ochre/20 text-stone-800 transition-all"
  />
                  {searchQuery && <button
    onClick={() => setSearchQuery("")}
    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-950 text-xs"
  >
                      <X className="w-3.5 h-3.5" />
                    </button>}
                </div>
              </div>

              {
    /* Bottom Row: Filter Groups */
  }
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
                {
    /* Left Side: Category Filter Group */
  }
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider text-left shrink-0">Kategori Produk:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
    { name: "Semua", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { name: "Makanan", icon: <Cookie className="w-3.5 h-3.5" /> },
    { name: "Minuman", icon: <Coffee className="w-3.5 h-3.5" /> }
  ].map((cat) => <button
    key={cat.name}
    onClick={() => setSelectedCategory(cat.name)}
    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedCategory === cat.name ? "bg-mangrove-deep text-white shadow-sm" : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"}`}
  >
                        {cat.icon}
                        <span>{cat.name}</span>
                      </button>)}
                  </div>
                </div>

                {
    /* Right Side: Flavor Filter Group */
  }
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider text-left shrink-0">Profil Rasa:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
    { name: "Semua", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { name: "Manis", icon: <Heart className="w-3.5 h-3.5" /> },
    { name: "Asam", icon: <Leaf className="w-3.5 h-3.5" /> },
    { name: "Gurih", icon: <Award className="w-3.5 h-3.5" /> }
  ].map((flav) => <button
    key={flav.name}
    onClick={() => setSelectedFlavor(flav.name)}
    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${selectedFlavor === flav.name ? "bg-stone-900 text-white shadow-sm" : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"}`}
  >
                        {flav.icon}
                        <span>{flav.name}</span>
                      </button>)}
                  </div>
                </div>
              </div>
            </div>

            {
    /* BENTO-GRID MULTI-GRID LAYOUT FOR E-COMMERCE */
  }
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {
    /* BENTO ITEM 1: LEFT BIG PROMO BANNER CARD */
  }
              <div className="lg:col-span-4 rounded-3xl overflow-hidden bg-mangrove-deep text-white shadow-md relative min-h-[400px] flex flex-col justify-end p-8 border border-white/10 group">
                <div className="absolute inset-0">
                  <img
    src={ASSET_CONFIG.promoBanners.leftBig}
    alt="Eco Mangrove Harvest Promotion"
    className="w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700"
    referrerPolicy="no-referrer"
  />
                  <div className="absolute inset-0 bg-gradient-to-t from-mangrove-deep via-mangrove-deep/60 to-transparent" />
                </div>
                
                <div className="relative z-10 space-y-4 text-left">
                  <div className="inline-flex items-center space-x-1.5 bg-accent-ochre text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-3 h-3 text-white animate-spin" />
                    <span>Promo Spesial</span>
                  </div>
                  
                  <h4 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
                    Eco Saver Pack: Hidup Sehat & Berdampak
                  </h4>
                  
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Dapatkan potongan khusus untuk bundling Sirup & Dodol. Otomatis menanam 3 bibit mangrove sekaligus untuk penguatan garis pantai Langsa.
                  </p>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (!user) {
                          triggerToast("Silakan masuk terlebih dahulu untuk membeli paket bundling.", "info");
                          setShowLoginModal(true);
                          return;
                        }
                        ASSET_CONFIG.products.forEach((p) => handleAddToCart(p));
                        triggerToast("Bundling Eco Saver Pack ditambahkan ke keranjang!");
                      }}
    className="bg-accent-ochre hover:bg-accent-ochre/95 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all shadow-md flex items-center space-x-2 w-full justify-center group"
  >
                      <span>Beli Paket Bundling (Hemat 15%)</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {
    /* BENTO ITEM 2: MAIN DYNAMIC PRODUCTS CATALOG GRID */
  }
              <div className="lg:col-span-8 flex flex-col justify-between space-y-8">
                {filteredProducts.length === 0 ? <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 space-y-3 flex-1 flex flex-col items-center justify-center">
                    <Info className="w-12 h-12 text-stone-300" />
                    <p className="text-stone-850 font-bold">Produk Tidak Ditemukan</p>
                    <p className="text-xs text-stone-500 max-w-sm">Maaf, kami tidak menemukan produk olahan mangrove dengan kriteria pencarian atau filter rasa tersebut.</p>
                    <button
    onClick={() => {
      setSelectedCategory("Semua");
      setSelectedFlavor("Semua");
      setSearchQuery("");
    }}
    className="text-xs text-accent-ochre font-bold hover:underline cursor-pointer"
  >
                      Reset Semua Filter
                    </button>
                  </div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredProducts.map((product) => <div
    key={product.id}
    className="bg-white rounded-[2rem] border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
  >
                        {
    /* Image Showcase */
  }
                        <div className="relative aspect-video overflow-hidden bg-stone-100">
                          <img
    src={product.image}
    alt={product.name}
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    referrerPolicy="no-referrer"
  />
                          
                          {
    /* Rating badge */
  }
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-stone-900 flex items-center space-x-1 shadow-sm">
                            <Sparkles className="w-3 h-3 text-accent-ochre" />
                            <span>Premium Quality</span>
                          </div>

                          {
    /* Conditional badge from user criteria ("Special Offer" or "Best Seller") */
  }
                          {product.badge && <div className="absolute top-3 right-3 bg-accent-ochre text-white px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-md">
                              {product.badge}
                            </div>}

                          {
    /* Conservation contribution flag */
  }
                          <div className="absolute bottom-3 left-3 bg-mangrove-deep/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold text-white flex items-center space-x-1.5 shadow-sm">
                            <Leaf className="w-3 h-3 text-accent-ochre animate-pulse" />
                            <span>🌿 +1 Bibit Mangrove</span>
                          </div>
                        </div>

                        {
    /* Content description */
  }
                        <div className="p-6 text-left space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400">
                              <span>{product.category}</span>
                              <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono">{product.flavor}</span>
                            </div>
                            <h4 className="font-serif font-bold text-lg text-stone-900 leading-tight group-hover:text-accent-ochre transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          </div>

                          <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
                            <div>
                              <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Harga Lestari</span>
                              <span className="font-mono font-bold text-base text-mangrove-deep">
                                Rp {product.price.toLocaleString("id-ID")}
                              </span>
                            </div>

                            <button
    onClick={() => handleAddToCart(product)}
    className="bg-accent-ochre hover:opacity-95 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 group/btn text-xs font-bold cursor-pointer"
  >
                              <Plus className="w-4 h-4" />
                              <span>Beli</span>
                            </button>
                          </div>
                        </div>
                      </div>)}
                  </div>}

                {
    /* BENTO ITEM 3: ADJACENT SMALL HIGHLIGHT CARD */
  }
                <div className="bg-stone-900 rounded-[2rem] p-6 text-white text-left flex flex-col sm:flex-row items-center justify-between gap-6 border border-stone-800">
                  <div className="space-y-2 max-w-md">
                    <div className="inline-flex items-center space-x-1.5 bg-white/10 text-stone-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent-ochre" />
                      <span>Eko-Sertifikasi</span>
                    </div>
                    <h5 className="font-serif font-bold text-lg text-white">Bebas Bahan Kimia & 100% Organik</h5>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Sinergi kearifan lokal dalam menjaga ekosistem. Seluruh buah dipanen secara selektif tanpa merusak struktur dahan mangrove induk di kawasan restorasi Langsa.
                    </p>
                  </div>
                  <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-stone-800 border border-stone-700">
                    <img
    src={ASSET_CONFIG.promoBanners.rightSmall}
    alt="Organic details"
    className="w-full h-full object-cover"
    referrerPolicy="no-referrer"
  />
                  </div>
                </div>
              </div>

            </div>

          </div>}

        {
    /* TAB 2: TENTANG KAMI SECTION */
  }
        {currentTab === "tentang" && <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-stone-200/80 space-y-12 text-left">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-ochre flex items-center gap-1">
                <Trees className="w-4 h-4 text-accent-ochre" /> Cerita Di Balik Setiap Botol & Kemasan
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 tracking-tight leading-tight">
                Misi Konservasi Pesisir Langsa Melalui Produk Kreatif Agro-Marina
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                Mangrovise didirikan di Kota Langsa, Provinsi Aceh, sebagai wadah inovasi sosial untuk menyelamatkan ekosistem pesisir dari ancaman abrasi parah. Kawasan muara dan pesisir Langsa menyimpan potensi luar biasa berupa hutan mangrove yang melimpah. Melalui hilirisasi produk pangan bernilai tambah tinggi, kami berupaya menghentikan penebangan pohon bakau liar dengan memberikan alternatif penghasilan baru yang jauh lebih menjanjikan bagi warga lokal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-stone-100 pt-10">
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-2xl text-stone-900">Menghubungkan Konsumen dengan Alam</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Banyak orang ingin membantu melestarikan alam namun tidak tahu caranya. Di Mangrovise, kami menyederhanakan proses donasi lingkungan melalui model belanja sehari-hari. Setiap produk yang dibeli menjadi simbol kontribusi nyata:
                </p>
                <ul className="space-y-3 text-xs text-stone-700">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-accent-ochre shrink-0 mt-0.5" />
                    <span><strong>1 Kemasan = 1 Bibit Bakau:</strong> Seluruh biaya pembibitan, perawatan awal, hingga penanaman di tanah pesisir Langsa ditanggung penuh oleh hasil penjualan produk.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-accent-ochre shrink-0 mt-0.5" />
                    <span><strong>Kemitraan Berkelanjutan:</strong> Bermitra dengan kelompok wanita nelayan 'Sari Mangrove' yang mengolah produk secara higienis dengan resep warisan leluhur.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-accent-ochre shrink-0 mt-0.5" />
                    <span><strong>Transparansi Dampak:</strong> Setiap transaksi menghasilkan sertifikat donasi digital yang mencatat nomor id pohon dan kontribusi pengurangan emisi gas karbon Anda secara real-time.</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-lg border border-stone-200">
                <img
    src="images/Banyak.jpeg"
    alt="Wanita nelayan mengolah produk pesisir"
    className="w-full h-full object-cover"
    referrerPolicy="no-referrer"
  />
              </div>
            </div>

            <div className="bg-warm-bg/50 p-6 sm:p-8 rounded-3xl border border-stone-200/50 text-center space-y-4 max-w-2xl mx-auto">
              <h4 className="font-serif font-bold text-lg text-stone-900">Bergabung Menjadi Pahlawan Pesisir Lestari</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Anda tidak hanya membeli makanan atau minuman segar khas pesisir Aceh, Anda sedang berinvestasi langsung pada kesehatan paru-paru dunia. Mari bersama-sama kita restorasi laut kita demi generasi mendatang.
              </p>
              <button
    onClick={() => {
      setCurrentTab("katalog");
    }}
    className="inline-flex items-center space-x-2 bg-mangrove-deep text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition-all cursor-pointer"
  >
                <span>Lihat Katalog Produk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>}

        {
    /* TAB 3: ECO IMPACT INTERACTIVE CALCULATOR */
  }
        {currentTab === "impact" && <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-stone-200/80 space-y-12 text-left">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-ochre flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-accent-ochre" /> Simulasi Kontribusi Hijau Anda
              </span>
              <h2 className="text-3xl font-serif font-bold text-stone-950 tracking-tight">
                Eco-Impact Interactive Calculator
              </h2>
              <p className="text-sm text-stone-500">
                Gunakan slider di bawah untuk mensimulasikan jumlah pembelian produk Mangrovise Anda dan lihat seberapa besar dampak ekologi yang dapat kita hasilkan secara nyata!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
              {
    /* Left Column: Interactive Slider Control */
  }
              <div className="lg:col-span-5 bg-warm-bg p-8 rounded-3xl border border-stone-200/60 space-y-6">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-accent-ochre uppercase tracking-wider block">Atur Jumlah Belanja</span>
                  <label htmlFor="impact-slider" className="text-lg font-bold text-stone-900 flex items-center justify-between">
                    <span>Jumlah Produk:</span>
                    <span className="font-mono text-2xl text-mangrove-deep font-extrabold">{sliderItems} <span className="text-xs font-sans text-stone-400 font-normal">Pack</span></span>
                  </label>
                </div>

                <div className="space-y-3">
                  <input
    id="impact-slider"
    type="range"
    min="1"
    max="100"
    value={sliderItems}
    onChange={(e) => setSliderItems(Number(e.target.value))}
    className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-accent-ochre"
  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono font-bold">
                    <span>1 PACK</span>
                    <span>50 PACK</span>
                    <span>100 PACK</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-150 text-xs text-stone-600 leading-relaxed text-left space-y-1.5">
                  <span className="font-bold text-stone-850 block flex items-center gap-1">
                    <Info className="w-4 h-4 text-accent-ochre shrink-0" />
                    Informasi Estimasi Dampak:
                  </span>
                  <p>Metrik dihitung berdasarkan data rata-rata penyerapan karbon pohon bakau genus Avicennia/Sonneratia per tahun serta standar waktu pengerjaan yang adil bagi ibu pesisir.</p>
                </div>
              </div>

              {
    /* Right Column: Visual Metrics Counters */
  }
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {
    /* Metric 1: Seedlings */
  }
                <div className="bg-white p-6 rounded-2xl border border-stone-200 text-left relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent-ochre/5 rounded-bl-full" />
                  <div className="bg-amber-50 text-accent-ochre p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-6">
                    <Leaf className="w-6 h-6 text-accent-ochre" />
                  </div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Bibit Ditanam</span>
                  <span className="block text-2xl sm:text-3xl font-mono font-bold text-mangrove-deep mt-1">
                    {sliderItems} <span className="text-xs font-sans text-stone-500 font-normal">Bibit</span>
                  </span>
                  <p className="text-[10px] text-stone-500 mt-2">Ditempatkan langsung pada zonasi pesisir Langsa terdampak abrasi.</p>
                </div>

                {
    /* Metric 2: Carbon Absorption */
  }
                <div className="bg-white p-6 rounded-2xl border border-stone-200 text-left relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-mangrove-deep/5 rounded-bl-full" />
                  <div className="bg-mangrove-light text-mangrove-deep p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-mangrove-deep" />
                  </div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Serapan CO₂ / Tahun</span>
                  <span className="block text-2xl sm:text-3xl font-mono font-bold text-accent-ochre mt-1">
                    {(sliderItems * 21.8).toFixed(1)} <span className="text-xs font-sans text-stone-500 font-normal">Kg</span>
                  </span>
                  <p className="text-[10px] text-stone-500 mt-2">Membantu mempercepat dekarbonisasi udara di wilayah selat Aceh.</p>
                </div>

                {
    /* Metric 3: Coastal Women wages */
  }
                <div className="bg-white p-6 rounded-2xl border border-stone-200 text-left relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent-ochre/5 rounded-bl-full" />
                  <div className="bg-amber-50 text-accent-ochre p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-accent-ochre" />
                  </div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Jam Kerja Adil</span>
                  <span className="block text-2xl sm:text-3xl font-mono font-bold text-stone-950 mt-1">
                    {(sliderItems * 0.5).toFixed(1)} <span className="text-xs font-sans text-stone-500 font-normal">Jam</span>
                  </span>
                  <p className="text-[10px] text-stone-500 mt-2">Menyokong upah kerja layak di atas rata-rata bagi nelayan setempat.</p>
                </div>

              </div>
            </div>

            <div className="border-t border-stone-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="font-bold text-sm text-stone-900">Siap untuk Mulai Berkontribusi Sekarang?</h4>
                <p className="text-xs text-stone-500">Anda dapat memilih satu atau beberapa produk olahan mangrove asli di katalog utama kami.</p>
              </div>
              <button
    onClick={() => {
      setCurrentTab("katalog");
    }}
    className="bg-accent-ochre hover:opacity-95 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md cursor-pointer"
  >
                Kembali ke Katalog Belanja
              </button>
            </div>
          </div>}

        {currentTab === "pesanan" && (
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-stone-200/80 space-y-8 text-left">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-ochre flex items-center gap-1">
                <ShoppingBag className="w-4 h-4 text-accent-ochre" /> Riwayat Belanja Lestari Anda
              </span>
              <h2 className="text-3xl font-serif font-bold text-stone-950 tracking-tight">
                Pesanan Saya
              </h2>
              <p className="text-sm text-stone-500">
                Lacak status pesanan pangan mangrove dan kontribusi bibit bakau Anda secara real-time.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-stone-200 rounded-3xl space-y-4">
                <div className="w-16 h-16 bg-warm-bg rounded-2xl flex items-center justify-center mx-auto text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-base text-stone-800">Belum Ada Transaksi</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Anda belum melakukan pemesanan produk Mangrovise. Silakan pilih produk dari katalog kami untuk memulai kontribusi hijau Anda!
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange("katalog")}
                  className="bg-accent-ochre hover:opacity-95 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Mulai Belanja Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="border border-stone-200/80 rounded-3xl overflow-hidden hover:shadow-md transition-all bg-white"
                  >
                    {/* Order Card Header */}
                    <div className="bg-stone-50 p-6 border-b border-stone-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-500">No. Invoice:</span>
                          <span className="text-xs font-mono font-bold text-stone-900">{order.invoiceNo || `INV-${order.orderId}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{order.tanggal}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-stone-500">Status:</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm animate-pulse">
                          {order.status || "In Process"}
                        </span>
                      </div>
                    </div>

                    {/* Order Card Body */}
                    <div className="p-6 space-y-4">
                      <div className="divide-y divide-stone-100">
                        {order.items && order.items.map((item, index) => (
                          <div key={index} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-4">
                              <img 
                                src={item.image || "https://via.placeholder.com/150"} 
                                alt={item.name} 
                                className="w-12 h-12 object-cover rounded-xl border border-stone-100 shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-left">
                                <h4 className="text-xs font-bold text-stone-900">{item.name}</h4>
                                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                                  Rp {item.price.toLocaleString("id-ID")} x {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-stone-900 shrink-0">
                              Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Eco Impact Contribution Info */}
                      <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 font-medium">
                          <Leaf className="w-4 h-4 text-accent-ochre animate-bounce shrink-0" />
                          <span>Kontribusi Anda: <strong>{order.ecoDonation || Math.round(order.total / 10000)} Bibit Bakau</strong> ditanam di Kuala Langsa</span>
                        </div>
                        <div className="text-emerald-700 font-semibold font-mono">
                          Setara -{order.carbonSaved || Math.round(order.total / 10000) * 2} kg CO₂ / tahun
                        </div>
                      </div>

                      {/* Alamat Pengiriman */}
                      <div className="border-t border-stone-100/80 pt-4 mt-4 text-left">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Alamat Pengiriman:</span>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed font-medium break-words">{order.alamat || "Alamat lengkap pengiriman tidak diisi"}</p>
                      </div>
                    </div>

                    {/* Order Card Footer */}
                    <div className="bg-stone-50/60 p-6 border-t border-stone-150 flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-500">Total Pembayaran:</span>
                      <span className="text-base font-mono font-bold text-mangrove-deep">
                        Rp {order.total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {
    /* 6. SLIDE-OVER SHOPPING CART DRAWER */
  }
      <AnimatePresence>
        {isCartOpen && <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              
              {
    /* Overlay Backdrop Blur */
  }
              <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setIsCartOpen(false)}
    className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm transition-opacity"
  />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
                <motion.div
    initial={{ x: "100%" }}
    animate={{ x: 0 }}
    exit={{ x: "100%" }}
    transition={{ type: "spring", damping: 25, stiffness: 200 }}
    className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
  >
                  {
    /* Header Cart */
  }
                  <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center space-x-2 text-stone-900 text-left">
                      <ShoppingBag className="w-5 h-5 text-mangrove-deep" />
                      <h3 className="font-serif font-bold text-lg">Keranjang Belanja</h3>
                      <span className="bg-mangrove-light text-mangrove-deep text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {totalCartItems} Item
                      </span>
                    </div>
                    <button
    onClick={() => setIsCartOpen(false)}
    className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
  >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {
    /* Cart Body - Items List */
  }
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center border border-stone-100">
                          <ShoppingCart className="w-8 h-8 text-stone-300" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-stone-850 text-sm">Keranjang Anda Kosong</p>
                          <p className="text-xs text-stone-500 max-w-xs">Jelajahi rasa eksotik mangrove pesisir Langsa dan tambahkan beberapa item sehat.</p>
                        </div>
                        <button
    onClick={() => setIsCartOpen(false)}
    className="bg-mangrove-deep text-stone-50 text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-colors cursor-pointer"
  >
                          Mulai Belanja Sekarang
                        </button>
                      </div> : <div className="space-y-4">
                        {cart.map((item) => <div
    key={item.product.id}
    className="flex items-center space-x-4 p-3 rounded-xl border border-stone-150 bg-white hover:border-stone-350 transition-colors text-left"
  >
                            <img
    src={item.product.image}
    alt={item.product.name}
    className="w-16 h-16 object-cover rounded-lg bg-stone-50 shrink-0 border border-stone-100"
    referrerPolicy="no-referrer"
  />
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-stone-900 line-clamp-1 leading-tight">
                                {item.product.name}
                              </h4>
                              <span className="block text-xs font-mono font-bold text-mangrove-deep mt-0.5">
                                Rp {item.product.price.toLocaleString("id-ID")}
                              </span>

                              <div className="flex items-center justify-between mt-2">
                                {
    /* Quantity Toggler */
  }
                                <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-lg border border-stone-200">
                                  <button
    onClick={() => handleDecreaseQuantity(item.product.id)}
    className="text-stone-600 hover:text-stone-950 p-1 rounded hover:bg-stone-200 transition-colors cursor-pointer"
  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-mono font-bold text-stone-900 w-5 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
    onClick={() => handleAddToCart(item.product)}
    className="text-stone-600 hover:text-stone-950 p-1 rounded hover:bg-stone-200 transition-colors cursor-pointer"
  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
    onClick={() => handleRemoveItem(item.product.id)}
    className="text-stone-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
    title="Hapus barang"
  >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>)}
                      </div>}
                  </div>

                  {
    /* Cart Footer - Totals & Ecological impact summary */
  }
                  {cart.length > 0 && <div className="p-6 border-t border-stone-200 bg-stone-50 space-y-4">
                      
                      {
    /* Eco contribution summary card */
  }
                      <div className="bg-mangrove-deep text-mangrove-light p-4 rounded-xl border border-mangrove-deep flex items-start space-x-3 text-left">
                        <Leaf className="w-5 h-5 text-accent-ochre shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <span className="text-[9px] uppercase font-extrabold text-accent-ochre tracking-wider block">Eco-Impact Aktif</span>
                          <p className="text-xs text-white font-bold leading-tight mt-0.5">
                            Belanja Anda setara dengan mendonasikan {ecoMetrics.seedlings} bibit bakau, mengurangi emisi {ecoMetrics.carbonOffset} kg CO₂/tahun.
                          </p>
                        </div>
                      </div>

                      {
    /* Payment details */
  }
                      <div className="space-y-2 text-xs text-stone-600">
                        <div className="flex justify-between">
                          <span>Subtotal Barang</span>
                          <span className="font-mono text-stone-900 font-bold">Rp {cartTotal.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between items-center text-mangrove-deep">
                          <span className="flex items-center space-x-1">
                            <span>Sertifikasi Eco-Donasi</span>
                            <span className="bg-mangrove-light text-mangrove-deep text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Gratis</span>
                          </span>
                          <span className="font-mono font-bold text-mangrove-deep">Rp 0</span>
                        </div>
                        <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-bold text-stone-900">
                          <span>Total Pembayaran</span>
                          <span className="font-mono text-mangrove-deep">Rp {cartTotal.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      {/* Alamat Lengkap Pengiriman */}
                      <div className="space-y-1.5 text-left border-t border-stone-200/60 pt-3">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Alamat Lengkap Pengiriman</label>
                        <textarea
                          rows={2}
                          required
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Masukkan alamat pengiriman lengkap Anda (RT/RW, kecamatan, kota, kode pos)..."
                          className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-accent-ochre/20 focus:border-accent-ochre transition-all resize-none placeholder-stone-400 font-medium"
                        />
                      </div>

                      <button
                        onClick={handleCheckout}
                        className="w-full bg-accent-ochre hover:bg-accent-ochre/95 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-accent-ochre/10 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <QrCode className="w-5 h-5" />
                        <span>Bayar via QRIS (Simulasi)</span>
                      </button>
                    </div>}

                </motion.div>
              </div>
            </div>
          </div>}
      </AnimatePresence>

      {
    /* 7. QRIS SIMULATION & ecological INVOICE RECEIPT MODAL */
  }
      <AnimatePresence>
        {isCheckoutModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            
            {
    /* Backdrop Blur */
  }
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => {
      if (checkoutStatus !== "verifying") setIsCheckoutModalOpen(false);
    }}
    className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm"
  />

            {
    /* Modal Box */
  }
            <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.95, opacity: 0 }}
    className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 border border-stone-100 flex flex-col"
  >
              
              {
    /* Modal Header */
  }
              <div className="bg-stone-50 p-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-stone-950 text-left">
                  <QrCode className="w-5 h-5 text-accent-ochre" />
                  <span className="font-serif font-bold text-base">Gerbang Pembayaran QRIS Lestari</span>
                </div>
                {checkoutStatus !== "verifying" && <button
    onClick={() => setIsCheckoutModalOpen(false)}
    className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
  >
                    <X className="w-4 h-4" />
                  </button>}
              </div>

              {
    /* Modal Body: QRIS scan state */
  }
              {checkoutStatus === "pending" && <div className="p-6 text-center space-y-6">
                  
                  {
    /* QRIS Top indicators */
  }
                  <div className="space-y-2">
                    <p className="text-xs text-stone-500">Pindai kode QRIS di bawah menggunakan dompet digital pilihan Anda (Gopay, OVO, Dana, LinkAja, Mobile Banking).</p>
                    
                    <div className="bg-stone-50 py-2.5 px-4 rounded-xl inline-flex items-center justify-center space-x-2 border border-stone-200">
                      <Clock className="w-4 h-4 text-accent-ochre animate-pulse" />
                      <span className="text-xs font-mono font-bold text-stone-900">Masa Berlaku: {formatTimer(countdown)}</span>
                    </div>
                  </div>

                  {
    /* QR Code Graphic Frame */
  }
                  <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-stone-200 max-w-[240px] mx-auto relative group">
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-accent-ochre" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-accent-ochre" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-accent-ochre" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-accent-ochre" />
                    
                    <div className="aspect-square bg-stone-50 flex items-center justify-center relative overflow-hidden rounded-xl">
                      {
    /* Embedded custom mock QR image overlaying with a brand center point */
  }
                      <svg width="180" height="180" viewBox="0 0 100 100" fill="currentColor" className="text-stone-950">
                        <rect x="5" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="10" y="10" width="10" height="10" />
                        <rect x="75" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="80" y="10" width="10" height="10" />
                        <rect x="5" y="75" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="10" y="80" width="10" height="10" />
                        <rect x="35" y="35" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,2" />
                        <rect x="42" y="42" width="16" height="16" fill="currentColor" opacity="0.15" />
                        {
    /* Random QR points */
  }
                        <path d="M 30,10 H 40 V 15 H 30 Z M 50,5 H 60 V 10 H 50 Z M 70,30 H 75 V 40 H 70 Z M 10,35 H 20 V 45 H 10 Z M 85,60 H 95 V 70 H 85 Z M 45,75 H 55 V 80 H 45 Z M 75,85 H 85 V 95 H 75 Z" />
                        <circle cx="50" cy="50" r="8" className="text-accent-ochre" />
                      </svg>
                      {
    /* Center floating leaf logo */
  }
                      <div className="absolute inset-0 m-auto w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md border border-stone-100">
                        <Leaf className="w-4.5 h-4.5 text-accent-ochre" />
                      </div>
                    </div>
                    <span className="block text-[10px] font-mono font-extrabold text-stone-400 mt-3 uppercase tracking-widest">NMID: ID1029108219</span>
                  </div>

                  {
    /* Pricing Overview */
  }
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-left space-y-2">
                    <div className="flex justify-between text-xs text-stone-500">
                      <span>Total Biaya Belanja:</span>
                      <span className="font-mono text-stone-900 font-bold">Rp {cartTotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-xs text-mangrove-deep font-bold">
                      <span className="flex items-center space-x-1">
                        <Leaf className="w-3.5 h-3.5" />
                        <span>Komitmen Donasi Hijau:</span>
                      </span>
                      <span>+{ecoMetrics.seedlings} Bibit Bakau</span>
                    </div>
                    <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold text-stone-900">
                      <span>Jumlah Tagihan:</span>
                      <span className="font-mono text-mangrove-deep text-base">Rp {cartTotal.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {
    /* Action button */
  }
                  <div className="pt-2">
                    <button
    onClick={handleVerifyPayment}
    className="w-full bg-mangrove-deep hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
  >
                      <Check className="w-4 h-4 text-accent-ochre" />
                      <span>Simulasi Konfirmasi Pembayaran Sukses</span>
                    </button>
                    <p className="text-[10px] text-stone-400 mt-2">Menekan tombol ini mensimulasikan notifikasi instan callback sukses dari Payment Gateway Bank Aceh.</p>
                  </div>

                </div>}

              {
    /* Modal Body: Verifying transition state */
  }
              {checkoutStatus === "verifying" && <div className="p-12 text-center space-y-6">
                  
                  {
    /* Dynamic spinner */
  }
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-accent-ochre border-t-transparent rounded-full animate-spin" />
                    <QrCode className="w-8 h-8 text-accent-ochre absolute inset-0 m-auto animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-lg text-stone-900">Sedang Memverifikasi Pembayaran</h4>
                    <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                      Sedang memverifikasi transaksi melalui gateway Bank Aceh Syariah & QRIS Nasional secara real-time. Mohon tidak menutup jendela ini...
                    </p>
                  </div>

                </div>}

              {
    /* Modal Body: Invoice Receipt Success state */
  }
              {checkoutStatus === "success" && activeReceipt && <div className="p-6 text-center space-y-6 overflow-y-auto max-h-[75vh]">
                  
                  {
    /* Success Header Icon */
  }
                  <div className="space-y-2">
                    <div className="w-14 h-14 bg-mangrove-light text-mangrove-deep rounded-full flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-8 h-8 text-mangrove-deep" />
                    </div>
                    <h4 className="font-serif font-bold text-2xl text-stone-950">Transaksi Berhasil!</h4>
                    <p className="text-xs text-stone-500">Invoice pembelian lestari Anda telah diterbitkan dengan nomor seri berikut.</p>
                  </div>

                  {
    /* Invoice Printable Sheet */
  }
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 text-left font-mono text-[11px] text-stone-700 space-y-4 relative overflow-hidden">
                    {
    /* Top watermark line */
  }
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent-ochre" />
                    
                    {
    /* Invoice header info */
  }
                    <div className="flex justify-between items-start pb-3 border-b border-dashed border-stone-300">
                      <div>
                        <span className="font-bold text-stone-900 block">GROVIESHOP ACEH</span>
                        <span className="text-[9px] text-stone-400 block">Kota Langsa, Prov. Aceh, Indonesia</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-stone-900">EKO-INVOICE</span>
                        <span className="text-[9px] text-stone-400 block">{activeReceipt.invoiceNo}</span>
                      </div>
                    </div>

                    {
    /* Invoice Transaction metadata */
  }
                    <div className="grid grid-cols-2 gap-y-1 text-[10px]">
                      <div>ID Transaksi:</div>
                      <div className="text-right font-bold text-stone-900">{activeReceipt.transactionId}</div>
                      <div>Tanggal:</div>
                      <div className="text-right">{activeReceipt.date}</div>
                      <div>Metode Pembayaran:</div>
                      <div className="text-right">QRIS Bank Aceh</div>
                      <div>Status Eko-Dampak:</div>
                      <div className="text-right text-mangrove-deep font-bold">🌿 AKTIF</div>
                    </div>

                    {
    /* Items table list */
  }
                    <div className="border-t border-b border-dashed border-stone-300 py-3 space-y-2">
                      <div className="grid grid-cols-12 font-bold text-stone-900">
                        <div className="col-span-6">Nama Barang</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-4 text-right">Subtotal</div>
                      </div>
                      {activeReceipt.items.map((item, i) => <div key={i} className="grid grid-cols-12 text-stone-600">
                          <div className="col-span-6 truncate">{item.product.name}</div>
                          <div className="col-span-2 text-center">x{item.quantity}</div>
                          <div className="col-span-4 text-right">Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</div>
                        </div>)}
                    </div>

                    {
    /* Summary Totals */
  }
                    <div className="space-y-1.5 text-right text-[10px]">
                      <div className="flex justify-between">
                        <span>Total Belanja:</span>
                        <span className="font-bold text-stone-900">Rp {activeReceipt.subtotal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Biaya Sertifikasi Eko:</span>
                        <span>Rp 0</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-stone-950 pt-1">
                        <span>Total Pembayaran:</span>
                        <span>Rp {activeReceipt.subtotal.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    {/* Alamat Pengiriman */}
                    <div className="border-t border-dashed border-stone-300 pt-3 text-[10px] text-left">
                      <span className="font-bold text-stone-900 block uppercase">Alamat Pengiriman:</span>
                      <span className="text-stone-600 block mt-1 leading-normal break-words">{activeReceipt.alamat || "Tidak ada alamat"}</span>
                    </div>

                    {
    /* Green ecological certification receipt details */
  }
                    <div className="bg-mangrove-deep text-white p-3.5 rounded-xl border border-mangrove-deep text-left space-y-1.5 text-[10px]">
                      <span className="font-bold text-accent-ochre flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5 text-accent-ochre shrink-0" />
                        SERTIFIKASI DONASI MANDIRI:
                      </span>
                      <p className="leading-relaxed text-stone-200">
                        Atas nama pembeli, Mangrovise berkomitmen mengalokasikan pendanaan untuk penanaman sebanyak <strong className="text-white text-xs">{activeReceipt.ecoDonation} bibit bakau</strong> di muara pesisir Kuala Langsa. Estetika penyerapan emisi setara <strong className="text-white text-xs">{activeReceipt.carbonSaved} kg CO₂ / tahun</strong>.
                      </p>
                    </div>

                    <div className="text-center text-[8px] text-stone-400 pt-2">
                      Terima kasih atas kontribusi nyata Anda bagi kelestarian pesisir Aceh.
                    </div>
                  </div>

                  {
    /* Action buttons */
  }
                  <div className="flex gap-3">
                    <button
    onClick={() => {
      window.print();
    }}
    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-850 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
  >
                      Cetak Invoice
                    </button>
                    <button
    onClick={() => setIsCheckoutModalOpen(false)}
    className="flex-1 bg-mangrove-deep text-white font-bold py-3 rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer"
  >
                      Selesai & Tutup
                    </button>
                  </div>

                </div>}

            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* 8. FOOTER */
  }
      <footer className="bg-stone-900 text-stone-300 py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4 md:col-span-2 text-left">
            {/* LOGO OTOMATIS: Memanggil fungsi logo utama agar ikut berganti ke logo.png */}
            {renderLogo()}

            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Inovasi e-commerce kearifan lokal Agro-Marina. Dikembangkan secara khusus untuk mendukung pertumbuhan ekonomi lestari, perlindungan pantai dari abrasi, dan pemasaran produk olahan makanan-minuman tanaman mangrove khas pesisir Kota Langsa, Aceh.
            </p>
            <p className="text-xs text-stone-500">
              © {(/* @__PURE__ */ new Date()).getFullYear()} Mangrovise Langsa, Aceh. Hak Cipta Dilindungi Undang-Undang.
            </p>
          </div>

          <div className="text-left space-y-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-wider">Misi Keberlanjutan</h5>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => {
    setCurrentTab("tentang");
  }} className="hover:text-accent-ochre transition-colors cursor-pointer">
                  Kemitraan Wanita Nelayan
                </button>
              </li>
              <li>
                <button onClick={() => {
    setCurrentTab("impact");
  }} className="hover:text-accent-ochre transition-colors cursor-pointer">
                  Penyerap Emisi Karbon
                </button>
              </li>
              <li>
                <button onClick={() => {
    setCurrentTab("tentang");
  }} className="hover:text-accent-ochre transition-colors cursor-pointer">
                  Restorasi Pesisir Langsa
                </button>
              </li>
            </ul>
          </div>

          <div className="text-left space-y-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-wider">Metode Kontak & Lokasi</h5>
            <p className="text-xs text-stone-400 leading-relaxed">
              Koperasi Pesisir Sari Mangrove<br />
              Kuala Langsa, Kota Langsa, Prov. Aceh, Indonesia
            </p>
            <div className="flex items-center space-x-1.5 text-xs text-stone-400">
              <MapPin className="w-3.5 h-3.5 text-accent-ochre shrink-0" />
              <span>Langsa, Aceh</span>
            </div>
          </div>

        </div>
      </footer>

      {/* 9. MODAL LOGIN & REGISTRASI PEMBELI */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-stone-200 overflow-hidden z-10"
            >
              {/* Pattern Header */}
              <div className="bg-mangrove-deep p-8 text-white relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-ochre/10 rounded-bl-full pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center space-x-2 text-accent-ochre">
                    <Leaf className="w-5 h-5 animate-bounce" />
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-accent-ochre">E-Commerce Lestari</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold tracking-tight">
                    {isRegistering ? "Gabung Mangrovise" : "Selamat Datang"}
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {isRegistering 
                      ? "Daftar akun pembeli untuk melacak pesanan dan donasi bibit bakau secara real-time."
                      : "Masuk untuk melanjutkan transaksi dan meninjau sertifikat kontribusi ekologi Anda."}
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="p-8 space-y-5 text-left">
                {authError && (
                  <div className="bg-red-50 text-red-800 text-xs p-4 rounded-2xl border border-red-200 font-medium">
                    {authError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-accent-ochre/20 focus:border-accent-ochre transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Kata Sandi</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-4 pr-11 py-3 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-accent-ochre/20 focus:border-accent-ochre transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 flex items-center justify-center cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-mangrove-deep hover:bg-mangrove-deep/90 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  <span>{isRegistering ? "Mulai Konservasi & Daftar" : "Masuk ke Akun"}</span>
                </button>

                {/* Switcher Option */}
                <div className="text-center pt-2">
                  <p className="text-xs text-stone-500">
                    {isRegistering ? "Sudah memiliki akun?" : "Belum bergabung?"}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setAuthError("");
                      }}
                      className="text-accent-ochre font-bold hover:underline"
                    >
                      {isRegistering ? "Masuk Sekarang" : "Daftar Akun Baru"}
                    </button>
                  </p>
                </div>
              </form>

              {/* Close Button top corner */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {
    /* 9. GLOBAL INTERACTIVE TOAST NOTIFICATIONS */
  }
      <AnimatePresence>
        {toast && <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className="fixed bottom-6 left-6 z-50 max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-4 flex items-center space-x-3 text-left"
  >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toast.type === "success" ? "bg-mangrove-light text-mangrove-deep" : "bg-amber-50 text-accent-ochre"}`}>
              {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-900 leading-snug">{toast.message}</p>
            </div>
            <button
    onClick={() => setToast(null)}
    className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
  >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>}
      </AnimatePresence>

    </div>;
}
