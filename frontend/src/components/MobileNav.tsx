import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, MessageSquare, Users, Radio } from 'lucide-react';

const MobileNav = () => {
    return (
        <div className="btm-nav btm-nav-lg lg:hidden bg-white border-t border-base-200 z-50 h-20 shadow-[-10px_0_20px_rgba(0,0,0,0.05)] rounded-t-[32px]">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active text-primary' : 'text-base-content/40'}>
                <LayoutDashboard size={20} />
                <span className="btm-nav-label text-[10px] font-black uppercase tracking-widest mt-1">Accueil</span>
            </NavLink>
            <NavLink to="/instances" className={({ isActive }) => isActive ? 'active text-primary' : 'text-base-content/40'}>
                <Zap size={20} />
                <span className="btm-nav-label text-[10px] font-black uppercase tracking-widest mt-1">Instances</span>
            </NavLink>
            <NavLink to="/campaigns" className={({ isActive }) => isActive ? 'active text-primary' : 'text-base-content/40'}>
                <MessageSquare size={20} />
                <span className="btm-nav-label text-[10px] font-black uppercase tracking-widest mt-1">Studio</span>
            </NavLink>
            <NavLink to="/channels" className={({ isActive }) => isActive ? 'active text-primary' : 'text-base-content/40'}>
                <Radio size={20} />
                <span className="btm-nav-label text-[10px] font-black uppercase tracking-widest mt-1">Chaînes</span>
            </NavLink>
            <NavLink to="/contacts" className={({ isActive }) => isActive ? 'active text-primary' : 'text-base-content/40'}>
                <Users size={20} />
                <span className="btm-nav-label text-[10px] font-black uppercase tracking-widest mt-1">Contacts</span>
            </NavLink>
        </div>
    );
};

export default MobileNav;
