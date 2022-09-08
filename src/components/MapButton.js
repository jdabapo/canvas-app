import { Button } from '@mantine/core'
import React from 'react'
export default function MapButton(row_idx,col_idx,cell,clickHandler,size='sm') {
    let coords = '' + row_idx + col_idx;
    let color;
    if(cell.displayName){
        color = cell.displayName ? "red" : "blue";
        if (color === "red"){
            // TODO: Make color redder 
        }
    }
    else if (cell === "selected"){
        color = 'green';
    }
    return (<Button
        size={size}
        color={color} 
        key={coords}
        value={coords}
        onClick={clickHandler}
        variant="filled">
    </Button>)
}
// 