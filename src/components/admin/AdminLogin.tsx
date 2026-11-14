import { useState } from 'react';
import { AlertCircle, Lock, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { UnpattiLogo } from '../UnpattiLogo';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Masukkan email dan kata sandi akun Admin / Auditor LPMPP.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      onLoginSuccess();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Autentikasi gagal. Periksa kembali kredensial Anda.';
      setErrorMsg(
        msg === 'Invalid login credentials'
          ? 'Email atau kata sandi tidak valid.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="glass-panel rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0A2342] px-6 py-6 text-white flex items-center gap-4 border-b border-[#D4AF37]/40">
          <UnpattiLogo className="w-12 h-12" />
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#E8CF78] uppercase">
              Portal Terproteksi
            </p>
            <h2 className="text-lg font-bold text-white">
              Admin &amp; Auditor Mutu LPMPP
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="admin_email"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Email Institusional
            </label>
            <input
              id="admin_email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lpmpp@unpatti.ac.id"
              className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 focus:border-[#0A2342]"
            />
          </div>

          <div>
            <label
              htmlFor="admin_password"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Kata Sandi
            </label>
            <input
              id="admin_password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 focus:border-[#0A2342]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0A2342] hover:bg-[#143763] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-[#E8CF78]" />
                <span>Masuk ke Console Admin</span>
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Akses diautentikasi melalui Supabase Auth untuk pengelola LPMPP &amp;
              Gugus Kendali Mutu Fakultas.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
