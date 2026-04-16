import { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageCircle, 
  ShieldCheck, 
  Users, 
  Zap,
  TrendingUp,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { campaignApi, contactApi } from '../api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [contactCount, setContactCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [statsResp, contactsResp] = await Promise.all([
                campaignApi.getStats(),
                contactApi.getContacts(1),
            ]);
            setStats(statsResp.data);
            setContactCount(contactsResp.data?.total ?? 0);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-base-900 tracking-tighter">Performance</h1>
          <p className="text-base-content/40 font-bold mt-1 tracking-tight">Analyse en temps réel de votre impact WhatsApp.</p>
        </div>
        <button 
          onClick={() => navigate('/campaigns')}
          className="btn btn-primary btn-lg rounded-3xl shadow-2xl shadow-primary/30 border-none px-8 flex items-center gap-3 w-full md:w-auto"
        >
          <Plus size={24} /> Nouvelle Campagne
        </button>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Messages Envoyés" 
            value={stats?.total_sent || "0"} 
            icon={<MessageCircle size={28} />} 
            trend="+21%" 
            color="primary"
        />
        <StatCard 
            title="Taux de Lecture" 
            value={stats?.total_sent > 0 ? ((stats.total_read / stats.total_sent) * 100).toFixed(1) + "%" : "0%"} 
            icon={<Zap size={28} />} 
            trend="Stable" 
            color="secondary"
        />
        <StatCard 
            title="Sécurité Gardien" 
            value="Actif" 
            icon={<ShieldCheck size={28} />} 
            trend="Protégé" 
            color="success"
        />
        <StatCard 
            title="Portée Contacts" 
            value={contactCount.toLocaleString('fr-FR')} 
            icon={<Users size={28} />} 
            trend={contactCount > 0 ? 'Actif' : 'Vide'} 
            color="info"
        />
      </div>

      {/* Chart & Analysis Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart Card */}
        <div className="xl:col-span-2 card bg-white shadow-2xl shadow-base-200/40 border-none rounded-[48px] overflow-hidden p-8">
            <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-base-900 uppercase tracking-widest">Activité Hebdomadaire</h2>
                    <p className="text-xs font-bold text-base-content/30 opacity-60">Volume d'envois sur les 7 derniers jours</p>
                </div>
                <div className="flex items-center gap-2 bg-base-50 p-2 rounded-2xl">
                    <button className="btn btn-sm btn-ghost btn-square rounded-xl shadow-inner shadow-black/5 bg-white">S</button>
                    <button className="btn btn-sm btn-ghost btn-square rounded-xl">M</button>
                    <button className="btn btn-sm btn-ghost btn-square rounded-xl">A</button>
                </div>
            </div>
            
            <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.daily_stats || []}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px'}}
                        />
                        <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Real-time Activity / Growth Card */}
        <div className="card bg-base-900 shadow-2xl shadow-base-900/60 border-none rounded-[48px] p-10 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-10 opacity-5">
                <TrendingUp size={160} />
            </div>
            
            <div className="relative z-10 space-y-10">
                <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white/30">Santé Système</h3>
                    <div className="space-y-6">
                        <ActivityItem label="Protection Le Gardien" status="Online" color="success" />
                        <ActivityItem label="API Evolution" status="Connected" color="success" />
                        <ActivityItem label="Worker Queue" status="Active" color="primary" />
                    </div>
                </div>

                <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Campagnes Actives</p>
                            <h4 className="text-xl font-black">{stats?.total_sent ?? 0} envois</h4>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Zap size={20} className="text-primary" />
                        </div>
                    </div>
                    <progress className="progress progress-primary w-full h-1.5" value={stats?.total_read ?? 0} max={Math.max(stats?.total_sent ?? 1, 1)}></progress>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Taux de lecture • Temps réel</p>
                </div>
            </div>

            <div className="relative z-10 pt-10">
                <a 
                    href="https://wa.me/2290146906352" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col gap-4 p-6 rounded-[32px] bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all text-green-400 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                            <MessageCircle size={20} />
                        </div>
                        <span className="font-black uppercase text-[10px] tracking-widest">Support Auteur</span>
                    </div>
                    <p className="text-xs font-bold text-white/40 leading-relaxed">Une question ? Cliquez ici pour me contacter sur WhatsApp.</p>
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color }: any) => (
    <div className="card bg-white p-8 rounded-[40px] shadow-2xl shadow-base-200/30 border-none group transition-all hover:translate-y-[-8px] cursor-default relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150`}></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={`w-14 h-14 rounded-[20px] bg-${color}/10 flex items-center justify-center text-${color} shadow-lg shadow-${color}/5`}>
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend.includes('+') ? 'text-success' : 'text-base-content/40'}`}>
                {trend} {trend.includes('+') ? <TrendingUp size={10} /> : <ArrowUpRight size={10} />}
            </div>
        </div>
        <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-base-content/30 mb-2">{title}</p>
            <h2 className="text-4xl font-black text-base-900 tracking-tight">{value}</h2>
        </div>
    </div>
);

const ActivityItem = ({ label, status, color }: any) => (
    <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-white/50">{label}</span>
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full bg-${color} animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest text-${color}`}>{status}</span>
        </div>
    </div>
);

export default Dashboard;
