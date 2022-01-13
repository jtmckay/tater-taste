import React, { useState } from 'react'
import { css } from '@emotion/css'
import TextField from '@mui/material/TextField';
import { FileGraph, SourceFilesType, SourceFileType } from '../../../../ast/generateAST'
import SourceFile from '../SourceFile'
import { getShortSourceFileName } from '../../utils/findSourceFile'

let searchTimerThrottleId

function matchFile (sourceFile: SourceFileType, searchString: string): boolean {
  return searchString.split(' ').every(searchText => {
    const regex = new RegExp(searchText.replace(/([^a-z0-9])/g, '\\$1'))
    if (regex.test(sourceFile.fileName)) {
      return true
    }
    if (regex.test(sourceFile.text)) {
      return true
    }
  })
}

export default function Explorer ({ fileGraph, sourceFiles }: { fileGraph: FileGraph, sourceFiles: SourceFilesType}) {
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])

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

  function expandSearchResult (moduleName: string) {
    if (searchResults.includes(moduleName)) {
      return
    }
    const newSearchResults = [...searchResults]
    newSearchResults.push(moduleName)
    setSearchResults(newSearchResults)
  }
  function removeSearchResult (moduleName: string) {
    const newSearchResults = [...searchResults].filter(i => i !== moduleName)
    setSearchResults(newSearchResults)
  }

  return (
    <div className={css`
      margin: 20px;
      display: flex;
      flex-wrap: wrap;
      flex-direction: column;
    `}>
      <TextField id="outlined-basic" label="Search" variant="outlined" onChange={event => setSearchText(event.target.value)} onKeyPress={key => {
        function search () {
          setSearchResults(Object.values(sourceFiles).reduce((accumulator, sourceFile) => {
            if (matchFile(sourceFile, searchText)) {
              accumulator.push(sourceFile.fileName)
              return accumulator
            } else {
              return accumulator
            }
          }, []))
        }
        if (key.key === 'Enter' && searchText.length) {
          clearTimeout(searchTimerThrottleId)
          search()
        } else {
          clearTimeout(searchTimerThrottleId)
          searchTimerThrottleId = setTimeout(search, 1000)
        }
      }} />
      {searchText ? <>
        {searchResults.map(searchResult => {
          return (
            <SourceFile key={searchResult} sourceFile={sourceFiles[getShortSourceFileName(sourceFiles, searchResult)]} expandModule={expandSearchResult} collapseModule={removeSearchResult} />
          )
        })}
      </> : <>
        <SourceFile sourceFile={sourceFiles[getShortSourceFileName(sourceFiles, fileGraph.fileName)]} expandModule={expandModule} />
        {expandedModules.map(expandedModule => {
          return (
            <SourceFile key={expandedModule} sourceFile={sourceFiles[getShortSourceFileName(sourceFiles, expandedModule)]} expandModule={expandModule} collapseModule={collapseModule} />
          )
        })}
      </>}
    </div>
  )
}
