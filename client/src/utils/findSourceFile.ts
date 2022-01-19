import { SourceFileKeyMap } from "../../../ast/generateAST"

export function getShortSourceFileName (sourceFiles: SourceFileKeyMap, fileName: string): string {
  if (sourceFiles[fileName]) {
    return fileName
  }
  let shortened = fileName.replace(/(.*)\..*/, '$1')
  if (sourceFiles[shortened]) {
    return shortened
  }
  shortened = fileName.replace(/(.*)\/.*/, '$1')
  if (sourceFiles[shortened]) {
    return shortened
  }
  throw new Error(`Could not find file ${fileName}`)
}
