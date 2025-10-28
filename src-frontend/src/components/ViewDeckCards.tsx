import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Grid } from '@mui/material';
import Dictionary from './Dictionary';
import FetchCards, { CardData, CardImageMap, FetchCardImages } from "../operations/FetchCards";
import { DeckCardsEntry } from '../application/Types';
import RenderCardPreview, { GetImagePreviewDataByImageUri, ImagePreviewInfo } from './CardZoom';

type CardDataMap = {
    [code:string]: CardData;
}

const g_pCardMap:CardDataMap = { };
const g_pImageMap:{[code:string]:{
            image: string;
            ImageNameErrataDC?: string;
        }
    } = { }
        
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

const RenderDeckListSectionPart = function(props: { list:DeckCardEntry[], title:string, basekey:string })
{
    if (props.list.length === 0)
        return <></>;
    
    return <>
        {props.title && (<h3>{props.title}</h3>)}
        <ul>
            {props.list.map((e,i) => <li key={props.basekey + i}>{e.count} {e.code}</li>)}
        </ul>
    </>
}

const RenderDeckListSection = function(props: { list:DeckCardEntry[], title:string, group?:boolean})
{
    if (props.list.length === 0)
        return <></>;

    const other:DeckCardEntry[] = !props.group ? props.list : [];
    const chars:DeckCardEntry[] = !props.group ? [] : props.list.filter(a => a.type === "Character");
    const res:DeckCardEntry[] = !props.group ? [] : props.list.filter(a => a.type === "Resource");
    const haz:DeckCardEntry[] = !props.group ? [] : props.list.filter(a => a.type === "Hazard");

    return <Grid item xs={12} sm={6} md={4} lg={3}>
        <h2>{props.title}</h2>
        <RenderDeckListSectionPart basekey={props.title+"c"} title="Characters" list={chars} />
        <RenderDeckListSectionPart basekey={props.title+"r"} title="Resources" list={res} />
        <RenderDeckListSectionPart basekey={props.title+"h"} title="Hazards" list={haz} />
        <RenderDeckListSectionPart basekey={props.title+"o"} title="" list={other} />
    </Grid>
}

const RenderDeckList = function(props: { pool:DeckCardEntry[], deck:DeckCardEntry[], sideboard:DeckCardEntry[], sites:DeckCardEntry[]})
{
    return <React.Fragment>
        <RenderDeckListSection title="Pool" list={props.pool} group={true} />
        <RenderDeckListSection title="Deck" list={props.deck} group={true} />
        <RenderDeckListSection title="Sideboard" list={props.sideboard} group={true} />
        <RenderDeckListSection title="Sites" list={props.sites} group={false} />
    </React.Fragment>

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

const getSortVal = function(type:string, title:string)
{
    if (type === "Resource")
        return "dres" + title;
    return type + title;;
}

const RenderSection = function({ title, codes, images, renderPreview } : { title: string, codes:DeckCardEntry[], images:any, renderPreview:Function } )
{
    if (!codes || !images || Object.keys(codes).length === 0)
        return <React.Fragment />;

    return (<>
        <Grid item xs={12}>
            <h3>{title} ({codes.length})</h3>
        </Grid>
        {codes.map((code, index) => {
            const img = code.image;
            return <Grid item xs={12} sm={6} md={2} key={title + index} className='view-image-container'>
                <img 
                    src={img} 
                    decoding="async" 
                    loading="lazy" 
                    alt={code.code} 
                    onMouseEnter={(e) => renderPreview(GetImagePreviewDataByImageUri(img, e.pageX))}
                    onMouseLeave={() => renderPreview(null) }
                    className='view-image'
                />
                <div className='view-image-count'>{code.count}</div>
            </Grid>
        })}
    </>);
}
const SortSection = function(codes:DeckCardsEntry, cards:CardDataMap):DeckCardEntry[]
{
    if (!codes || Object.keys(codes).length === 0)
        return [];

    function sortCardEntries(a: string, b: string): number {

        const cardA = cards[a];
        const cardB = cards[b];
        if (!cardA || !cardB)
            return a.localeCompare(b);

        return getSortVal(cardA.type, cardA.title).localeCompare(getSortVal(cardB.type, cardB.title));
    }

    return Object.keys(codes).sort((a,b) => sortCardEntries(a,b)).map((card) => {
        const data = cards[card];
        const image = g_pImageMap[card];
        let imageSrc = image?.image ?? "";
        if (image && image.ImageNameErrataDC)
            imageSrc = image.ImageNameErrataDC;
            
        return {
            code: card,
            count: codes[card],
            type: data.type,
            image: imageSrc
        } as DeckCardEntry;
    });
}

type DeckCardEntry = {
    code: string;
    count: number;
    type: "Resource" | "Site" | "Character" | "Hazard";
    image: string;
}

export default function ViewDeckCards({ imageMap, notes, deck, pool, sideboard, sites, onClose }: { imageMap: any, notes:string, deck:DeckCardsEntry, pool:DeckCardsEntry, sideboard:DeckCardsEntry, sites:DeckCardsEntry, onClose: Function }) {

    const [, setCardData] = React.useState<CardDataMap>({ });
    const [sectionPool, setSectionPool] = React.useState<DeckCardEntry[]>([]);
    const [secionDeck, setSecionDeck] = React.useState<DeckCardEntry[]>([]);
    const [secionSB, setSecionSB] = React.useState<DeckCardEntry[]>([]);
    const [secionSites, setSecionSites] = React.useState<DeckCardEntry[]>([]);
    const [previewCard, setPreviewCard] = React.useState<ImagePreviewInfo|null>(null);

    React.useEffect(() => {

        if (Object.keys(g_pCardMap).length > 0)
        {
            setCardData(g_pCardMap);
            setSectionPool(SortSection(pool, g_pCardMap));
            setSecionDeck(SortSection(deck, g_pCardMap));
            setSecionSB(SortSection(sideboard, g_pCardMap));
            setSecionSites(SortSection(sites, g_pCardMap));
            return;
        }

        FetchCardImages().then((res:CardImageMap) => {
            for (const code in res.images)
                g_pImageMap[code] = res.images[code];

            return FetchCards();
        }).then(data => {
            data.forEach(card => g_pCardMap[card.code] = card);
            setCardData(g_pCardMap);

            setSectionPool(SortSection(pool, g_pCardMap));
            setSecionDeck(SortSection(deck, g_pCardMap));
            setSecionSB(SortSection(sideboard, g_pCardMap));
            setSecionSites(SortSection(sites, g_pCardMap));
        });
        
    }, [pool, deck, sideboard, sites, setCardData, setSectionPool, setSecionDeck, setSecionSB, setSecionSites])

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
                    <RenderCardPreview image={previewCard?.image??""} left={previewCard?.left===true} />
                    <Grid container>
                        <RenderDeckList 
                            deck={secionDeck}
                            pool={sectionPool}
                            sideboard={secionSB}
                            sites={secionSites}
                        />
                        {renderNotes(notes)}

                        <RenderSection images={imageMap} codes={sectionPool} title="Pool" renderPreview={setPreviewCard} />
                        <RenderSection images={imageMap} codes={secionDeck} title="Deck" renderPreview={setPreviewCard} />
                        <RenderSection images={imageMap} codes={secionSB} title="Sideboard" renderPreview={setPreviewCard} />
                        <RenderSection images={imageMap} codes={secionSites} title="Sites" renderPreview={setPreviewCard} />
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

