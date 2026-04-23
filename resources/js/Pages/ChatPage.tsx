import MainLayout from "@/layouts/MainLayout";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Search as SearchIcon, Lock, Users, Bell, MessageCircle, PlusCircle, Shield, MessageSquare, Loader2 } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReactionPicker } from "@/components/chat/ReactionPicker";
import { ReactionDisplay } from "@/components/chat/ReactionDisplay";
import { MessageActions } from "@/components/chat/MessageActions";
import { EditMessageModal } from "@/components/chat/EditMessageModal";
import { DeleteConfirmation } from "@/components/chat/DeleteConfirmation";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { FileAttachmentButton, FilePreview } from "@/components/chat/FileAttachment";
import { AttachmentDisplay } from "@/components/chat/AttachmentDisplay";
import { getEcho } from "@/lib/echo";
import type { SharedData } from "@/types";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
  userIds?: number[];
}

interface Message {
  id: number;
  conversationId: number;
  sender: string;
  avatar: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  authorUserId: number;
  created_at: string;
  is_edited?: boolean;
  edited_at?: string;
  reactions?: Reaction[];
  attachment?: {
    path: string;
    name: string;
    type: string;
    size: number;
  } | null;
}

interface Conversation {
  id: number;
  type: string;
  name: string;
  department?: string;
  unread: number;
  last_message: string;
  last_message_time?: string;
  is_read_only?: boolean;
  is_global?: boolean;
  is_confidential?: boolean;
}

interface DirectMessage {
  id: string;
  conversation_id: number;
  user_id: number;
  name: string;
  department: string;
  position: string;
  avatar: string;
  unread: number;
  last_message: string;
  timestamp: string;
  isOnline?: boolean;
}

interface ChatPageProps {
  userRole?: string;
}

type ChatMessageAction = "created" | "updated" | "deleted" | "reactions";

interface ChatMessageEvent {
  conversationId: number;
  action: ChatMessageAction;
  message: Partial<Message> & { id: number };
  actorUserId?: number | null;
}

interface ChatTypingEvent {
  conversationId: number;
  userId: number;
  userName: string;
}

const upsertMessage = (messages: Message[], incoming: Message): Message[] => {
  const nextMessages = messages.some((message) => message.id === incoming.id)
    ? messages.map((message) =>
      message.id === incoming.id ? { ...message, ...incoming } : message
    )
    : [...messages, incoming];

  return nextMessages.sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );
};

const getMessagePreview = (message: Pick<Message, "content" | "attachment">): string => {
  const content = message.content.trim();

  if (content !== "") {
    return content;
  }

  if (message.attachment?.name) {
    return `Shared ${message.attachment.name}`;
  }

  return "Updated message";
};

