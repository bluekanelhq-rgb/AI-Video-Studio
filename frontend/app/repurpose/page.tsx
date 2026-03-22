"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Link as LinkIcon, Loader2, CheckCircle, Video, Eye, Trash2, Plus, Wand2, Edit, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge as BadgeComponent } from "@/components/ui/badge"

export default function RepurposePage() {
  const [url, setUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [clips, setClips] = useState<any[]>([])
  const [videoId, setVideoId] = useState<number | null>(null)
  const [processingStatus, setProcessingStatus] = useState("")
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [previewClip, setPreviewClip] = useState<any>(null)
  const [queueDialogOpen, setQueueDialogOpen] = useState(false)
  const [selectedClipForQueue, setSelectedClipForQueue] = useState<any>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [scheduleDate, setScheduleDate] = useState("")
  const [queueLoading, setQueueLoading] = useState(false)
  const [processingClipId, setProcessingClipId] = useState<number | null>(null)
  const [selectedClipForStyle, setSelectedClipForStyle] = useState<any>(null)
  const [selectedStyle, setSelectedStyle] = useState("modern")

  const platforms = [
    { id: "instagram", name: "Instagram" },
    { id: "facebook", name: "Facebook" },
  ]

  const videoStyles = [
    { id: "modern", name: "Modern", description: "Clean & minimal aesthetic" },
    { id: "bold", name: "Bold", description: "High contrast, attention-grabbing" },
    { id: "elegant", name: "Elegant", description: "Sophisticated and refined" },
    { id: "playful", name: "Playful", description: "Fun and energetic" },
    { id: "cinematic", name: "Cinematic", description: "Film-like quality" },
  ]

  // Load existing clips on page mount
  useEffect(() => {
    loadClips()
  }, [])

  const loadClips = async () => {
    try {
      const data = await api.getClips()
      if (data.clips && data.clips.length > 0) {
        // Filter to only show clips that have a video_id (from YouTube processing)
        // Clips with video_id = null are from My Videos section
        const youtubeClips = data.clips.filter((c: any) => c.video_id !== null)
        setClips(youtubeClips.map((c: any) => ({
          id: c.id,
          title: c.title || `Clip ${c.id}`,
          duration: `${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}`,
          status: c.status,
          thumbnail: c.thumbnail_path,
          filePath: c.file_path,
          videoId: c.video_id,
          caption: c.caption,
          style: c.style,
        })))
      }
    } catch (error) {
      console.error('Error loading clips:', error)
    }
  }

  const getStatusMessage = (status: string, progress: number): string => {
    if (status === 'pending' || status === 'downloading') {
      return `Downloading video... ${Math.round(progress)}%`
    } else if (status === 'downloaded') {
      return 'Download complete, analyzing video...'
    } else if (status.startsWith('generating_clip_')) {
      const clipNumber = status.replace('generating_clip_', '')
      return `Creating clip ${clipNumber}...`
    } else if (status === 'processed') {
      return 'Processing complete!'
    } else if (status === 'failed') {
      return 'Processing failed'
    }
    return 'Processing video...'
  }

  const handleGenerate = async () => {
    if (!url) return

    setIsProcessing(true)
    try {
      const result = await api.processVideo(url)
      if (result.success) {
        setVideoId(result.video.id)
        // Poll for clips
        pollForClips(result.video.id)
      }
    } catch (error) {
      console.error('Error processing video:', error)
      alert('Failed to process video')
      setIsProcessing(false)
    }
  }

  const pollForClips = async (vId: number) => {
    let pollCount = 0;
    const maxPolls = 100; // 5 minutes max (100 * 3 seconds)
    
    const interval = setInterval(async () => {
      try {
        pollCount++;
        
        // Get video status with progress
        const videoData = await api.getVideo(vId);
        const videoStatus = videoData.video.status;
        const progress = videoData.progress || 0;
        
        console.log(`Video status: ${videoStatus}, Progress: ${progress}%, Poll count: ${pollCount}`);
        
        // Update status message and progress
        setProcessingStatus(videoStatus);
        setDownloadProgress(progress);
        
        // Get clips
        const data = await api.getClips();
        const videoClips = data.clips?.filter((c: any) => c.video_id === vId) || [];
        
        console.log(`Found ${videoClips.length} clips for video ${vId}, status: ${videoStatus}`);
        
        // Only stop polling when video status is 'processed' AND we have clips
        if (videoStatus === 'processed' && videoClips.length > 0) {
          setClips(videoClips.map((c: any) => ({
            id: c.id,
            title: c.title || `Clip ${c.id}`, // Use title from database
            duration: `${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}`,
            status: c.status,
            thumbnail: c.thumbnail_path,
            filePath: c.file_path,
          })))
          setIsProcessing(false)
          clearInterval(interval)
          alert(`Generated ${videoClips.length} clips successfully!`)
        } else if (videoStatus === 'failed') {
          setIsProcessing(false)
          clearInterval(interval)
          alert('Video processing failed. Please try again.')
        } else if (pollCount >= maxPolls) {
          setIsProcessing(false)
          clearInterval(interval)
          alert('Processing is taking longer than expected. Please refresh the page.')
        }
      } catch (error) {
        console.error('Error polling clips:', error)
      }
    }, 3000)
  }

  const handleDeleteClip = async (clipId: number) => {
    if (!confirm('Are you sure you want to delete this clip?')) return

    try {
      await api.deleteClip(clipId)
      setClips(clips.filter(c => c.id !== clipId))
    } catch (error) {
      console.error('Error deleting clip:', error)
      alert('Failed to delete clip')
    }
  }

  const handleAddToQueue = (clip: any) => {
    setSelectedClipForQueue(clip)
    setSelectedPlatforms([])
    setScheduleDate(new Date().toISOString().slice(0, 16))
    setQueueDialogOpen(true)
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const confirmAddToQueue = async () => {
    if (!selectedClipForQueue || selectedPlatforms.length === 0) {
      alert("Please select at least one platform")
      return
    }

    try {
      setQueueLoading(true)
      const response = await api.publishClip(
        selectedClipForQueue.id,
        selectedPlatforms,
        scheduleDate ? new Date(scheduleDate).toISOString() : undefined
      )

      if (response.success) {
        alert("Clip added to queue successfully!")
        setQueueDialogOpen(false)
      } else {
        alert(response.error || "Failed to add to queue")
      }
    } catch (error) {
      console.error("Error adding to queue:", error)
      alert("Failed to add to queue. Please try again.")
    } finally {
      setQueueLoading(false)
    }
  }

  const handleGenerateCaption = async (clipId: number) => {
    setProcessingClipId(clipId)
    try {
      await api.generateClipCaption(clipId)
      
      // Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max
      
      const checkStatus = setInterval(async () => {
        attempts++
        
        // Fetch fresh clip data
        const data = await api.getClips()
        const youtubeClips = data.clips?.filter((c: any) => c.video_id !== null) || []
        const clip = youtubeClips.find((c: any) => c.id === clipId)
        
        if (clip && (clip.status === 'generated' || clip.status === 'error')) {
          clearInterval(checkStatus)
          setProcessingClipId(null)
          
          // Reload all clips to update the UI
          await loadClips()
          
          if (clip.status === 'generated') {
            alert('Caption added to clip successfully!')
          } else {
            alert('Error adding caption. Please try again.')
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkStatus)
          setProcessingClipId(null)
          alert('Caption processing is taking longer than expected. Please refresh the page.')
        }
      }, 1000)
    } catch (error) {
      console.error('Error generating caption:', error)
      alert('Failed to generate caption')
      setProcessingClipId(null)
    }
  }

  const handleApplyStyle = async (clipId: number, style: string) => {
    setProcessingClipId(clipId)
    setSelectedClipForStyle(null) // Close modal immediately after starting
    
    try {
      await api.applyClipStyle(clipId, style)
      
      // Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max
      
      const checkStatus = setInterval(async () => {
        attempts++
        
        // Fetch fresh clip data
        const data = await api.getClips()
        const youtubeClips = data.clips?.filter((c: any) => c.video_id !== null) || []
        const clip = youtubeClips.find((c: any) => c.id === clipId)
        
        if (clip && (clip.status === 'generated' || clip.status === 'error')) {
          clearInterval(checkStatus)
          setProcessingClipId(null)
          
          // Reload all clips to update the UI
          await loadClips()
          
          if (clip.status === 'generated') {
            alert('Style applied successfully! The clip has been updated.')
          } else {
            alert('Error applying style. Please try again.')
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkStatus)
          setProcessingClipId(null)
          alert('Style processing is taking longer than expected. Please refresh the page.')
        }
      }, 1000)
    } catch (error) {
      console.error('Error applying style:', error)
      alert('Failed to apply style')
      setProcessingClipId(null)
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Video Repurposing
        </h1>
        <p className="text-muted-foreground">
          Generate clips from videos or Riverside recordings
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Paste Video Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleGenerate} disabled={isProcessing || !url}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Generate Clips
                  </>
                )}
              </Button>
            </div>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{getStatusMessage(processingStatus, downloadProgress)}</p>
                    
                    {/* Progress bar */}
                    {processingStatus !== 'processed' && (
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${downloadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(downloadProgress)}% complete
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take 2-5 minutes depending on video length
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {clips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Generated Clips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clips.map((clip, index) => (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full flex flex-col">
                      <div 
                        className="relative aspect-video bg-black group cursor-pointer overflow-hidden" 
                        onClick={() => setPreviewClip(clip)}
                      >
                        {clip.thumbnail ? (
                          <img
                            src={`http://localhost:3001${clip.thumbnail}`}
                            alt={clip.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="secondary">{clip.duration}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{clip.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap min-h-[20px]">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-accent" />
                                <span>Ready to post</span>
                              </div>
                              {clip.caption && (
                                <Badge variant="outline" className="text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Captioned
                                </Badge>
                              )}
                              {clip.style && (
                                <Badge variant="outline" className="text-xs">
                                  Style: {clip.style}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mt-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleGenerateCaption(clip.id)}
                            disabled={processingClipId === clip.id || clip.caption}
                          >
                            {processingClipId === clip.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            {clip.caption ? 'Caption Generated' : 'Generate Caption'}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setSelectedClipForStyle(clip)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Apply Style
                          </Button>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleAddToQueue(clip)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add to Queue
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClip(clip.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Clip Preview Modal */}
      {previewClip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewClip(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border rounded-lg p-6 max-w-4xl w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{previewClip.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setPreviewClip(null)}>
                ✕
              </Button>
            </div>

            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4 flex items-center justify-center" style={{ maxHeight: '70vh' }}>
              <video
                key={previewClip.filePath}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] h-auto w-auto"
                src={`http://localhost:3001${previewClip.filePath}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Clip Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{previewClip.duration}</Badge>
                <Badge variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to post
                </Badge>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add to Queue Dialog */}
      <Dialog open={queueDialogOpen} onOpenChange={setQueueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Queue</DialogTitle>
            <DialogDescription>
              Select platforms and schedule when to publish &quot;{selectedClipForQueue?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Platforms</label>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((platform) => (
                  <Button
                    key={platform.id}
                    variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePlatform(platform.id)}
                    className="justify-start"
                  >
                    {platform.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="scheduleDate" className="text-sm font-medium">
                Schedule Date & Time (Optional)
              </label>
              <Input
                id="scheduleDate"
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                Leave as current time to publish immediately
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQueueDialogOpen(false)}
              disabled={queueLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddToQueue}
              disabled={queueLoading || selectedPlatforms.length === 0}
            >
              {queueLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Queue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Style Selection Modal */}
      {selectedClipForStyle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedClipForStyle(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4">Apply Video Style</h2>
            <p className="text-muted-foreground mb-6">
              Choose a style for: {selectedClipForStyle.title}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {videoStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedStyle === style.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <h3 className="font-semibold mb-1">{style.name}</h3>
                  <p className="text-sm text-muted-foreground">{style.description}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  handleApplyStyle(selectedClipForStyle.id, selectedStyle)
                }}
                disabled={processingClipId === selectedClipForStyle.id}
              >
                {processingClipId === selectedClipForStyle.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply Style
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setSelectedClipForStyle(null)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
