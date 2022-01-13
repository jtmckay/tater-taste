import React, { useState } from 'react'
import { css } from '@emotion/css'
import { FileGraph, SourceFilesType } from '../../../../ast/generateAST'
import SourceFile from '../SourceFile'
import { getShortSourceFileName } from '../../utils/findSourceFile'

export default function Explorer ({ fileGraph, sourceFiles }: { fileGraph: FileGraph, sourceFiles: SourceFilesType}) {
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  function expandModule (moduleName: string) {
    if (expandedModules.includes(moduleName)) {
      return
    }
    const newExpandedModules = [...expandedModules]
    newExpandedModules.push(moduleName)
    setExpandedModules(newExpandedModules)
  }

  function collapseModule (moduleName: string) {
    const newExpandedModules = [...expandedModules].filter(i => i !== moduleName)
    setExpandedModules(newExpandedModules)
  }

  return (
    <div className={css`
      margin: 20px;
      display: flex;
      flex-wrap: wrap;
      flex-direction: column;
    `}>
      <SourceFile sourceFile={sourceFiles[getShortSourceFileName(sourceFiles, fileGraph.fileName)]} expandModule={expandModule} />
      {expandedModules.map(expandedModule => {
        return (
          <SourceFile key={expandedModule} sourceFile={sourceFiles[getShortSourceFileName(sourceFiles, expandedModule)]} expandModule={expandModule} collapseModule={collapseModule} />
        )
      })}
    </div>
  )
}
