"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "./sidebar"
import { Loader2 } from "lucide-react"

const publicRoutes = ['/login', '/register']

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        router.push('/login')
      } else if (user && isPublicRoute) {
        router.push('/')
      }
    }
  }, [user, loading, isPublicRoute, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Public routes (login/register) - no sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Protected routes - with sidebar
  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-gradient-to-b from-transparent to-muted/5">
          {children}
        </div>
      </main>
    </div>
  )
}
