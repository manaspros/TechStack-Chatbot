import type React from "react"

const PixelLogo: React.FC = () => {
  return (
    <div className="w-16 h-16 grid grid-cols-8 grid-rows-8 gap-0.5 mb-4">
      {[...Array(64)].map((_, i) => (
        <div
          key={i}
          className={`w-full h-full ${
            [0, 7, 8, 15, 16, 23, 24, 31, 32, 39, 40, 47, 48, 55, 56, 63].includes(i)
              ? "bg-green-400"
              : "bg-transparent"
          }`}
        />
      ))}
    </div>
  )
}

export default PixelLogo

