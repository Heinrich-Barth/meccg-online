import { Autocomplete, Button, Checkbox, FormControl, FormControlLabel, FormGroup, Grid, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material";
import React from "react";
import Backdrop from '@mui/material/Backdrop';
import LinearProgress from '@mui/material/LinearProgress';
import FetchCards, { CardData, CardFilters, CardImageMap, FetchCardImages, FetchFilters } from "../operations/FetchCards";
import { FetchStageCards } from "../operations/FetchStageCards";

function renderIsLoading() {
    return <Backdrop
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
    >
        <LinearProgress color="inherit" />
    </Backdrop>;
}

type CardSet = {
    code: string;
    name: string;
}

const g_pCards: CardData[] = [];
const g_pImages: CardImageMap = {
    fliped: {},
    images: {}
}

const g_pSets: CardSet[] = [];
const g_sSkills: string[] = [];
const g_sKeywords: string[] = [];

let g_pFilters: CardFilters | null = null;

function cacheFilters(filters: CardFilters) {
    g_pFilters = filters;
}


const buildSetsMap = function (cards: CardData[]) {
    if (g_pSets.length > 0)
        return;

    const map: any = {};
    for (let card of cards) {
        if (card.set_code && card.set_code !== "" && card.full_set && card.full_set !== "")
            map[card.set_code] = card.full_set;
    }

    const codes = Object.keys(map)
    for (let code of codes) {
        g_pSets.push({
            code: code,
            name: map[code]
        });
    }

    g_pSets.sort((a,b) => a.name.localeCompare(b.name));
}

const assertArray = function(code:string, name:string, candidate:any)
{
    if (candidate)
    {
        if (Array.isArray(candidate))
            return candidate;

        console.warn(code + " - " + name + " is not of type array");
    }

    return [];
}

const containsDreamcards = function (list: CardData[]) {
    for (let card of list)
    {
        if (card.dreamcard === true)
            return true;
    }

    return false;
}

const cacheCards = function (list: CardData[]) {
    if (g_pCards.length > 0)
        return;

    for (let card of list)
        g_pCards.push(card);

    const mapSkill: any = {};
    const mapKeyword: any = {};
    for (let card of list) {
        for (let skill of assertArray(card.code, "skill", card.skills))
            mapSkill[skill] = 1;

        for (let keyword of assertArray(card.code, "keywords", card.keywords))
            mapKeyword[keyword] = 1;

        if (typeof card.Secondary === "string")
            card.Secondary = card.Secondary.replace("-", " ").replace("-", " ").toLowerCase();
    }

    Object.keys(mapSkill).sort().forEach((e) => g_sSkills.push(e));
    Object.keys(mapKeyword).sort().forEach((e) => g_sKeywords.push(e));
}

const cacheImages = function (images: CardImageMap) {
    for (let code in images.fliped)
        g_pImages.fliped[code] = images.fliped[code];

    for (let code in images.images)
        g_pImages.images[code] = images.images[code];
}

export function GetCardImage(code: string) {
    const img = g_pImages.images[code];
    const flipped = g_pImages.fliped[code];

    return {
        image: img.image ?? "",
        flipped: flipped ?? ""
    };
}

export function copyCode(code: string) {
    if (code !== "")
        navigator.clipboard.writeText(code);
}

const getFlippedImage = function (code: string) {
    const flippedCode = g_pImages.fliped[code];
    const img = flippedCode ? g_pImages.images[flippedCode] : null;
    return img ? img.image : "";
}

function CheckboxList(list: string[], label: string, onChange: Function) {
    return <Autocomplete
        disablePortal
        onChange={(_evt, value) => onChange(value)}
        options={list.sort()}
        renderInput={(params) => <TextField {...params} margin="dense" label={label} variant="filled" />}
    />
}


function CheckboxListSet(list: CardSet[], label: string, value:string, onChange: Function) {

    return <FormControl fullWidth variant="filled" margin="dense">
        <InputLabel id="demo-select-small-label">{label}</InputLabel>
        <Select
            labelId="demo-select-small-label"
            value={value}
            label="Set"
            onChange={(e) => onChange(e.target.value)}
        >
            <MenuItem value="">
                <em>All sets</em>
            </MenuItem>
            {list.map((item, n) => (
                <MenuItem key={n+label} value={item.code}>{item.name}</MenuItem>
            ))}
        </Select>
    </FormControl>
}

type SearchParams = {
    alignment: string;
    type: string;
    secondary: string;
    keyword: string;
    skill: string;
    set: string;
    q: string,
    stageOnly?:boolean;
    dreamcards:number;
}

export type SeachResultEntry = {
    code: string;
    boost: number;
    image: string;
    imageErrata: string;
    flip: string;
}

const DC_ONLY = 1;
const REGULAR_ONLY = 2;

const getMatch = function (card: CardData, params: SearchParams) {

    if (params.dreamcards !== 0)
    {
        if (params.dreamcards === DC_ONLY && !card.dreamcard)
            return 0;

        if (params.dreamcards === REGULAR_ONLY && card.dreamcard === true)
            return 0;
    }

    if (params.alignment !== "" && card.alignment !== params.alignment)
        return 0;

    if (params.secondary !== "" && card.Secondary !== params.secondary)
        return 0;

    if (params.set !== "" && card.set_code !== params.set)
        return 0;

    if (params.type !== "" && card.type !== params.type)
        return 0;

    if (params.stageOnly === true && !card.stage)
        return 0;

    if (params.keyword !== "" && (card.keywords === null || (Array.isArray(card.keywords) && !card.keywords.includes(params.keyword))))
        return 0;

    if (params.skill !== "" && (card.skills === null || (Array.isArray(card.skills) && !card.skills.includes(params.skill))))
        return 0;

    let boost = 1;

    if (params.q !== "") {
        if (card.code.startsWith(params.q))
            boost = 10;
        else if (card.title.startsWith(params.q))
            boost = 8;
        else if (card.code.indexOf(params.q) > 0 || card.title.indexOf(params.q) > 0)
            boost = 5
        else if (card.text && card.text.indexOf(params.q) > 0)
            boost = 4
        else
            boost = 0;
    }

    return boost;
}

const performSearchCards = function (params: SearchParams) {
    const res: SeachResultEntry[] = [];

    params.secondary = params.secondary.toLowerCase();

    for (let card of g_pCards) {
        const boost = getMatch(card, params);
        if (boost > 0) {
            res.push({
                code: card.code,
                image: g_pImages.images[card.code].image,
                imageErrata: g_pImages.images[card.code].ImageNameErrataDC ?? "",
                flip: getFlippedImage(card.code),
                boost: boost
            })
        }
    }

    if (res.length <= 2)
        return res;

    return res.sort((a, b) => {
        const res = b.boost - a.boost;
        return res !== 0 ? res : a.code.localeCompare(b.code);
    });

}

const addStageInfo = function(cards:CardData[], stageCodes:string[])
{
    for (let card of cards)
    {
        if (stageCodes.includes(card.code))
            card.stage = true;    
    }
}

const ViewCardCountIndicator = function(props:{ max:number, current:number})
{
    if (props.max === 0)
        return <></>;

    const current = props.current > props.max ? props.max : props.current;

    const progress = (current / props.max) * 100
    return <>
        <Typography component={"p"} textAlign={"center"} style={{paddingBottom: "5px"}}>{current} of {props.max}</Typography>
        <LinearProgress variant="buffer" value={progress} valueBuffer={100} />
        <br/>
    </>
}
 
const CARDS_PER_VIEW = 30;
export default function ViewCardBrowser({ renderCardEntry, subline = "" }: { renderCardEntry: Function, subline: string }) {

    const [isLoading, setIsLoading] = React.useState(true);
    const [searchValue, setSearchValue] = React.useState("");
    const [searchResult, setSearchResult] = React.useState<SeachResultEntry[]>([]);
    const [resultLimit, setResultLimit] = React.useState(0);
    const [hasDreamcards, setDreamcards] = React.useState(false);
    const [preferDC, setPreferDC] = React.useState(true);
    const [searchParams, setSearchParams] = React.useState<SearchParams>({
        alignment: "",
        keyword: "",
        q: "",
        secondary: "",
        skill: "",
        type: "",
        set: "",
        stageOnly: false,
        dreamcards: 0
    });

    const performSearch = function () {
        const params = searchParams;
        if (params.alignment === "" && params.keyword === "" && params.set === ""
            && params.q === "" && params.secondary === "" 
            && params.skill === "" && params.type === "") {
            setResultLimit(0);
            setSearchResult([]);
            return;
        }

        const res = performSearchCards(params);
        const limit = CARDS_PER_VIEW;
        setSearchResult(res);

        if (res.length + 10 < limit)
            setResultLimit(res.length);
        else
            setResultLimit(limit);
    }

    const updateSearchValue = function (q: string) {
        setSearchValue(q);

        if (q === "" || q.length > 2)
            onSearchTerm(q);
    }

    const loadData = async function () {
        try {
            const cards = await FetchCards();
            const stageCodes = await FetchStageCards();
            addStageInfo(cards, stageCodes);
            cacheCards(cards);

            const images = await FetchCardImages();
            cacheImages(images);

            const filters = await FetchFilters();
            cacheFilters(filters);

            buildSetsMap(cards);

            if (containsDreamcards(g_pCards))
                setDreamcards(true);
        }
        catch (err) {
            console.error(err);
        }
    }

    const initialized = React.useRef(false)
    React.useEffect(() => {

        if (g_pCards.length > 0) {
            setSearchParams({
                alignment: "",
                keyword: "",
                q: "",
                secondary: "",
                skill: "",
                type: "",
                set: "",
                dreamcards: 0
            });

            setIsLoading(false);
            return;
        }

        if (initialized.current)
            return;

        initialized.current = true
        loadData().finally(() => setIsLoading(false));

    }, [setIsLoading, setSearchParams, setDreamcards]);

    if (isLoading)
        return renderIsLoading();

    const onSearchTerm = function (val: string) {
        searchParams.q = val ?? "";
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectSpecific = function (val: string) {
        searchParams.secondary = val ?? "";
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectType = function (val: string) {

        console.info(val)
        if (val === "Resource (Stage only)")
        {
            searchParams.type = "Resource"
            searchParams.stageOnly = true; 
        }
        else
        {
            searchParams.stageOnly = false;
            searchParams.type = val ?? "";
        }

        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectSet = function (val: string) {
        searchParams.set = val ?? "";
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectAlignment = function (val: string) {
        searchParams.alignment = val ?? "";
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectKeywords = function (val: string) {
        searchParams.keyword = val ?? "";
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectDreamcards = function (val: string) {
        if (val === "" + DC_ONLY)
            searchParams.dreamcards = DC_ONLY;
        else if (val === "" + REGULAR_ONLY)
            searchParams.dreamcards = REGULAR_ONLY;
        else
            searchParams.dreamcards = 0;

        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectSkill = function (val: string) {
        searchParams.skill = val ?? "";
        setSearchParams(searchParams);
        performSearch();
    }
    return <React.Fragment>
        <Grid item xs={12} sm={4} lg={1} textAlign={"center"}>
            <TextField value={searchValue} variant="filled" margin="dense" autoFocus onChange={(e) => updateSearchValue(e.target.value.toLowerCase())} fullWidth label="Search text" placeholder="Seach by title" />
        </Grid>
        {g_pSets.length > 0 && (
            <Grid item xs={12} sm={3} lg={2} textAlign={"center"}>
                {CheckboxListSet(g_pSets, "Set", searchParams.set, (e: string) => onSelectSet(e))}
            </Grid>
        )}
        {g_pFilters && (<>
            {g_pFilters.alignment && (
                <Grid item xs={12} sm={3} lg={2} textAlign={"center"}>
                    {CheckboxList(g_pFilters.alignment, "Alignment", (e: string) => onSelectAlignment(e))}
                </Grid>
            )}
            {g_pFilters.type && (
                <Grid item xs={12} sm={4} lg={2} textAlign={"center"}>
                    {CheckboxList([...g_pFilters.type, "Resource (Stage only)"], "Type", (e: string) => onSelectType(e))}
                </Grid>
            )}
            {g_pFilters.secondaries && (
                <Grid item xs={12} sm={4} lg={2} textAlign={"center"}>
                    {CheckboxList(g_pFilters.secondaries, "Specific", (e: string) => onSelectSpecific(e))}
                </Grid>
            )}
        </>)}
        <Grid item xs={12} sm={3} lg={1} textAlign={"center"}>
            {CheckboxList(g_sSkills, "Skills", (e: string) => onSelectSkill(e))}
        </Grid>
        <Grid item xs={12} sm={4} lg={2} textAlign={"center"}>
            {CheckboxList(g_sKeywords, "Keywords", (e: string) => onSelectKeywords(e))}
        </Grid>

        {hasDreamcards && (<Grid item xs={12} textAlign={"center"}>
            <FormControl>
                <RadioGroup
                    name="radio-buttons-group"
                    value={searchParams.dreamcards + ""}
                    onChange={(e) => onSelectDreamcards(e.target.value)}
                >
                    <FormControlLabel value={"0"} control={<Radio />} label="Show all cards" />
                    <FormControlLabel value={"" + DC_ONLY} control={<Radio />} label="Only show DC cards" />
                    <FormControlLabel value={"" + REGULAR_ONLY} control={<Radio />} label={"Only show regular cards" } />
                </RadioGroup>
            </FormControl>
        </Grid>)}

        <Grid item xs={12}>
            <Grid container spacing={2} className="cardbrowser" justifyContent="center">
                {searchResult.length > 0 && (
                    <Grid item xs={12} textAlign={"center"}>
                        <p>{searchResult.length} card(s) matching your filter settings. {subline}</p>
                        <FormGroup style={{alignContent: "center"}}>
                            <FormControlLabel control={<Checkbox  checked={preferDC} onChange={(e) => setPreferDC(e.target.checked)} />} label="DC Errata" />
                        </FormGroup>
                    </Grid>
                )}
                {searchResult.filter((_item, idx) => idx < resultLimit).map((value, key) => renderCardEntry(value, preferDC, key))}

            </Grid>
            <Grid container justifyContent="center">
                <Grid item xs={6} sm={1} justifyContent="center" justifyItems={"center"} className="view-cards-eol">
                    <ViewCardCountIndicator max={searchResult.length} current={resultLimit} />
                    {searchResult.length > 0 && resultLimit < searchResult.length && (
                        <Button variant="contained" fullWidth onClick={() => setResultLimit(resultLimit + CARDS_PER_VIEW)}>Load more</Button>
                    )}
                </Grid>
            </Grid>
        </Grid>
    </React.Fragment>
}
