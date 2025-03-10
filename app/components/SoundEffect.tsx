"use client"

import { useEffect, useRef } from "react"

const SoundEffect = () => {
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

    const playSound = () => {
      if (audioContextRef.current) {
        const oscillator = audioContextRef.current.createOscillator()
        oscillator.type = "square"
        oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime) // 440 Hz = A4 note

        const gainNode = audioContextRef.current.createGain()
        gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1)

        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)

        oscillator.start()
        oscillator.stop(audioContextRef.current.currentTime + 0.1)
      }
    }

    document.addEventListener("click", playSound)

    return () => {
      document.removeEventListener("click", playSound)
      audioContextRef.current?.close()
    }
  }, [])

  return null
}

export default SoundEffect

