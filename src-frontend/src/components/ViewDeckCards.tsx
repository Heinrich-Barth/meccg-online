import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Grid } from '@mui/material';
import Dictionary from './Dictionary';

const mapToImages = function(map:any)
{
    const list:string[] = [];
    const keys = Object.keys(map);
    for (let code of keys.sort())
    {
        const image = map[code];
        if (typeof image === "string" && image !== "")
            list.push(image);
    }

    return list;
}

const renderNotes = function(text:string)
{
    if (text.trim() === "")
        return <></>;

    const res:any = [];
    for (let line of text.split("\n"))
    {
        if (line.startsWith("= "))
            res.push(<h2>{line.substring(2)}</h2>)
        else
            res.push(<p>{line}</p>)
    }

    return (<Grid item xs={12}>{res}</Grid>);
}

export default function ViewDeckCards({ imageMap, notes, onClose }: { imageMap: any, notes:string, onClose: Function }) {
    const list = mapToImages(imageMap);

    if (list.length === 0)
    {
        onClose();
        return <></>;
    }

    return (
        <React.Fragment>
            <Dialog
                fullWidth={true}
                maxWidth={"xl"}
                open={true}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogContent>
                    <Grid container>
                        {renderNotes(notes)}
                        {list.map((image, index) => <Grid item xs={12} sm={6} md={2} key={"i" + index}>
                            <img src={image} decoding="async" alt='card' className='view-image'/>
                        </Grid>)}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose()} variant='contained'>
                        {Dictionary("cancel", "Close")}
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}