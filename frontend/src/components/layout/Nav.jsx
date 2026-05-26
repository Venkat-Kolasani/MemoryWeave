/**
 * Nav.jsx
 *
 * Landing page marketing navigation. Fixed, scroll-aware.
 * Uses useNavigate() for CTA buttons. No currentPage prop.
 *
 * Used by: LandingPage
 * Depends on: Icon, Button, react-router-dom
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../atoms/Icon.jsx'
import Button from '../atoms/Button.jsx'

const NAV_LINKS = ['Product', 'Architecture', 'Security', 'Docs']

/** Fixed marketing nav with frosted scroll state and dashboard CTAs. */
export default function Nav() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [hoveredLink, setHoveredLink] = useState(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100]"
      style={{
        background: scrolled ? 'rgba(250,250,249,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{
          maxWidth: 1200,
          padding: '0 32px',
          height: 60,
        }}
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center border-none bg-transparent p-0 cursor-pointer"
          style={{ gap: 10 }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              background: 'var(--text-primary)',
              borderRadius: 8,
            }}
          >
            <Icon name="layers" size={14} color="oklch(100% 0 0)" />
          </div>
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            MemoryWeave
          </span>
        </button>

        {/* Links + CTAs */}
        <div className="flex items-center" style={{ gap: 4 }}>
          {NAV_LINKS.map((item) => {
            const isHovered = hoveredLink === item
            return (
              <button
                key={item}
                type="button"
                onMouseEnter={() => setHoveredLink(item)}
                onMouseLeave={() => setHoveredLink(null)}
                className="border-none cursor-pointer"
                style={{
                  padding: '6px 14px',
                  fontSize: 14,
                  fontFamily: 'var(--font-sans)',
                  borderRadius: 6,
                  transition: 'all 0.15s',
                  background: isHovered ? 'var(--bg-secondary)' : 'transparent',
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {item}
              </button>
            )
          })}

          <div
            style={{
              width: 1,
              height: 16,
              background: 'var(--border)',
              margin: '0 8px',
            }}
          />

          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            Sign in
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
            Request Demo
          </Button>
        </div>
      </div>
    </nav>
  )
}
