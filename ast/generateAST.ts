import { existsSync } from 'fs';
import { join } from 'path';
import ts = require('typescript');

const tsConfigCompilerOptions = {
  moduleResolution: 2,
  noImplicitAny: false,
  target: 2,
};

function getEntryFilePath(entryPoint: string): string {
  let entryFilePath = join(process.cwd(), entryPoint || '')
  fileVariations(entryFilePath).concat(entryPoint? fileVariations(entryPoint || '') : []).some((i) => {
    if (existsSync(i)) {
      entryFilePath = i
      return true
    }
  })
  return entryFilePath
}

export function generateAST(entryPoint?: string, tsConfigPath?: string): { sourceFiles: SourceFileKeyMap, fileGraph: FileGraph } {
  let entryFilePath = getEntryFilePath(entryPoint || '')

  const program = ts.createProgram([entryFilePath], grabConfig(tsConfigPath));
  const programFileMap: ts.Map<ts.SourceFile> = (program as any).getFilesByNameMap();
  const sourceFiles: SourceFileKeyMap = {};

  const fileGraph = traverseFile(sourceFiles, entryFilePath, programFileMap);
  return { sourceFiles, fileGraph };
}

function grabConfig(tsConfigPath?: string) {
  if (tsConfigPath) {
    const tsConfigFilePath = join(process.cwd(), tsConfigPath)
    try {
      const tsConfig = require(tsConfigFilePath)
      if (tsConfig.compilerOptions) {
        return tsConfig.compilerOptions
      }
    } catch (err) {
      console.log('Could not load tsconfig at', tsConfigFilePath, '\nPlease ensure there are no comments in the tsconfig supplied\n\n')
      throw err
    }
  }
  return tsConfigCompilerOptions
}

export type SourceFileKeyMap = { [key: string]: SourceFile }

export type SourceFile = {
  fileName: string,
  text: string,
  modules: string[]
  statements?: Statement[]
}

export type FileGraph = {
  fileName: string,
  modules: string[]
}

export type Statement = {
  pos: number,
  end: number,
  name?: string,
  type: string,
  statements?: Statement[]
}

function traverseFile(sourceFiles: SourceFileKeyMap, file: string, fileMap: ts.Map<ts.SourceFile>, parentSourceFile?: any, importStatement?: string, prefix: string = ''): FileGraph {
  const root = findFile(file, fileMap, importStatement);

  if (!root && parentSourceFile && parentSourceFile.resolvedModules.get(importStatement)) {
    const subProgram = ts.createProgram(fileVariations(file).filter((i) => existsSync(i)), tsConfigCompilerOptions);
    const subFileMap: ts.Map<ts.SourceFile> = (subProgram as any).getFilesByNameMap();
    return traverseFile(sourceFiles, file, subFileMap);
  }

  if (!root) {
    throw new Error(`Could not find file ${file}`);
  }
  if (sourceFiles[file]) {
    return sourceFiles[file];
  }
  const parsedFile: SourceFile = {
    fileName: root.fileName,
    text: root.text,
    modules: [],
    statements: [],
  };
  sourceFiles[file] = parsedFile;
  if (!root.statements) {
    throw new Error(`No root statements in file ${file}`);
  }
  root.statements.forEach((statement: any, index) => {
    if (statement.kind === ts.SyntaxKind.ImportDeclaration) {
      try {
        const modulePath = join(root.fileName, '../', statement.moduleSpecifier.text);
        parsedFile.modules.push(traverseFile(sourceFiles, modulePath, fileMap, root, statement.moduleSpecifier.text, `${prefix}\t`).fileName);
      } catch (err) {
        parsedFile.statements?.push({
          pos: statement.pos,
          end: statement.end,
          name: statement.moduleSpecifier.text,
          type: 'module',
        });
        console.info(prefix, `External module: ${statement.moduleSpecifier.text} in ${file}`);
      }
    } else if (statement.kind === ts.SyntaxKind.ImportEqualsDeclaration) {
      try {
        const modulePath = join(root.fileName, '../', statement.moduleReference.expression.text);
        parsedFile.modules.push(traverseFile(sourceFiles, modulePath, fileMap, root, statement.moduleReference.expression.text, `${prefix}\t`).fileName);
      } catch (err) {
        parsedFile.statements?.push({
          pos: statement.pos,
          end: statement.end,
          name: statement.moduleReference.expression.text,
          type: 'module',
        });
        console.info(prefix, `External module: ${statement.moduleReference.expression.text} in ${file}`);
      }
    } else if (statement.kind === ts.SyntaxKind.ClassDeclaration) {
      parsedFile.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name: statement.name?.escapedText,
        type: 'class',
        statements: statement.members?.map((nestedStatement: any) => {
          if (nestedStatement.kind === ts.SyntaxKind.FunctionDeclaration) {
            return {
              pos: nestedStatement.pos,
              end: nestedStatement.end,
              name: nestedStatement.name.escapedText,
              type: 'function',
            };
          } else if (nestedStatement.kind === ts.SyntaxKind.MethodDeclaration) {
            return {
              pos: nestedStatement.pos,
              end: nestedStatement.end,
              name: nestedStatement.name.escapedText,
              type: 'method',
            };
          }
        }).filter((i: any) => i)
      });
    } else if (statement.kind === ts.SyntaxKind.FunctionDeclaration) {
      parsedFile.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name: statement.name.escapedText,
        type: 'function',
      });
    } else if (statement.kind === ts.SyntaxKind.MethodDeclaration) {
      parsedFile.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name: statement.name.escapedText,
        type: 'method',
      });
    } else if (statement.kind === ts.SyntaxKind.ExpressionStatement) {
      parsedFile.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name: statement.expression.name?.escapedText || statement.expression.expression?.name.escapedText || statement.expression.expression?.expression?.name.escapedText,
        type: 'expression',
      });
    } else {
      // console.debug(prefix, 'Missed something', ts.SyntaxKind[statement.kind]);
    }
  });
  return { fileName: parsedFile.fileName, modules: parsedFile.modules };
}

function fileVariations(file: string): string[] {
  return [
    file,
    `${file}.ts`,
    `${file}.tsx`,
    file.toLowerCase(),
    `${file}.ts`.toLowerCase(),
    `${file}.tsx`.toLowerCase(),
    join(file, 'index.ts'),
    join(file, 'index.tsx'),
    join(file, 'index.ts').toLowerCase(),
    join(file, 'index.tsx').toLowerCase(),
  ];
}

function findFile(file: string, fileMap: ts.Map<ts.SourceFile>, importStatement?: string): ts.SourceFile | undefined {
  let foundFile;
  if (importStatement) {
    fileVariations(importStatement).some((filePath) => {
      foundFile = fileMap.get(filePath);
      return !!foundFile;
    });
  }
  if (!foundFile) {
    fileVariations(file).some((filePath) => {
      foundFile = fileMap.get(filePath);
      return !!foundFile;
    });
  }
  return foundFile;
}
