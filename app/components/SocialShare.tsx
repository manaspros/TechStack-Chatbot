import type React from "react"
import { Twitter, Facebook, Linkedin } from "lucide-react"

interface SocialShareProps {
  url: string
  title: string
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return (
    <div className="flex space-x-4 mt-4">
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="pixelated-border p-2 bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <Twitter className="w-6 h-6" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="pixelated-border p-2 bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <Facebook className="w-6 h-6" />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="pixelated-border p-2 bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <Linkedin className="w-6 h-6" />
      </a>
    </div>
  )
}

export default SocialShare

