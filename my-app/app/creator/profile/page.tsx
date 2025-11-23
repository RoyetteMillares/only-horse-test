import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function CreatorProfileRedirect() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/auth/login')
    }

    // Redirect to the public profile page
    redirect(`/creator/${session.user.id}`)
}
