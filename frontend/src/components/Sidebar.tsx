import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Zap,
  ShieldCheck,
  Radio,
  Database
} from 'lucide-react';

const Sidebar = () => {
    return (
        <div className="w-80 h-screen sticky top-0 bg-white border-r border-base-100 flex flex-col p-8 space-y-12">
            {/* Logo */}
            <div className="flex items-center gap-4 px-2">
                <div className="bg-primary p-3 rounded-[20px] text-white shadow-xl shadow-primary/20 rotate-3">
                    <Zap size={28} fill="currentColor" />
                </div>
                <span className="text-3xl font-black tracking-tight text-base-900">
                    Open<span className="text-primary italic">Zap</span>
                </span>
            </div>

            <nav className="flex-1 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/30 mb-6 px-4">Menu Principal</div>
                <ul className="space-y-1">
                    <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <SidebarLink to="/instances" icon={<Zap size={20} />} label="Instances" />
                    <SidebarLink to="/campaigns" icon={<MessageSquare size={20} />} label="Campagnes" />
                    <SidebarLink to="/channels" icon={<Radio size={20} />} label="Chaînes" />
                    <SidebarLink to="/contacts" icon={<Users size={20} />} label="Contacts" />
                    <SidebarLink to="/stats" icon={<BarChart3 size={20} />} label="Statistiques" />
                    
                    <div className="pt-6 pb-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/30 px-4">Système</div>
                    </div>
                    
                    <SidebarLink to="/api-config" icon={<Settings size={20} />} label="Clés API & Accès" />
                    <SidebarLink to="/guardian" icon={<ShieldCheck size={20} />} label="Le Gardien" />
                    <SidebarLink to="/admin" icon={<Database size={20} />} label="Observatoire (Admin)" />
                </ul>
                
                <a 
                    href="https://wa.me/2290146906352" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-black tracking-tight text-green-600 bg-green-50 hover:bg-green-100 mt-4 shadow-lg shadow-green-500/10"
                >
                    <MessageSquare size={20} />
                    <span className="text-sm">📞 Contact Créateur</span>
                </a>
                
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/30 mb-6 mt-12 px-4">Système</div>
                <ul className="space-y-1">
                    <SidebarLink to="/api-config" icon={<Settings size={20} />} label="Configuration API" />
                    <SidebarLink to="/guardian" icon={<ShieldCheck size={20} />} label="Le Gardien" />
                </ul>
            </nav>

            <button className="flex items-center gap-4 p-4 rounded-2xl text-error font-bold hover:bg-error/10 transition-all opacity-60 hover:opacity-100">
                <LogOut size={20} />
                <span>Déconnexion</span>
            </button>
        </div>
    );
};

const SidebarLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
    <li>
        <NavLink 
            to={to} 
            className={({ isActive }) => 
                `flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-black tracking-tight ${
                    isActive 
                    ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5' 
                    : 'text-base-content/40 hover:bg-base-100 hover:text-base-content'
                }`
            }
        >
            {icon}
            <span className="text-sm">{label}</span>
        </NavLink>
    </li>
);

export default Sidebar;
