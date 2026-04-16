import { useState, useEffect } from 'react';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Radio,
  Zap,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { campaignApi, contactApi, channelApi, whatsappApi } from '../api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Stats = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    campaigns: [],
    contactsData: null,
    channels: [],
    instances: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, contRes, chanRes, instRes] = await Promise.all([
        campaignApi.getCampaigns(),
        contactApi.getContacts(), // returns paginated contacts, will use total
        channelApi.getChannels(),
        whatsappApi.getInstances()
      ]);

      setData({
        campaigns: campRes.data,
        contactsData: contRes.data,
        channels: chanRes.data,
        instances: instRes.data
      });
    } catch (e) {
      console.error("Error fetching stats data:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin text-primary">
          <Zap size={40} />
        </div>
      </div>
    );
  }

  // 1. Process Campaign Data for BarChart (Delivery vs Read)
  const topCampaigns = [...data.campaigns]
    .sort((a, b) => b.messages_count - a.messages_count)
    .slice(0, 5)
    .map(c => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
      messages: c.messages_count,
      livrés: c.delivered_count || 0,
      lus: c.read_count || 0,
    }));

  // 2. Process Global Message Status for PieChart
  const totalMessages = data.campaigns.reduce((acc: number, c: any) => acc + c.messages_count, 0);
  const totalRead = data.campaigns.reduce((acc: number, c: any) => acc + (c.read_count || 0), 0);
  const totalDelivered = data.campaigns.reduce((acc: number, c: any) => acc + (c.delivered_count || 0), 0);
  const totalPending = totalMessages - totalDelivered - totalRead;

  const pieData = [
    { name: 'Lus', value: totalRead },
    { name: 'Livrés (Non lus)', value: Math.max(0, totalDelivered - totalRead) },
    { name: 'En attente / Autres', value: Math.max(0, totalPending) },
  ];

  // 3. Process Channels
  const totalSubscribers = data.channels.reduce((acc: number, c: any) => acc + c.subscribers_count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-base-900 tracking-tighter">Statistiques Avancées</h1>
        <p className="text-base-content/40 font-bold mt-2">Plongez dans les détails de vos envois et de votre audience.</p>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard 
          title="Total Contacts" 
          value={data.contactsData?.total || 0} 
          icon={<Users size={24} />} 
          color="bg-blue-500" 
        />
        <OverviewCard 
          title="Abonnés Chaînes" 
          value={totalSubscribers} 
          icon={<Radio size={24} />} 
          color="bg-emerald-500" 
        />
        <OverviewCard 
          title="Campagnes Créées" 
          value={data.campaigns.length} 
          icon={<MessageSquare size={24} />} 
          color="bg-purple-500" 
        />
        <OverviewCard 
          title="Instances Actives" 
          value={data.instances.filter((i:any) => i.status === 'connected').length} 
          icon={<Activity size={24} />} 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Bar Chart - Top Campaigns */}
        <div className="lg:col-span-2 card bg-white p-8 rounded-[48px] shadow-2xl shadow-base-200/50 border-none">
          <div className="flex items-center gap-3 mb-8">
             <div className="p-3 bg-primary/10 text-primary rounded-2xl">
               <BarChartIcon size={20} />
             </div>
             <div>
               <h3 className="font-black text-xl">Top 5 Campagnes</h3>
               <p className="text-xs text-base-content/40 font-bold">Volumes et conversions (Livrés / Lus)</p>
             </div>
          </div>
          
          <div className="h-80 w-full">
            {topCampaigns.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCampaigns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold', paddingTop: '20px'}} />
                  <Bar dataKey="messages" name="Total Ciblé" fill="#94a3b8" radius={[8, 8, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="livrés" name="Livrés" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="lus" name="Lus" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-base-content/30 font-bold">Aucune donnée de campagne</div>
            )}
          </div>
        </div>

        {/* Pie Chart - Taux de Conversion */}
        <div className="card bg-white p-8 rounded-[48px] shadow-2xl shadow-base-200/50 border-none">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
               <PieChartIcon size={20} />
             </div>
             <div>
               <h3 className="font-black text-xl">Conversion Globale</h3>
             </div>
          </div>
          
          <div className="h-64 w-full relative">
            {totalMessages > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black">{totalMessages}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-base-content/40">Messages</span>
                </div>
              </>
            ) : (
                <div className="h-full flex items-center justify-center text-base-content/30 font-bold">En attente d'envois</div>
            )}
          </div>

          {/* Legend Details */}
          {totalMessages > 0 && (
            <div className="space-y-3 mt-4">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                    <span className="text-sm font-bold text-base-content/70">{item.name}</span>
                  </div>
                  <span className="font-black">{((item.value / totalMessages) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-[40px] p-8 text-white flex items-center justify-between shadow-2xl shadow-primary/20">
        <div>
           <h3 className="text-2xl font-black">Besoin d'aller plus loin ?</h3>
           <p className="text-white/80 font-medium mt-1">Exportez vos rapports ou connectez un outil d'analyse externe via nos Webhooks.</p>
        </div>
        <button className="btn bg-white text-primary hover:bg-white/90 border-none rounded-2xl shadow-xl font-black">
          <TrendingUp size={18} />
          Configurer Webhook
        </button>
      </div>

    </div>
  );
};

const OverviewCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-base-200/40 border border-base-100 flex items-center gap-5 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-20 h-20 ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
    <div className={`p-4 ${color} text-white rounded-[24px] shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">{title}</p>
      <h3 className="text-3xl font-black tracking-tight">{value}</h3>
    </div>
  </div>
);

export default Stats;
