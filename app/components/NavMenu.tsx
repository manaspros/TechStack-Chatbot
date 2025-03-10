"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

const NavMenu = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

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

  return (
    <nav className="flex justify-center my-4 w-full max-w-md mx-auto">
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
    </nav>
  )
}

export default NavMenu

