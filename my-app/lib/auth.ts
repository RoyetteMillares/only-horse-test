import { auth } from '@/app/api/auth/[...nextauth]/route'
import { NextRequest, NextResponse } from 'next/server'

export async function getAuthSession() {
  return await auth()
}

export async function requireAuth(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return session
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}
