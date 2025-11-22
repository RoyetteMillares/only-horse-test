import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Chrome, Facebook } from "lucide-react"

export function OAuthButtons() {
  return (
    <div className="space-y-3">
      <Button
        onClick={() => signIn("google", { redirect: false })}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        <Chrome size={20} />
        Continue with Google
      </Button>

      <Button
        onClick={() => signIn("facebook", { redirect: false })}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        <Facebook size={20} />
        Continue with Facebook
      </Button>
    </div>
  )
}
