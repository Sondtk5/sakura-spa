import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    const ok = login(username.trim(), password);
    if (!ok) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="min-h-screen bg-sakura-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sakura-400 to-gold-400 shadow-lg shadow-sakura-500/30 mb-4">
            <span className="text-3xl font-bold text-white font-serif">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-serif">Sakura Spa & Beauty</h1>
          <p className="text-white/50 text-sm mt-1">Vẻ đẹp tỏa sáng từng ngày</p>
        </div>

        {/* Login Card */}
        <div className="bg-sakura-card rounded-2xl border border-white/10 p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50 focus:ring-1 focus:ring-sakura-400/30 transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50 focus:ring-1 focus:ring-sakura-400/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-rose-300 text-xs bg-rose-500/10 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
            >
              <LogIn className="w-4 h-4" /> Đăng nhập
            </button>
          </form>

          <p className="text-center text-[10px] text-white/30 mt-6">
            Mặc định: admin / admin
          </p>
        </div>
      </div>
    </div>
  );
}