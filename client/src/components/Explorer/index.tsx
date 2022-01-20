import React, { useRef, useState } from 'react'
import { css } from '@emotion/css'
import TextField from '@mui/material/TextField';
import { FileGraph, SourceFileKeyMap, SourceFile } from '../../../../ast/generateAST'
import ExploreItem from '../ExploreItem'
import { getFileNameWithoutExtension, searchSourceFileText } from '../../utils/sourceFileHelpers'
import FabricCanvas from '../FabricCanvas'
import SearchResult from '../SearchResult';

let searchTimerThrottleId

export default function Explorer ({ fileGraph, sourceFileKeyMap }: { fileGraph: FileGraph, sourceFileKeyMap: SourceFileKeyMap}) {
  const [fabricCanvas, setFabricCanvas] = useState()
  const [pointerState, setPointerState] = useState()
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])

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
      display: flex;
      position: relative;
      flex-direction: column;
      flex-grow: 1;
    `}>
      <TextField id="outlined-basic" label="Search" variant="outlined" onChange={event => setSearchText(event.target.value)} onKeyPress={key => {
        function search () {
          setSearchResults(searchSourceFileText(sourceFileKeyMap, searchText))
        }
        if (key.key === 'Enter' && searchText.length) {
          clearTimeout(searchTimerThrottleId)
          search()
        } else {
          clearTimeout(searchTimerThrottleId)
          searchTimerThrottleId = setTimeout(search, 500)
        }
      }} />
      <FabricCanvas registerFabricCanvas={fabricCanvas => setFabricCanvas(fabricCanvas)}
        registerPointerState={pointerState => setPointerState(pointerState)} />
      <ExploreItem
        sourceFileKeyMap={sourceFileKeyMap}
        fabricCanvas={fabricCanvas}
        pointerState={pointerState}
        sourceFile={sourceFileKeyMap[getFileNameWithoutExtension(sourceFileKeyMap, fileGraph.fileName)]} />
      {searchText && <div className={css`
        position: absolute;
        top: 56px;
        left: 10px;
        background: lightgray;
        opacity: 80%;
      `}>
        {searchResults.map(searchResult => {
          return (
            <SearchResult key={searchResult} sourceFile={sourceFileKeyMap[getFileNameWithoutExtension(sourceFileKeyMap, searchResult)]} expandModule={expandSearchResult} collapseModule={removeSearchResult} />
          )
        })}
      </div>}
    </div>
  )
}
