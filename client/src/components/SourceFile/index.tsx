import React, { useState } from 'react';
import { css } from '@emotion/css'
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SourceFileType } from '../../../../ast/generateAST'

export default function SourceFile({ sourceFile, expandModule, collapseModule }: { sourceFile: SourceFileType, expandModule: Function, collapseModule?: Function }) {
  return (
    <>
      <Card className={css`
        margin: 10px;
        position: relative;
      `} sx={{ minWidth: 275 }}>
        <CardContent>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <h3>File: {sourceFile.fileName}</h3>
            </AccordionSummary>
            <AccordionDetails>
              <div>
                {sourceFile.text.split(/\n/).map((line, index) => {
                  const elements = line.split(/  |\t/).slice(1)
                  return (
                    <div key={index}>
                      {elements.map((_, id) => <span key={`${index}-${id}`}>&nbsp;&nbsp;</span>)}
                      <span>{line}</span>
                    </div>
                  )
                })}
              </div>
            </AccordionDetails>
          </Accordion>
          {collapseModule ? <div className={css`
            cursor: pointer;
            background: gray;
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 10px;
          `} onClick={() => collapseModule(sourceFile.fileName)}>
            Collapse
          </div> : undefined}
        </CardContent>
        <CardActions className={css`
          display: flex;
          flex-direction: column;
          align-items: flex-start !important;
        `}>
          <h3 className={css`
            margin: 0px 10px;
          `}>{sourceFile.modules.length ? 'Modules:' : 'No Modules'}</h3>
          {sourceFile.modules.map(modulePath => {
            return <div key={modulePath} className={css`
              cursor: pointer;
              color: blue;
              margin: 10px;
            `} onClick={() => {
              expandModule(modulePath)
            }}>{modulePath}</div>
          })}
        </CardActions>
      </Card>
    </>
  )
}
