import React from 'react';
import { css } from '@emotion/css'
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';

export default function SearchResult({ sourceFileName, isDeclaration, callback }: { sourceFileName: string, isDeclaration?: boolean, callback: Function }) {
  return (
    <>
      <Card className={css`
          margin: 10px;
          position: relative;
          cursor: pointer;
        `}
        sx={{ minWidth: 275, maxWidth: 800 }}
        onClick={() => callback()}>
        <CardActions>
          <h3>{sourceFileName}</h3>
          {isDeclaration && <div className={css`
            position: absolute;
            top: 2px;
            right: 2px;
            color: #ff6767;
          `}>
            Declaration
          </div>}
        </CardActions>
      </Card>
    </>
  )
}
