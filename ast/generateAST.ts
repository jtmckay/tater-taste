import { existsSync } from 'fs';
import { join } from 'path';
import ts = require('typescript');

const logging = false;

const tsConfigCompilerOptions = {
  moduleResolution: 2,
  noImplicitAny: false,
  target: 2,
};

export function generateAST(entryPoint?: string, tsConfigPath?: string): { sourceFiles: SourceFilesType, fileGraph: FileGraph } {
  const entryFilePath = join(process.cwd(), entryPoint || '')
  const program = ts.createProgram(fileVariations(entryFilePath).concat(entryPoint? fileVariations(entryPoint) : []).filter((i) => existsSync(i)), grabConfig(tsConfigPath));
  const programFileMap: ts.Map<ts.SourceFile> = (program as any).getFilesByNameMap();
  const sourceFiles: SourceFilesType = {};

  // console.log('program', program.getRootFileNames())

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

function debugLog(...params: any) {
  if (logging) {
    debugLog(...params);
  }
}

export type SourceFilesType = { [key: string]: SourceFileType }

export type SourceFileType = {
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
  name: string,
  type: string,
}

function traverseFile(sourceFiles: SourceFilesType, file: string, fileMap: ts.Map<ts.SourceFile>, parentSourceFile?: any, importStatement?: string, prefix: string = ''): FileGraph {
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
  const parsedFile: SourceFileType = {
    fileName: root.fileName,
    text: root.text,
    modules: [],
    statements: [],
  };
  sourceFiles[file] = parsedFile;
  root.statements.forEach((statement: any, index) => {
    debugLog(prefix, 'Index', index);
    if (statement.moduleSpecifier?.text) {
      debugLog(prefix, 'statement moduleSpecifier text:', statement.moduleSpecifier.text);
      try {
        parsedFile.statements?.push({
          pos: statement.pos,
          end: statement.end,
          name: statement.moduleSpecifier.text,
          type: 'module',
        });
        const modulePath = join(root.fileName, '../', statement.moduleSpecifier.text);
        parsedFile.modules.push(traverseFile(sourceFiles, modulePath, fileMap, root, statement.moduleSpecifier.text, `${prefix}\t`).fileName);
      } catch (err) {
        console.info(prefix, `Skipped ${statement.moduleSpecifier.text} in ${file}`);
      }
    } else if (statement.name?.escapedText) {
      debugLog(prefix, 'statement name:', statement.name?.escapedText);
      parsedFile?.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name: statement.name?.escapedText,
        type: 'statement',
      });
    } else if (statement.declarationList?.declarations) {
      statement.declarationList.declarations.forEach((declaration: ts.Declaration & { name: { escapedText: string }}) => {
        debugLog(prefix, 'declaration name:', declaration.name?.escapedText);
        parsedFile?.statements?.push({
          pos: statement.pos,
          end: statement.end,
          name: declaration.name?.escapedText,
          type: 'declaration',
        });
      });
    } else {
      debugLog(prefix, 'Missed something', statement);
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
