"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  Youtube, 
  Link as LinkIcon, 
  ListVideo, 
  Share2, 
  Settings,
  Moon,
  Sun,
  Sparkles,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Video,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "./theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", color: "from-blue-500 to-cyan-500" },
  { href: "/channels", icon: Youtube, label: "Channels", color: "from-red-500 to-pink-500" },
  { href: "/my-videos", icon: Video, label: "My Videos", color: "from-purple-500 to-violet-500" },
  { href: "/repurpose", icon: LinkIcon, label: "Repurpose", color: "from-green-500 to-emerald-500" },
  { href: "/queue", icon: ListVideo, label: "Clips Queue", color: "from-orange-500 to-amber-500" },
  { href: "/connections", icon: Share2, label: "Connections", color: "from-indigo-500 to-blue-500" },
  { href: "/settings", icon: Settings, label: "Settings", color: "from-gray-500 to-slate-500" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ 
        x: 0,
        width: isCollapsed ? "80px" : "288px"
      }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="border-r bg-gradient-to-b from-card via-card/95 to-card/90 backdrop-blur-xl flex flex-col shadow-2xl relative"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-6 z-50 h-8 w-8 rounded-full border-2 bg-card shadow-xl hover:bg-accent hover:shadow-2xl transition-all duration-300 hover:border-primary/50 hover:scale-110 active:scale-90"
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </motion.div>
      </Button>

      {/* Logo Section */}
      <div className="p-6 border-b border-border/50 relative">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <motion.div 
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <Sparkles className="h-5 w-5 text-white relative z-10" />
              </motion.div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent truncate">
                  AI Video Studio
                </h1>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Automate your content
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <motion.div 
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg relative overflow-hidden"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <Sparkles className="h-5 w-5 text-white relative z-10" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          const isHovered = hoveredItem === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                whileHover={{ x: isCollapsed ? 0 : 6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setHoveredItem(item.href)}
                onHoverEnd={() => setHoveredItem(null)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden",
                  isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground hover:shadow-md"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Animated background gradient on hover */}
                {!isActive && isHovered && (
                  <motion.div
                    layoutId="hoverBackground"
                    className={cn("absolute inset-0 bg-gradient-to-r opacity-10", item.color)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Active indicator with animation */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/90"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                  </motion.div>
                )}
                
                {/* Icon with color gradient on hover */}
                <motion.div
                  animate={{ 
                    scale: isActive || isHovered ? 1.1 : 1,
                    rotate: isActive ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 flex-shrink-0"
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive && "drop-shadow-md"
                  )} />
                </motion.div>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative z-10 flex items-center gap-2 flex-1 min-w-0"
                    >
                      <span className="truncate">{item.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isActive && !isCollapsed && (
                  <motion.div
                    animate={{ x: isHovered ? 0 : -5, opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border/50 space-y-3 relative">
        {/* Theme Toggle */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "w-full transition-all duration-300 relative overflow-hidden border-border/50 hover:border-primary/50",
              isCollapsed ? "justify-center px-0" : "justify-between"
            )}
            title={isCollapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            
            {!isCollapsed && (
              <span className="relative z-10 font-medium">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
            
            <motion.div
              animate={{ rotate: theme === "dark" ? 0 : 180 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="relative z-10"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </motion.div>
          </Button>
        </motion.div>

        {/* User Info */}
        <AnimatePresence>
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              onClick={logout}
              title="Click to logout"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center gap-3 relative z-10">
                <motion.div 
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md relative overflow-hidden"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  <span className="relative z-10">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Click to logout
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <motion.div 
                className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-md relative overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.15 }}
                transition={{ type: "spring", stiffness: 400 }}
                onClick={logout}
                title={`${user?.name || 'User'} - Click to logout`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <span className="relative z-10">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
