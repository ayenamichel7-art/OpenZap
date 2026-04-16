import React, { useState, useEffect } from 'react';
import { Plus, Zap, RefreshCw, Trash2, Smartphone, QrCode, Hash, X, CheckCircle } from 'lucide-react';
import { whatsappApi } from '../api';

const Instances = () => {
    const [instances, setInstances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [connectionMode, setConnectionMode] = useState<'qr' | 'code'>('qr');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQr, setSelectedQr] = useState<string | null>(null);
    const [pairingCode, setPairingCode] = useState<string | null>(null);

    const fetchInstances = async () => {
        setLoading(true);
        try {
            const resp = await whatsappApi.getInstances();
            setInstances(resp.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInstances();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await whatsappApi.createInstance(name);
            const instance = resp.data.instance;
            setInstances([...instances, instance]);
            
            if (connectionMode === 'qr') {
                if (resp.data.qr) {
                    setSelectedQr(resp.data.qr.base64);
                }
            } else {
                const codeResp = await whatsappApi.getPairingCode(instance.id, phone);
                if (codeResp.data && codeResp.data.code) {
                    setPairingCode(codeResp.data.code);
                }
            }
            
            setIsModalOpen(false);
            setName('');
            setPhone('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Voulez-vous vraiment supprimer cet appareil ?')) return;
        try {
            await whatsappApi.deleteInstance(id);
            setInstances(instances.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white px-6 py-2 bg-primary w-fit rounded-2xl rotate-[-2deg] shadow-lg shadow-primary/20">Mes WhatsApp</h1>
                    <p className="text-base-content/50 font-bold mt-3 px-1 tracking-tight">Gérez vos connexions et instances Evolution API.</p>
                </div>
                <button 
                    className="hidden md:flex btn btn-primary btn-lg rounded-3xl gap-3 shadow-xl shadow-primary/20 border-none"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={24} /> Connecter
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center p-20">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {instances.map((instance) => (
                        <div key={instance.id} className="card bg-white shadow-2xl shadow-base-200/50 border-none rounded-[40px] overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="w-14 h-14 rounded-3xl bg-base-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Smartphone size={28} />
                                    </div>
                                    <div className={`badge ${instance.status === 'open' || instance.status === 'connected' ? 'bg-success text-white' : 'bg-warning text-white'} border-none rounded-xl px-4 py-3 font-black uppercase text-[10px] tracking-wider`}>
                                        {instance.status === 'open' ? 'Connecté' : instance.status}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-base-900">{instance.name}</h2>
                                    <p className="text-xs font-mono font-bold text-base-content/30 opacity-60 tracking-wider">ID: {instance.instance_id}</p>
                                </div>
                                
                                <div className="flex gap-3 pt-6 border-t border-base-50 items-center justify-between">
                                    <button 
                                        className="btn btn-ghost btn-square rounded-2xl text-error/40 hover:text-error hover:bg-error/10 transition-all"
                                        onClick={() => handleDelete(instance.id)}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button className="btn btn-primary rounded-2xl flex-1 gap-2 border-none shadow-lg shadow-primary/10">
                                        <RefreshCw size={18} /> Sync
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {instances.length === 0 && (
                        <div className="col-span-full bg-white p-16 rounded-[48px] shadow-xl shadow-base-200/30 border-2 border-dashed border-base-200 text-center space-y-8">
                            <div className="w-24 h-24 bg-base-50 rounded-[40px] flex items-center justify-center mx-auto">
                                <Zap size={48} className="text-base-content/20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-base-900 tracking-tight">Zéro Profil Connecté</h3>
                                <p className="max-w-xs mx-auto text-base-content/40 font-bold leading-relaxed">
                                    Associez votre premier compte WhatsApp pour débloquer la puissance d'OpenZap.
                                </p>
                            </div>
                            <button 
                                className="btn btn-primary btn-lg rounded-3xl px-12 shadow-2xl shadow-primary/30 border-none"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus size={24} /> C'est parti !
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Action Button for Mobile */}
            <button 
                className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center z-40 animate-bounce"
                onClick={() => setIsModalOpen(true)}
            >
                <Plus size={32} />
            </button>

            {/* Modals are kept responsive with modal-box sizing */}
            {isModalOpen && (
                <div className="modal modal-open backdrop-blur-md bg-base-900/20">
                    <div className="modal-box max-w-md rounded-[40px] p-8 shadow-2xl border-none">
                        <header className="flex justify-between items-center mb-8">
                            <h3 className="font-black text-2xl text-base-900">Nouveau Canal</h3>
                            <button className="btn btn-ghost btn-circle btn-sm" onClick={() => setIsModalOpen(false)}>✕</button>
                        </header>
                        <form onSubmit={handleCreate} className="space-y-8">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-black uppercase text-[10px] tracking-widest text-base-content/40">Nom de l'appareil</span>
                                </label>
                                <input 
                                    type="text" 
                                    className="input input-bordered h-16 border-2 rounded-2xl font-bold focus:border-primary w-full" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="ex: WhatsApp Bureau"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-black uppercase text-[10px] tracking-widest text-base-content/40">Méthode de connexion</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setConnectionMode('qr')}
                                        className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all ${connectionMode === 'qr' ? 'border-primary bg-primary/5 text-primary' : 'border-base-100 opacity-40 grayscale'}`}
                                    >
                                        <QrCode size={24} />
                                        <span className="text-xs font-black uppercase tracking-widest">Scanner</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setConnectionMode('code')}
                                        className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all ${connectionMode === 'code' ? 'border-primary bg-primary/5 text-primary' : 'border-base-100 opacity-40 grayscale'}`}
                                    >
                                        <Hash size={24} />
                                        <span className="text-xs font-black uppercase tracking-widest">Pairing</span>
                                    </button>
                                </div>
                            </div>

                            {connectionMode === 'code' && (
                                <div className="form-control animate-in zoom-in-95 duration-200">
                                    <label className="label"><span className="label-text font-black uppercase text-[10px] tracking-widest text-base-content/40">Numéro de téléphone</span></label>
                                    <div className="flex items-center bg-base-50 rounded-2xl border-2 border-base-100 overflow-hidden focus-within:border-primary transition-all px-4">
                                        <span className="font-black text-xl text-primary opacity-40 pr-3 border-r border-base-100">+</span>
                                        <input 
                                            type="tel" 
                                            className="input bg-transparent border-none w-full font-bold focus:ring-0 text-lg h-16" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required={connectionMode === 'code'}
                                            placeholder="229XXXXXXXX"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-base-content/30 opacity-80 mt-2 px-2 italic uppercase">Inclure l'indicatif pays (ex: 229)</span>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" className="btn btn-ghost rounded-2xl px-6 flex-1" onClick={() => setIsModalOpen(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary rounded-2xl px-12 shadow-xl shadow-primary/20 border-none flex-1">Étape Suivante</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal QR Code */}
            {selectedQr && (
                <div className="modal modal-open backdrop-blur-2xl">
                    <div className="modal-box text-center rounded-[48px] p-10 bg-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                        <h3 className="font-black text-3xl mb-8 tracking-tight">Scannez le code</h3>
                        <div className="bg-base-900 p-8 rounded-[40px] shadow-2xl inline-block mx-auto mb-8 relative ring-8 ring-base-50">
                           <img src={selectedQr} alt="QR Code" className="w-56 h-56 rounded-2xl" />
                           <div className="absolute inset-0 border-[20px] border-base-900 pointer-events-none"></div>
                        </div>
                        <p className="text-sm font-bold opacity-40 leading-relaxed max-w-xs mx-auto mb-8 uppercase tracking-widest">
                            Ouvrez WhatsApp {'>'} Appareils connectés {'>'} Connecter
                        </p>
                        <button className="btn btn-primary btn-lg rounded-3xl w-full border-none shadow-xl shadow-primary/20" onClick={() => setSelectedQr(null)}>C'est fait !</button>
                    </div>
                </div>
            )}

            {/* Modal Pairing Code */}
            {pairingCode && (
                <div className="modal modal-open backdrop-blur-2xl">
                    <div className="modal-box text-center p-12 rounded-[48px] border-none shadow-2xl">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Smartphone className="text-primary" size={36} />
                        </div>
                        <h3 className="font-black text-3xl mb-2 tracking-tight">Code Secret</h3>
                        <p className="text-base-content/40 mb-10 font-black uppercase tracking-widest text-xs">Entrez ce code sur votre téléphone</p>
                        
                        <div className="grid grid-cols-4 gap-3 mb-12 max-w-xs mx-auto">
                            {pairingCode.toUpperCase().split('').map((char, i) => (
                                <div key={i} className="bg-base-900 rounded-2xl py-5 text-3xl font-black text-primary shadow-xl ring-4 ring-base-50">
                                    {char}
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-primary btn-lg rounded-3xl w-full border-none shadow-xl shadow-primary/20" onClick={() => setPairingCode(null)}>
                            <CheckCircle size={20} className="mr-2" /> Valider la connexion
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Instances;
