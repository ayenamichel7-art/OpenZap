import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Mail, Lock, User, UserPlus, Loader2 } from 'lucide-react';
import { authApi } from '../api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setLoading(true);

    try {
      const resp = await authApi.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      localStorage.setItem('token', resp.data.token);
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
      }
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
            <h1 className="text-3xl font-black tracking-tight">Créer un compte</h1>
            <p className="text-sm text-base-content/40 font-medium">Rejoignez OpenZap gratuitement</p>
          </div>

          {/* Errors */}
          {error && (
            <div className="alert alert-error rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input input-bordered flex items-center gap-3 rounded-2xl h-14 bg-base-50">
                <User size={18} className="text-base-content/30" />
                <input
                  type="text"
                  placeholder="Nom complet"
                  className="grow"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  id="register-name"
                />
              </label>
              {errors.name && <p className="text-error text-xs mt-1 ml-2">{errors.name[0]}</p>}
            </div>

            <div>
              <label className="input input-bordered flex items-center gap-3 rounded-2xl h-14 bg-base-50">
                <Mail size={18} className="text-base-content/30" />
                <input
                  type="email"
                  placeholder="Email"
                  className="grow"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  id="register-email"
                />
              </label>
              {errors.email && <p className="text-error text-xs mt-1 ml-2">{errors.email[0]}</p>}
            </div>

            <div>
              <label className="input input-bordered flex items-center gap-3 rounded-2xl h-14 bg-base-50">
                <Lock size={18} className="text-base-content/30" />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="grow"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  id="register-password"
                />
              </label>
              {errors.password && <p className="text-error text-xs mt-1 ml-2">{errors.password[0]}</p>}
            </div>

            <label className="input input-bordered flex items-center gap-3 rounded-2xl h-14 bg-base-50">
              <Lock size={18} className="text-base-content/30" />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                className="grow"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                id="register-password-confirm"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 border-none"
              id="register-submit"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/40">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
