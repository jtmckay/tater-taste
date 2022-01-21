import React from 'react';
import { css } from '@emotion/css'
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';

export default function SearchResult({ sourceFileName, callback }: { sourceFileName: string, callback: Function }) {
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
        </CardActions>
      </Card>
    </>
  )
}
