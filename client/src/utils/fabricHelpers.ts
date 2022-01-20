export function addToGroup (fabricCanvas: fabric.Canvas, pointerState, group: fabric.Group, createItem: (xOffset: number, yOffset: number) => fabric.Object) {
  const offset = getObjectOffset(pointerState, group)
  group.addWithUpdate(createItem(offset.x, offset.y))
  fabricCanvas.requestRenderAll()
}

export function getObjectOffset (pointerState, fabricObject: fabric.Object): { x: number, y: number } {
  const coords = fabricObject.calcCoords().tl
  return { x: coords.x - pointerState.relativeX, y: coords.y - pointerState.relativeY }
}

export function calculateTopLeft (fabricCanvas: fabric.Canvas, cardWidth: number, cardHeight: number, topAnchor?: number, bottomAnchor?: number, leftAnchor?: number, rightAnchor?: number): { top: number, left: number } {
  if (!fabricCanvas) return
  let top
  let left

  if (typeof(topAnchor) !== 'undefined') {
    top = topAnchor
  } else if (typeof(bottomAnchor) !== 'undefined') {
    top = bottomAnchor - cardHeight
  } else {
    top = Math.floor((fabricCanvas.height - cardHeight) / 4)
  }

  if (typeof(leftAnchor) !== 'undefined') {
    left = leftAnchor
  } else if (typeof(rightAnchor) !== 'undefined') {
    left = rightAnchor - cardWidth
  } else {
    left = Math.floor((fabricCanvas.width - cardWidth) / 2)
  }

  return { top, left }
}

export function onMove (fabricObject: fabric.Object, callback: Function) {
  let down = false
  fabricObject.on('mousedown', () => {
    down = true
  })
  fabricObject.on('mousemove', () => {
    if (down) {
      callback()
    }
  })
  fabricObject.on('mouseup', () => {
    down = false
  })
}

export function onClick (fabricObject: fabric.Object, callback: Function) {
  let down = false
  fabricObject.on('mousedown', () => {
    down = true
  })
  fabricObject.on('mousemove', () => {
    down = false
  })
  fabricObject.on('mouseup', () => {
    if (down) {
      callback()
    }
    down = false
  })
}

type AnchorPoints = {
  lineAnchor?: {
    x: number,
    y: number
  },
  arrowPoint: {
    x: number,
    y: number
  }
}

const offsetFromCard = 10

export function getAnchorPoints ({
  isModule,
  cardWidth,
  parentHeight,
  parentPosition,
  currentHeight,
  currentPosition
}: {
  isModule: boolean,
  cardWidth: number,
  parentHeight: number,
  parentPosition: { left: number, top: number },
  currentHeight: number,
  currentPosition: { left: number, top: number }
}): AnchorPoints {
  if (!currentPosition) return
  
  const res: AnchorPoints = {
    arrowPoint: {
      x: currentPosition.left + cardWidth / 2,
      // if it's a module use the top of the card: else use the bottom
      y: isModule ? currentPosition.top - offsetFromCard : currentHeight + currentPosition.top + offsetFromCard
    }
  }

  if (!parentPosition) return res

  res.lineAnchor = {
    x: parentPosition.left + cardWidth / 2,
    // if it's a module use the bottom of the parent card: else use the top
    y: isModule ? parentHeight + parentPosition.top + offsetFromCard : parentPosition.top - offsetFromCard
  }

  return res
}
