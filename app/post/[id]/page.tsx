import { notFound } from "next/navigation"
import CommentSection from "../../components/CommentSection"
import SocialShare from "../../components/SocialShare"

const posts = [
  {
    id: 1,
    title: "AI: Your New Artsy Bestie",
    category: "Tech",
    content:
      "Who needs human creativity when you've got AI, right? Wrong! AI is here to amplify your artistic genius, not replace it. Imagine a world where your digital paintbrush is powered by machine learning, creating strokes you never thought possible. It's like having a hyper-caffeinated art assistant that never sleeps and doesn't steal your snacks. So, embrace the future, and let AI be the Robin to your Batman in the art world!",
  },
  // Add more posts here...
]

export default function Post({ params }: { params: { id: string } }) {
  const post = posts.find((p) => p.id === Number.parseInt(params.id))

  if (!post) {
    notFound()
  }

  return (
    <article className="prose prose-invert prose-green max-w-none">
      <h1 className="font-pixel">{post.title}</h1>
      <span className="inline-block px-2 py-1 bg-green-600 text-black text-sm font-mono rounded mb-4">
        {post.category}
      </span>
      <div className="font-mono text-lg leading-relaxed">{post.content}</div>
      <SocialShare url={`https://yourdomain.com/post/${post.id}`} title={post.title} />
      <CommentSection />
    </article>
  )
}

