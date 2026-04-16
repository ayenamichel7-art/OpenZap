import { useState, useEffect } from 'react';
import { 
  Radio, Plus, RefreshCw, Send, Clock, Search, 
  Trash2, Users, ExternalLink, Zap,
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { channelApi, whatsappApi } from '../api';

interface Channel {
  id: number;
  channel_jid: string;
  name: string;
  description: string | null;
  picture_url: string | null;
  subscribers_count: number;
  invite_link: string | null;
  is_owner: boolean;
  status: string;
  whatsapp_instance?: { id: number; name: string; status: string };
}

interface Instance {
  id: number;
  name: string;
  status: string;
}

const Channels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ instance_id: 0, name: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Publish form
  const [publishForm, setPublishForm] = useState({
    channel_ids: [] as number[],
    content: '',
    content_type: 'text',
    scheduled_at: '',
  });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const loadData = async () => {
    try {
      const [chRes, instRes] = await Promise.all([
        channelApi.getChannels(),
        whatsappApi.getInstances()
      ]);
      setChannels(chRes.data);
      setInstances(instRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const detectChannels = async (instanceId: number) => {
    setDetecting(instanceId);
    try {
      const res = await channelApi.detect(instanceId);
      setToast({ type: res.data.has_channels ? 'success' : 'info', message: res.data.message });
      loadData();
    } catch (e) {
      setToast({ type: 'error', message: "Erreur lors de la détection." });
    } finally {
      setDetecting(null);
    }
  };

  const createChannel = async () => {
    if (!createForm.instance_id || !createForm.name) return;
    setCreating(true);
    try {
      const res = await channelApi.create(createForm);
      setToast({ type: 'success', message: res.data.message });
      setShowCreateModal(false);
      setCreateForm({ instance_id: 0, name: '', description: '' });
      loadData();
    } catch (e: any) {
      setToast({ type: 'error', message: e.response?.data?.message || "Erreur lors de la création." });
    } finally {
      setCreating(false);
    }
  };

  const publishToChannels = async () => {
    if (publishForm.channel_ids.length === 0 || !publishForm.content) return;
    setPublishing(true);
    try {
      const res = await channelApi.publish(publishForm);
      setToast({ type: 'success', message: res.data.message });
      setShowPublishModal(false);
      setPublishForm({ channel_ids: [], content: '', content_type: 'text', scheduled_at: '' });
    } catch (e: any) {
      setToast({ type: 'error', message: e.response?.data?.message || "Erreur lors de la publication." });
    } finally {
      setPublishing(false);
    }
  };

  const deleteChannel = async (id: number) => {
    if (!confirm("Supprimer cette chaîne de votre liste ?")) return;
    try {
      await channelApi.delete(id);
      setChannels(prev => prev.filter(c => c.id !== id));
      setToast({ type: 'success', message: "Chaîne supprimée." });
    } catch (e) {
      setToast({ type: 'error', message: "Erreur lors de la suppression." });
    }
  };

  const toggleChannelSelect = (id: number) => {
    setPublishForm(prev => ({
      ...prev,
      channel_ids: prev.channel_ids.includes(id)
        ? prev.channel_ids.filter(cid => cid !== id)
        : [...prev.channel_ids, id]
    }));
  };

  const ownedChannels = channels.filter(c => c.is_owner);
  const subscribedChannels = channels.filter(c => !c.is_owner);
  const connectedInstances = instances.filter(i => i.status === 'connected' || i.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`alert ${toast.type === 'success' ? 'alert-success' : toast.type === 'error' ? 'alert-error' : 'alert-info'} shadow-lg fixed top-4 right-4 z-50 w-auto max-w-md animate-in`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">📡 Chaînes WhatsApp</h1>
          <p className="text-base-content/50 font-medium mt-1">
            Détectez, créez et publiez sur vos chaînes WhatsApp
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPublishModal(true)}
            className="btn btn-primary rounded-2xl font-black shadow-lg shadow-primary/20"
            disabled={ownedChannels.length === 0}
          >
            <Send size={18} /> Publier
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-secondary rounded-2xl font-black"
            disabled={connectedInstances.length === 0}
          >
            <Plus size={18} /> Créer une chaîne
          </button>
        </div>
      </div>

      {/* Detect Section */}
      {connectedInstances.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl p-6 border border-primary/10">
          <h3 className="font-black text-sm uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
            <RefreshCw size={16} /> Détecter les chaînes
          </h3>
          <p className="text-sm text-base-content/60 mb-4">
            Scanne tes instances WhatsApp pour trouver les chaînes existantes.
          </p>
          <div className="flex flex-wrap gap-3">
            {connectedInstances.map(inst => (
              <button
                key={inst.id}
                onClick={() => detectChannels(inst.id)}
                disabled={detecting === inst.id}
                className="btn btn-outline btn-sm rounded-xl font-bold gap-2"
              >
                {detecting === inst.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} />
                )}
                Scanner « {inst.name} »
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {channels.length === 0 && (
        <div className="text-center py-20">
          <Radio size={64} className="mx-auto text-base-content/10 mb-6" />
          <h2 className="text-2xl font-black text-base-content/30">Aucune chaîne détectée</h2>
          <p className="text-base-content/40 mt-2 max-w-md mx-auto">
            Connecte d'abord une instance WhatsApp, puis clique sur "Scanner" pour détecter tes chaînes. 
            Tu peux aussi en créer une nouvelle.
          </p>
        </div>
      )}

      {/* Search */}
      {channels.length > 0 && (
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30" />
          <input
            type="text"
            placeholder="Rechercher une chaîne..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input input-bordered w-full pl-12 rounded-2xl font-bold"
          />
        </div>
      )}

      {/* Owned Channels */}
      {ownedChannels.length > 0 && (
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-4 px-2">
            🏆 Mes chaînes ({ownedChannels.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ownedChannels
              .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
              .map(channel => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onDelete={deleteChannel}
                  onPublish={() => {
                    setPublishForm(prev => ({ ...prev, channel_ids: [channel.id] }));
                    setShowPublishModal(true);
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {/* Subscribed Channels */}
      {subscribedChannels.length > 0 && (
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-base-content/30 mb-4 px-2">
            📡 Chaînes abonnées ({subscribedChannels.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subscribedChannels
              .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
              .map(channel => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onDelete={deleteChannel}
                />
              ))}
          </div>
        </div>
      )}

      {/* ─── Create Modal ─── */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-md">
            <h3 className="font-black text-xl mb-6">✨ Créer une chaîne</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label font-bold text-xs uppercase tracking-wider">Instance WhatsApp</label>
                <select
                  value={createForm.instance_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, instance_id: Number(e.target.value) }))}
                  className="select select-bordered w-full rounded-xl font-bold"
                >
                  <option value={0}>Choisir une instance...</option>
                  {connectedInstances.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-bold text-xs uppercase tracking-wider">Nom de la chaîne</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Promo OpenZap"
                  className="input input-bordered w-full rounded-xl font-bold"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="label font-bold text-xs uppercase tracking-wider">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décris ta chaîne..."
                  className="textarea textarea-bordered w-full rounded-xl font-medium"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowCreateModal(false)} className="btn rounded-xl">Annuler</button>
              <button
                onClick={createChannel}
                disabled={creating || !createForm.instance_id || !createForm.name}
                className="btn btn-primary rounded-xl font-black"
              >
                {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Créer
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
        </div>
      )}

      {/* ─── Publish Modal ─── */}
      {showPublishModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-lg">
            <h3 className="font-black text-xl mb-2">📢 Publier sur les chaînes</h3>
            <p className="text-sm text-base-content/50 mb-6">Publie un message sur une ou plusieurs de tes chaînes.</p>

            <div className="space-y-4">
              {/* Channel Selection */}
              <div>
                <label className="label font-bold text-xs uppercase tracking-wider">Chaînes cibles</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {ownedChannels.map(ch => (
                    <label key={ch.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${publishForm.channel_ids.includes(ch.id) ? 'border-primary bg-primary/5' : 'border-base-200 hover:border-primary/30'}`}>
                      <input
                        type="checkbox"
                        checked={publishForm.channel_ids.includes(ch.id)}
                        onChange={() => toggleChannelSelect(ch.id)}
                        className="checkbox checkbox-primary checkbox-sm"
                      />
                      <span className="font-bold text-sm">{ch.name}</span>
                      <span className="text-xs text-base-content/40 ml-auto">{ch.subscribers_count} abonnés</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="label font-bold text-xs uppercase tracking-wider">Message</label>
                <textarea
                  value={publishForm.content}
                  onChange={e => setPublishForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Écris ton message ici... Le Spintax est supporté : {Salut|Hello|Hey} !"
                  className="textarea textarea-bordered w-full rounded-xl font-medium"
                  rows={4}
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="label font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} /> Planifier (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={publishForm.scheduled_at}
                  onChange={e => setPublishForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="input input-bordered w-full rounded-xl font-bold"
                />
                {publishForm.scheduled_at && (
                  <p className="text-xs text-primary font-bold mt-1">
                    ⏰ Publication planifiée
                  </p>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowPublishModal(false)} className="btn rounded-xl">Annuler</button>
              <button
                onClick={publishToChannels}
                disabled={publishing || publishForm.channel_ids.length === 0 || !publishForm.content}
                className="btn btn-primary rounded-xl font-black"
              >
                {publishing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : publishForm.scheduled_at ? (
                  <><Clock size={18} /> Planifier</>
                ) : (
                  <><Send size={18} /> Publier maintenant</>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowPublishModal(false)} />
        </div>
      )}
    </div>
  );
};

/* ─── Channel Card ─── */
const ChannelCard = ({ channel, onDelete, onPublish }: { 
  channel: Channel; 
  onDelete: (id: number) => void;
  onPublish?: () => void;
}) => (
  <div className="bg-white rounded-3xl border border-base-200 p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {channel.picture_url ? (
          <img src={channel.picture_url} alt={channel.name} className="w-12 h-12 rounded-2xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Radio size={20} className="text-primary" />
          </div>
        )}
        <div>
          <h3 className="font-black text-sm leading-tight">{channel.name}</h3>
          <p className="text-xs text-base-content/40 font-mono mt-0.5">
            {channel.whatsapp_instance?.name || 'Instance'}
          </p>
        </div>
      </div>
      {channel.is_owner && (
        <span className="badge badge-primary badge-sm font-black rounded-lg">OWNER</span>
      )}
    </div>

    {channel.description && (
      <p className="text-xs text-base-content/50 line-clamp-2 mb-3">{channel.description}</p>
    )}

    <div className="flex items-center gap-4 text-xs text-base-content/40 font-bold mb-4">
      <span className="flex items-center gap-1"><Users size={12} /> {channel.subscribers_count} abonnés</span>
      {channel.invite_link && (
        <a href={channel.invite_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
          <ExternalLink size={12} /> Lien
        </a>
      )}
    </div>

    <div className="flex gap-2">
      {channel.is_owner && onPublish && (
        <button onClick={onPublish} className="btn btn-primary btn-sm flex-1 rounded-xl font-bold">
          <Send size={14} /> Publier
        </button>
      )}
      <button onClick={() => onDelete(channel.id)} className="btn btn-ghost btn-sm rounded-xl text-error opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

export default Channels;
