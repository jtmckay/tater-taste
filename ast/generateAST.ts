import { existsSync } from "fs";
import { join } from "path";
import ts = require("typescript");

let tsConfigCompilerOptions: any = {
  moduleResolution: 2,
  noImplicitAny: false,
  target: 2,
};

function getEntryFilePath(entryPoint: string): string {
  let entryFilePath = join(process.cwd(), entryPoint || "");
  fileVariations(entryFilePath)
    .concat(entryPoint ? fileVariations(entryPoint) : [])
    .sort((a, b) => {
      if (a.length > b.length) {
        return -1;
      } else {
        return 1;
      }
    })
    .some((i) => {
      if (existsSync(i)) {
        entryFilePath = i;
        console.log("Input", entryFilePath);
        return true;
      }
    });
  return entryFilePath;
}

export function generateAST(
  entryPoint?: string,
  tsConfigPath?: string,
  absolutePaths: { pathName: string; absolutePath: string }[] = [],
  mapping: { importName: string; path: string }[] = []
): { sourceFiles: SourceFileKeyMap; fileGraph: FileGraph } {
  let entryFilePath = getEntryFilePath(
    join(process.cwd(), entryPoint || "") || ""
  );
  const configFile = ts.findConfigFile(
    join(process.cwd(), tsConfigPath || ""),
    ts.sys.fileExists,
    "tsconfig.json"
  );
  if (configFile) {
    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      entryFilePath
    );
    tsConfigCompilerOptions = options;
  }
  const program = ts.createProgram([entryFilePath], tsConfigCompilerOptions);
  const programFileMap: ts.Map<ts.SourceFile> = (
    program as any
  ).getFilesByNameMap();
  const sourceFiles: SourceFileKeyMap = {};

  const fileGraph = traverseFile(
    sourceFiles,
    entryFilePath,
    programFileMap,
    absolutePaths,
    mapping
  );
  return { sourceFiles, fileGraph };
}

export function grabConfigPaths(
  tsConfigPathsPath?: string
): { pathName: string; absolutePath: string }[] {
  const tsConfigFilePath = join(
    process.cwd(),
    tsConfigPathsPath || "tsconfig.paths.json"
  );
  try {
    const tsConfig = require(tsConfigFilePath);
    let paths;
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      paths = tsConfig.compilerOptions.paths;
    } else if (tsConfig.paths) {
      paths = tsConfig.paths;
    }
    console.log("Loaded tsconfig paths");
    return Object.entries(paths)
      .map(([key, value]) => {
        return {
          pathName: key.replace("*", "").replace(/\/$/, ""),
          absolutePath: join(
            tsConfigFilePath,
            "..",
            ...(Array.isArray(value) ? value : [value]).map((i) =>
              i.replace("*", "").replace(/\/$/, "")
            )
          ),
        };
      })
      .sort((a, b) => {
        return b.pathName.length - a.pathName.length;
      });
  } catch (err) {
    if (tsConfigPathsPath) {
      console.log(
        "Could not load tsconfig at",
        tsConfigFilePath,
        "\nPlease ensure there are no comments in the tsconfig supplied\n\n"
      );
      throw err;
    }
  }
  return [];
}

export type SourceFileKeyMap = { [key: string]: SourceFile };

export type SourceFile = {
  fileName: string;
  text: string;
  modules: string[];
  statements?: Statement[];
};

export type FileGraph = {
  fileName: string;
  modules: string[];
};

export type Statement = {
  pos: number;
  end: number;
  name?: string;
  type: string;
  statements?: Statement[];
};

