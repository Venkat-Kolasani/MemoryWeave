/**
 * Nav.jsx
 *
 * Landing page marketing navigation. Fixed, scroll-aware.
 * Layout: logo (left) · section links (center) · Request Demo (right).
 *
 * Used by: LandingPage
 * Depends on: Icon, Button, react-router-dom
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../atoms/Icon.jsx'
import Button from '../atoms/Button.jsx'

const NAV_INNER_MAX = 1200
const NAV_HEIGHT = 60

/** Anchor targets on LandingPage — must match section ids. */
const NAV_LINKS = [
  { label: 'Product', hash: '#product' },
  { label: 'Architecture', hash: '#architecture' },
  { label: 'Security', hash: '#security' },
  { label: 'Docs', hash: '#docs', external: 'https://github.com/Venkat-Kolasani/MemoryWeave' },
]

/**
 * Nav link action — scroll to section or open external URL (Docs → GitHub).
 * @param {{ hash: string, external?: string }} link
 */
function handleNavLink(link) {
  if (link.external) {
    window.open(link.external, '_blank', 'noopener,noreferrer')
    return
  }
  const target = document.querySelector(link.hash)
  if (target) {
    const top =
      target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 8
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

/** Fixed marketing nav with frosted scroll state. */
export default function Nav() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [hoveredLink, setHoveredLink] = useState(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogoClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    navigate('/')
  }, [navigate])

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
        className="mx-auto flex w-full items-center"
        style={{
          maxWidth: NAV_INNER_MAX,
          height: NAV_HEIGHT,
          padding: '0 40px',
        }}
      >
        {/* Left — logo (unchanged) */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex shrink-0 items-center border-none bg-transparent p-0 cursor-pointer"
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

        {/* Center — section links (between logo and CTA) */}
        <div
          className="flex flex-1 items-center justify-center"
          style={{ gap: 4, minWidth: 0 }}
        >
          {NAV_LINKS.map((link) => {
            const { label } = link
            const isHovered = hoveredLink === label
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNavLink(link)}
                onMouseEnter={() => setHoveredLink(label)}
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
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Right — primary CTA only */}
        <div className="flex shrink-0 items-center">
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
            Request Demo
          </Button>
        </div>
      </div>
    </nav>
  )
}
