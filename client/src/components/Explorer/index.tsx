import React from 'react'
import { css } from '@emotion/css'
import { FileGraph, SourceFiles } from '../../../../ast/generateAST'

export default function Explorer ({ fileGraph, sourceFiles }: { fileGraph: FileGraph, sourceFiles: SourceFiles}) {
  return (
    <div className={css`
      margin: 20px;
    `}>
      File: {fileGraph.fileName}
      <br/>
      Modules: {fileGraph.modules.map(module => {
        return <div>
          {module}
        </div>
      })}
      <br />
      <br />
      {Object.keys(sourceFiles).map(fileName => {
        return <div className={css`
          margin: 10px;
        `}>
          Source File: {fileName}
          Modules: {sourceFiles[fileName].modules.map(module => {
            return <div>
              {module}
            </div>
          })}
          Code: {sourceFiles[fileName].text}
        </div>
      })}
    </div>
  )
}
