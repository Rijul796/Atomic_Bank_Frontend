import { useState } from 'react';

interface LoginProps {
  onLogin: (base64Credentials: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would hit a /login endpoint here.
    // Since we use Basic Auth, we just encode the credentials.
    if (username && password) {
      const token = btoa(`${username}:${password}`);
      onLogin(token); // Send token up to App.tsx
    } else {
      setError("Please fill in all fields");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md flex flex-col">

        {/* Header */}
        <div className="bg-emerald-500 p-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">AtomicBank</h1>
          <p className="text-emerald-100 mt-2">Secure Financial Ledger</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition transform active:scale-95"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Use <b>admin</b> / <b>password123</b> to access demo
          </p>
        </div>
      </div>
    </div>
  );
}