import React, { useState, useEffect } from 'react';
import { 
    UserPlus, Trash2, Search, FileDown, CheckCircle2, 
    Table as TableIcon, Tag, Filter, MoreVertical, Smartphone, Users, ChevronRight, ChevronLeft, Download, X, Loader2
} from 'lucide-react';
import { contactApi } from '../api';

const Contacts = () => {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [importModal, setImportModal] = useState(false);
    const [importType, setImportType] = useState<'csv' | 'google'>('csv');
    const [csvText, setCsvText] = useState('');
    const [sheetUrl, setSheetUrl] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [importing, setImporting] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Mock tags for segmentation UI
    const availableTags = ['Client VIP', 'Prospect', 'Soutien', 'Bénin', 'Lomé', 'Abidjan', 'Relance'];

    const fetchContacts = async (page = 1, query = '', tag = '') => {
        setLoading(true);
        try {
            const resp = await contactApi.getContacts(page, query, tag);
            setContacts(resp.data.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchContacts(1, search, selectedTag || '');
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [search, selectedTag]);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        setImporting(true);
        try {
            if (importType === 'csv') {
                const lines = csvText.split('\n');
                const parsed = lines.map(line => {
                    const [name, phone] = line.split(/[;,]/);
                    if (!phone) return null;
                    return { 
                        name: name?.trim(), 
                        phone: phone.trim().replace(/[^0-9]/g, ''),
                        tags: selectedTag ? [selectedTag] : []
                    };
                }).filter(c => c !== null);

                if (parsed.length === 0) {
                    alert('Format invalide. Utilisez: Nom,Téléphone');
                    setImporting(false);
                    return;
                }
                await contactApi.bulkImport(parsed);
                setStats({ count: parsed.length });
            } else {
                const resp = await contactApi.importGoogleSheet(sheetUrl);
                setStats({ message: resp.data.message });
            }
            setCsvText(''); setSheetUrl(''); setImportModal(false); fetchContacts();
        } catch (err: any) {
            alert(err.response?.data?.error || "Erreur d'importation");
        } finally { setImporting(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Voulez-vous supprimer ce contact ?')) return;
        try {
            await contactApi.deleteContact(id);
            setContacts(contacts.filter(c => c.id !== id));
        } catch (err) { console.error(err); }
    };

    const getRandomColor = (name: string) => {
        const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-error'];
        const index = name ? name.length % colors.length : 0;
        return colors[index];
    };

    return (
        <div className="space-y-10 pb-20 fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black text-base-900 tracking-tighter">Répertoire <span className="text-primary italic">Audience</span></h1>
                    <p className="text-base-content/40 font-bold mt-1 uppercase text-[10px] tracking-widest">Gérez et segmentez votre base de contacts massive.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button className="btn btn-ghost bg-white border-2 border-base-100 rounded-[28px] px-8 h-16 shadow-sm hover:shadow-md transition-all flex-1 md:flex-none" onClick={() => setImportModal(true)}>
                        <Download size={20} className="text-primary" /> Importer
                    </button>
                    <button className="btn btn-primary rounded-[28px] px-8 h-16 shadow-2xl shadow-primary/30 border-none flex-1 md:flex-none">
                        <UserPlus size={20} /> Nouveau
                    </button>
                </div>
            </header>

            {stats && (
                <div className="alert bg-success text-white border-none rounded-[32px] p-6 shadow-xl shadow-success/20 animate-in slide-in-from-top duration-500">
                    <CheckCircle2 size={32} />
                    <div>
                        <h4 className="font-black uppercase text-[10px] tracking-widest opacity-60">Synchronisation réussie</h4>
                        <p className="font-bold text-lg">{stats.message || `${stats.count} nouveaux contacts ajoutés à l'audience.`}</p>
                    </div>
                    <button className="btn btn-white/20 btn-circle" onClick={() => setStats(null)}>✕</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Segmentation Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="card bg-white p-8 rounded-[40px] shadow-2xl shadow-base-200/40 border-none">
                        <h3 className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-base-content/30 mb-8 px-2">
                            <Tag size={14} /> Segmentation
                        </h3>
                        <div className="space-y-4">
                            <button 
                                onClick={() => setSelectedTag(null)}
                                className={`w-full flex justify-between items-center p-4 rounded-2xl font-black text-sm transition-all ${!selectedTag ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-base-content/40 hover:bg-base-50'}`}
                            >
                                <span className="flex items-center gap-3"><Users size={16} /> Tous</span>
                                <span className="opacity-40">{contacts.length}</span>
                            </button>
                            {availableTags.map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`w-full flex justify-between items-center p-4 rounded-2xl font-black text-xs transition-all ${selectedTag === tag ? 'bg-base-900 text-white shadow-xl shadow-base-900/40' : 'text-base-content/40 hover:bg-base-50'}`}
                                >
                                    <span className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${selectedTag === tag ? 'bg-primary' : 'bg-base-200'}`}></div> {tag}</span>
                                    <ChevronRight size={14} className="opacity-20" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-primary/5 rounded-[40px] border-2 border-dashed border-primary/20 text-center space-y-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary mx-auto shadow-sm">
                            <Smartphone size={24} />
                        </div>
                        <h4 className="font-black text-sm text-primary">Mobile First</h4>
                        <p className="text-[10px] font-bold text-base-content/30 uppercase leading-relaxed">Faites glisser les contacts pour des actions rapides sur votre téléphone.</p>
                    </div>
                </div>

                {/* Contacts List */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="card bg-white shadow-2xl shadow-base-200/40 border-none rounded-[48px] overflow-hidden">
                        <div className="p-8 border-b border-base-50 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="relative w-full">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-base-content/20" size={20} />
                                <input 
                                    type="text" 
                                    className="input input-lg w-full h-16 pl-16 rounded-2xl border-2 border-base-50 focus:border-primary transition-all font-bold placeholder:text-base-content/10 bg-base-50/5" 
                                    placeholder="Nom, numéro ou entreprise..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-ghost btn-circle btn-lg text-base-content/20 hover:bg-base-50 transition-all"><Filter size={20} /></button>
                                <button className="btn btn-ghost btn-circle btn-lg text-base-content/20 hover:bg-base-50 transition-all"><FileDown size={20} /></button>
                            </div>
                        </div>

                        <div className="p-4 overflow-x-auto scrollbar-hide">
                            <table className="table w-full">
                                <thead>
                                    <tr className="text-base-content/20 font-black uppercase text-[10px] tracking-[0.2em] border-none">
                                        <th className="pl-8 py-6">Profil</th>
                                        <th className="py-6">Identifiant Phone</th>
                                        <th className="py-6">Tags</th>
                                        <th className="pr-8 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="border-none">
                                    {loading ? (
                                        <tr><td colSpan={4} className="text-center p-20"><Loader2 className="animate-spin mx-auto text-primary" size={48} /></td></tr>
                                    ) : contacts.map(contact => (
                                        <tr key={contact.id} className="group hover:bg-base-50/80 transition-all border-none">
                                            <td className="pl-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-[20px] ${getRandomColor(contact.name)} flex items-center justify-center text-white font-black text-xl shadow-lg shadow-black/5`}>
                                                        {(contact.name || 'S').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-base text-base-900 tracking-tight">{contact.name || 'Identité Secrète'}</div>
                                                        <div className="text-[10px] font-black text-base-content/30 uppercase tracking-widest mt-0.5">Contact Enregistré</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                                                    <span className="font-black text-sm text-base-content/70 tracking-tight">{contact.phone}</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    {contact.tags?.map((tag: string) => (
                                                        <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-xl font-black text-[9px] uppercase tracking-widest">{tag}</span>
                                                    )) || <span className="text-[10px] font-bold text-base-content/20 uppercase tracking-widest">Aucun Tag</span>}
                                                </div>
                                            </td>
                                            <td className="pr-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="btn btn-ghost btn-circle btn-sm text-base-content/20 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16} /></button>
                                                    <button onClick={() => handleDelete(contact.id)} className="btn btn-ghost btn-circle btn-sm text-error/30 hover:bg-error/10 hover:text-error opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-8 bg-base-50/50 flex justify-between items-center rounded-b-[48px]">
                            <p className="text-[10px] font-black uppercase text-base-content/40 tracking-widest">Affichage de <span className="text-base-900">{contacts.length}</span> contacts sur {contacts.length}</p>
                            <div className="flex gap-2">
                                <button className="btn btn-sm btn-ghost rounded-xl disabled:opacity-20" disabled><ChevronLeft size={16} /></button>
                                <button className="btn btn-sm bg-white border-none shadow-sm rounded-xl font-black text-xs text-primary px-4">1</button>
                                <button className="btn btn-sm btn-ghost rounded-xl text-xs font-black">2</button>
                                <button className="btn btn-sm btn-ghost rounded-xl"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            {importModal && (
                <div className="modal modal-open backdrop-blur-3xl bg-base-900/10 transition-all">
                    <div className="modal-box max-w-2xl rounded-[48px] p-0 overflow-hidden shadow-2xl border-none bg-white">
                        <header className="p-10 flex justify-between items-center text-base-900">
                           <div>
                                <h3 className="font-black text-3xl tracking-tighter">Flux d'Importation</h3>
                                <p className="text-base-content/40 font-bold uppercase text-[10px] tracking-widest mt-1">Multi-Source Audience Stream</p>
                           </div>
                           <button className="btn btn-ghost btn-circle text-base-content/20" onClick={() => setImportModal(false)}><X size={32} /></button>
                        </header>

                        <div className="px-10 pb-10 space-y-8">
                            <div className="flex bg-base-50 p-1.5 rounded-[28px] border border-base-100">
                                <button onClick={() => setImportType('csv')} className={`flex-1 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-sm transition-all ${importType === 'csv' ? 'bg-white text-primary shadow-xl shadow-black/5' : 'text-base-content/40'}`}>CSV / Texte</button>
                                <button onClick={() => setImportType('google')} className={`flex-1 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-sm transition-all ${importType === 'google' ? 'bg-white text-primary shadow-xl shadow-black/5' : 'text-base-content/40'}`}>Google Sheets</button>
                            </div>

                            <form onSubmit={handleImport} className="space-y-8">
                                {importType === 'csv' ? (
                                    <div className="space-y-4">
                                        <div className="bg-primary/5 p-6 rounded-[32px] border-2 border-dashed border-primary/20">
                                            <p className="text-xs font-bold text-primary/80 leading-relaxed uppercase tracking-wider text-center">Format : Nom;Téléphone (un par ligne)</p>
                                        </div>
                                        <textarea className="textarea bg-base-50/50 w-full h-56 rounded-[32px] p-8 font-mono text-sm border-2 border-base-50 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" placeholder="Jean Dupont;22997000000" value={csvText} onChange={e => setCsvText(e.target.value)} required />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100 flex gap-6 items-center">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0"><TableIcon size={32} /></div>
                                            <p className="text-xs font-bold text-amber-900/60 leading-relaxed uppercase tracking-wider">Assurez-vous que le lien est <span className="text-amber-600">Public</span> et que la <span className="text-amber-600">Colonne A</span> contient le numéro.</p>
                                        </div>
                                        <input type="url" className="input input-lg w-full h-20 border-2 border-base-50 bg-base-50/30 rounded-[28px] px-8 font-bold focus:border-primary shadow-inner" placeholder="Lien partagé de votre Google Sheet..." value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} required />
                                    </div>
                                )}
                                
                                <div className="flex gap-4">
                                    <button type="button" className="btn btn-ghost h-20 px-10 rounded-[28px] font-black uppercase tracking-widest text-[10px]" onClick={() => setImportModal(false)}>Abandonner</button>
                                    <button type="submit" className={`btn btn-primary flex-1 h-20 rounded-[28px] text-xl font-black tracking-tighter shadow-2xl shadow-primary/30 border-none ${importing ? 'loading' : ''}`} disabled={importing}>{importing ? 'Importation Active...' : 'Lancer l\'Importation'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
