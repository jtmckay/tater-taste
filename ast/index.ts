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
.option('-c --config <type>', 'Specify the path to your tsconfig.json')
.action((filePath: string, { config }: { config: string }) => {
  try {
    const ast = generateAST(filePath, config)
    fs.writeFileSync(join(__dirname, '../client/src/', 'fileGraph.json'), JSON.stringify(ast.fileGraph, null, 2))
    fs.writeFileSync(join(__dirname, '../client/src/', 'sourceFiles.json'), JSON.stringify(ast.sourceFiles, null, 2))
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
