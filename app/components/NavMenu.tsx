"use client"

import type React from "react"
import { useState } from "react"
import { Search, BookOpen } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

const NavMenu = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
      setTimeout(() => {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        setIsSearching(false)
      }, 500) // Delay to show animation
    }
  }

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex flex-col items-center my-4 w-full max-w-md mx-auto space-y-3">
      <form onSubmit={handleSearch} className="flex w-full">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded-l pixelated-border font-mono text-green-400 focus:outline-none"
          />
          <button
            type="submit"
            className={`p-2 bg-green-600 text-black rounded-r pixelated-border hover:bg-green-500 transition-colors ${isSearching ? "animate-pulse" : ""}`}
            disabled={isSearching}
          >
            <Search className={`w-5 h-5 ${isSearching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </form>

      <div className="flex justify-center gap-4 w-full">
        <Link 
          href="/chatbot"
          className={`flex items-center px-3 py-1.5 rounded pixelated-border font-mono transition-colors ${
            isActive('/chatbot') 
              ? 'bg-green-600 text-black' 
              : 'bg-gray-800 text-green-400 hover:bg-gray-700'
          }`}
        >
          <span className="mr-1">AI Assistant</span>
        </Link>
        
        <Link 
          href="/learning-paths"
          className={`flex items-center px-3 py-1.5 rounded pixelated-border font-mono transition-colors ${
            isActive('/learning-paths') 
              ? 'bg-green-600 text-black' 
              : 'bg-gray-800 text-green-400 hover:bg-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-1" />
          <span>Learning Paths</span>
        </Link>
      </div>
    </nav>
  )
}

export default NavMenu

