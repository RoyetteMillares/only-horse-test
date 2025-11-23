'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'

export default function StripeConnectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    const checkConnection = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        if (code && state) {
          // User came back from Stripe after authorization
          const response = await fetch('/api/stripe/connect-callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
          })

          const data = await response.json()

          if (response.ok) {
            setSuccess(true)
            setTimeout(() => {
              router.push('/dashboard/creator')
            }, 2000)
          } else {
            setError(data.error || 'Failed to connect Stripe account')
          }
        } else {
          setLoading(false)
        }
      } catch (err: any) {
        setError(err.message)
      }
    }

    checkConnection()
  }, [status, router, searchParams])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Connecting your Stripe account...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-4">Your Stripe account has been connected.</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Connect Stripe Account</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          To start accepting payments, you need to connect your Stripe account. This is where your earnings will be deposited.
        </p>

        <form action="/api/stripe/connect-url" method="POST">
          <Button type="submit" className="w-full" size="lg">
            Connect Stripe Account
          </Button>
        </form>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={async () => {
                try {
                  setLoading(true)
                  const res = await fetch('/api/stripe/dev-skip', { method: 'POST' })
                  if (!res.ok) throw new Error('Failed to skip')
                  router.push('/creator/dashboard')
                } catch (err) {
                  setError('Failed to skip in dev mode')
                  setLoading(false)
                }
              }}
            >
              Skip (Dev Mode)
            </Button>
            <p className="text-xs text-amber-600/70 text-center mt-2">
              Bypasses Stripe Connect for local testing
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          You'll be redirected to Stripe to securely connect your account.
        </p>
      </div>
    </div>
  )
}
