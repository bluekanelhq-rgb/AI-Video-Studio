"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Video, 
  Edit, 
  Wand2, 
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Eye
} from "lucide-react"

interface MyVideo {
  id: number
  title: string
  filePath: string
  thumbnailPath?: string
  duration: number
  status: string
  hasTranscript: boolean
  hasCaption: boolean
  style?: string
  createdAt: string
}

const videoStyles = [
  { id: "modern", name: "Modern", description: "Clean & minimal aesthetic" },
  { id: "bold", name: "Bold", description: "High contrast, attention-grabbing" },
  { id: "elegant", name: "Elegant", description: "Sophisticated and refined" },
  { id: "playful", name: "Playful", description: "Fun and energetic" },
  { id: "cinematic", name: "Cinematic", description: "Film-like quality" },
]

export default function MyVideosPage() {
  const [videos, setVideos] = useState<MyVideo[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<MyVideo | null>(null)
  const [selectedStyle, setSelectedStyle] = useState("modern")
  const [customCaption, setCustomCaption] = useState("")
  const [processing, setProcessing] = useState<number | null>(null)
  const [previewVideo, setPreviewVideo] = useState<MyVideo | null>(null)

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      const data = await api.getMyVideos()
      if (data.videos) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Error loading videos:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file')
      return
    }

    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 500MB')
      return
    }

    console.log('Uploading file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB')

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('Sending upload request...')

      const response = await fetch('http://localhost:3001/api/my-videos/upload', {
        method: 'POST',
        credentials: 'include', // Include authentication cookies
        body: formData,
      })

      console.log('Upload response status:', response.status)

      const result = await response.json()
      console.log('Upload result:', result)
      
      if (result.success) {
        console.log('Upload successful!')
        await loadVideos()
        // Reset file input
        event.target.value = ''
        alert('Video uploaded successfully!')
      } else {
        console.error('Upload failed:', result.error)
        alert(result.error || 'Failed to upload video')
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Failed to upload video. Please check the console for details.')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateCaption = async (videoId: number) => {
    setProcessing(videoId)
    try {
      await api.generateVideoCaption(videoId)
      
      // Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max
      
      const checkStatus = setInterval(async () => {
        attempts++
        const data = await api.getMyVideos()
        const video = data.videos.find((v: MyVideo) => v.id === videoId)
        
        if (video && (video.status === 'ready' || video.status === 'error')) {
          clearInterval(checkStatus)
          await loadVideos()
          setProcessing(null)
          
          // Update preview video if it's the same one
          if (previewVideo && previewVideo.id === videoId) {
            setPreviewVideo(video)
          }
          
          if (video.status === 'ready') {
            alert('Caption added to video successfully!')
          } else {
            alert('Error adding caption. Please try again.')
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkStatus)
          setProcessing(null)
          alert('Caption processing is taking longer than expected. Please refresh the page.')
        }
      }, 1000)
    } catch (error) {
      console.error('Error generating caption:', error)
      alert('Failed to generate caption')
      setProcessing(null)
    }
  }

  const handleApplyStyle = async (videoId: number, style: string) => {
    setProcessing(videoId)
    try {
      await api.applyVideoStyle(videoId, style)
      
      // Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max
      
      const checkStatus = setInterval(async () => {
        attempts++
        const data = await api.getMyVideos()
        const video = data.videos.find((v: MyVideo) => v.id === videoId)
        
        if (video && (video.status === 'styled' || video.status === 'error')) {
          clearInterval(checkStatus)
          await loadVideos()
          setProcessing(null)
          
          // Update preview video if it's the same one
          if (previewVideo && previewVideo.id === videoId) {
            setPreviewVideo(video)
          }
          
          if (video.status === 'styled') {
            alert('Style applied successfully! The video has been updated.')
          } else {
            alert('Error applying style. Please try again.')
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkStatus)
          setProcessing(null)
          alert('Style processing is taking longer than expected. Please refresh the page.')
        }
      }, 1000)
    } catch (error) {
      console.error('Error applying style:', error)
      alert('Failed to apply style')
      setProcessing(null)
    }
  }

  const handleAddToQueue = async (videoId: number) => {
    try {
      const video = videos.find(v => v.id === videoId)
      if (!video) return

      if (!video.hasCaption) {
        alert('Please generate a caption first before adding to queue')
        return
      }

      await api.addMyVideoToQueue(videoId, ['instagram', 'facebook'])
      alert('Video added to posting queue!')
    } catch (error) {
      console.error('Error adding to queue:', error)
      alert('Failed to add to queue')
    }
  }

  const handleDelete = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      await api.deleteMyVideo(videoId)
      setVideos(videos.filter(v => v.id !== videoId))
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video')
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            My Videos
          </h1>
          <p className="text-muted-foreground">
            Upload, edit, and style your own videos with AI
          </p>
        </div>
        <div>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button 
            size="lg" 
            className="shadow-lg hover:shadow-xl transition-all" 
            disabled={uploading}
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading... (this may take a minute)
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {videos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No videos uploaded yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first video to start editing and styling
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Video Preview */}
                <div className="relative aspect-video bg-muted group cursor-pointer" onClick={() => setPreviewVideo(video)}>
                  {video.thumbnailPath ? (
                    <img 
                      src={`http://localhost:3001${video.thumbnailPath}`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant={
                      video.status === 'ready' ? 'success' :
                      video.status === 'processing' ? 'default' : 'secondary'
                    }>
                      {video.status}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1 line-clamp-1">{video.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {video.hasCaption && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Captioned
                        </Badge>
                      )}
                      {video.style && (
                        <Badge variant="outline" className="text-xs">
                          Style: {video.style}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleGenerateCaption(video.id)}
                      disabled={processing === video.id || video.hasCaption}
                    >
                      {processing === video.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      {video.hasCaption ? 'Caption Generated' : 'Generate Caption'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Apply Style
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddToQueue(video.id)}
                        disabled={!video.hasCaption}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Queue
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(video.id)}
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
      )}

      {/* Style Selection Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
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
                Choose a style for: {selectedVideo.title}
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
                    handleApplyStyle(selectedVideo.id, selectedStyle)
                    setSelectedVideo(null)
                  }}
                  disabled={processing === selectedVideo.id}
                >
                  {processing === selectedVideo.id ? (
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
                <Button variant="outline" onClick={() => setSelectedVideo(null)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {previewVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border rounded-lg p-6 max-w-4xl w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{previewVideo.title}</h2>
                <Button variant="ghost" size="sm" onClick={() => setPreviewVideo(null)}>
                  ✕
                </Button>
              </div>

              {/* Video Player */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4 flex items-center justify-center" style={{ maxHeight: '70vh' }}>
                <video
                  key={previewVideo.filePath}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto"
                  src={`http://localhost:3001${previewVideo.filePath}?t=${Date.now()}`}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    previewVideo.status === 'ready' ? 'success' :
                    previewVideo.status === 'processing' ? 'default' : 'secondary'
                  }>
                    {previewVideo.status}
                  </Badge>
                  {previewVideo.hasCaption && (
                    <Badge variant="outline">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Captioned
                    </Badge>
                  )}
                  {previewVideo.style && (
                    <Badge variant="outline">
                      Style: {previewVideo.style}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Uploaded: {new Date(previewVideo.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
