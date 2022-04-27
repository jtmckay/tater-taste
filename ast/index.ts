#!/usr/bin/env node

import { Command } from 'commander'
import fs from 'fs'
import { join } from 'path'
import { generateAST } from './generateAST'
const { exec } = require('child_process');

const program = new Command();

program.description('An application for exploring typescript repositories')
.version('1.0.0')
.addHelpText('after', `
  Examples:
    $ tater-taste client/src/
    -- Compile the target typescript file, and host a webpage locally to explore
`)
.argument('[file]', 'Specify the path of the file')
.option('-c --config <string>', 'Specify the path to your tsconfig.json')
.option('-m --map <string>', 'Specify the paths to check for external packages (comma delimited) EG: @streem/sdk-react=packages/sdk-react/src')
.action((filePath: string, { config, map }: { config: string, map: string }) => {
  try {
    const mapping = map?.split(',').map(i => {
      const [ importName, path ] = i.split('/')
      return { importName, path }
    })
    const ast = generateAST(filePath, config, mapping)
    console.log('__dirname', __dirname)
    fs.writeFileSync(join(__dirname, '../client/src/', 'fileGraph.json'), JSON.stringify(ast.fileGraph, null, 2))
    fs.writeFileSync(join(__dirname, '../client/src/', 'sourceFiles.json'), JSON.stringify(ast.sourceFiles, null, 2))
    console.log('Output', join(__dirname, '../client/src/', 'sourceFiles.json'))
  } catch (err) {
    console.log(`Please check the path to your main typescript file. \nAdd the path as an argument. EG: tater-taste client/src\n\n`)
    throw err
  }

  const childProcess = exec(`cd ${join(__dirname, '../')} && yarn start`, (error: Error, stdout: any, stderr: any) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
  
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
  
    console.log(`stdout:\n${stdout}`);
  })
  if (childProcess.stdout) {
    childProcess.stdout.on('data', function(data: any) {
      console.log(data.toString())
    })
  }
  if (childProcess.stderr) {
    childProcess.stderr.on('data', function(data: any) {
      console.error(data.toString())
    })
  }
})

program.parse(process.argv);
