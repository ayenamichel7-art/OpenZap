import React, { useState, useEffect, useRef } from 'react';
import { 
    Zap, Image as ImageIcon, 
    Calendar, Clock, X, Plus, Loader2, 
    Terminal, Search, ShieldCheck
} from 'lucide-react';
import { campaignApi, whatsappApi, contactApi, mediaApi, templateApi } from '../api';

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [instances, setInstances] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [selectedInstance, setSelectedInstance] = useState('');
    const [content, setContent] = useState('');
    const [targetType, setTargetType] = useState<'individual' | 'group'>('individual');
    const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [scheduledAt, setScheduledAt] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [contentType, setContentType] = useState('text');
    const [uploading, setUploading] = useState(false);
    
    // Search & Filter
    const [contactSearch, setContactSearch] = useState('');
    const [selectedTag] = useState('');

    // Logs state
    const [activeCampaignLogs, setActiveCampaignLogs] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
    const logsInterval = useRef<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [campResp, instResp, contResp, tempResp] = await Promise.all([
                campaignApi.getCampaigns(),
                whatsappApi.getInstances(),
                contactApi.getContacts(),
                templateApi.getTemplates()
            ]);
            setCampaigns(campResp.data);
            setInstances(instResp.data);
            setContacts(contResp.data.data);
            setTemplates(tempResp.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (showModal) {
                contactApi.getContacts(1, contactSearch, selectedTag).then(resp => setContacts(resp.data.data));
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [contactSearch, selectedTag, showModal]);

    useEffect(() => {
        if (selectedInstance && targetType === 'group') {
            whatsappApi.getGroups(parseInt(selectedInstance)).then(resp => setGroups(resp.data));
        }
    }, [selectedInstance, targetType]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const filesBuffer = Array.from(e.target.files || []);
        if (filesBuffer.length === 0) return;

        setUploading(true);
        try {
            const results = await Promise.all(filesBuffer.map(file => {
                const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';
                return mediaApi.upload(file, type);
            }));
            
            const newUrls = results.map((r: any) => r.data.url);
            setMediaUrls([...mediaUrls, ...newUrls]);
            if (mediaUrls.length === 0) setContentType(filesBuffer[0].type.startsWith('image/') ? 'image' : 'video');
        } catch (err) {
            alert("Erreur lors de l'upload");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const applyTemplate = (template: any) => {
        setContent(template.content);
        setMediaUrls(template.media_urls || []);
        setContentType(template.media_urls?.length > 0 ? 'image' : 'text');
    };

    const saveAsTemplate = async () => {
        const tName = prompt("Nom du modèle :");
        if (!tName) return;
        try {
            const resp = await templateApi.createTemplate({
                name: tName,
                content,
                media_urls: mediaUrls,
                category: 'user_saved'
            });
            setTemplates([...templates, resp.data]);
            alert("Modèle enregistré !");
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await campaignApi.createCampaign({
                name,
                whatsapp_instance_id: selectedInstance,
                content,
                media_urls: mediaUrls,
                content_type: contentType,
                target_type: targetType,
                contacts: selectedContacts,
                group_ids: selectedGroups,
                scheduled_at: scheduledAt || null
            });
            setShowModal(false);
            fetchData();
            // Reset
            setName(''); setContent(''); setMediaUrls([]); setSelectedContacts([]); setSelectedGroups([]);
        } catch (err) { console.error(err); }
    };

    const openLogs = (campaign: any) => {
        setSelectedCampaignId(campaign.id);
        setActiveCampaignLogs([]);
        setShowLogsModal(true);
        fetchLogs(campaign.id);
    };

    useEffect(() => {
        if (showLogsModal && selectedCampaignId) {
            // Initial fetch
            fetchLogs(selectedCampaignId);
            
            // Set up polling
            logsInterval.current = setInterval(() => {
                fetchLogs(selectedCampaignId);
            }, 3000);
        } else {
            if (logsInterval.current) {
                clearInterval(logsInterval.current);
                logsInterval.current = null;
            }
        }

        return () => {
            if (logsInterval.current) {
                clearInterval(logsInterval.current);
            }
        };
    }, [showLogsModal, selectedCampaignId]);

    const fetchLogs = async (id: number) => {
        try {
            const resp = await campaignApi.getLogs(id);
            setActiveCampaignLogs(resp.data);
        } catch (err) { console.error(err); }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            pending: 'badge-ghost',
            processing: 'badge-primary animate-pulse',
            completed: 'badge-success text-white',
            failed: 'badge-error text-white'
        };
        return <span className={`badge ${styles[status] || 'badge-ghost'} font-black uppercase text-[10px] rounded-lg px-3 py-2`}>{status}</span>;
    };

    return (
        <div className="space-y-10 pb-20 fade-in transition-all">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black text-base-900 tracking-tighter">Studio Pro <span className="text-primary italic">Carrousel</span></h1>
                    <p className="text-base-content/40 font-bold mt-1">Multi-médias, modèles intelligents et sécurité Gardien.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary btn-lg rounded-3xl shadow-2xl shadow-primary/30 gap-3 px-8 border-none h-16"
                >
                    <Plus size={24} /> Nouvelle Campagne
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="card bg-white shadow-2xl shadow-base-200/40 border-none rounded-[40px] overflow-hidden group hover:translate-y-[-4px] transition-all">
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-base-900 line-clamp-1">{campaign.name}</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-base-content/20">
                                            <Clock size={12} /> {new Date(campaign.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <StatusBadge status={campaign.status} />
                                </div>

                                <div className="bg-base-50 rounded-3xl p-5 border border-base-100 text-sm font-bold text-base-content/60 leading-relaxed min-h-[80px]">
                                    <p className="line-clamp-3 italic">{campaign.content || "Diffusion multimédia"}</p>
                                </div>

                                {campaign.media_urls?.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 h-32">
                                        {campaign.media_urls.slice(0, 4).map((url: string, i: number) => (
                                            <div key={i} className={`rounded-2xl overflow-hidden relative ${i === 3 && campaign.media_urls.length > 4 ? 'after:content-["+'+(campaign.media_urls.length-3)+'"] after:absolute after:inset-0 after:bg-black/60 after:flex after:items-center after:justify-center after:text-white after:font-black' : ''}`}>
                                                <img src={url} alt="Media" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-6 border-t border-base-50">
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-black text-primary">{campaign.delivered_count || 0}</div>
                                            <div className="text-[9px] font-black uppercase opacity-30">Reçus</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-black text-success">{campaign.read_count || 0}</div>
                                            <div className="text-[9px] font-black uppercase opacity-30">Lus</div>
                                        </div>
                                    </div>
                                    <button onClick={() => openLogs(campaign)} className="btn btn-ghost btn-circle bg-base-50 text-base-content/30 hover:text-primary transition-all shadow-sm"><Terminal size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Logic (Templates & Carousel) */}
            {showModal && (
                <div className="modal modal-open backdrop-blur-3xl bg-base-900/10 transition-all">
                    <div className="modal-box max-w-7xl w-full rounded-[48px] p-0 overflow-hidden shadow-2xl border-none">
                        <div className="flex flex-col lg:flex-row h-[90vh]">
                            {/* Templates Sidebar */}
                            <div className="lg:w-64 bg-base-50 p-6 border-r flex flex-col space-y-8 overflow-y-auto">
                                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-base-content/30 mb-4 px-2">Modèles Pro</h3>
                                <div className="space-y-3">
                                    {templates.map(t => (
                                        <button key={t.id} onClick={() => applyTemplate(t)} className="w-full p-4 bg-white rounded-2xl text-left border-2 border-transparent hover:border-primary transition-all group shadow-sm">
                                            <div className="font-black text-sm text-base-900 group-hover:text-primary transition-colors">{t.name}</div>
                                            <div className="text-[9px] font-bold text-base-content/30 mt-1 uppercase line-clamp-1">{t.category}</div>
                                        </button>
                                    ))}
                                    <button onClick={saveAsTemplate} className="w-full p-4 border-2 border-dashed border-base-200 rounded-2xl text-center text-xs font-black text-base-content/40 hover:bg-white hover:text-primary transition-all">
                                        <Plus size={14} className="mx-auto mb-1" /> Enreg. l'Actuel
                                    </button>
                                </div>
                            </div>

                            {/* Main Editor */}
                            <div className="flex-1 p-10 overflow-y-auto bg-white space-y-10 scrollbar-hide">
                                <header className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-4xl font-black text-base-900 tracking-tighter">Éditeur Armada</h2>
                                        <p className="text-base-content/40 font-bold uppercase text-[10px] tracking-widest mt-1">Configuration Multi-Médias</p>
                                    </div>
                                    <button className="btn btn-ghost btn-circle text-base-content/20" onClick={() => setShowModal(false)}><X size={32} /></button>
                                </header>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-black text-[10px] uppercase tracking-widest text-base-content/40">Nom de la Campagne</span></label>
                                            <input type="text" className="input input-lg border-2 border-base-50 rounded-2xl font-bold h-16 focus:border-primary" value={name} onChange={e => setName(e.target.value)} required />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-black text-[10px] uppercase tracking-widest text-base-content/40">WhatsApp Business</span></label>
                                            <select className="select select-lg border-2 border-base-50 rounded-2xl font-bold h-16 focus:border-primary" value={selectedInstance} onChange={e => setSelectedInstance(e.target.value)} required>
                                                <option value="">Choisir un appareil...</option>
                                                {instances.map(i => <option key={i.id} value={i.id}>{i.name} ({i.phone})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="label"><span className="label-text font-black text-[10px] uppercase tracking-widest text-base-content/40">Contenu (Supporte Spintax)</span></label>
                                        <div className="relative group">
                                            <textarea className="textarea w-full h-48 border-2 border-base-50 bg-base-50/10 rounded-[40px] p-8 font-medium text-lg focus:border-primary transition-all placeholder:text-base-content/10 shadow-inner" placeholder="Bonjour {Monsieur|Madame}, voici notre offre..." value={content} onChange={e => setContent(e.target.value)} />
                                            <div className="absolute right-8 bottom-8 flex gap-3">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-primary rounded-2xl gap-2 font-black border-none shadow-xl shadow-primary/20"><ImageIcon size={18} /> Ajouter Photos</button>
                                                <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} multiple accept="image/*,video/*" />
                                            </div>
                                        </div>
                                        
                                        {/* Carousel Gallery */}
                                        {mediaUrls.length > 0 && (
                                            <div className="flex gap-4 p-4 bg-base-50 rounded-[32px] overflow-x-auto scrollbar-hide border border-base-100 ring-4 ring-base-50/50">
                                                {mediaUrls.map((url, i) => (
                                                    <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white">
                                                        <img src={url} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-error"><X size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Target Section */}
                                        <div className="space-y-6">
                                            <div className="flex bg-base-100 p-1.5 rounded-3xl w-fit border border-base-200 shadow-sm">
                                                <button type="button" onClick={() => setTargetType('individual')} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${targetType === 'individual' ? 'bg-white text-primary shadow-lg' : 'text-base-content/30'}`}>Individus</button>
                                                <button type="button" onClick={() => setTargetType('group')} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${targetType === 'group' ? 'bg-white text-primary shadow-lg' : 'text-base-content/30'}`}>Groupes</button>
                                            </div>
                                            
                                            <div className="bg-white border-2 border-base-50 rounded-[40px] p-2 h-72 space-y-1 overflow-y-auto scrollbar-hide relative shadow-inner">
                                                <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 flex gap-4 border-b border-base-50 z-10 mb-2">
                                                    <Search size={16} className="text-base-content/20 mt-1" />
                                                    <input placeholder="Rechercher ou Filtrer par Tag..." className="bg-transparent border-none focus:ring-0 font-bold text-sm flex-1" value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
                                                </div>
                                                {(targetType === 'individual' ? contacts : groups).map((item: any) => (
                                                    <label key={item.id} className="flex items-center gap-4 p-4 hover:bg-primary/5 rounded-3xl cursor-pointer group transition-all">
                                                        <input type="checkbox" className="checkbox checkbox-primary rounded-xl border-2 border-base-200" checked={targetType === 'individual' ? selectedContacts.includes(item.id) : selectedGroups.includes(item.id)} onChange={e => {
                                                            if (targetType === 'individual') {
                                                                if (e.target.checked) setSelectedContacts([...selectedContacts, item.id]);
                                                                else setSelectedContacts(selectedContacts.filter(id => id !== item.id));
                                                            } else {
                                                                if (e.target.checked) setSelectedGroups([...selectedGroups, item.id]);
                                                                else setSelectedGroups(selectedGroups.filter(id => id !== item.id));
                                                            }
                                                        }} />
                                                        <div className="flex-1">
                                                            <div className="font-black text-sm text-base-900 line-clamp-1">{targetType === 'individual' ? (item.name || item.phone) : item.subject}</div>
                                                            <div className="text-[9px] font-bold text-base-content/30 uppercase tracking-widest">{targetType === 'individual' ? item.phone : item.size + ' membres'}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="form-control">
                                                <label className="label"><span className="label-text font-black text-[10px] uppercase tracking-widest text-base-content/40">Planification (Optionnel)</span></label>
                                                <div className="relative h-16">
                                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                                                    <input type="datetime-local" className="pl-14 input input-lg w-full h-full border-2 border-base-50 rounded-2xl font-bold" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="bg-base-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                                                <Zap className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                                                <div className="relative z-10 flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-primary"><ShieldCheck size={20} /></div>
                                                    <h4 className="font-black text-[10px] uppercase tracking-widest">Sécurité Armada</h4>
                                                </div>
                                                <p className="text-white/40 text-xs font-bold leading-relaxed relative z-10 uppercase tracking-wider">Le Gardien analyse vos cibles et optimise les délais pour un envoi 100% sécurisé.</p>
                                            </div>
                                            <button type="submit" className={`btn btn-primary btn-lg w-full h-24 rounded-[40px] text-2xl font-black tracking-tighter shadow-2xl shadow-primary/30 border-none ${uploading ? 'loading' : ''}`} disabled={uploading}>Lancer l'Armada</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Logs modal remains as created before */}
            {showLogsModal && (
                <div className="modal modal-open backdrop-blur-md bg-base-900/40">
                    <div className="modal-box max-w-3xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl bg-base-900">
                        <header className="p-8 flex justify-between items-center text-white border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20"><Terminal size={24} /></div>
                                <div><h3 className="font-black text-2xl tracking-tighter">Terminal Gardien</h3><p className="text-white/20 text-[10px] uppercase font-black tracking-widest">Direct Node Stream</p></div>
                            </div>
                            <button className="btn btn-ghost btn-circle text-white/40" onClick={() => setShowLogsModal(false)}>✕</button>
                        </header>
                        <div className="p-8 h-96 overflow-y-auto font-mono text-xs space-y-3 scrollbar-hide">
                            {activeCampaignLogs.map((log: any) => (
                                <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                    <span className="text-white/20">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                    <span className={`font-black uppercase tracking-widest ${log.type === 'error' ? 'text-error' : 'text-primary'}`}>{log.event}</span>
                                    <span className="text-white/60 font-medium">{log.message}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 px-10 border-t border-white/5 flex gap-4 items-center">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest flex-1">Surveillance Active</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaigns;