function traverseFile(
  sourceFiles: SourceFileKeyMap,
  file: string,
  fileMap: ts.Map<ts.SourceFile>,
  absolutePaths: { pathName: string; absolutePath: string }[] = [],
  mapping: { importName: string; path: string }[] = [],
  parentSourceFile?: any,
  importStatement?: string,
  prefix: string = ""
): FileGraph {
  const sourceFile = findFile(
    file,
    fileMap,
    importStatement,
    absolutePaths,
    mapping
  );

  if (!sourceFile && parentSourceFile) {
    // mapping route
    if (parentSourceFile.resolvedModules.get(importStatement)) {
      const subProgram = ts.createProgram(
        fileVariations(file).filter((i) => existsSync(i)),
        tsConfigCompilerOptions
      );
      const subFileMap: ts.Map<ts.SourceFile> = (
        subProgram as any
      ).getFilesByNameMap();
      subFileMap.forEach((value, key) => {
        if (value) {
          parseFile(
            value,
            sourceFiles,
            key,
            fileMap,
            absolutePaths,
            mapping,
            prefix
          );
          fileMap.set(key, value);
        }
      });
      return traverseFile(sourceFiles, file, fileMap, absolutePaths, mapping);
      // absolutePaths route
    } else {
      let pathName;
      let absolutePath;
      absolutePaths.some((path) => {
        if ((importStatement || "").startsWith(path.pathName)) {
          absolutePath = path.absolutePath;
          pathName = path.pathName;
          return true;
        }
      });

      if (pathName && absolutePath) {
        const subProgram = ts.createProgram(
          fileVariations(
            join(absolutePath, (importStatement || "").replace(pathName, ""))
          ).filter((i) => existsSync(i)),
          tsConfigCompilerOptions
        );
        const subFileMap: ts.Map<ts.SourceFile> = (
          subProgram as any
        ).getFilesByNameMap();
        subFileMap.forEach((value, key) => {
          if (value) {
            parseFile(
              value,
              sourceFiles,
              key,
              fileMap,
              absolutePaths,
              mapping,
              prefix
            );
            fileMap.set(key, value);
          }
        });
        return traverseFile(sourceFiles, file, fileMap, absolutePaths, mapping);
      }
    }
  }

  const parsedFile = parseFile(
    sourceFile,
    sourceFiles,
    file,
    fileMap,
    absolutePaths,
    mapping,
    prefix
  );
  return { fileName: parsedFile.fileName, modules: parsedFile.modules };
}

function parseFile(
  sourceFile: ts.SourceFile | undefined,
  sourceFiles: SourceFileKeyMap,
  file: string,
  fileMap: ts.Map<ts.SourceFile>,
  absolutePaths: { pathName: string; absolutePath: string }[] = [],
  mapping: { importName: string; path: string }[] = [],
  prefix: string = ""
) {
  if (!sourceFile) {
    throw new Error(`Could not find file ${file}`);
  }
  if (sourceFiles[file]) {
    return sourceFiles[file];
  }

  const parsedFile: SourceFile = {
    fileName: sourceFile.fileName,
    text: sourceFile.text,
    modules: [],
    statements: [],
  };
  sourceFiles[file] = parsedFile;
  if (!sourceFile.statements) {
    throw new Error(`No sourceFile statements in file ${file}`);
  }
  sourceFile.statements.forEach((statement: any) => {
    if (statement.kind === ts.SyntaxKind.ImportDeclaration) {
      try {
        const modulePath = join(
          sourceFile.fileName,
          "../",
          statement.moduleSpecifier.text
        );
        let absolutePath;
        absolutePaths.some((i) => {
          if (statement.moduleSpecifier.text.startsWith(i.pathName)) {
            absolutePath = join(
              i.absolutePath,
              statement.moduleSpecifier.text.replace(i.pathName, "")
            );
            return true;
          }
        });

        parsedFile.modules.push(
          traverseFile(
            sourceFiles,
            absolutePath || modulePath,
            fileMap,
            absolutePaths,
            mapping,
            sourceFile,
            statement.moduleSpecifier.text,
            `${prefix}\t`
          ).fileName
        );
      } catch (err) {
        parsedFile.statements?.push({
          pos: statement.pos,
          end: statement.end,
          name: statement.moduleSpecifier.text,
          type: "module",
        });
        console.info(
          prefix,
          `External module: ${statement.moduleSpecifier.text} in ${file}`
        );
      }
    } else if (statement.kind === ts.SyntaxKind.ImportEqualsDeclaration) {
      try {
        const modulePath = join(
          sourceFile.fileName,
          "../",
          statement.moduleReference.expression.text
        );
        parsedFile.modules.push(
          traverseFile(
            sourceFiles,
            modulePath,
            fileMap,
            absolutePaths,
            mapping,
            sourceFile,
            statement.moduleReference.expression.text,
            `${prefix}\t`
          ).fileName
        );
      } catch (err) {
        parsedFile.statements?.push({
          pos: statement.pos,
          end: statement.end,
          name: statement.moduleReference.expression.text,
          type: "module",
        });
        console.info(
          prefix,
          `External module: ${statement.moduleReference.expression.text} in ${file}`
        );
      }
    } else if (statement.kind === ts.SyntaxKind.ClassDeclaration) {
      parsedFile.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name: statement.name?.escapedText,
        type: "class",
        statements: statement.members
          ?.map((nestedStatement: any) => {
            if (nestedStatement.kind === ts.SyntaxKind.FunctionDeclaration) {
              return {
                pos: nestedStatement.pos,
                end: nestedStatement.end,
                name: nestedStatement.name.escapedText,
                type: "function",
              };
            } else if (
              nestedStatement.kind === ts.SyntaxKind.MethodDeclaration
            ) {
              return {
                pos: nestedStatement.pos,
                end: nestedStatement.end,
                name: nestedStatement.name.escapedText,
                type: "method",
              };
            }
          })
          .filter((i: any) => i),
      });
    } else if (statement.kind === ts.SyntaxKind.FunctionDeclaration) {
      parsedFile.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name: statement.name.escapedText,
        type: "function",
      });
    } else if (statement.kind === ts.SyntaxKind.MethodDeclaration) {
      parsedFile.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name: statement.name.escapedText,
        type: "method",
      });
    } else if (statement.kind === ts.SyntaxKind.ExpressionStatement) {
      parsedFile.statements?.push({
        pos: statement.pos,
        end: statement.end,
        name:
          statement.expression.name?.escapedText ||
          statement.expression.expression?.name.escapedText ||
          statement.expression.expression?.expression?.name.escapedText,
        type: "expression",
      });
    } else if (statement.moduleSpecifier?.text) {
      // Catch all statements with a module specified; EG: ts.SyntaxKind.ExportDeclaration
      try {
        const modulePath = join(
          sourceFile.fileName,
          "../",
          statement.moduleSpecifier.text
        );
        parsedFile.modules.push(
          traverseFile(
            sourceFiles,
            modulePath,
            fileMap,
            absolutePaths,
            mapping,
            sourceFile,
            statement.moduleSpecifier.text,
            `${prefix}\t`
          ).fileName
        );
      } catch (err) {
        parsedFile.statements?.push({
          pos: statement.pos,
          end: statement.end,
          name: statement.moduleSpecifier.text,
          type: "module",
        });
        console.info(
          prefix,
          `External module: ${statement.moduleSpecifier.text} in ${file}`
        );
      }
    } else {
      // console.debug(prefix, 'Missed something', ts.SyntaxKind[statement.kind]);
    }
  });
  return parsedFile;
}

