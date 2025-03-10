"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Comment {
  id: number
  author: string
  content: string
}

const CommentSection: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState({ author: "", content: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.author && newComment.content) {
      setComments([...comments, { ...newComment, id: Date.now() }])
      setNewComment({ author: "", content: "" })
    }
  }

  return (
    <div className="mt-8 p-4 bg-gray-800 rounded-lg pixelated-border">
      <h3 className="text-2xl font-pixel mb-4">Comments</h3>
      {comments.map((comment) => (
        <div key={comment.id} className="mb-4 p-2 bg-gray-700 rounded">
          <p className="font-mono text-green-400">{comment.author}:</p>
          <p className="font-mono">{comment.content}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="mt-4">
        <Input
          type="text"
          placeholder="Your name"
          value={newComment.author}
          onChange={(e) => setNewComment({ ...newComment, author: e.target.value })}
          className="mb-2 font-mono"
        />
        <Textarea
          placeholder="Your comment"
          value={newComment.content}
          onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
          className="mb-2 font-mono"
        />
        <Button type="submit" className="font-pixel">
          Submit
        </Button>
      </form>
    </div>
  )
}

export default CommentSection

