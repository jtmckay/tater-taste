import { SourceFile, SourceFileKeyMap } from "../../../ast/generateAST"

export function getFileNameWithoutExtension (sourceFileKeyMap: SourceFileKeyMap, fileName: string): string {
  if (sourceFileKeyMap[fileName]) {
    return fileName
  }
  let shortened = fileName.replace(/(.*)\..*/, '$1')
  if (sourceFileKeyMap[shortened]) {
    return shortened
  }
  shortened = fileName.replace(/(.*)\/.*/, '$1')
  if (sourceFileKeyMap[shortened]) {
    return shortened
  }
  throw new Error(`Could not find file ${fileName}`)
}

export function getShortenedFileName (fileName: string): string {
  const match = fileName.match(/([^/]*)\/*([^/]*)\/*([^/]*)$/)
  if (match) {
    return match.slice(1).filter(i => i).join('/')
  } else {
    return fileName
  }
}

function matchFileText (sourceFile: SourceFile, searchString: string): boolean {
  return searchString.split(' ').every(searchText => {
    const regex = new RegExp(searchText.replace(/([^a-z0-9])/gi, '\\$1'))
    if (regex.test(sourceFile.fileName)) {
      return true
    }
    if (regex.test(sourceFile.text)) {
      return true
    }
  })
}

export function searchSourceFileText (sourceFileKeyMap: SourceFileKeyMap, searchText: string) {
  return Object.values(sourceFileKeyMap).reduce((accumulator, sourceFile) => {
    if (matchFileText(sourceFile, searchText)) {
      accumulator.push(sourceFile.fileName)
      return accumulator
    } else {
      return accumulator
    }
  }, [])
}

export function searchSourceFileModules (sourceFileKeyMap: SourceFileKeyMap, fileName: string) {
  return Object.values(sourceFileKeyMap).reduce((accumulator, sourceFile) => {
    if (sourceFile.modules.includes(fileName)) {
      accumulator.push(sourceFile.fileName)
      return accumulator
    } else {
      return accumulator
    }
  }, [])
}
