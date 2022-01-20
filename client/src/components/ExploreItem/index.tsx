import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { SourceFile, SourceFileKeyMap } from '../../../../ast/generateAST'
// import { addToGroup } from '../../utils/fabricHelpers'
import { getFileNameWithoutExtension, getShortenedFileName, searchSourceFileModules } from '../../utils/sourceFileHelpers'
import { calculateTopLeft, onClick, onMove } from '../../utils/fabricHelpers';

const cardWidth = 500
const cardSpacing = 40

export default function ExploreItem({ fabricCanvas, pointerState, isReference, isModule, referringModule, topAnchor, bottomAnchor, leftAnchor, rightAnchor, sourceFile, sourceFileKeyMap }:
  { fabricCanvas: fabric.Canvas, pointerState, isReference?: boolean, isModule?: boolean, referringModule?: string, topAnchor?: number, bottomAnchor?: number, leftAnchor?: number, rightAnchor?: number, sourceFile: SourceFile, sourceFileKeyMap: SourceFileKeyMap }) {
  const groupRef = useRef<fabric.Group>()
  const positionRef = useRef<{ left: number, top: number }>()
  const [ expandedReferences, setExpandedReferences ] = useState([])
  const [ expandedModules, setExpandedModules ] = useState<string[]>([])
  const [ cardHeight, setCardHeight ] = useState(400)

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
      })
      // setTimeout(() => {
      //   addToGroup(fabricCanvas, pointerState, group, (x, y) => new fabric.Textbox('Other stuff', {
      //     left: x + 30,
      //     top: y + 30,
      //     width: 170,
      //     fontSize: 20,
      //   }))
      // }, 1000)
      fabricCanvas.add(group)
      return () => {
        fabricCanvas.remove(group)
      }
    }
  }, [fabricCanvas, pointerState, expandedModules, expandedReferences])

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
    {expandedReferences.map((reference, index) => <ExploreItem key={reference}
      isReference
      referringModule={sourceFile.fileName}
      leftAnchor={isModule ? positionRef.current.left + cardWidth + cardSpacing + index * (10 + cardWidth): positionRef.current.left + index * (10 + cardWidth)}
      bottomAnchor={positionRef.current.top - cardSpacing}
      sourceFileKeyMap={sourceFileKeyMap}
      fabricCanvas={fabricCanvas}
      pointerState={pointerState}
      sourceFile={sourceFileKeyMap[getFileNameWithoutExtension(sourceFileKeyMap, reference)]} />)}
    {expandedModules.map((module, index) => <ExploreItem key={module}
      isModule
      referringModule={sourceFile.fileName}
      leftAnchor={isReference ? positionRef.current.left + cardWidth + cardSpacing + index * (10 + cardWidth) : positionRef.current.left + index * (10 + cardWidth)}
      topAnchor={positionRef.current.top + cardHeight + cardSpacing}
      sourceFileKeyMap={sourceFileKeyMap}
      fabricCanvas={fabricCanvas}
      pointerState={pointerState}
      sourceFile={sourceFileKeyMap[getFileNameWithoutExtension(sourceFileKeyMap, module)]} />)}
  </>
}