function fileVariations(file: string): string[] {
  return [
    file,
    `${file}.ts`,
    `${file}.tsx`,
    file.toLowerCase(),
    `${file}.ts`.toLowerCase(),
    `${file}.tsx`.toLowerCase(),
    join(file, "index.ts"),
    join(file, "index.tsx"),
    join(file, "index.ts").toLowerCase(),
    join(file, "index.tsx").toLowerCase(),
  ];
}

function findFile(
  file: string,
  fileMap: ts.Map<ts.SourceFile>,
  importStatement?: string,
  absolutePaths: { pathName: string; absolutePath: string }[] = [],
  mapping: { importName: string; path: string }[] = []
): ts.SourceFile | undefined {
  let foundFile: ts.SourceFile | undefined;
  if (importStatement) {
    fileVariations(importStatement).some((filePath) => {
      foundFile = fileMap.get(filePath);
      return !!foundFile;
    });
  }
  if (foundFile) {
    return foundFile;
  }
  if (importStatement) {
    const mappingPath = mapping.find(
      (i) => i.importName === importStatement
    )?.path;
    if (mappingPath) {
      fileVariations(join(process.cwd(), mappingPath, importStatement)).some(
        (filePath) => {
          foundFile = fileMap.get(filePath);
          return !!foundFile;
        }
      );
    }

    if (foundFile) {
      return foundFile;
    }

    if (importStatement.startsWith("@")) {
      let pathName;
      let absolutePath;
      absolutePaths.some((path) => {
        if (importStatement.startsWith(path.pathName)) {
          absolutePath = path.absolutePath;
          pathName = path.pathName;
        }
      });

      if (pathName && absolutePath) {
        fileVariations(
          join(absolutePath, importStatement.replace(pathName, ""))
        ).some((filePath) => {
          foundFile = fileMap.get(filePath);
          return !!foundFile;
        });

        if (foundFile) {
          return foundFile;
        }

        fileVariations(
          join(absolutePath, importStatement.replace(pathName, ""))
        ).some((filePath) => {
          fileMap.forEach((file) => {
            if (file.fileName === filePath) {
              foundFile = file;
            }
          });
          return !!foundFile;
        });
      }
    }
  }

  if (foundFile) {
    return foundFile;
  }

  fileVariations(file).some((filePath) => {
    foundFile = fileMap.get(filePath);
    return !!foundFile;
  });

  return foundFile;
}
