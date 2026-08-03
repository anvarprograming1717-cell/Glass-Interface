import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { 
  useListMessages, 
  useSendMessage,
  getListMessagesQueryKey,
  useListUsers
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';

export default function Messages() {
  const { t } = useTranslation();
  const { userId } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: users } = useListUsers();
  const { data: messages } = useListMessages({ withUserId: selectedUser || undefined }, { 
    query: { enabled: !!selectedUser, queryKey: getListMessagesQueryKey({ withUserId: selectedUser || undefined }) } 
  });
  
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !content.trim()) return;

    sendMessage.mutate({
      data: {
        receiverId: selectedUser,
        content: content.trim()
      }
    }, {
      onSuccess: () => {
        setContent('');
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey({ withUserId: selectedUser }) });
      }
    });
  };

  const otherUsers = users?.filter(u => u.id !== userId) || [];

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4">
      {/* Users List */}
      <GlassCard className="w-full md:w-80 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 font-bold">{t('messages')}</div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {otherUsers.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u.id)}
              className={`p-3 flex items-center gap-3 cursor-pointer transition-all border-b border-white/5 last:border-0 ${
                selectedUser === u.id ? 'bg-white/20 dark:bg-white/10' : 'hover:bg-white/10 dark:hover:bg-white/5'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="overflow-hidden">
                <div className="font-medium truncate">{u.firstName} {u.lastName}</div>
                <div className="text-xs text-foreground/50 capitalize truncate">{t(u.role as any)}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Chat Area */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-white/10 font-bold bg-white/5">
              {otherUsers.find(u => u.id === selectedUser)?.firstName} {otherUsers.find(u => u.id === selectedUser)?.lastName}
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map(msg => {
                const isMe = msg.senderId === userId;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMe 
                        ? 'bg-indigo-500 text-white rounded-tr-sm' 
                        : 'bg-white/20 dark:bg-white/10 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-foreground/40 mt-1 mx-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              {!messages?.length && (
                <div className="h-full flex items-center justify-center text-foreground/40">No messages yet.</div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
              <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={t('type_message')}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none"
              />
              <GlassButton type="submit" variant="primary" size="icon" disabled={!content.trim()}>
                <Send className="w-5 h-5" />
              </GlassButton>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-foreground/40 gap-3">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>Select a user to start messaging</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}