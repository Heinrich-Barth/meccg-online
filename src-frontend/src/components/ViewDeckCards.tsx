import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Grid } from '@mui/material';
import Dictionary from './Dictionary';

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

const countCards = function(codes:any)
{
    if (!codes)
        return 0;

    let res = 0;
    for (let code in codes)
        res += codes[code];

    return res;
}

const RenderSection = function({ title, codes, images } : { title: string, codes:any, images:any} )
{
    if (!codes || !images || Object.keys(codes).length === 0)
        return <></>;

    return (<>
        <Grid item xs={12}>
            <h3>{title} ({countCards(codes)})</h3>
        </Grid>
        {Object.keys(codes).sort().map((code, index) => {
                
                const img = images[code];
                if (!img)
                    return <></>;

                return <Grid item xs={12} sm={6} md={2} key={title + index} className='view-image-container'>
                    <img src={img} decoding="async" loading="lazy" alt='card' className='view-image'/>
                    <div className='view-image-count'>{codes[code]}</div>
                </Grid>
        })}
    </>);
}

export default function ViewDeckCards({ imageMap, notes, deck, pool, sideboard, sites, onClose }: { imageMap: any, notes:string, deck:any, pool:any, sideboard:any, sites:any, onClose: Function }) {

    if (countCards(imageMap) === 0)
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

                        <RenderSection images={imageMap} codes={pool} title="Pool" />
                        <RenderSection images={imageMap} codes={deck} title="Deck" />
                        <RenderSection images={imageMap} codes={sideboard} title="Sideboard" />
                        <RenderSection images={imageMap} codes={sites} title="Sites" />

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