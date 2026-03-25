"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Video, Instagram, Facebook, Youtube, CheckCircle, XCircle, Loader2, Hash, Twitter, Linkedin } from "lucide-react"
import { api } from "@/lib/api"

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

// Custom Threads icon component
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142l-.126 1.974a11.881 11.881 0 0 0-2.588-.12c-1.014.058-1.84.355-2.456.882-.578.495-.897 1.187-.897 1.941.058.86.403 1.472.97 1.821.635.39 1.505.577 2.447.523 1.036-.059 1.834-.455 2.37-1.179.48-.648.769-1.568.854-2.74-1.984-.983-4.588-1.316-6.98-.897-2.275.398-4.034 1.317-5.23 2.73-1.262 1.493-1.888 3.433-1.862 5.77.026 2.337.652 4.277 1.862 5.77 1.196 1.413 2.955 2.332 5.23 2.73 2.392.419 5.006.086 6.98-.897-.085-1.172-.374-2.092-.854-2.74-.536-.724-1.334-1.12-2.37-1.179-.942-.054-1.812.133-2.447.523-.567.349-.912.961-.97 1.821 0 .754.319 1.446.897 1.941.616.527 1.442.824 2.456.882a11.881 11.881 0 0 0 2.588-.12l.126 1.974a13.853 13.853 0 0 1-3.02.142c-1.464-.084-2.703-.531-3.583-1.291-.922-.797-1.395-1.892-1.33-3.082.067-1.224.689-2.275 1.752-2.964.898-.583 2.057-.866 3.259-.801 1.59.086 2.844.688 3.73 1.79.662.826 1.092 1.92 1.284 3.272.761-.45 1.324-1.04 1.634-1.75.528-1.205.557-3.185-1.09-4.798-1.442-1.414-3.177-2.025-5.8-2.045z"/>
  </svg>
)

interface Platform {
  id: string
  name: string
  icon: any
  connected: boolean
  accountId?: number
  account: string | null
  followers: string | null
  color: string
  placeholder: string
  helperText: string
}

const platformsConfig = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "from-purple-500 to-pink-500",
    placeholder: "1234567890",
    helperText: "Your Instagram Business Account ID",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "from-blue-500 to-blue-600",
    placeholder: "1234567890",
    helperText: "Your Facebook Page ID",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "from-red-500 to-red-600",
    placeholder: "UC1234567890",
    helperText: "Your YouTube Channel ID",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: TikTokIcon,
    color: "from-black to-gray-800",
    placeholder: "@username",
    helperText: "Your TikTok username",
  },
  {
    id: "threads",
    name: "Threads",
    icon: ThreadsIcon,
    color: "from-gray-900 to-gray-700",
    placeholder: "@username",
    helperText: "Your Threads username",
  },
  {
    id: "twitter",
    name: "Twitter (X)",
    icon: Twitter,
    color: "from-blue-400 to-blue-500",
    placeholder: "@username",
    helperText: "Your Twitter/X username",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "from-blue-600 to-blue-700",
    placeholder: "company-name",
    helperText: "Your LinkedIn Company Page ID",
  },
]

export default function ConnectionsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>(
    platformsConfig.map(p => ({ ...p, connected: false, account: null, followers: null }))
  )
  const [loading, setLoading] = useState(true)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [accountName, setAccountName] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadConnectedAccounts()
  }, [])

  const loadConnectedAccounts = async () => {
    try {
      setLoading(true)
      const response = await api.getSocialAccounts()
      
      if (response.accounts) {
        const updatedPlatforms = platformsConfig.map(config => {
          const connectedAccount = response.accounts.find(
            (acc: any) => acc.platform === config.id
          )
          
          if (connectedAccount) {
            return {
              ...config,
              connected: true,
              accountId: connectedAccount.id,
              account: connectedAccount.account_name,
              followers: connectedAccount.followers || "N/A",
            }
          }
          
          return {
            ...config,
            connected: false,
            account: null,
            followers: null,
          }
        })
        
        setPlatforms(updatedPlatforms)
      }
    } catch (error) {
      console.error("Error loading accounts:", error)
      setError("Failed to load connected accounts")
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = (platform: Platform) => {
    setSelectedPlatform(platform)
    setAccountName("")
    setError("")
    setConnectDialogOpen(true)
  }

  const handleDisconnect = (platform: Platform) => {
    setSelectedPlatform(platform)
    setError("")
    setDisconnectDialogOpen(true)
  }

  const confirmConnect = async () => {
    if (!selectedPlatform || !accountName.trim()) {
      setError("Please enter an account ID")
      return
    }

    try {
      setActionLoading(true)
      setError("")
      
      const response = await api.connectSocialAccount({
        platform: selectedPlatform.id,
        accountName: accountName.trim(),
      })

      if (response.success) {
        await loadConnectedAccounts()
        setConnectDialogOpen(false)
        setAccountName("")
      } else {
        setError(response.error || "Failed to connect account")
      }
    } catch (error) {
      console.error("Error connecting account:", error)
      setError("Failed to connect account. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDisconnect = async () => {
    if (!selectedPlatform || !selectedPlatform.accountId) return

    try {
      setActionLoading(true)
      setError("")
      
      const response = await api.disconnectSocialAccount(selectedPlatform.accountId)

      if (response.success) {
        await loadConnectedAccounts()
        setDisconnectDialogOpen(false)
      } else {
        setError(response.error || "Failed to disconnect account")
      }
    } catch (error) {
      console.error("Error disconnecting account:", error)
      setError("Failed to disconnect account. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Social Media Connections
        </h1>
        <p className="text-muted-foreground">
          Connect your social media accounts to automatically publish clips
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform, index) => {
          const Icon = platform.icon
          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group"
            >
              <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 h-full bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <div className={`h-1 bg-gradient-to-r ${platform.color}`} />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                        {platform.connected && platform.account && (
                          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                            {platform.account}
                          </p>
                        )}
                      </div>
                    </div>
                    {platform.connected ? (
                      <Badge className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1.5 bg-muted/50 text-muted-foreground border-border">
                        <XCircle className="h-3.5 w-3.5" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {platform.connected ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                        <span className="text-sm text-muted-foreground font-medium">Followers</span>
                        <span className="font-semibold text-foreground">{platform.followers}</span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                        onClick={() => handleDisconnect(platform)}
                      >
                        Disconnect Account
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className={`w-full bg-gradient-to-r ${platform.color} hover:opacity-90 transition-opacity shadow-md hover:shadow-lg`}
                      onClick={() => handleConnect(platform)}
                    >
                      Connect {platform.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Connect {selectedPlatform?.name}</DialogTitle>
            <DialogDescription className="text-base">
              Enter your {selectedPlatform?.name} account ID to connect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label htmlFor="accountName" className="text-sm font-semibold">
                Account ID
              </label>
              <Input
                id="accountName"
                placeholder={selectedPlatform?.placeholder || 'Account ID'}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !actionLoading) {
                    confirmConnect()
                  }
                }}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary">ℹ️</span>
                {selectedPlatform?.helperText || 'Enter your account identifier'}
              </p>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConnectDialogOpen(false)}
              disabled={actionLoading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmConnect}
              disabled={actionLoading || !accountName.trim()}
              className="flex-1 sm:flex-none"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Dialog */}
      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Disconnect {selectedPlatform?.name}?</DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to disconnect your {selectedPlatform?.name} account <span className="font-semibold text-foreground">({selectedPlatform?.account})</span>? You can reconnect it anytime.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDisconnectDialogOpen(false)}
              disabled={actionLoading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisconnect}
              disabled={actionLoading}
              className="flex-1 sm:flex-none"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