export default function ChatPage({ userRole = "staff" }: ChatPageProps) {
  const { auth } = usePage<SharedData>().props;
  const currentUserId = auth.user.id;
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedDM, setSelectedDM] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("all");
  const [chatType, setChatType] = useState<"channels" | "direct">("channels");
  const [searchTerm, setSearchTerm] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Enhanced features state
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingUsersTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const lastTypingPingAtRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New channel dialog
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDept, setNewChannelDept] = useState("");
  const [newChannelConfidential, setNewChannelConfidential] = useState(false);
  const [newChannelCreating, setNewChannelCreating] = useState(false);

  const isAdmin = userRole === "superadmin" || userRole === "hr" || userRole === "management";
  const activeConversationId = chatType === "channels" ? selectedConversation : selectedDM;
  const subscribedConversationKey = Array.from(
    new Set([
      ...conversations.map((conversation) => conversation.id),
      ...directMessages.map((directMessage) => directMessage.conversation_id),
    ])
  )
    .sort((left, right) => left - right)
    .join(",");

  const normalizeIncomingMessage = useCallback(
    (incoming: Message): Message => ({
      ...incoming,
      isOwn: (incoming.authorUserId ?? currentUserId) === currentUserId,
      reactions:
        incoming.reactions?.map((reaction) => ({
          ...reaction,
          hasReacted: reaction.userIds?.includes(currentUserId) ?? reaction.hasReacted,
        })) ?? [],
      attachment: incoming.attachment ?? null,
    }),
    [currentUserId]
  );

  const syncConversationPreview = useCallback(
    (conversationId: number, message: Message, incrementUnread = false) => {
      const preview = getMessagePreview(message);

      setConversations((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation.id === conversationId
            ? {
              ...conversation,
              last_message: preview,
              last_message_time: "Just now",
              unread: incrementUnread ? conversation.unread + 1 : conversation.unread,
            }
            : conversation
        )
      );

      setDirectMessages((previousDirectMessages) =>
        previousDirectMessages.map((directMessage) =>
          directMessage.conversation_id === conversationId
            ? {
              ...directMessage,
              last_message: preview,
              timestamp: "Just now",
              unread: incrementUnread ? directMessage.unread + 1 : directMessage.unread,
            }
            : directMessage
        )
      );
    },
    []
  );

  const applyRealtimeMessage = useCallback(
    (event: ChatMessageEvent) => {
      const isCurrentConversation = activeConversationId === event.conversationId;

      if (event.action === "deleted") {
        if (isCurrentConversation) {
          setMessages((previousMessages) =>
            previousMessages.filter((message) => message.id !== event.message.id)
          );
        }

        return;
      }

      const normalizedMessage = normalizeIncomingMessage(event.message as Message);

      if (isCurrentConversation) {
        setMessages((previousMessages) => upsertMessage(previousMessages, normalizedMessage));
      }

      if (event.action === "created" || event.action === "updated") {
        const incrementUnread =
          event.action === "created" && !isCurrentConversation && !normalizedMessage.isOwn;

        syncConversationPreview(event.conversationId, normalizedMessage, incrementUnread);
      }

      if (event.action === "reactions" && isCurrentConversation) {
        setMessages((previousMessages) => upsertMessage(previousMessages, normalizedMessage));
      }
    },
    [activeConversationId, normalizeIncomingMessage, syncConversationPreview]
  );

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    fetchDirectMessages();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (chatType === "channels" && selectedConversation) {
      fetchMessages(selectedConversation);
    } else if (chatType === "direct" && selectedDM) {
      fetchMessages(selectedDM);
    }
  }, [selectedConversation, selectedDM, chatType]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      Object.values(typingUsersTimeoutRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    setTypingUsers([]);
    Object.values(typingUsersTimeoutRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    typingUsersTimeoutRef.current = {};
  }, [activeConversationId]);

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && chatType === "channels") {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations]);

  useEffect(() => {
    const echo = getEcho();
    const conversationIds =
      subscribedConversationKey === ""
        ? []
        : subscribedConversationKey.split(",").map((value) => Number(value));

    if (!echo || conversationIds.length === 0) {
      return;
    }

    const cleanupCallbacks = conversationIds.map((conversationId) => {
      const channel = echo.private(`chat.conversation.${conversationId}`);

      const handleMessageEvent = (event: ChatMessageEvent) => {
        applyRealtimeMessage(event);
      };

      const handleTypingEvent = (event: ChatTypingEvent) => {
        if (event.conversationId !== activeConversationId || event.userId === currentUserId) {
          return;
        }

        setTypingUsers((previousTypingUsers) =>
          previousTypingUsers.includes(event.userName)
            ? previousTypingUsers
            : [...previousTypingUsers, event.userName]
        );

        const existingTimeout = typingUsersTimeoutRef.current[event.userId];
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        typingUsersTimeoutRef.current[event.userId] = setTimeout(() => {
          setTypingUsers((previousTypingUsers) =>
            previousTypingUsers.filter((name) => name !== event.userName)
          );
          delete typingUsersTimeoutRef.current[event.userId];
        }, 2500);
      };

      channel.listen(".chat.message", handleMessageEvent);
      channel.listen(".chat.typing", handleTypingEvent);

      return () => {
        channel.stopListening(".chat.message", handleMessageEvent);
        channel.stopListening(".chat.typing", handleTypingEvent);
        echo.leave(`chat.conversation.${conversationId}`);
      };
    });

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [activeConversationId, applyRealtimeMessage, currentUserId, subscribedConversationKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchDirectMessages = async () => {
    try {
      const response = await axios.get('/api/chat/direct-messages');
      setDirectMessages(response.data);
    } catch (error) {
      console.error('Error fetching direct messages:', error);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/chat/conversations/${conversationId}/messages`);
      setMessages(response.data.messages.map(normalizeIncomingMessage));

      // Update unread count
      if (chatType === "channels") {
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread: 0 } : conv
        ));
      } else {
        setDirectMessages(prev => prev.map(dm =>
          dm.conversation_id === conversationId ? { ...dm, unread: 0 } : dm
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    if (!selectedConversation && !selectedDM) return;

    const conversationId = chatType === "channels" ? selectedConversation : selectedDM;
    if (!conversationId) return;

    setSending(true);
    try {
      const response = await axios.post(`/api/chat/conversations/${conversationId}/messages`, {
        content: messageText,
      });

      const normalizedMessage = normalizeIncomingMessage(response.data);

      setMessages((previousMessages) => upsertMessage(previousMessages, normalizedMessage));
      setMessageText("");
      syncConversationPreview(conversationId, normalizedMessage);
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.response?.status === 403) {
        alert(error.response.data.error || 'You do not have permission to send messages in this conversation');
      }
    } finally {
      setSending(false);
    }
  };

  // Reaction handlers
  const handleAddReaction = async (messageId: number, emoji: string) => {
    try {
      const response = await axios.post(`/api/chat/messages/${messageId}/reactions`, { emoji });

      const normalizedMessage = normalizeIncomingMessage(response.data.message);
      setMessages((previousMessages) => upsertMessage(previousMessages, normalizedMessage));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Edit message handlers
  const handleEditMessage = async (newContent: string) => {
    if (!editingMessage) return;

    setIsSavingEdit(true);
    try {
      const response = await axios.put(`/api/chat/messages/${editingMessage.id}`, {
        content: newContent,
      });

      const normalizedMessage = normalizeIncomingMessage(response.data);
      setMessages((previousMessages) => upsertMessage(previousMessages, normalizedMessage));
      syncConversationPreview(normalizedMessage.conversationId, normalizedMessage);

      setEditingMessage(null);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete message handlers
  const handleDeleteMessage = async () => {
    if (!deletingMessageId) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/chat/messages/${deletingMessageId}`);

      // Remove the message from the list
      setMessages(prev => prev.filter(msg => msg.id !== deletingMessageId));
      setDeletingMessageId(null);
      fetchConversations();
      fetchDirectMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  // Typing indicator handlers
  const handleTyping = useCallback(() => {
    const conversationId = chatType === "channels" ? selectedConversation : selectedDM;
    if (!conversationId) return;

    const now = Date.now();
    if (now - lastTypingPingAtRef.current < 1200) {
      return;
    }

    lastTypingPingAtRef.current = now;

    // Send typing indicator
    axios.post(`/api/chat/conversations/${conversationId}/typing`).catch(console.error);
  }, [chatType, selectedConversation, selectedDM]);

  // File upload handler
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    if (!selectedConversation && !selectedDM) return;

    const conversationId = chatType === "channels" ? selectedConversation : selectedDM;
    if (!conversationId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (messageText.trim()) {
        formData.append('content', messageText);
      }

      const response = await axios.post(`/api/chat/conversations/${conversationId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const normalizedMessage = normalizeIncomingMessage(response.data);

      setMessages((previousMessages) => upsertMessage(previousMessages, normalizedMessage));
      setMessageText("");
      setSelectedFile(null);
      syncConversationPreview(conversationId, normalizedMessage);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      if (error.response?.status === 403) {
        alert(error.response.data.error || 'You do not have permission to upload files in this conversation');
      } else {
        alert('Failed to upload file. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    setNewChannelCreating(true);
    try {
      const currentUserId2 = auth.user.id;
      await axios.post('/api/chat/conversations', {
        type: 'group',
        name: newChannelName.trim(),
        department: newChannelDept.trim() || null,
        participant_ids: [currentUserId2],
        is_confidential: newChannelConfidential,
      });
      setNewChannelOpen(false);
      setNewChannelName("");
      setNewChannelDept("");
      setNewChannelConfidential(false);
      fetchConversations();
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setNewChannelCreating(false);
    }
  };

  const departments = ["Tech", "Design", "Marketing", "Sales", "HR", "Finance"];

  const filteredConversations = isAdmin && selectedDepartmentFilter !== "all"
    ? conversations.filter(c => c.is_global || c.department === selectedDepartmentFilter)
    : conversations;

  const filteredDMs = searchTerm
    ? directMessages.filter(dm =>
      dm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dm.department.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : directMessages;

  const currentConvData = chatType === "channels"
    ? conversations.find(c => c.id === selectedConversation)
    : null;

  const currentDMData = chatType === "direct"
    ? directMessages.find(dm => dm.conversation_id === selectedDM)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] gap-4">
      <div className="flex-shrink-0">
        <h1 className="text-foreground mb-1">Team Chat</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin ? "Access all team communications" : "Communicate with your team"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar - Chat Groups & Direct Messages */}
        <Card className="bg-card shadow-sm lg:col-span-1 h-full !flex flex-col min-h-0 overflow-hidden gap-0">
          <CardHeader className="border-b border-border pb-3 flex-shrink-0">
            <Tabs value={chatType} onValueChange={(v) => setChatType(v as "channels" | "direct")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="channels" className="text-xs">
                  <Users className="w-4 h-4 mr-1" />
                  Channels
                </TabsTrigger>
                <TabsTrigger value="direct" className="text-xs">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Direct
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <div className="flex-1 min-h-0 overflow-y-scroll custom-scrollbar">
            <CardContent className="p-0">
              {chatType === "channels" ? (
                <>
                  {isAdmin && (
                    <div className="p-3 border-b border-border space-y-2">
                      <Select value={selectedDepartmentFilter} onValueChange={setSelectedDepartmentFilter}>
                        <SelectTrigger className="bg-card h-9 text-xs">
                          <SelectValue placeholder="Filter by department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={newChannelOpen} onOpenChange={setNewChannelOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                            <PlusCircle className="w-3.5 h-3.5 mr-1" /> New Channel
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-sm">Create Channel</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Channel Name *</Label>
                              <Input
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                placeholder="e.g. #leadership-ops"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Department (optional)</Label>
                              <Input
                                value={newChannelDept}
                                onChange={(e) => setNewChannelDept(e.target.value)}
                                placeholder="e.g. Engineering"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-amber-500" />
                                <Label className="text-xs">Confidential (leaders only)</Label>
                              </div>
                              <Switch
                                checked={newChannelConfidential}
                                onCheckedChange={setNewChannelConfidential}
                              />
                            </div>
                            <Button
                              onClick={handleCreateChannel}
                              disabled={newChannelCreating || !newChannelName.trim()}
                              className="w-full bg-brand hover:bg-brand/90 text-white h-8 text-xs"
                            >
                              {newChannelCreating ? "Creating…" : "Create Channel"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                  <div className="space-y-1 p-2">
                    {filteredConversations.filter(conv => conv.type === 'group').length === 0 && (
                      <div className="flex flex-col items-center py-8 gap-2 text-center px-4">
                        <Users className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground">No channels available</p>
                      </div>
                    )}
                    {filteredConversations.filter(conv => conv.type === 'group').map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          setSelectedDM(null);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedConversation === conv.id && chatType === "channels"
                          ? "bg-brand text-white"
                          : "hover:bg-muted text-foreground"
                          }`}
                      >
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className={selectedConversation === conv.id && chatType === "channels" ? "bg-white/20 text-white" : "bg-brand text-white"}>
                              {(conv.name || 'CH').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {conv.unread > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-white text-xs">
                              {conv.unread}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${selectedConversation === conv.id && chatType === "channels" ? "text-white" : "text-foreground"}`}>
                              {conv.name}
                            </p>
                            {conv.is_read_only && (
                              <Lock className={`w-3 h-3 ${selectedConversation === conv.id && chatType === "channels" ? "text-white" : "text-muted-foreground"}`} />
                            )}
                            {conv.is_global && (
                              <Bell className={`w-3 h-3 ${selectedConversation === conv.id && chatType === "channels" ? "text-white" : "text-muted-foreground"}`} />
                            )}
                            {conv.is_confidential && (
                              <span title="Confidential">
                                <Shield className={`w-3 h-3 ${selectedConversation === conv.id && chatType === "channels" ? "text-white" : "text-amber-500"}`} />
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate ${selectedConversation === conv.id && chatType === "channels" ? "text-white/80" : "text-muted-foreground"}`}>
                            {conv.last_message}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 p-2">
                    {filteredDMs.map((dm) => (
                      <button
                        key={dm.id}
                        onClick={() => {
                          setSelectedDM(dm.conversation_id);
                          setSelectedConversation(null);
                          setChatType("direct");
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedDM === dm.conversation_id
                          ? "bg-brand text-white"
                          : "hover:bg-muted text-foreground"
                          }`}
                      >
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className={selectedDM === dm.conversation_id ? "bg-white/20 text-white" : "bg-brand text-white"}>
                              {dm.avatar}
                            </AvatarFallback>
                          </Avatar>
                          {dm.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                          {dm.unread > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-white text-xs">
                              {dm.unread}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium truncate ${selectedDM === dm.conversation_id ? "text-white" : "text-foreground"}`}>
                              {dm.name}
                            </p>
                            <p className={`text-xs ${selectedDM === dm.conversation_id ? "text-white/70" : "text-muted-foreground"}`}>
                              {dm.timestamp}
                            </p>
                          </div>
                          <p className={`text-xs truncate ${selectedDM === dm.conversation_id ? "text-white/80" : "text-muted-foreground"}`}>
                            {dm.department} • {dm.position}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Main Chat Area */}
        <Card className="bg-card shadow-sm lg:col-span-3 h-full !flex flex-col min-h-0 overflow-hidden gap-0">
          {/* Chat Header */}
          <CardHeader className="border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-brand text-white">
                      {chatType === "direct" && currentDMData
                        ? currentDMData.avatar
                        : (currentConvData?.name || 'CH').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chatType === "direct" && currentDMData?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    {chatType === "direct" && currentDMData
                      ? currentDMData.name
                      : currentConvData?.name || "Select a conversation"}
                    {currentConvData?.is_read_only && chatType === "channels" && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Read Only
                      </Badge>
                    )}
                    {currentConvData?.is_confidential && chatType === "channels" && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Confidential
                      </Badge>
                    )}
                    {chatType === "direct" && currentDMData?.isOnline && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Online
                      </Badge>
                    )}
                  </CardTitle>
                  {chatType === "direct" && currentDMData ? (
                    <p className="text-xs text-muted-foreground">{currentDMData.position} • {currentDMData.department}</p>
                  ) : currentConvData?.department ? (
                    <p className="text-xs text-muted-foreground">{currentConvData.department} Department</p>
                  ) : null}
                </div>
              </div>
              {chatType === "direct" && currentDMData && (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {currentDMData.department}
                </Badge>
              )}
              {isAdmin && chatType === "channels" && currentConvData?.department && (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {currentConvData.department}
                </Badge>
              )}
            </div>
          </CardHeader>

          {/* Messages Area */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="text-sm text-muted-foreground">Loading messages…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
                <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-brand" />
                </div>
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground">Be the first to say something!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                    className={`flex gap-3 group ${message.isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={message.isOwn ? "bg-brand-yellow text-foreground" : "bg-brand text-white"}>
                        {message.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${message.isOwn ? "flex flex-col items-end" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{message.sender}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                        {message.is_edited && (
                          <span className="text-xs text-muted-foreground italic">(edited)</span>
                        )}
                        {message.isOwn && (
                          <MessageActions
                            onEdit={() => setEditingMessage(message)}
                            onDelete={() => setDeletingMessageId(message.id)}
                          />
                        )}
                      </div>
                      <div
                        className={`inline-block p-3 rounded-2xl max-w-lg ${message.isOwn
                          ? "bg-brand text-white rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none"
                          }`}
                      >
                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>

                      {/* Attachment Display */}
                      {message.attachment && (
                        <AttachmentDisplay attachment={message.attachment} />
                      )}

                      {/* Reactions Display */}
                      {message.reactions && message.reactions.length > 0 && (
                        <ReactionDisplay
                          reactions={message.reactions}
                          onReactionClick={(emoji) => handleAddReaction(message.id, emoji)}
                        />
                      )}

                      {/* Reaction Picker */}
                      {!currentConvData?.is_read_only && (
                        <div className={`mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${message.isOwn ? "flex justify-end" : ""}`}>
                          <ReactionPicker
                            onReactionSelect={(emoji) => handleAddReaction(message.id, emoji)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <TypingIndicator users={typingUsers} />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-border p-4 flex-shrink-0">
            {currentConvData?.is_read_only && !isAdmin ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <Lock className="w-4 h-4" />
                <span>This is a read-only channel</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* File Preview */}
                {selectedFile && (
                  <FilePreview
                    file={selectedFile}
                    onRemove={() => setSelectedFile(null)}
                  />
                )}

                {/* Message Input */}
                <div className="flex gap-2">
                  <FileAttachmentButton
                    onFileSelect={setSelectedFile}
                    disabled={sending || isUploading || (!selectedConversation && !selectedDM)}
                  />
                  <Input
                    placeholder={selectedFile ? "Add a message (optional)..." : "Type your message..."}
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !sending && !isUploading) {
                        if (selectedFile) {
                          handleFileUpload();
                        } else {
                          handleSendMessage();
                        }
                      }
                    }}
                    disabled={sending || isUploading || (!selectedConversation && !selectedDM)}
                    className="bg-card flex-1"
                  />
                  <Button
                    onClick={selectedFile ? handleFileUpload : handleSendMessage}
                    disabled={
                      sending ||
                      isUploading ||
                      (!selectedFile && !messageText.trim()) ||
                      (!selectedConversation && !selectedDM)
                    }
                    className="bg-brand hover:bg-brand/90 text-white"
                  >
                    {isUploading ? (
                      <span className="text-sm">Uploading...</span>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Message Modal */}
      <EditMessageModal
        open={editingMessage !== null}
        onOpenChange={(open) => !open && setEditingMessage(null)}
        currentContent={editingMessage?.content || ""}
        onSave={handleEditMessage}
        isSaving={isSavingEdit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={deletingMessageId !== null}
        onOpenChange={(open) => !open && setDeletingMessageId(null)}
        onConfirm={handleDeleteMessage}
        isDeleting={isDeleting}
      />
    </div>
  );
}

ChatPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
