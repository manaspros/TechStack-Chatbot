import Link from "next/link"
import { posts } from "../../data/posts"
import { notFound } from "next/navigation"

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = params.slug.charAt(0).toUpperCase() + params.slug.slice(1)
  const categoryPosts = posts.filter((post) => post.category.toLowerCase() === params.slug)

  if (categoryPosts.length === 0) {
    notFound()
  }

  return (
    <div>
      <h2 className="text-2xl font-pixel mb-6">{category} Posts</h2>
      <div className="grid gap-6">
        {categoryPosts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h3 className="text-xl font-pixel mb-2">{post.title}</h3>
            <p className="font-mono text-sm mb-2">{post.content.slice(0, 100)}...</p>
            <span className="inline-block px-2 py-1 bg-green-600 text-black text-sm font-mono rounded">
              {post.category}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

