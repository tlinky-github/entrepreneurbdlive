import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Mail, 
  MailOpen, 
  Trash2, 
  Clock, 
  Search, 
  Inbox, 
  Reply, 
  User, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { contactAPI } from '../../lib/api';

const formatDate = (date) => {
  if (!date) return 'N/A';
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleString();
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleString();
};

const AdminContactMessages = () => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [searchQuery, setSearchQuery] = useState('');

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await contactAPI.list();
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to load contact messages:', err);
      toast.error('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleToggleRead = async (id, currentStatus) => {
    const newStatus = currentStatus === 'unread' ? 'read' : 'unread';
    try {
      await contactAPI.updateStatus(id, newStatus);
      toast.success(`Message marked as ${newStatus}`);
      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await contactAPI.delete(id);
      toast.success('Message deleted');
      setMessages(prev => prev.filter(msg => msg.id !== id));
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread' && msg.status !== 'unread') return false;
    if (filter === 'read' && msg.status === 'unread') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (msg.name || '').toLowerCase().includes(q);
      const emailMatch = (msg.email || '').toLowerCase().includes(q);
      const subjectMatch = (msg.subject || '').toLowerCase().includes(q);
      const contentMatch = (msg.message || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || subjectMatch || contentMatch;
    }
    return true;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  return (
    <div className="space-y-6" data-testid="admin-contact-messages">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Contact Messages</h1>
            {unreadCount > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-stone-500 text-sm">View and respond to inquiries submitted through the contact page</p>
        </div>
        <Button onClick={loadMessages} variant="outline" size="sm" disabled={loading} className="self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Messages</p>
              <p className="text-2xl font-bold text-stone-900 mt-1">{messages.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
              <Mail className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Unread Messages</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{unreadCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Read Messages</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{messages.length - unreadCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList className="bg-stone-200/60 p-1">
            <TabsTrigger value="all" className="px-4 text-xs font-medium">All ({messages.length})</TabsTrigger>
            <TabsTrigger value="unread" className="px-4 text-xs font-medium">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="read" className="px-4 text-xs font-medium">Read ({messages.length - unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender, email or subject..."
            className="pl-9 text-sm border-stone-200"
          />
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-stone-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading messages...</span>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-stone-200 text-stone-400">
          <Inbox className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No contact messages found</p>
          {searchQuery && <p className="text-xs text-stone-400 mt-1">Try resetting your search query</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => {
            const isUnread = msg.status === 'unread';
            return (
              <Card 
                key={msg.id} 
                className={`transition-all ${isUnread ? 'border-amber-300 bg-amber-50/20 shadow-sm' : 'border-stone-200 bg-white'}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${isUnread ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}>
                        {msg.name ? msg.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-stone-900 text-base">{msg.name || 'Anonymous User'}</h3>
                          <Badge variant="outline" className={isUnread ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' : 'bg-stone-100 text-stone-600 border-stone-200'}>
                            {isUnread ? 'Unread' : 'Read'}
                          </Badge>
                        </div>
                        <a href={`mailto:${msg.email}`} className="text-sm text-emerald-700 hover:underline flex items-center gap-1 mt-0.5 font-medium">
                          <Mail className="w-3.5 h-3.5" />
                          {msg.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatDate(msg.created_at)}</span>
                    </div>
                  </div>

                  <div className="mb-4 bg-stone-50 p-4 rounded-lg border border-stone-100">
                    <h4 className="text-sm font-bold text-stone-800 mb-2">Subject: {msg.subject || 'No subject'}</h4>
                    <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{msg.message}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRead(msg.id, msg.status)}
                      className="text-stone-600 text-xs"
                    >
                      {isUnread ? (
                        <>
                          <MailOpen className="w-3.5 h-3.5 mr-1.5" />
                          Mark as Read
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 mr-1.5" />
                          Mark as Unread
                        </>
                      )}
                    </Button>

                    {msg.email && (
                      <a 
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Inquiry on Entrepreneurs BD')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="bg-emerald-900 hover:bg-emerald-800 text-white text-xs">
                          <Reply className="w-3.5 h-3.5 mr-1.5" />
                          Reply via Email
                        </Button>
                      </a>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(msg.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 border-stone-200 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminContactMessages;
