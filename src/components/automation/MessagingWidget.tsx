import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  type MessagingChannel,
  type MessageTemplateType,
  type MessageLog,
  type MessageTemplate,
  DEFAULT_TEMPLATES,
} from "@/types";
import {
  generateDeepLink,
  fillTemplate,
  subscribeMessageLogsForEntity,
  sendMessageViaChannel as sendMessage,
  type TemplateVariables,
} from "@/services/messagingService";

// ─── Props ────────────────────────────────────────────────────────

export interface MessagingWidgetProps {
  open: boolean;
  onClose: () => void;
  relatedId: string;
  relatedType: "lead" | "deal" | "listing";
  clientName: string;
  clientPhone: string;
  propertyAddress?: string;
  amount?: string;
  date?: string;
  agentName: string;
  brokerId: string;
}

// ─── Channel config ───────────────────────────────────────────────

interface ChannelInfo {
  key: MessagingChannel;
  label: string;
  icon: string;
  color: string;
}

const CHANNELS: ChannelInfo[] = [
  { key: "whatsapp", label: "WhatsApp", icon: "💬", color: "bg-green-500 hover:bg-green-600" },
  { key: "viber",     label: "Viber",     icon: "📞", color: "bg-purple-500 hover:bg-purple-600" },
  { key: "sms",       label: "SMS",       icon: "✉️", color: "bg-blue-500 hover:bg-blue-600" },
];

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Build the variables map from widget props. Keys match {{placeholders}} in templates.
 */
function buildVariables(props: MessagingWidgetProps): TemplateVariables {
  return {
    clientName: props.clientName,
    agentName: props.agentName,
    propertyAddress: props.propertyAddress ?? "",
    amount: props.amount ?? "",
    date: props.date ?? "",
    brokerName: "",   // left empty — caller can override via template
    dealType: props.relatedType === "deal" ? "deal" : "transaction",
    dealRef: props.relatedId?.slice(0, 8) ?? "",
    status: "in progress",
    documentList: "",
    message: "",
  };
}

// ─── Component ────────────────────────────────────────────────────

export default function MessagingWidget(props: MessagingWidgetProps) {
  const { open, onClose, relatedId, relatedType, clientName, clientPhone, agentName: _agentName, brokerId } = props;
  const { user } = useAuth();

  // State
  const [channel, setChannel] = useState<MessagingChannel>("whatsapp");
  const [selectedTemplateType, setSelectedTemplateType] = useState<MessageTemplateType>("general");
  const [messageBody, setMessageBody] = useState("");
  const [customTemplates, _setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const unsubRef = useRef<(() => void) | null>(null);

  // ── Load message logs for this entity ──
  useEffect(() => {
    if (!open || !relatedId) {return;}

    const unsub = subscribeMessageLogsForEntity(relatedId, (logs) => {
      setMessageLogs(logs.slice(0, 20));
    });

    return () => {
      unsub();
      unsubRef.current?.();
    };
  }, [open, relatedId]);

  // ── Rebuild message body when template or channel changes ──
  const rebuildMessage = useCallback(() => {
    const vars = buildVariables(props);

    // Look for a custom template first, fall back to DEFAULT_TEMPLATES
    const custom = customTemplates.find((t) => t.type === selectedTemplateType);
    let rawBody: string;

    if (custom) {
      rawBody = channel === "whatsapp" ? custom.bodyWhatsApp
        : channel === "viber" ? custom.bodyViber
        : custom.bodySms;
    } else {
      const fallback = DEFAULT_TEMPLATES.find((t) => t.type === selectedTemplateType);
      if (!fallback) {
        setMessageBody("");
        return;
      }
      rawBody = channel === "whatsapp" ? fallback.bodyWhatsApp
        : channel === "viber" ? fallback.bodyViber
        : fallback.bodySms;
    }

    setMessageBody(fillTemplate(rawBody, vars));
  }, [props, channel, selectedTemplateType, customTemplates]);

  useEffect(() => {
    rebuildMessage();
  }, [rebuildMessage]);

  // ── Handlers ──

  const handleSend = async () => {
    if (!messageBody.trim() || !user) {return;}
    setSending(true);
    setSuccessMsg(null);

    try {
      await sendMessage(
        channel,
        clientPhone,
        messageBody,
        {
          templateType: selectedTemplateType,
          recipientName: clientName,
          recipientPhone: clientPhone,
          messageBody,
          relatedId,
          relatedType,
          sentBy: user.uid,
          brokerId,
        },
      );
      setSuccessMsg("Message sent! Chat opened in a new tab.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    const link = generateDeepLink(channel, clientPhone, messageBody);
    navigator.clipboard.writeText(link).catch(() => {
      // Fallback: no clipboard API
    });
    setSuccessMsg("Link copied to clipboard!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Render nothing when closed ──
  if (!open) {return null;}

  // ── Available templates (combined defaults + custom) ──
  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-lg rounded-xl bg-background shadow-2xl border mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Send Message</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          {/* Recipient info */}
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
            <span className="font-medium">To: </span>
            <span>{clientName}</span>
            <span className="mx-1.5 text-muted-foreground">&middot;</span>
            <span className="text-muted-foreground">{clientPhone}</span>
          </div>

          {/* Channel selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Channel</label>
            <div className="flex gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => setChannel(ch.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    channel === ch.key
                      ? `${ch.color} text-white`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{ch.icon}</span>
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Template</label>
            <select
              value={selectedTemplateType}
              onChange={(e) => setSelectedTemplateType(e.target.value as MessageTemplateType)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {allTemplates.map((t) => (
                <option key={`${t.type}-${t.name}`} value={t.type}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Message body */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Message</label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type your message..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={!messageBody.trim() || sending || !user}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {sending ? "Opening..." : `Send via ${CHANNELS.find((c) => c.key === channel)?.label}`}
            </button>
            <button
              onClick={handleCopyLink}
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              title="Copy deep link to clipboard"
            >
              Copy Link
            </button>
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/40 px-4 py-2 text-sm text-green-700 dark:text-green-300">
              {successMsg}
            </div>
          )}
        </div>

        {/* Recent message logs */}
        <div className="border-t px-6 py-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Recent Messages
            {messageLogs.length > 0 && (
              <span className="ml-1 text-xs">({messageLogs.length})</span>
            )}
          </h3>

          {messageLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">No messages sent yet for this {relatedType}.</p>
          ) : (
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {messageLogs.map((log) => {
                const chInfo = CHANNELS.find((c) => c.key === log.channel);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs"
                  >
                    <span className="mt-0.5">{chInfo?.icon ?? "📨"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium capitalize">{log.channel}</span>
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            log.status === "sent"
                              ? "bg-blue-400"
                              : log.status === "opened"
                                ? "bg-green-400"
                                : "bg-red-400"
                          }`}
                        />
                        <span className="text-muted-foreground">{log.status}</span>
                      </div>
                      <p className="mt-0.5 truncate text-muted-foreground">
                        {log.messageBody}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
