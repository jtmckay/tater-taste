import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { SourceFile, SourceFileKeyMap } from '../../../../ast/generateAST'
import { getFileNameWithoutExtension, getShortenedFileName, searchSourceFileModules } from '../../utils/sourceFileHelpers'
import { calculateTopLeft, getAnchorPoints, onClick, onMove } from '../../utils/fabricHelpers';
import Arrow from '../Arrow';

const cardWidth = 500
const cardSpacing = 40

export default function ExploreItem({ fabricCanvas, pointerState, isReference, isModule, referringModule, parentHeight, parentPosition, topAnchor, bottomAnchor, leftAnchor, rightAnchor, sourceFile, sourceFileKeyMap }:
  { fabricCanvas: fabric.Canvas, pointerState, isReference?: boolean, isModule?: boolean, referringModule?: string, parentHeight?: number, parentPosition?: { left: number, top: number}, topAnchor?: number, bottomAnchor?: number, leftAnchor?: number, rightAnchor?: number, sourceFile: SourceFile, sourceFileKeyMap: SourceFileKeyMap }) {
  const groupRef = useRef<fabric.Group>()
  const positionRef = useRef<{ left: number, top: number }>()
  const [ expandedReferences, setExpandedReferences ] = useState([])
  const [ expandedModules, setExpandedModules ] = useState<string[]>([])
  const [ cardHeight, setCardHeight ] = useState(400)
  const [ arrow, setArrow ] = useState<{ lineAnchor?: { x: number; y: number; }; arrowPoint: { x: number; y: number; } }>()

  useEffect(() => {
    if (fabricCanvas && pointerState) {
      let lineOffset = 20
      let margin = 20
      let lineSpacing = 10

      const groupArray = []

      function addLine (text: string, options: fabric.ITextboxOptions, handler?: any) {
        const textBox = new fabric.Textbox(text, {
          left: margin,
          top: lineOffset,
          width: cardWidth - margin * 2,
          ...options
        })
        if (handler) {
          onClick(textBox, handler)
        }
        groupArray.push(textBox)
        lineOffset += (options.fontSize || 40) + lineSpacing
      }

      addLine(getShortenedFileName(sourceFile.fileName), { fontSize: 24, fontWeight: 'bold' }, () => {
        console.log('clicked title: modal with code?')
      })

      // Margin below header
      lineOffset += 20

      const references = searchSourceFileModules(sourceFileKeyMap, sourceFile.fileName)

      addLine('References:', { fontSize: 18 }, () => {
        if (expandedReferences.length === references.filter(i => i !== referringModule).length) {
          setExpandedReferences([])
        } else {
          const newExpandedReferences = [...expandedReferences]
          references.forEach(reference => {
            if (!expandedReferences.includes(reference)) {
              newExpandedReferences.push(reference)
            }
          })
          setExpandedReferences(newExpandedReferences.filter(i => i !== referringModule))
        }
      })

      references.filter(i => i !== referringModule).forEach((reference, index) => {
        addLine(`  ${getShortenedFileName(reference)}`, { fontSize: 16, backgroundColor: index % 2 === 0 ? '#eee' : undefined }, () => {
          toggleReference(reference)
        })
      })

      addLine('Modules:', { fontSize: 18 }, () => {
        if (expandedModules.length === sourceFile.modules.filter(i => i !== referringModule).length) {
          setExpandedModules([])
        } else {
          const newExpandedModules = [...expandedModules]
          sourceFile.modules.forEach(module => {
            if (!expandedModules.includes(module)) {
              newExpandedModules.push(module)
            }
          })
          setExpandedModules(newExpandedModules.filter(i => i !== referringModule))
        }
      })

      sourceFile.modules.filter(i => i !== referringModule).forEach((module, index) => {
        addLine(`  ${getShortenedFileName(module)}`, {
          fontSize: 16,
          backgroundColor: index % 2 === 0 ? '#eee' : undefined
        }, () => {
          toggleModule(module)
        })
      })

      // Bottom margin for card
      lineOffset += 20

      const card = new fabric.Rect({
        height: lineOffset,
        width: cardWidth,
        fill: '#fff',
        rx: 10,
        ry: 10,
        shadow: new fabric.Shadow({
          blur: 10,
        })
      });

      setCardHeight(lineOffset)
      if (!positionRef.current) {
        positionRef.current = calculateTopLeft(fabricCanvas, cardWidth + 30, lineOffset, topAnchor, bottomAnchor, leftAnchor, rightAnchor)
      }

      const group = new fabric.Group([card, ...groupArray], {
        hasControls: false,
        left: positionRef.current.left,
        top: positionRef.current.top,
        subTargetCheck: true
      });
      groupRef.current = group

      onMove(group, () => {
        positionRef.current = { left: group.left, top: group.top }
        setArrow(getAnchorPoints({
          isModule,
          cardWidth,
          parentHeight,
          parentPosition,
          currentHeight: cardHeight,
          currentPosition: positionRef.current
        }))
      })
      fabricCanvas.add(group)
      return () => {
        fabricCanvas.remove(group)
      }
    }
  }, [fabricCanvas, pointerState, expandedModules, expandedReferences])

  useEffect(() => {
    setArrow(getAnchorPoints({
      isModule,
      cardWidth,
      parentHeight,
      parentPosition,
      currentHeight: cardHeight,
      currentPosition: positionRef.current
    }))
  }, [parentPosition, isModule, positionRef.current])

  function toggleReference (referenceName: string) {
    if (expandedReferences.includes(referenceName)) {
      const newExpandedReferences = [...expandedReferences].filter(i => i !== referenceName)
      setExpandedReferences(newExpandedReferences.filter(i => i !== referringModule))
    } else {
      const newExpandedReferences = [...expandedReferences]
      newExpandedReferences.push(referenceName)
      setExpandedReferences(newExpandedReferences.filter(i => i !== referringModule))
    }
  }

  function toggleModule (moduleName: string) {
    if (expandedModules.includes(moduleName)) {
      const newExpandedModules = [...expandedModules].filter(i => i !== moduleName)
      setExpandedModules(newExpandedModules.filter(i => i !== referringModule))
    } else {
      const newExpandedModules = [...expandedModules]
      newExpandedModules.push(moduleName)
      setExpandedModules(newExpandedModules.filter(i => i !== referringModule))
    }
  }

  return <>
    {parentPosition && positionRef.current && <Arrow
      fabricCanvas={fabricCanvas}
      // If it is a reference, reverse the direction of the arrow
      lineAnchor={isModule ? arrow.lineAnchor : arrow.arrowPoint}
      arrowPoint={isModule ? arrow.arrowPoint : arrow.lineAnchor} />}
    {expandedReferences.map((reference, index) => <ExploreItem key={reference}
      isReference
      referringModule={sourceFile.fileName}
      leftAnchor={isModule ? positionRef.current.left + cardWidth + cardSpacing + index * (10 + cardWidth): positionRef.current.left + index * (10 + cardWidth)}
      bottomAnchor={positionRef.current.top - cardSpacing}
      parentHeight={cardHeight}
      parentPosition={positionRef.current}
      sourceFileKeyMap={sourceFileKeyMap}
      fabricCanvas={fabricCanvas}
      pointerState={pointerState}
      sourceFile={sourceFileKeyMap[getFileNameWithoutExtension(sourceFileKeyMap, reference)]} />)}
    {expandedModules.map((module, index) => <ExploreItem key={module}
      isModule
      referringModule={sourceFile.fileName}
      leftAnchor={isReference ? positionRef.current.left + cardWidth + cardSpacing + index * (10 + cardWidth) : positionRef.current.left + index * (10 + cardWidth)}
      topAnchor={positionRef.current.top + cardHeight + cardSpacing}
      parentHeight={cardHeight}
      parentPosition={positionRef.current}
      sourceFileKeyMap={sourceFileKeyMap}
      fabricCanvas={fabricCanvas}
      pointerState={pointerState}
      sourceFile={sourceFileKeyMap[getFileNameWithoutExtension(sourceFileKeyMap, module)]} />)}
  </>
}
