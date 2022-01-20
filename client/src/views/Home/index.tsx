import React from 'react'
import { css } from '@emotion/css'
import Explorer from '../../components/Explorer'
import fileGraph from '../../fileGraph.json'
import sourceFiles from '../../sourceFiles.json'

export default function Home () {
  return (
    <div className={css`
      min-width: 800px;
      height: 100%;
      display: flex;
      flex-direction: column;
    `}>
      <h1 className={css`text-align: center;`}>Tater - TypeScript Abstract Syntax Tree Explorer</h1>
      <Explorer fileGraph={fileGraph} sourceFileKeyMap={sourceFiles} />
    </div>
  )
}
