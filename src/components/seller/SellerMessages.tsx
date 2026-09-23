import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  CheckCheck, 
  Clock, 
  DollarSign, 
  Phone, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { formatNaira } from '../../utils/formatters';
import { api, type MessageThreadData } from '../../lib/api';

type MessageThread = MessageThreadData;

export const SellerMessages: React.FC = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Buyer enquiries are stored in PostgreSQL against the merchant's storefront.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.seller.messages();
        if (cancelled) return;
        setThreads(res.threads);
        setActiveThreadId(res.threads[0]?.id ?? '');
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Could not load conversations');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || replyText).trim();
    if (!text || !activeThread) return;

    try {
      await api.seller.reply(activeThread.id, text);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Message could not be sent');
      return;
    }

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          unread: false,
          lastMessage: text,
          time: 'Just now',
          messages: [
            ...t.messages,
            { sender: 'seller', text, time: new Date().toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }) }
          ]
        };
      }
      return t;
    }));

    setReplyText('');
  };

  const handleSendCounterOffer = () => {
    const num = parseFloat(counterPrice);
    if (isNaN(num) || num <= 0) return;
    const msg = `Special Counter Offer: I can accept ₦${formatNaira(num)} through Komback Escrow for immediate dispatch!`;
    handleSendMessage(msg);
    setCounterPrice('');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden h-[calc(100vh-12rem)] min-h-[500px] flex flex-col md:flex-row w-full max-w-full">
      {/* Left List of Inquiries (w-full md:w-80) */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200/80 bg-white">
          <h2 className="text-sm font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Buyer Chats & Inquiries
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Negotiate, answer questions, and close sales
          </p>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {isLoading && (
            <p className="text-[11px] font-bold text-slate-500 p-4">Loading conversations…</p>
          )}
          {errorMessage && (
            <p className="text-[11px] font-bold text-rose-600 p-4">{errorMessage}</p>
          )}
          {!isLoading && threads.length === 0 && (
            <p className="text-[11px] font-bold text-slate-500 p-4">
              No buyer enquiries yet. Messages from shoppers will appear here.
            </p>
          )}
          {threads.map((thread) => {
            const isSelected = thread.id === activeThreadId;
            return (
              <button
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setShowMobileChat(true);
                  // Mark read
                  setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unread: false } : t));
                }}
                className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-emerald-50/80' : 'hover:bg-slate-100/70'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={thread.buyerAvatar}
                    alt={thread.buyerName}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-200"
                  />
                  {thread.unread && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {thread.buyerName}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{thread.time}</span>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 truncate mt-0.5">
                    {thread.productTitle}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    {thread.lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Chat Conversation View */}
      {activeThread ? (
        <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Conversation Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Back to chat list on mobile */}
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shrink-0"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <img
                src={activeThread.buyerAvatar}
                alt={activeThread.buyerName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-900 truncate font-['Plus_Jakarta_Sans',sans-serif]">
                  {activeThread.buyerName}
                </h3>
                <div className="text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                  <span className="font-bold text-slate-700 truncate max-w-[120px] sm:max-w-none">{activeThread.productTitle}</span>
                  <span>•</span>
                  <span className="font-black text-emerald-700 shrink-0">{formatNaira(activeThread.productPrice)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Escrow Protected
              </span>
            </div>
          </div>

          {/* Quick Counter Offer Strip */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Quick Counter Offer:</span>
              <input
                type="number"
                placeholder="₦ Amount"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="w-28 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
              />
              <button
                type="button"
                onClick={handleSendCounterOffer}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
              >
                Send Offer
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => handleSendMessage('Yes, available for immediate pickup and nationwide dispatch!')}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
              >
                "Available now"
              </button>
              <button
                onClick={() => handleSendMessage('Can ship today with official GIG Logistics waybill number!')}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
              >
                "Ships today"
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
            {activeThread.messages.map((msg, idx) => {
              const isSeller = msg.sender === 'seller';
              return (
                <div
                  key={idx}
                  className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isSeller
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div
                      className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                        isSeller ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.time}</span>
                      {isSeller && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Type your response to the buyer..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              title="Send reply"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs font-bold">
          Select a customer inquiry thread to view conversation
        </div>
      )}
    </div>
  );
};
