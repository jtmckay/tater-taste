import React from 'react'
import Explorer from '../../components/Explorer'
import fileGraph from '../../fileGraph.json'
import sourceFiles from '../../sourceFiles.json'

export default function Home () {
  return (
    <div>
      <div>Hello from the AST client!</div>
      <Explorer fileGraph={fileGraph} sourceFiles={sourceFiles} />
    </div>
  )
}
