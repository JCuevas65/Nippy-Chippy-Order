import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, CheckCircle2, ArrowLeft, Plus, Minus, CreditCard, LogOut, Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { MENU_ITEMS, GOOGLE_SHEET_URL } from './constants';
import { OrderItem, Order } from './types';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

type AppState = 'menu' | 'checkout' | 'success';
type AuthMode = 'signin' | 'signup' | 'verify';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');

  const [view, setView] = useState<AppState>('menu');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.emailVerified) {
          setUser(currentUser);
          setAuthMode('signin'); // Reset mode for next time
        } else {
          // User exists but not verified
          setVerificationEmail(currentUser.email || '');
          setAuthMode('verify');
          signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const signedInUser = userCredential.user;
      
      if (!signedInUser.emailVerified) {
        setVerificationEmail(signedInUser.email || '');
        setAuthMode('verify');
        await signOut(auth);
      } else {
        setUser(signedInUser);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      setAuthError("Email or password is incorrect");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (password.length < 6) {
      setAuthError("Password should be at least 6 characters");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      await sendEmailVerification(newUser);
      setVerificationEmail(newUser.email || '');
      setAuthMode('verify');
      await signOut(auth);
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("User already exists. Please sign in");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("Password should be at least 6 characters");
      } else {
        setAuthError(error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setView('menu');
      setQuantities({});
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Google users are usually verified, but we can check if needed
      setUser(result.user);
    } catch (error: any) {
      console.error("Google sign in error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setAuthError("This domain is not authorized in Firebase. Please add this URL to 'Authorized domains' in your Firebase Console.");
      } else if (error.code !== 'auth/cancelled-popup-request') {
        setAuthError(error.message);
      }
    }
  };

  const cartItems = useMemo(() => {
    return MENU_ITEMS.filter(item => quantities[item.id] > 0).map(item => ({
      ...item,
      quantity: quantities[item.id]
    }));
  }, [quantities]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    
    const order: Order = {
      id: `NC-${Math.floor(100000 + Math.random() * 900000)}`,
      items: cartItems,
      total: totalAmount,
      status: 'pending'
    };
    setCurrentOrder(order);
    setView('checkout');
    window.scrollTo(0, 0);
  };

  const handlePay = async () => {
    if (currentOrder) {
      const updatedOrder: Order = { ...currentOrder, status: 'paid' };
      setCurrentOrder(updatedOrder);
      setView('success');
      window.scrollTo(0, 0);

      // Send to Google Sheets
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL || GOOGLE_SHEET_URL;
      if (sheetUrl) {
        try {
          await fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors for simple redirects
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedOrder),
          });
          console.log('Order sent to Google Sheets');
        } catch (error) {
          console.error('Error sending order to Google Sheets:', error);
        }
      }
    }
  };

  const categories = ['Fish', 'Chips', 'Drinks'] as const;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col my-auto">
          <div className="bg-blue-600 p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Nippy Chippy</h1>
            <p className="text-blue-100">Delicious Fish & Chips at your fingertips</p>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {authMode === 'verify' ? (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Mail size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Verify your email</h2>
                    <p className="text-gray-600">
                      We have sent you a verification email to <span className="font-semibold text-blue-600">{verificationEmail}</span>. Please verify it and log in.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError('');
                    }}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-700 transition-all"
                  >
                    <LogIn size={20} />
                    <span>Login</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={authMode}
                  initial={{ opacity: 0, x: authMode === 'signin' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: authMode === 'signin' ? 20 : -20 }}
                >
                  <h2 className="text-2xl font-bold mb-6 text-center">
                    {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                  </h2>

                  <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    {authError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center space-x-2 border border-red-100">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                      {authMode === 'signin' ? <LogIn size={20} /> : <UserPlus size={20} />}
                      <span>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</span>
                    </button>
                  </form>

                  {authMode === 'signin' && (
                    <div className="mt-4">
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500 uppercase tracking-wider text-xs font-semibold">Or continue with</span>
                        </div>
                      </div>

                      <button
                        onClick={handleGoogleSignIn}
                        className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold flex items-center justify-center space-x-3 shadow-sm hover:bg-gray-50 transition-all active:scale-[0.98]"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span>Sign in with Google</span>
                      </button>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                        setAuthError('');
                      }}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {authMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative">
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-blue-600 text-white p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {view !== 'menu' && (
              <button 
                onClick={() => setView(view === 'checkout' ? 'menu' : 'menu')}
                className="p-1 hover:bg-blue-700 rounded-full transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
          </div>
          <h1 className="text-xl font-bold flex-1 text-center">Nippy Chippy</h1>
          <button 
            onClick={handleLogout}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            {view === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-8"
              >
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-blue-800 text-sm font-medium">Welcome back!</p>
                  <p className="text-blue-600 text-xs truncate">{user.email}</p>
                </div>

                {categories.map(category => (
                  <section key={category}>
                    <h2 className="text-lg font-bold text-blue-800 border-b-2 border-blue-100 pb-2 mb-4">
                      {category}
                    </h2>
                    <div className="space-y-4">
                      {MENU_ITEMS.filter(item => item.category === category).map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <div>
                            <h3 className="font-medium text-gray-800">{item.name}</h3>
                            <p className="text-blue-600 font-semibold">${item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-3 bg-gray-50 rounded-full p-1 border border-gray-200">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-blue-600 hover:bg-blue-50"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-6 text-center font-bold text-gray-700">
                              {quantities[item.id] || 0}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full shadow-sm text-white hover:bg-blue-700"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </motion.div>
            )}

            {view === 'checkout' && currentOrder && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-2">
                    <ShoppingBag size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Order Summary</h2>
                  <p className="text-gray-500 font-mono">Order ID: {currentOrder.id}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                  {currentOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-xs">
                          {item.quantity}x
                        </span>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${currentOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    onClick={handlePay}
                    className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95"
                  >
                    <CreditCard size={20} />
                    <span>Pay with PayPal</span>
                  </button>
                  <p className="text-center text-xs text-gray-400 px-4">
                    By clicking "Pay with PayPal", you agree to Nippy Chippy's terms of service and privacy policy.
                  </p>
                </div>
              </motion.div>
            )}

            {view === 'success' && currentOrder && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 flex flex-col items-center justify-center text-center space-y-6 flex-1"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 size={48} />
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900">Order Accepted!</h2>
                  <p className="text-gray-600">
                    Thank you for your order. We're getting your fish and chips ready!
                  </p>
                </div>

                <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Order Number</p>
                  <p className="text-xl font-mono font-bold text-blue-600">{currentOrder.id}</p>
                </div>

                <button
                  onClick={() => {
                    setQuantities({});
                    setView('menu');
                  }}
                  className="mt-8 text-blue-600 font-semibold hover:underline"
                >
                  Place another order
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sticky Footer for Menu */}
        {view === 'menu' && totalAmount > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          >
            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-between px-6 shadow-lg transition-all active:scale-95"
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag size={20} />
                <span>{cartItems.length} items</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Proceed to Checkout</span>
                <ChevronRight size={20} />
              </div>
              <span className="text-lg">${totalAmount.toFixed(2)}</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
