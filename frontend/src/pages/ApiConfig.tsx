import { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  AlertCircle,
  CheckCircle2,
  Terminal,
  Code
} from 'lucide-react';
import { userApi } from '../api';

interface ApiToken {
  id: number;
  name: string;
  abilities: string[];
  last_used_at: string | null;
  created_at: string;
}

const ApiConfig = () => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    loadTokens();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const loadTokens = async () => {
    try {
      const res = await userApi.getKeys();
      setTokens(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    if (!newTokenName) return;
    try {
      const res = await userApi.createKey(newTokenName);
      setCreatedToken(res.data.token);
      setNewTokenName('');
      loadTokens();
      setToast({ type: 'success', message: "Clé générée avec succès." });
    } catch (e: any) {
      setToast({ type: 'error', message: "Impossible de créer la clé." });
    }
  };

  const deleteToken = async (id: number) => {
    if (!confirm("Voulez-vous vraiment révoquer cette clé ? Les applications utilisant cette clé cesseront de fonctionner immédiatement.")) return;
    try {
      await userApi.deleteKey(id);
      setTokens(prev => prev.filter(t => t.id !== id));
      setToast({ type: 'success', message: "Clé révoquée." });
    } catch (e) {
      setToast({ type: 'error', message: "Erreur lors de la révocation." });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Toast */}
      {toast && (
        <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg fixed top-4 right-4 z-50 w-auto max-w-md animate-in`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-4xl font-black text-base-900 tracking-tighter">Configuration API</h1>
        <p className="text-base-content/40 font-bold mt-2 max-w-2xl">
          Générez des clés d'accès personnelles (Personal Access Tokens) pour intégrer OpenZap avec Zapier, Make, n8n ou vos propres scripts.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Column - Keys List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-base-content/40">Vos Clés Actives</h2>
            <button 
              onClick={() => { setCreatedToken(null); setShowCreateModal(true); }}
              className="btn btn-primary btn-sm rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              <Plus size={16} /> Générer une clé
            </button>
          </div>

          {createdToken && (
            <div className="bg-success/10 border border-success/20 rounded-3xl p-6 relative animate-in zoom-in-95 duration-300">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success flex-shrink-0">
                  <Key size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-success">Nouvelle clé secrète générée !</h3>
                  <p className="text-sm text-base-content/60 font-medium mb-4">
                    Assurez-vous de copier votre clé API maintenant. Pour des raisons de sécurité, vous ne pourrez plus la voir une fois cette fenêtre fermée.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-4 py-3 rounded-2xl font-mono text-base font-bold shadow-sm flex-1 break-all border border-base-200">
                      {createdToken}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(createdToken)}
                      className="btn btn-primary rounded-2xl w-32"
                    >
                      {copying ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                      {copying ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="skeleton w-full h-64 rounded-3xl"></div>
          ) : tokens.length === 0 ? (
            <div className="bg-white border border-base-200 rounded-[32px] p-12 text-center shadow-2xl shadow-base-200/40">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Key className="text-primary/40" size={32} />
              </div>
              <h3 className="text-xl font-black mb-2">Aucune clé.</h3>
              <p className="text-base-content/40 font-medium max-w-sm mx-auto">
                Vous n'avez pas encore généré de clés API. Créez-en une pour automatiser vos envois et synchroniser vos outils.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-base-200 rounded-[32px] overflow-hidden shadow-2xl shadow-base-200/40">
              <table className="table">
                <thead className="bg-base-50/50">
                  <tr>
                    <th className="font-black text-xs uppercase tracking-widest text-base-content/40 py-5">Nom de la clé</th>
                    <th className="font-black text-xs uppercase tracking-widest text-base-content/40 py-5">Création</th>
                    <th className="font-black text-xs uppercase tracking-widest text-base-content/40 py-5">Dernière utilisation</th>
                    <th className="font-black text-xs uppercase tracking-widest text-base-content/40 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map(token => (
                    <tr key={token.id} className="hover:bg-base-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Key size={16} />
                          </div>
                          <div>
                            <p className="font-black">{token.name}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60">Bearer Token</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-bold text-base-content/60">
                          {new Date(token.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-bold text-base-content/60">
                          {token.last_used_at ? new Date(token.last_used_at).toLocaleDateString('fr-FR') : 'Jamais'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => deleteToken(token.id)}
                          className="btn btn-ghost btn-sm text-error rounded-xl hover:bg-error/10"
                        >
                          <Trash2 size={16} /> Révoquer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Documentation Sidebar */}
        <div className="space-y-6">
          <div className="card bg-base-900 text-white shadow-2xl shadow-base-900/40 rounded-[32px] overflow-hidden border-none">
            <div className="p-8 pb-6 bg-gradient-to-br from-white/10 to-transparent">
              <h3 className="font-black text-xl flex items-center gap-2 mb-2">
                <Terminal size={20} className="text-primary" /> Guide Rapide
              </h3>
              <p className="text-sm text-white/50 font-medium leading-relaxed">
                Utilisez votre clé d'accès dans le header <code className="bg-white/10 px-1.5 py-0.5 rounded-md text-white">Authorization</code> de vos requêtes HTTP.
              </p>
            </div>
            
            <div className="bg-black/40 p-6 space-y-4 font-mono text-xs">
              <div className="space-y-2">
                <span className="text-white/40 uppercase font-bold tracking-wider text-[10px]">Endpoint de Base</span>
                <div className="text-primary break-all">
                  https://api.votre-openzap.com/api/v1
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                <span className="text-white/40 uppercase font-bold tracking-wider text-[10px]">Exemple cURL</span>
                <div className="text-emerald-400 break-all leading-loose">
                  curl -X GET \<br/>
                  &nbsp;&nbsp;https://[...]/api/campaigns/stats \<br/>
                  &nbsp;&nbsp;-H <span className="text-amber-300">"Authorization: Bearer 1|T8Vq..."</span> \<br/>
                  &nbsp;&nbsp;-H <span className="text-amber-300">"Accept: application/json"</span>
                </div>
              </div>
            </div>
          </div>

          <a href="#" className="flex items-center gap-4 p-5 rounded-[24px] bg-white border border-base-200 hover:border-primary/30 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-xl bg-primary/5 group-hover:bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary transition-colors">
              <Code size={20} />
            </div>
            <div>
              <h4 className="font-black text-sm">Documentation API Complète</h4>
              <p className="text-xs text-base-content/40 font-bold mt-0.5">Endpoints, Webhooks & Exemples</p>
            </div>
          </a>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-[32px] max-w-md">
            <h3 className="font-black text-2xl mb-2">Créer une clé API</h3>
            <p className="text-sm text-base-content/50 font-medium mb-6">
              Donnez un nom explicite à cette clé pour identifier rapidement l'application qui l'utilise.
            </p>
            
            <div className="space-y-2">
              <label className="label font-bold text-xs uppercase tracking-wider">Nom de la clé</label>
              <input 
                type="text" 
                value={newTokenName}
                onChange={e => setNewTokenName(e.target.value)}
                placeholder="Ex: Make.com Workflow, Zapier, Script Interne..." 
                className="input input-bordered w-full rounded-2xl font-bold bg-base-50 focus:bg-white"
                autoFocus
              />
            </div>

            <div className="modal-action mt-8">
              <button onClick={() => setShowCreateModal(false)} className="btn rounded-xl">Annuler</button>
              <button 
                onClick={() => { setShowCreateModal(false); createToken(); }} 
                disabled={!newTokenName}
                className="btn btn-primary rounded-xl font-black px-6"
              >
                Générer la clé
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-base-900/20 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
        </div>
      )}
    </div>
  );
};

export default ApiConfig;
