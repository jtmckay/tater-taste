import React, { useRef, useState } from 'react'
import { css } from '@emotion/css'
import TextField from '@mui/material/TextField';
import { FileGraph, SourceFileKeyMap } from '../../../../ast/generateAST'
import ExploreItem from '../ExploreItem'
import { getShortenedFileName, searchSourceFileText } from '../../utils/sourceFileHelpers'
import FabricCanvas from '../FabricCanvas'
import SearchResult from '../SearchResult';
import { useEffect } from 'react';

let searchTimerThrottleId

export default function Explorer ({ fileGraph, sourceFileKeyMap }: { fileGraph: FileGraph, sourceFileKeyMap: SourceFileKeyMap}) {
  const [sourceFileName, setSourceFileName] = useState(fileGraph.fileName)
  const [fabricCanvas, setFabricCanvas] = useState()
  const [pointerState, setPointerState] = useState()
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<{ fileName: string, isDeclaration?: boolean }[]>([])
  const timerRef = useRef()

  function search () {
    setSearchResults(searchSourceFileText(sourceFileKeyMap, searchText))
  }

  useEffect(() => {
    clearTimeout(searchTimerThrottleId)
    searchTimerThrottleId = setTimeout(search, 500)

    return () => {
      clearTimeout(searchTimerThrottleId)
    }
  }, [searchText])

  return (
    <div className={css`
      display: flex;
      position: relative;
      flex-direction: column;
      flex-grow: 1;
    `}>
      <div className={css`
        display: flex;
        box-shadow: 0px -3px 5px 5px;
        padding-top: 6px;
        padding-bottom: 2px;
      `}>
        <div className={css`font-size: 32px; margin: 0px 20px; align-self: center;`}>Tater - TypeScript Abstract Syntax Tree Explorer</div>
        <TextField
          className={css`flex-grow: 1; margin-bottom: -6px;`}
          id="outlined-basic"
          label="Search"
          variant="outlined"
          value={searchText}
          onChange={event => setSearchText(event.target.value)}
          onKeyPress={key => {
            if (key.key === 'Enter' && searchText.length) {
              clearTimeout(searchTimerThrottleId)
              search()
            }
          }} />
      </div>
      <FabricCanvas registerFabricCanvas={fabricCanvas => setFabricCanvas(fabricCanvas)}
        registerPointerState={pointerState => setPointerState(pointerState)} />
      <ExploreItem
        sourceFileKeyMap={sourceFileKeyMap}
        fabricCanvas={fabricCanvas}
        pointerState={pointerState}
        sourceFileName={sourceFileName} />
      {searchText && <div className={css`
        position: absolute;
        top: 64px;
        right: 0px;
        background: #d3d3d3d3;
      `}>
        {searchResults.map(searchResult => {
          return (
            <SearchResult key={searchResult.fileName}
              isDeclaration={searchResult.isDeclaration}
              sourceFileName={getShortenedFileName(searchResult.fileName)}
              callback={() => setSourceFileName(searchResult.fileName)} />
          )
        })}
      </div>}
      {searchText && <div className={css`
        position: absolute;
        top: 2px;
        right: 0px;
        color: red;
        cursor: pointer;
        font-size: 32px;
        padding: 10px;
      `} onClick={() => setSearchText('')}>
        x
      </div>}
    </div>
  )
}
