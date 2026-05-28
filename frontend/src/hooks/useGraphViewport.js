/**
 * useGraphViewport.js
 *
 * Pan and zoom for the knowledge graph SVG via viewBox manipulation.
 * Supports hand-tool drag pan, +/- buttons, and wheel zoom.
 *
 * Used by: GraphPage.jsx
 */

import { useCallback, useRef, useState } from 'react'

export const GRAPH_CANVAS = { width: 720, height: 400 }
const ZOOM_FACTOR = 1.12
const MIN_VIEW_WIDTH = 180

const INITIAL_VIEWBOX = {
  x: 0,
  y: 0,
  w: GRAPH_CANVAS.width,
  h: GRAPH_CANVAS.height,
}

/**
 * @returns Viewport state and handlers for GraphPage SVG.
 */
export function useGraphViewport() {
  const svgRef = useRef(null)
  const [viewBox, setViewBox] = useState(INITIAL_VIEWBOX)
  const [panMode, setPanMode] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const dragStartRef = useRef(null)

  const viewBoxString = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`

  const resetViewport = useCallback(() => {
    setViewBox(INITIAL_VIEWBOX)
  }, [])

  /** Convert pointer delta (px) to viewBox units. */
  const pointerDeltaToSvg = useCallback(
    (deltaX, deltaY) => {
      const svg = svgRef.current
      if (!svg) return { dx: 0, dy: 0 }

      const rect = svg.getBoundingClientRect()
      if (!rect.width || !rect.height) return { dx: 0, dy: 0 }

      return {
        dx: (deltaX / rect.width) * viewBox.w,
        dy: (deltaY / rect.height) * viewBox.h,
      }
    },
    [viewBox.w, viewBox.h],
  )

  const zoomBy = useCallback((factor) => {
    setViewBox((prev) => {
      const nextW = Math.min(
        GRAPH_CANVAS.width * 2.5,
        Math.max(MIN_VIEW_WIDTH, prev.w * factor),
      )
      const nextH = (nextW / GRAPH_CANVAS.width) * GRAPH_CANVAS.height
      const dx = (prev.w - nextW) / 2
      const dy = (prev.h - nextH) / 2
      return {
        x: prev.x + dx,
        y: prev.y + dy,
        w: nextW,
        h: nextH,
      }
    })
  }, [])

  const zoomIn = useCallback(() => zoomBy(1 / ZOOM_FACTOR), [zoomBy])
  const zoomOut = useCallback(() => zoomBy(ZOOM_FACTOR), [zoomBy])

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault()
      if (event.deltaY < 0) zoomIn()
      else zoomOut()
    },
    [zoomIn, zoomOut],
  )

  const handlePointerDown = useCallback(
    (event) => {
      if (!panMode) return
      if (event.button !== 0) return

      event.currentTarget.setPointerCapture(event.pointerId)
      setIsPanning(true)
      dragStartRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        viewBox: { ...viewBox },
      }
    },
    [panMode, viewBox],
  )

  const handlePointerMove = useCallback(
    (event) => {
      if (!isPanning || !dragStartRef.current) return

      const deltaX = event.clientX - dragStartRef.current.clientX
      const deltaY = event.clientY - dragStartRef.current.clientY
      const { dx, dy } = pointerDeltaToSvg(deltaX, deltaY)
      const start = dragStartRef.current.viewBox

      setViewBox({
        ...start,
        x: start.x - dx,
        y: start.y - dy,
      })
    },
    [isPanning, pointerDeltaToSvg],
  )

  const handlePointerUp = useCallback((event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsPanning(false)
    dragStartRef.current = null
  }, [])

  const togglePanMode = useCallback(() => {
    setPanMode((active) => !active)
    setIsPanning(false)
    dragStartRef.current = null
  }, [])

  const canvasCursor = panMode
    ? isPanning
      ? 'grabbing'
      : 'grab'
    : 'default'

  return {
    svgRef,
    viewBoxString,
    panMode,
    isPanning,
    canvasCursor,
    zoomIn,
    zoomOut,
    resetViewport,
    togglePanMode,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
