import { useState, useEffect } from 'react';
import axios from 'axios';

// --- TYPES ---
interface Transaction {
  id: number;
  sourceAccountId: number;
  targetAccountId: number;
  amount: number;
  timestamp: string;
}

interface UserProfile {
  id: number;
  name: string;
  username: string;
  avatar: string;
}

// --- CONSTANTS ---
const USERS: UserProfile[] = [
  { id: 1, name: 'Admin (You)', username: 'admin', avatar: 'AD' },
  { id: 2, name: 'Alice', username: 'alice', avatar: 'AL' },
  { id: 3, name: 'Bob', username: 'bob', avatar: 'BO' },
];

function App() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authHeader, setAuthHeader] = useState<string | null>(null);

  const [view, setView] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState<number>(0);
  const [targetId, setTargetId] = useState<number>(2);

  // --- INIT ---
  useEffect(() => {
    if (currentUser && authHeader) {
      fetchData();
      // Default to sending money to someone else, not self
      setTargetId(currentUser.id === 1 ? 2 : 1);
    }
  }, [currentUser, authHeader]);

  // --- HANDLERS ---
  const handleLogin = (user: UserProfile) => {
    const token = btoa(`${user.username}:password123`);
    setAuthHeader(`Basic ${token}`);
    setCurrentUser(user);
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthHeader(null);
    setTransactions([]);
    setBalance(0);
    setShowProfileMenu(false);
  };

  const fetchData = async () => {
    if (!currentUser || !authHeader) return;
    try {
      const balRes = await axios.get(`https://atomic-bank.onrender.com/api/banking/${currentUser.id}/balance`, { headers: { Authorization: authHeader } });
      setBalance(balRes.data);
      const histRes = await axios.get(`https://atomic-bank.onrender.com/api/banking/${currentUser.id}/transactions`, { headers: { Authorization: authHeader } });
      setTransactions(histRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async () => {
    if (amount <= 0) return alert("Enter a valid amount");
    setLoading(true);
    try {
      await axios.post('https://atomic-bank.onrender.com/api/banking/transfer', {
        fromAccountId: currentUser?.id,
        toAccountId: targetId,
        amount: amount
      }, { headers: { Authorization: authHeader } });

      alert(`Successfully sent $${amount} to User #${targetId}`);
      setAmount(0);
      fetchData();
    } catch (error: any) {
      alert("Transfer Failed: " + (error.response?.data?.message || "Check balance"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    try {
      await axios.post('https://atomic-bank.onrender.com/api/banking/deposit', {
        toAccountId: currentUser?.id,
        amount: 500
      }, { headers: { Authorization: authHeader } });
      alert("Added $500 to wallet!");
      fetchData();
    } catch (error) {
      alert("Deposit Failed");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">AtomicBank</h1>
          <p className="text-gray-500 mb-8">Secure Login Portal</p>
          <div className="space-y-3">
            {USERS.map(user => (
              <button key={user.id} onClick={() => handleLogin(user)} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-500 transition group">
                <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 group-hover:bg-emerald-500 group-hover:text-white transition">{user.avatar}</div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 group-hover:text-emerald-700">{user.name}</p>
                  <p className="text-xs text-gray-400">ID: #{user.id}</p>
                </div>
                <span className="ml-auto text-gray-300 group-hover:text-emerald-500">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- APP LAYOUT ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col p-6 shadow-2xl z-10">
        <h1 className="text-2xl font-bold mb-10">Atomic<span className="text-emerald-400">Bank</span></h1>
        <nav className="space-y-2 flex-1">
          <SidebarButton label="📊 Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarButton label="🧾 Transactions" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarButton label="⚙️ Settings" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* HEADER */}
        <header className="h-20 bg-white border-b border-gray-200 flex justify-between items-center px-8 shadow-sm shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 capitalize">{view}</h2>

          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-700">{currentUser.name}</p>
                <p className="text-xs text-emerald-600 font-bold">Online</p>
              </div>
              <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-emerald-100">{currentUser.avatar}</div>
            </button>

            {/* PROFILE DROPDOWN */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-down">
                <div className="px-4 py-3 border-b border-gray-100 mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase">Signed in as</p>
                  <p className="text-sm font-bold text-gray-800 truncate">@{currentUser.username}</p>
                </div>
                <button onClick={() => setView('settings')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50">Account Settings</button>
                <div className="border-t border-gray-100 my-2"></div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-2">
                  <span>🚪</span> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* --- DASHBOARD VIEW --- */}
          {view === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Balance Card */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-slate-400 text-sm font-bold mb-1 tracking-wider">AVAILABLE BALANCE</p>
                  <h3 className="text-5xl font-bold tracking-tight">${balance.toFixed(2)}</h3>
                </div>
                <button onClick={handleDeposit} disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50">
                  <span>+</span> Add $500
                </button>
              </div>

              {/* Transfer Form */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-slate-800">Quick Transfer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Recipient</label>
                    <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700" value={targetId} onChange={(e) => setTargetId(Number(e.target.value))}>
                      {USERS.filter(u => u.id !== currentUser.id).map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount</label>
                    <input
                      type="number"
                      min="0" // Helper for browser spinners
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"

                      // 1. Show empty string if 0 (for placeholder)
                      value={amount || ''}

                      // 2. THE FIX: If value is negative, force it to 0 immediately
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAmount(val < 0 ? 0 : val);
                      }}

                      placeholder="0.00"

                      // 3. Prevent typing the minus key (-) entirely
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>
                <button onClick={handleTransfer} disabled={loading || amount <= 0} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-lg disabled:opacity-50">
                  {loading ? 'Processing...' : 'Send Money Now'}
                </button>
              </div>

              {/* Recent Activity Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-700">Recent Activity</h3>
                  <button onClick={() => setView('history')} className="text-sm text-emerald-600 font-bold hover:underline">View All</button>
                </div>
                <TransactionTable transactions={transactions.slice(0, 3)} myId={currentUser.id} />
              </div>
            </div>
          )}

          {/* --- HISTORY VIEW --- */}
          {view === 'history' && (
            <div className="max-w-5xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 text-slate-800">Full Transaction History</h3>
              <TransactionTable transactions={transactions} myId={currentUser.id} />
            </div>
          )}

          {/* --- SETTINGS VIEW --- */}
          {view === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-slate-800">Profile Settings</h3>

                <div className="flex items-center gap-6 mb-8">
                   <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 border-4 border-white shadow-lg">{currentUser.avatar}</div>
                   <div>
                      <h2 className="text-2xl font-bold text-slate-800">{currentUser.name}</h2>
                      <p className="text-emerald-600 font-medium">Verified User</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Username</p>
                      <p className="font-mono text-slate-700 font-medium">@{currentUser.username}</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Account ID</p>
                      <p className="font-mono text-slate-700 font-medium">#{currentUser.id}</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Security</p>
                      <p className="text-slate-700 font-medium">Basic Auth (Active)</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Member Since</p>
                      <p className="text-slate-700 font-medium">Jan 2026</p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function SidebarButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full text-left py-3 px-4 rounded-lg font-medium transition duration-200 ${active ? 'bg-emerald-600 text-white shadow-md translate-x-1' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
      {label}
    </button>
  );
}

function TransactionTable({ transactions, myId }: { transactions: Transaction[], myId: number }) {
  if (transactions.length === 0) return <div className="text-center py-12 text-gray-400 italic">No transactions found</div>;

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
          <th className="pb-4 pl-2">Status</th>
          <th className="pb-4">Details</th>
          <th className="pb-4 text-right pr-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(tx => {
          const isSender = tx.sourceAccountId === myId;
          const isDeposit = tx.sourceAccountId === -1;
          return (
            <tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition group">
              <td className="py-4 pl-2">
                {isDeposit ? <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">DEPOSIT</span> :
                 isSender ? <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">SENT ↗</span> :
                 <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">REC'D ↙</span>}
              </td>
              <td className="py-4 text-sm text-gray-600">
                 <span className="font-bold text-slate-700 block">
                   {isDeposit ? "Wallet Top-up" : isSender ? `To User #${tx.targetAccountId}` : `From User #${tx.sourceAccountId}`}
                 </span>
                 <span className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleString()}</span>
              </td>
              <td className={`py-4 pr-2 text-right font-bold font-mono text-lg ${isSender ? 'text-slate-700' : 'text-emerald-600'}`}>
                {isSender ? '-' : '+'}${tx.amount.toFixed(2)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default App;