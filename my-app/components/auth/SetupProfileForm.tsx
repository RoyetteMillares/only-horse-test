"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function SetupProfileForm() {
  const router = useRouter()
  const [role, setRole] = useState<"SUBSCRIBER" | "CREATOR" | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!role) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) throw new Error("Failed to setup profile")

      // Redirect based on role
      if (role === "CREATOR") {
        router.push("/auth/stripe-connect")
      } else {
        router.push("/dashboard/subscriber/browse")
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-md">
      <h2 className="text-2xl font-bold">What are you here for?</h2>

      <div className="space-y-4">
        <button
          onClick={() => setRole("SUBSCRIBER")}
          className={`w-full p-4 border-2 rounded-lg text-left transition ${
            role === "SUBSCRIBER"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <h3 className="font-bold">I want to browse and chat</h3>
          <p className="text-sm text-gray-600">Find and connect with creators</p>
        </button>

        <button
          onClick={() => setRole("CREATOR")}
          className={`w-full p-4 border-2 rounded-lg text-left transition ${
            role === "CREATOR"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <h3 className="font-bold">I want to earn money</h3>
          <p className="text-sm text-gray-600">Monetize your profile and content</p>
        </button>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!role || isLoading}
        className="w-full"
      >
        {isLoading ? "Setting up..." : "Continue"}
      </Button>
    </div>
  )
}
