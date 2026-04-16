import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Radio,
  Zap,
  Globe,
  Database,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { adminApi } from '../api';

const SuperAdmin = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const res = await adminApi.getOverview();
      setData(res.data);
    } catch (e: any) {
      if (e.response?.status === 403) {
        setError("Accès Refusé. Cette page est strictement réservée aux administrateurs de la plateforme.");
      } else {
        setError("Une erreur est survenue lors de la récupération des statistiques globales.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in zoom-in duration-500 text-center">
        <div className="w-24 h-24 bg-error/10 text-error rounded-[32px] flex items-center justify-center mb-6 shadow-2xl shadow-error/20">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-black mb-2">Accès Restreint</h1>
        <p className="text-base-content/50 font-bold max-w-md">{error}</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin text-primary">
          <Zap size={40} />
        </div>
      </div>
    );
  }

  const { platform, messages, recent_users } = data;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="badge badge-error border-none bg-error/10 text-error uppercase font-black tracking-widest gap-2">
              <ShieldCheck size={14} /> Super Admin
            </span>
          </div>
          <h1 className="text-5xl font-black text-base-900 tracking-tighter">Observatoire Global</h1>
          <p className="text-base-content/40 font-bold mt-1 tracking-tight">Vue omnisciente sur la performance et l'usage de la plateforme.</p>
        </div>
        
        <div className="px-6 py-4 bg-white rounded-3xl shadow-xl shadow-base-200/50 border border-base-100 flex items-center gap-4">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
          <div className="text-sm font-black uppercase tracking-widest text-base-content/60">
            Plateforme en Ligne
          </div>
        </div>
      </header>

      {/* Primary Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlobalStatCard 
          title="Utilisateurs Inscrits" 
          value={platform.total_users} 
          icon={<Users size={28} />} 
          color="bg-indigo-500" 
        />
        <GlobalStatCard 
          title="Instances Liées" 
          value={platform.total_instances} 
          subtitle={`${platform.active_instances} connectées`}
          icon={<Activity size={28} />} 
          color="bg-emerald-500" 
        />
        <GlobalStatCard 
          title="Messages Traités" 
          value={messages.total.toLocaleString()} 
          icon={<Globe size={28} />} 
          color="bg-primary" 
        />
        <GlobalStatCard 
          title="Volume Contacts" 
          value={platform.total_contacts.toLocaleString()} 
          icon={<Database size={28} />} 
          color="bg-rose-500" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Messages Routing & Success Rates */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="font-black text-2xl">Acheminement & Trafic</h2>
          <div className="card bg-white p-8 rounded-[48px] shadow-2xl shadow-base-200/50 border-none">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <TrafficStat label="Livrés" value={messages.sent} color="text-primary" />
              <TrafficStat label="Lus" value={messages.read} color="text-success" />
              <TrafficStat label="En Attente" value={messages.pending} color="text-amber-500" />
              <TrafficStat label="Échecs" value={messages.failed} color="text-error" />
            </div>

            <div className="mt-8 border-t border-base-100 pt-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-base-content/30 mb-1">Campagnes & Canaux</p>
                <div className="flex gap-4">
                  <span className="font-black text-lg">{platform.total_campaigns} Lancées</span>
                  <span className="text-base-content/30">|</span>
                  <span className="font-black text-lg">{platform.total_channels} Chaînes Créées</span>
                </div>
              </div>
              <div className="p-4 bg-primary/5 text-primary rounded-[20px]">
                <Radio size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Inscriptions */}
        <div className="space-y-6">
          <h2 className="font-black text-2xl">Derniers Inscrits</h2>
          <div className="card bg-base-900 border-none rounded-[48px] shadow-2xl shadow-base-900/40 p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none p-6">
               <Users size={120} />
            </div>
            
            <div className="relative z-10 space-y-4">
              {recent_users.map((u: any) => (
                <div key={u.id} className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-black shadow-lg">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-black text-sm truncate">{u.name}</p>
                    <p className="text-[10px] text-white/50 truncate font-bold">{u.email}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-white/30" />
                </div>
              ))}

              {recent_users.length === 0 && (
                <div className="text-center text-white/40 py-8 font-bold">Aucun utilisateur</div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

const GlobalStatCard = ({ title, value, subtitle, icon, color }: any) => (
  <div className="card bg-white p-6 rounded-[32px] shadow-xl shadow-base-200/30 border-none flex flex-row items-center gap-5 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-20 h-20 ${color} opacity-[0.03] rounded-full group-hover:scale-[2.5] transition-transform duration-700`}></div>
    <div className={`p-4 ${color} text-white rounded-[24px] shadow-lg flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">{title}</p>
      <div className="flex items-end gap-2">
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
      </div>
      {subtitle && <p className="text-[10px] uppercase font-bold text-success tracking-wider mt-1">{subtitle}</p>}
    </div>
  </div>
);

const TrafficStat = ({ label, value, color }: any) => (
  <div>
    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${color}`}>{label}</p>
    <p className="text-3xl font-black">{value.toLocaleString()}</p>
  </div>
);

export default SuperAdmin;
