"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrainIcon, XIcon, LoaderIcon, ChevronDownIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your MedAI Assistant. I can help you understand diagnostic results, explain risk predictions, or answer questions about the platform. How can I assist you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2))
                assistantContent += text
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: assistantContent } : m)),
                )
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <BrainIcon className="h-6 w-6" />
      </button>
    )
  }

  return (
    <Card
      className={cn(
        "fixed bottom-6 right-6 z-50 w-96 shadow-xl bg-card border-border transition-all duration-200",
        isMinimized ? "h-14" : "h-[500px]",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BrainIcon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm text-card-foreground">MedAI Assistant</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            <ChevronDownIcon
              className={cn("h-4 w-4 text-muted-foreground transition-transform", isMinimized && "rotate-180")}
            />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            <XIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col h-[calc(100%-56px)] p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about diagnostics..."
                className="flex-1 bg-transparent"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="bg-primary text-primary-foreground"
              >
                Send
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
