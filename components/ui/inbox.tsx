"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Mail, Search, Filter, MoreVertical, Star, Archive, Trash2 } from "lucide-react"
import { Input } from "./input"

export interface InboxMessage {
  id: string
  from: string
  subject: string
  preview: string
  timestamp: string
  unread?: boolean
  starred?: boolean
}

export interface InboxProps {
  messages?: InboxMessage[]
  className?: string
}

const defaultMessages: InboxMessage[] = [
  {
    id: "1",
    from: "John Doe",
    subject: "Welcome to DataW Platform",
    preview: "Thank you for joining our platform. We're excited to have you on board!",
    timestamp: "2 hours ago",
    unread: true,
    starred: false,
  },
  {
    id: "2",
    from: "Sarah Smith",
    subject: "Data Pool Update",
    preview: "Your data pool has been successfully updated with new entries.",
    timestamp: "5 hours ago",
    unread: true,
    starred: true,
  },
  {
    id: "3",
    from: "Mike Johnson",
    subject: "Weekly Report Available",
    preview: "Your weekly analytics report is now available for download.",
    timestamp: "1 day ago",
    unread: false,
    starred: false,
  },
  {
    id: "4",
    from: "Emily Chen",
    subject: "Account Verification",
    preview: "Please verify your account to continue using all features.",
    timestamp: "2 days ago",
    unread: false,
    starred: false,
  },
]

export function Inbox({ messages = defaultMessages, className }: InboxProps) {
  const [selectedMessage, setSelectedMessage] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filteredMessages, setFilteredMessages] = React.useState(messages)

  React.useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMessages(messages)
    } else {
      const filtered = messages.filter(
        (msg) =>
          msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.preview.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredMessages(filtered)
    }
  }, [searchQuery, messages])

  const unreadCount = messages.filter((msg) => msg.unread).length

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Inbox</CardTitle>
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No messages found</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-4 p-4 hover:bg-accent/50 cursor-pointer transition-colors",
                  message.unread && "bg-accent/30",
                  selectedMessage === message.id && "bg-accent"
                )}
                onClick={() => setSelectedMessage(message.id)}
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {message.from.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            message.unread && "font-semibold"
                          )}
                        >
                          {message.from}
                        </p>
                        {message.starred && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm truncate mt-1",
                          message.unread ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                      >
                        {message.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {message.preview}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {message.timestamp}
                      </span>
                      {message.unread && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle star toggle
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        message.starred && "fill-yellow-400 text-yellow-400"
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle archive
                    }}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle delete
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

