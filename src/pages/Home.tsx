import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Upload,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  File,
  Trash2,
  Copy,
  Settings,
  Moon,
  Sun,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import { uploadFiles, formatFileSize } from '@/utils/fileUpload'

// Type definitions
interface Message {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: Date
  sources?: Source[]
  confidence?: number
  relatedTopics?: string[]
  followUpQuestions?: string[]
}

interface Source {
  title: string
  url?: string
  relevance: number
  excerpt?: string
}

interface UploadedDocument {
  id: string
  name: string
  size: number
  uploadDate: Date
  pages?: number
}

// Constants
const AGENT_ID = '695e1b6528a3f341188e0149'
const RAG_ID = '695e1b5e1fd00875a2eb6b4f'

// Suggested questions for empty state
const SUGGESTED_QUESTIONS = [
  'What are the main topics covered in my documents?',
  'Can you summarize the key findings?',
  'What are the most important takeaways?',
  'How do these documents relate to each other?',
]

// ============================================================================
// DOCUMENT SIDEBAR COMPONENT
// ============================================================================
function DocumentSidebar({
  documents,
  onUpload,
  onDelete,
  uploadProgress,
  isUploading,
}: {
  documents: UploadedDocument[]
  onUpload: (files: File[]) => void
  onDelete: (id: string) => void
  uploadProgress: number
  isUploading: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type === 'application/pdf')
    if (files.length > 0) {
      onUpload(files as File[])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      onUpload(files)
    }
  }

  return (
    <div className="w-60 bg-slate-950 border-r border-slate-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Your Documents</h2>
        <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
          {documents.length} file{documents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Upload Zone */}
      <div className="p-4 border-b border-slate-800">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-slate-900'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
              <span className="text-xs text-slate-400">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-xs text-slate-300 font-medium">Drag PDFs here</span>
              <span className="text-xs text-slate-500">or click to browse</span>
            </div>
          )}
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-3">
            <Progress value={uploadProgress} className="h-1" />
            <p className="text-xs text-slate-400 mt-2">{uploadProgress}% uploaded</p>
          </div>
        )}
      </div>

      {/* Document List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-2 p-3 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors group"
                >
                  <File className="h-4 w-4 text-slate-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">{doc.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-slate-500">{formatFileSize(doc.size)}</span>
                      {doc.pages && <span className="text-xs text-slate-500">{doc.pages}p</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================================================
// CITATION CARD COMPONENT
// ============================================================================
function CitationCard({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm">{source.title}</CardTitle>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
              >
                View source <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <Badge variant="outline" className="border-slate-700 text-purple-300 whitespace-nowrap">
            {(source.relevance * 100).toFixed(0)}% match
          </Badge>
        </div>
      </CardHeader>

      {source.excerpt && (
        <>
          <CardContent className="pb-3">
            {expanded ? (
              <p className="text-sm text-slate-300 line-clamp-none">{source.excerpt}</p>
            ) : (
              <p className="text-sm text-slate-400 line-clamp-2">{source.excerpt}</p>
            )}
          </CardContent>
          <Separator className="bg-slate-800" />
          <div className="px-4 py-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              {expanded ? 'Show less' : 'Show more'}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </>
      )}
    </Card>
  )
}

// ============================================================================
// RESPONSE CARD COMPONENT
// ============================================================================
function ResponseCard({ message }: { message: Message }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopiedId(message.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Main Response */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Answer</CardTitle>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Copy response"
            >
              {copiedId === message.id ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-slate-400" />
              )}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      {message.confidence !== undefined && (
        <div className="flex items-center gap-4 text-xs text-slate-400 px-4">
          <div className="flex items-center gap-2">
            <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${Math.round(message.confidence * 100)}%` }}
              />
            </div>
            <span>{Math.round(message.confidence * 100)}% confidence</span>
          </div>
        </div>
      )}

      {/* Related Topics */}
      {message.relatedTopics && message.relatedTopics.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium">Related Topics:</p>
          <div className="flex flex-wrap gap-2">
            {message.relatedTopics.map((topic, i) => (
              <Badge key={i} variant="outline" className="bg-slate-900 border-slate-700 text-slate-300">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {message.sources && message.sources.length > 0 && (
        <div>
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-slate-100">
              <ChevronDown className="h-4 w-4" />
              Sources ({message.sources.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {message.sources.map((source, i) => (
                <CitationCard key={i} source={source} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Follow-up Questions */}
      {message.followUpQuestions && message.followUpQuestions.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium">Follow-up Questions:</p>
          <div className="space-y-2">
            {message.followUpQuestions.map((question, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-3 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SUGGESTED QUESTIONS COMPONENT
// ============================================================================
function SuggestedQuestions({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 font-medium">Try asking about:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {SUGGESTED_QUESTIONS.map((question, i) => (
          <Button
            key={i}
            variant="outline"
            className="justify-start text-left h-auto py-3 px-4 text-sm border-slate-700 text-slate-300 hover:bg-slate-900 hover:border-purple-500 transition-colors"
            onClick={() => onSelect(question)}
          >
            <Search className="h-4 w-4 mr-2 text-slate-500" />
            {question}
          </Button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN HOME COMPONENT
// ============================================================================
export default function Home() {
  // State management
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // Handle document upload
  const handleUpload = async (files: File[]) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 30
        })
      }, 200)

      // Upload files
      const result = await uploadFiles(files)

      clearInterval(progressInterval)

      if (result.success) {
        setUploadProgress(100)
        // Add documents to list
        const newDocs = files.map((file) => ({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          uploadDate: new Date(),
          pages: Math.floor(Math.random() * 50) + 5, // Mock page count
        }))
        setDocuments((prev) => [...prev, ...newDocs])

        // Reset progress after delay
        setTimeout(() => setUploadProgress(0), 1000)
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle document delete
  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  // Handle search/chat submission
  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    if (e instanceof KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'Enter') return
    } else {
      e.preventDefault()
    }

    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // Call the Knowledge Search Agent
      const result = await callAIAgent(input, AGENT_ID)

      if (result.success && result.response) {
        const response = result.response

        // Parse the response based on schema
        const agentMessage: Message = {
          id: Math.random().toString(36).substring(7),
          type: 'agent',
          content:
            response.result?.answer ||
            (typeof response === 'string' ? response : 'No response received'),
          timestamp: new Date(),
          sources: response.result?.sources || [],
          confidence: response.result?.confidence,
          relatedTopics: response.result?.related_topics,
          followUpQuestions: response.result?.follow_up_questions,
        }

        setMessages((prev) => [...prev, agentMessage])
      } else {
        setError(result.error || 'Failed to get response')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle suggested question selection
  const handleSelectSuggestion = (question: string) => {
    setInput(question)
    setTimeout(() => {
      textareaRef.current?.focus()
      // Trigger submit after a short delay
      setTimeout(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          bubbles: true,
        })
        textareaRef.current?.dispatchEvent(event)
        handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      }, 100)
    }, 50)
  }

  // Clear chat history
  const handleClearChat = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div
      className={`h-screen flex flex-col ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}
    >
      {/* Header */}
      <header
        className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'} px-6 py-4`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-purple-500" />
            <h1 className="text-2xl font-bold">Knowledge Search</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-slate-800 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-slate-800 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Documents */}
        <DocumentSidebar
          documents={documents}
          onUpload={handleUpload}
          onDelete={handleDeleteDocument}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
        />

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
              {/* Empty State with Suggestions */}
              {messages.length === 0 && (
                <div className="py-12 space-y-8">
                  <div className="text-center">
                    <Search className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Start Searching Your Documents</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                      Upload PDF documents and ask intelligent questions about their contents.
                      Get cited answers with source references.
                    </p>
                  </div>

                  {documents.length > 0 && <SuggestedQuestions onSelect={handleSelectSuggestion} />}
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'user' ? (
                    // User message
                    <div className="bg-purple-600 text-white rounded-lg px-4 py-3 max-w-2xl">
                      {message.content}
                    </div>
                  ) : (
                    // Agent response
                    <div className="w-full max-w-3xl">
                      <ResponseCard message={message} />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                    <span className="text-sm">Searching your documents...</span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    isDarkMode
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div
            className={`border-t ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'} p-6`}
          >
            <div className="max-w-4xl mx-auto">
              {documents.length === 0 && messages.length === 0 && (
                <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-200">
                    Upload PDF documents to get started with intelligent document search.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        handleSubmit(e)
                      }
                    }}
                    placeholder="Ask anything about your documents... (Cmd/Ctrl+Enter to search)"
                    className={`resize-none min-h-24 max-h-48 p-4 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    disabled={isLoading || documents.length === 0}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {documents.length === 0 && 'Upload documents to search'}
                  </div>
                  <div className="flex gap-2">
                    {messages.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearChat}
                        disabled={isLoading}
                        className={isDarkMode ? 'border-slate-700' : ''}
                      >
                        Clear Chat
                      </Button>
                    )}
                    <Button
                      onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                      disabled={isLoading || !input.trim() || documents.length === 0}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
