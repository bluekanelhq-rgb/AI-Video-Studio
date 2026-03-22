"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Video, Instagram, Facebook, Youtube, CheckCircle, XCircle, Loader2, Hash } from "lucide-react"
import { api } from "@/lib/api"

interface Platform {
  id: string
  name: string
  icon: any
  connected: boolean
  accountId?: number
  account: string | null
  followers: string | null
  color: string
}

const platformsConfig = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "from-blue-500 to-blue-600",
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Card className="overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${platform.color}`} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                      <platform.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>{platform.name}</CardTitle>
                      {platform.connected && platform.account && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {platform.account}
                        </p>
                      )}
                    </div>
                  </div>
                  {platform.connected ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {platform.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm text-muted-foreground">Followers</span>
                      <span className="font-semibold">{platform.followers}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDisconnect(platform)}
                    >
                      Disconnect Account
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(platform)}
                  >
                    Connect {platform.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform?.name}</DialogTitle>
            <DialogDescription>
              Enter your {selectedPlatform?.name} account ID to connect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="accountName" className="text-sm font-medium">
                Account ID
              </label>
              <Input
                id="accountName"
                placeholder={`e.g., 1234567890`}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !actionLoading) {
                    confirmConnect()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {selectedPlatform?.id === 'instagram' 
                  ? 'Your Instagram Business Account ID'
                  : 'Your Facebook Page ID'}
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmConnect}
              disabled={actionLoading || !accountName.trim()}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {selectedPlatform?.name}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect your {selectedPlatform?.name} account ({selectedPlatform?.account})? You can reconnect it anytime.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisconnectDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisconnect}
              disabled={actionLoading}
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
