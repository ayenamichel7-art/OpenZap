import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Save, 
  Info, 
  Activity, 
  Thermometer, 
  Clock, 
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { whatsappApi } from '../api';

const Guardian = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    loadInstances();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const loadInstances = async () => {
    try {
      const res = await whatsappApi.getInstances();
      setInstances(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateLimit = async (id: number, limit: number) => {
    setSaving(id);
    try {
      const res = await whatsappApi.updateInstance(id, { daily_limit: limit });
      setToast({ type: 'success', message: res.data.message });
      setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, daily_limit: limit } : inst));
    } catch (e: any) {
      setToast({ type: 'error', message: "Erreur lors de la mise à jour." });
    } finally {
      setSaving(null);
    }
  };

  const calculateHealth = (instance: any) => {
    if (instance.status !== 'connected') return 'offline';
    
    // An instance is considered new if linked_at is less than 7 days ago
    const daysOld = instance.linked_at ? Math.floor((new Date().getTime() - new Date(instance.linked_at).getTime()) / (1000 * 3600 * 24)) : 0;
    
    if (daysOld < 7) return 'warming';
    return 'healthy';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {toast && (
        <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg fixed top-4 right-4 z-50 w-auto max-w-md animate-in`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="mb-10 card bg-base-900 text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-success/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-success/20 text-success rounded-2xl">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Le Gardien</h1>
          </div>
          <p className="text-white/60 font-bold max-w-2xl text-lg mt-2">
            Votre bouclier intelligent contre les blocages WhatsApp. Le Gardien analyse automatiquement l'âge de vos comptes et orchestre les délais d'envoi pour imiter un comportement humain.
          </p>
        </div>
      </header>

      {/* Protection Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-base-200/40 border border-base-100 relative overflow-hidden group">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Clock size={24} />
          </div>
          <h3 className="font-black text-lg mb-2">Délais Dynamiques</h3>
          <p className="text-sm font-medium text-base-content/50">
            Délai par défaut de 30s. Si l'instance a moins de 7 jours, le délai est doublé automatiquement (60s). Si elle n'est pas complètement liée, il passe à 120s pour la protéger.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-base-200/40 border border-base-100 relative overflow-hidden group">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Thermometer size={24} />
          </div>
          <h3 className="font-black text-lg mb-2">Cycle Circadien</h3>
          <p className="text-sm font-medium text-base-content/50">
            "Le Gardien" ralentit ou bloque la création de nouveaux messages si vous planifiez des envois massifs en dehors des heures recommandées (8h - 20h).
          </p>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-base-200/40 border border-base-100 relative overflow-hidden group">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Info size={24} />
          </div>
          <h3 className="font-black text-lg mb-2">Injection Spintax</h3>
          <p className="text-sm font-medium text-base-content/50">
            Oubliez les messages clonés. Syntaxe <code>{'{Bonjour|Salut}'}</code> supportée de manière native pour créer une signature unique à chaque envoi et déjouer l'antispam Meta.
          </p>
        </div>
      </div>

      {/* Instances Limiter Configuration */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Paramètres par Instance</h2>
          <span className="badge badge-lg badge-success font-black border-none bg-success/10 text-success gap-2">
            <Activity size={14} /> Bouclier Actif
          </span>
        </div>

        {loading ? (
          <div className="skeleton w-full h-40 rounded-[32px]"></div>
        ) : instances.length === 0 ? (
          <div className="bg-white p-10 rounded-[32px] text-center border border-base-200">
            <p className="text-base-content/40 font-bold">Aucune instance WhatsApp configurée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {instances.map(instance => {
              const health = calculateHealth(instance);
              
              // Determine UI based on health
              const healthSpecs = {
                healthy: { color: 'text-success', bg: 'bg-success/10', label: 'Compte Ancien (Sécurisé)', border: 'border-success/20' },
                warming: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Warming Up (< 7 jrs)', border: 'border-amber-500/20' },
                offline: { color: 'text-base-content/30', bg: 'bg-base-200', label: 'Hors-Ligne', border: 'border-base-200' },
              }[health];

              return (
                <div key={instance.id} className={`bg-white rounded-[32px] p-6 shadow-xl shadow-base-200/30 border ${healthSpecs.border}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${healthSpecs.bg} ${healthSpecs.color}`}>
                        {health === 'offline' ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
                      </div>
                      <div>
                        <h3 className="font-black text-xl">{instance.name}</h3>
                        <span className={`text-xs font-bold uppercase tracking-widest ${healthSpecs.color}`}>
                          {healthSpecs.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-base-50 rounded-[20px] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-base-content/60">
                        Limite Journalière Absolue
                        <br/>
                        <span className="text-[10px] uppercase tracking-wider opacity-60">Bloque les envois au-delà</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={instance.daily_limit || 50}
                          min={1}
                          max={10000}
                          className="input input-sm input-bordered w-24 text-center font-black rounded-lg"
                          id={`limit-${instance.id}`}
                        />
                        <button 
                          onClick={() => {
                            const val = parseInt((document.getElementById(`limit-${instance.id}`) as HTMLInputElement).value);
                            updateLimit(instance.id, val);
                          }}
                          disabled={saving === instance.id}
                          className="btn btn-sm btn-primary rounded-lg font-black w-24"
                        >
                          {saving === instance.id ? <Zap size={14} className="animate-pulse" /> : <Save size={14} />}
                          Sauver
                        </button>
                      </div>
                    </div>

                    <progress 
                      className={`progress w-full ${health === 'healthy' ? 'progress-success' : health === 'warming' ? 'progress-warning' : ''}`} 
                      value={instance.total_sent || 0} 
                      max={instance.daily_limit || 50}
                    ></progress>
                    <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-base-content/30">
                      <span>{instance.total_sent || 0} Envoyés</span>
                      <span>{instance.daily_limit || 50} Max</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Guardian;
