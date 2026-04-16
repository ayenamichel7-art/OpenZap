import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { authApi } from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await authApi.login({ email, password });
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', resp.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 via-base-100 to-primary/5 p-4">
      <div className="card bg-white shadow-2xl shadow-primary/10 rounded-[48px] w-full max-w-md overflow-hidden">
        <div className="p-10 space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-primary p-4 rounded-3xl text-white shadow-2xl shadow-primary/30">
              <Zap size={32} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">OpenZap</h1>
            <p className="text-sm text-base-content/40 font-medium">Connectez-vous à votre compte</p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="input input-bordered flex items-center gap-3 rounded-2xl h-14 bg-base-50">
              <Mail size={18} className="text-base-content/30" />
              <input
                type="email"
                placeholder="Email"
                className="grow"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="login-email"
              />
            </label>

            <label className="input input-bordered flex items-center gap-3 rounded-2xl h-14 bg-base-50">
              <Lock size={18} className="text-base-content/30" />
              <input
                type="password"
                placeholder="Mot de passe"
                className="grow"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-password"
              />
            </label>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm rounded-lg"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                id="login-remember"
              />
              <label htmlFor="login-remember" className="text-sm text-base-content/50 font-medium cursor-pointer">
                Se souvenir de moi
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 border-none"
              id="login-submit"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/40">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
