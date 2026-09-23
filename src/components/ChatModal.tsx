import React, { useEffect, useState } from 'react';
import { Product, Store } from '../types';
import { X, Send, Phone, ShieldCheck, CheckCircle2, Bot, MapPin } from 'lucide-react';
import { formatNaira } from '../utils/formatters';
import { api } from '../lib/api';
import { useMarketplace } from '../context/AppContext';

interface ChatModalProps {
  product?: Product | null;
  store?: Store | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  product,
  store,
  isOpen,
  onClose
}) => {
  const { user } = useMarketplace();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: 'user' | 'seller'; text: string; time: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sellerName = product ? product.seller.name : store ? store.name : 'Verified Seller';
  const sellerLocation = product ? product.seller.location : store ? store.location : 'Nigeria';
  const sellerPhone = (product ? product.seller.phone : store?.phone) ?? '';

  // Reload the existing conversation with this seller whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      setErrorMessage(null);
      try {
        const res = await api.messages.threads();
        if (cancelled) return;

        const match = res.threads.find((thread) =>
          product
            ? thread.productTitle === product.title
            : store
              ? thread.productTitle === 'General enquiry' || thread.productTitle === ''
              : false
        );

        if (match) {
          setThreadId(match.id);
          setMessages(
            match.messages.map((message) => ({
              sender: message.sender === 'seller' ? ('seller' as const) : ('user' as const),
              text: message.text,
              time: message.time,
            }))
          );
        } else {
          setThreadId(null);
          setMessages([]);
        }
      } catch {
        // A guest with no history simply starts fresh.
        if (!cancelled) setMessages([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, product?.id, store?.id]);

  const quickQuestions = [
    'Is this item still available?',
    'What is the last price for delivery in Lagos?',
    'Can I inspect it at your store in person?',
    'Do you offer same-day waybill delivery?'
  ];

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      if (!threadId) {
        // First message from this buyer — opens a real thread in PostgreSQL.
        const res = await api.messages.start({
          storeId: product?.seller.id ?? store?.id ?? '',
          productId: product?.id,
          text,
          buyerName: user?.name,
          buyerPhone: user?.phone ?? undefined,
        });
        setThreadId(res.thread.id);
      } else {
        await api.messages.reply(threadId, text);
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'user',
          text,
          time: new Date().toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
        }
      ]);
      if (!textToSend) setInputText('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Message could not be sent');
    } finally {
      setIsSending(false);
    }
  };

  const hasSeller = Boolean(product?.seller.id ?? store?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="seller-chat-modal"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[560px] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {sellerName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white line-clamp-1">{sellerName}</h3>
                <span className="p-0.5 rounded-full bg-emerald-500 text-white" title="Verified Seller">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-300">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>{sellerLocation}</span>
                <span>• Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sellerPhone && (
              <a
                href={`tel:${sellerPhone}`}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
                title="Call Seller"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Snippet Bar */}
        {product && (
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-9 h-9 rounded-lg object-cover border border-slate-200"
              />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{product.title}</p>
                <p className="font-black text-emerald-700">{formatNaira(product.price)}</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
              {product.condition}
            </span>
          </div>
        )}

        {/* Chat Safety Notice */}
        <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Komback Safety: Keep chats & transactions here. Never pay to unverified private accounts.</span>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.length === 0 && (
            <p className="text-[11px] text-slate-500 text-center py-6 leading-relaxed">
              No messages yet with {sellerName}. Send a message and the merchant will see it in
              their Seller Hub inbox.
            </p>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
            </div>
          ))}

          {!hasSeller && (
            <p className="text-[11px] font-bold text-rose-600 text-center">
              No seller is attached to this conversation.
            </p>
          )}
          {errorMessage && (
            <p className="text-[11px] font-bold text-rose-600 text-center">{errorMessage}</p>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 whitespace-nowrap font-medium border border-slate-200 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="seller-chat-input"
              type="text"
              placeholder="Type your message to seller..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              id="seller-chat-send-btn"
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-2.5 rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
