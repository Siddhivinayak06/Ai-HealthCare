"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, MessageCircle, Send, X, Mic, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"

type Message = {
    role: "user" | "bot"
    text: string
    timestamp: Date
    actions?: Array<{ label: string, link: string }>
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "bot",
            text: "Hello! 👋 I'm your AI Medical Assistant. How can I help you today?",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const pathname = usePathname()

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isOpen])

    // Hide on login/signup pages
    if (pathname === "/login" || pathname === "/register" || pathname === "/") return null

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg: Message = { role: "user", text: input, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)

        try {
            // Get session token (simplified, ideally via context or auth hook)
            // Note: In real app, we need to pass token in headers. 
            // For this widget demo, we'll try to fetch from cookie via api proxy or assume cookie is sent automatically.
            // Since this component is "use client", standard fetch sends cookies.

            const res = await fetch("/api/proxy/chat", { // We'll need a Next.js proxy route or direct to backend if configured
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg.text })
            })

            // Fallback for demo if backend route isn't actively proxied or 404
            let botMsg: Message;
            if (res.ok) {
                const data = await res.json()
                botMsg = {
                    role: "bot",
                    text: data.response,
                    timestamp: new Date(),
                    actions: data.actions
                }
            } else {
                // Simple client-side fallback if backend unreachable
                botMsg = {
                    role: "bot",
                    text: "I'm having trouble connecting to the server. Try again later!",
                    timestamp: new Date()
                }
            }
            setMessages(prev => [...prev, botMsg])

        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", text: "Something went wrong. Please check your connection.", timestamp: new Date() }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleActionClick = (link: string) => {
        router.push(link)
        setIsOpen(false)
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="animate-in slide-in-from-bottom-5 duration-300">
                    <Card className="w-[350px] h-[500px] shadow-2xl border-primary/20 flex flex-col backdrop-blur-xl bg-background/80">
                        <CardHeader className="p-4 border-b bg-primary/5 space-y-1">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        <Bot className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">Medical Assistant</CardTitle>
                                        <CardDescription className="text-xs">Always here to help</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden relative">
                            <ScrollArea className="h-full p-4 pr-3"> {/* Added padding-right for scrollbar */}
                                <div className="space-y-4">
                                    {messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex w-full gap-2",
                                                msg.role === "user" ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {msg.role === "bot" && (
                                                <Avatar className="h-8 w-8 border border-primary/20">
                                                    <AvatarImage src="/bot-avatar.png" />
                                                    <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className="flex flex-col gap-1 max-w-[80%]">
                                                <div
                                                    className={cn(
                                                        "p-3 rounded-2xl text-sm shadow-sm",
                                                        msg.role === "user"
                                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                                            : "bg-secondary/50 border border-border/50 rounded-tl-none"
                                                    )}
                                                >
                                                    {msg.text}
                                                </div>

                                                {/* Action Buttons */}
                                                {msg.actions && msg.actions.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {msg.actions.map((action, idx) => (
                                                            <Button
                                                                key={idx}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-xs bg-background/50 hover:bg-primary/5 border-primary/20"
                                                                onClick={() => handleActionClick(action.link)}
                                                            >
                                                                {action.label}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                )}

                                                <span className="text-[10px] text-muted-foreground px-1 opacity-50">
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {msg.role === "user" && (
                                                <Avatar className="h-8 w-8 border border-border">
                                                    <AvatarFallback className="bg-secondary">ME</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start gap-2">
                                            <Avatar className="h-8 w-8 border border-primary/20">
                                                <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                                            </Avatar>
                                            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50 rounded-tl-none flex gap-1 items-center">
                                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="p-3 border-t bg-secondary/10">
                            <div className="flex items-center gap-2 w-full">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <RotateCcw className="h-4 w-4" onClick={() => setMessages([messages[0]])} />
                                </Button>
                                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex-1 flex gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="h-9 text-sm focus-visible:ring-primary/20"
                                        disabled={loading}
                                    />
                                    <Button type="submit" size="icon" className="h-9 w-9" disabled={!input.trim() || loading}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-tr from-primary to-indigo-500 hover:scale-110 transition-all duration-300 animate-in zoom-in-50"
                >
                    <MessageCircle className="h-7 w-7 text-white" />
                    {/* Notification dot */}
                    <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
                </Button>
            )}
        </div>
    )
}
