import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, CheckCircle2, ArrowLeft, Plus, Minus, CreditCard } from 'lucide-react';
import { MENU_ITEMS, GOOGLE_SHEET_URL } from './constants';
import { OrderItem, Order } from './types';

type AppState = 'menu' | 'checkout' | 'success';

export default function App() {
  const [view, setView] = useState<AppState>('menu');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative">
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-blue-600 text-white p-4 shadow-md flex items-center justify-between">
          {view !== 'menu' && (
            <button 
              onClick={() => setView(view === 'checkout' ? 'menu' : 'menu')}
              className="p-1 hover:bg-blue-700 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-xl font-bold flex-1 text-center">Nippy Chippy</h1>
          <div className="w-8"></div> {/* Spacer for symmetry */}
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
