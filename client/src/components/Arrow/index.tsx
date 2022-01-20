import { useEffect } from "react"
import { fabric } from "fabric"

// {parentPosition && <Arrow fabricCanvas={fabricCanvas} isModule={isModule} parentHeight={parentHeight} parentPosition={parentPosition} currentPosition={positionRef.current} currentHeight={cardHeight} />}

export default function Arrow ({
  fabricCanvas,
  lineAnchor,
  arrowPoint
}: {
  fabricCanvas: fabric.Canvas,
  lineAnchor: { x: number, y: number },
  arrowPoint: { x: number, y: number }
}) {
  useEffect(() => {
    if (!lineAnchor || !arrowPoint) return
    // const arrowIsLeft = arrowPoint.x < lineAnchor.x
    const arrowIsBelow = arrowPoint.y < lineAnchor.y
    // const offset = (arrowPoint.y - lineAnchor.y) / 2
    const midY = (arrowPoint.y - lineAnchor.y) / 2 + lineAnchor.y
    const midX = (arrowPoint.x - lineAnchor.x) / 2 + lineAnchor.x
    const line = new fabric.Path(`
    M ${lineAnchor.x} ${lineAnchor.y}
    Q ${lineAnchor.x}, ${midY}, ${midX}, ${midY}
    M ${midX} ${midY}
    Q ${arrowPoint.x}, ${midY}, ${arrowPoint.x}, ${arrowPoint.y}
    M ${arrowPoint.x - 8} ${arrowPoint.y}
    Q ${arrowPoint.x - 8}, ${arrowPoint.y}, ${arrowPoint.x}, ${arrowIsBelow ? arrowPoint.y - 8 : arrowPoint.y + 8}
    M ${arrowPoint.x + 8} ${arrowPoint.y}
    Q ${arrowPoint.x + 8}, ${arrowPoint.y}, ${arrowPoint.x}, ${arrowIsBelow ? arrowPoint.y - 8 : arrowPoint.y + 8}
    `, {
      fill: '', stroke: 'black', strokeWidth: 3, strokeLineCap: 'round', selectable: false
    })
    // const line = new fabric.Path(`M ${lineAnchor.x} ${lineAnchor.y} Q ${lineAnchor.x}, ${midY}, ${arrowPoint.x}, ${arrowPoint.y}`, { fill: '', stroke: 'black', hasControls: false, lockMovementX: true, lockMovementY: true })
    // const line1 = new fabric.Path(`M ${lineAnchor.x} ${lineAnchor.y} Q ${arrowPoint.x}, ${arrowIsBelow ? lineAnchor.y + offset : lineAnchor.y - offset}, ${arrowIsLeft ? lineAnchor.x - offset : lineAnchor.x + offset}, ${arrowIsBelow ? lineAnchor.y + offset : lineAnchor.y - offset}`, { fill: '', stroke: 'black' })
    // const line2 = new fabric.Path(`M ${arrowPoint.x} ${arrowPoint.y} Q ${arrowPoint.x}, ${arrowIsBelow ? arrowPoint.y - offset : arrowPoint.y + offset}, ${arrowIsLeft ? arrowPoint.x - offset: arrowPoint.x + offset}, ${arrowIsBelow ? arrowPoint.y - offset : arrowPoint.y + offset}`, { fill: '', stroke: 'black' })
    // const straightLine = new fabric.Line([lineAnchor.x + offset, midY, arrowPoint.x - offset, midY], { fill: '', stroke: 'black' })
    fabricCanvas.add(line)
    // fabricCanvas.add(line1)
    // fabricCanvas.add(line2)
    // fabricCanvas.add(straightLine)
    return () => {
      fabricCanvas.remove(line)
      // fabricCanvas.remove(line1)
      // fabricCanvas.remove(line2)
      // fabricCanvas.remove(straightLine)
    }
  }, [lineAnchor, arrowPoint])

  return null
}
