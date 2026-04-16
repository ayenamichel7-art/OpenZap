import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { Zap, MessageSquare, Moon, Sun } from 'lucide-react';

const Layout = () => {
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'night');

    useEffect(() => {
        const theme = darkMode ? 'night' : 'light';
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [darkMode]);

    return (
        <div className="lg:flex min-h-screen bg-base-100 transition-colors duration-300">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {/* Mobile Header */}
            <div className="navbar bg-white lg:hidden sticky top-0 z-40 border-b border-base-200 px-6 py-4">
                <div className="flex-1 flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <span className="text-xl font-black tracking-tight">OpenZap</span>
                </div>
                <div className="flex-none flex items-center gap-2">
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="btn btn-ghost btn-circle btn-sm"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <a 
                        href="https://wa.me/2290146906352" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-circle btn-sm text-green-600"
                    >
                        <MessageSquare size={20} />
                    </a>
                    <div className="avatar bg-base-200 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase cursor-pointer">
                        M
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
                {/* Desktop Top Header (Hidden on Mobile) */}
                <header className="hidden lg:flex justify-end items-center p-8 gap-4">
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="btn btn-ghost btn-circle rounded-2xl bg-base-100 shadow-sm"
                    >
                        {darkMode ? <Sun size={22} /> : <Moon size={22} />}
                    </button>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm">
                        <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-widest leading-none">Admin OpenZap</p>
                            <span className="text-[10px] font-bold text-success uppercase leading-none">En Ligne</span>
                        </div>
                        <div className="avatar bg-primary/10 text-primary w-10 h-10 rounded-xl flex items-center justify-center font-bold">
                            A
                        </div>
                    </div>
                </header>

                <main className="p-4 md:p-8 lg:p-12 pb-32 lg:pb-12 bg-base-50/30 min-h-screen">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <MobileNav />
        </div>
    );
};

export default Layout;
