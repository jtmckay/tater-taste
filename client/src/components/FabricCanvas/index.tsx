import React, { useRef } from 'react'
import { fabric } from "fabric"
import { useEffect } from 'react'
import { css } from '@emotion/css'

export default function FabricCanvas ({ registerFabricCanvas, registerPointerState }) {
  const canvasContainerRef = useRef<HTMLDivElement>()
  const pointerState = useRef({ pan: false, x: 0, y: 0, relativeX: 0, relativeY: 0 })
  const canvasRef = useRef()
  const fabricRef = useRef<fabric.Canvas>()

  useEffect(() => {
    if (canvasRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current)
    }
  }, [canvasRef])

  useEffect(() => {
    registerFabricCanvas(fabricRef.current)
    resizeCanvas()
  }, [fabricRef])

  useEffect(() => {
    registerPointerState(pointerState.current)
  }, [pointerState])

  useEffect(() => {
    if (canvasContainerRef.current) {
      window.addEventListener('resize', resizeCanvas)
      return () => {
        window.removeEventListener('resize', resizeCanvas)
      }
    }
  }, [canvasContainerRef])

  function resizeCanvas () {
    if (fabricRef.current) {
      fabricRef.current.setWidth(canvasContainerRef.current.clientWidth)
      fabricRef.current.setHeight(canvasContainerRef.current.clientHeight)
      fabricRef.current.calcOffset()
    }
  }

  function startPan(event) {
    if (event.button === 2) {
      pointerState.current.pan = true
      pointerState.current.x = event.screenX
      pointerState.current.y = event.screenY
    }
  }

  function stopPan(event) {
    pan(event)
    pointerState.current.pan = false
  }

  function pan(event) {
    if (pointerState.current.pan) {
      if (fabricRef.current) {
        pointerState.current.relativeX += event.screenX - pointerState.current.x
        pointerState.current.relativeY += event.screenY - pointerState.current.y
        fabricRef.current.relativePan({ x: event.screenX - pointerState.current.x, y: event.screenY - pointerState.current.y })
      }
      pointerState.current.x = event.screenX
      pointerState.current.y = event.screenY
    }
  }

  return (
    <div className={css`
      flex-grow: 1;
    `} ref={canvasContainerRef}
      onWheel={event => {
        fabricRef.current.relativePan({ x: 0, y: -1 * event.deltaY })
      }}
      onContextMenu={e => e.preventDefault()}
      onMouseDown={startPan}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      onMouseMove={pan} >
      <canvas ref={canvasRef} />
    </div>
  )
}
