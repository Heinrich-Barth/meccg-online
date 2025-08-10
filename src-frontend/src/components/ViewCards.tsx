import React from "react";
import { Button, Checkbox, Chip, Drawer, FormControl, FormControlLabel, FormGroup, Grid, Radio, RadioGroup, SpeedDial, TextField, Typography } from "@mui/material";
import Backdrop from '@mui/material/Backdrop';
import LinearProgress from '@mui/material/LinearProgress';
import FetchCards, { CardData, CardFilters, CardImageMap, FetchCardImages, FetchFilters } from "../operations/FetchCards";
import { FetchStageCards } from "../operations/FetchStageCards";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { FetchSets, ISetInformation, ISetList } from "../operations/FetchSets";

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

const g_pSetMap: ISetList = {};
const g_pSets: ISetInformation[] = [];
const g_sSkills: string[] = [];
const g_sKeywords: string[] = [];

let g_pFilters: CardFilters | null = null;

function cacheFilters(filters: CardFilters) {
    filters.secondaries = filters.secondaries.map(x => x.toLowerCase());
    g_pFilters = filters;
}


const buildSetsMap = function (cards: CardData[], sets:ISetList) {
    if (g_pSets.length > 0)
        return;

    const map: any = {};
    for (let card of cards) {
        if (card.set_code && card.set_code !== "" && card.full_set && card.full_set !== "")
            map[card.set_code] = card.full_set;
    }

    const codes = Object.keys(sets)
    for (const code of codes)
    {
        g_pSetMap[code] = sets[code];
        g_pSets.push(sets[code]);
    }

    g_pSets.sort((a,b) => a.order - b.order);
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


function CheckboxListApplied(list: string[], label: string, values:string[], onChange: Function) {

    return <React.Fragment>
        {list.filter(item => values.includes(item)).map((item, n) => <Chip key={"app" + n+label} 
            onClick={() => onChange(item)} 
            className="filter-chip"
            variant={"filled"}
            label={item} 
            /> )}
    </React.Fragment>
}
function CheckboxList(list: string[], label: string, values:string[], onChange: Function) {
    if (list.length === 0)
        return <></>

    return <Grid container item xs={12}>
        <Grid item xs={12} sm={1}><Typography variant="caption">{label}</Typography></Grid>
        <Grid item xs={12} sm={11}>
            {list.map((value, i) => <Chip 
                variant={values.includes(value) ? "filled" : "outlined"}
                key={label+i} 
                className="filter-chip"
                label={value} 
                onClick={() => onChange(value)} 
            />)}
        </Grid>
    </Grid>
}
function CheckboxListSetApplied(list: ISetInformation[], label: string, value:string[], onChange: Function) {

    return <React.Fragment>
        {list.filter(item => value.includes(item.code)).map((item, n) => <Chip key={"app" + n+label} 
            onClick={() => onChange(item.code)} 
            variant={"filled"}
            className="filter-chip"
            label={item.name} 
            /> )}
    </React.Fragment>

}
function CheckboxListSet(list: ISetInformation[], label: string, value:string[], onChange: Function) {

    if (list.length === 0)
        return <></>

    return <Grid container item xs={12}>
        <Grid item xs={12} sm={1}><Typography variant="caption">{label}</Typography></Grid>
        <Grid item xs={12} sm={11}>
            {list.map((item, n) => ( <Chip key={n+label} 
                onClick={() => onChange(item.code)} 
                className="filter-chip"
                variant={value.includes(item.code) ? "filled" : "outlined"}
                label={item.name} 
                /> ))}
        </Grid>
    </Grid>

}

type FilterCreator = "all" | "dconly" | "iceonly";
type FilterRelased = "all" | "released";

type SearchParams = {
    alignment: string[];
    type: string[];
    secondary: string[];
    keyword: string[];
    skill: string[];
    set: string[];
    q: string,
    stageOnly?:boolean;
    dreamcards:FilterCreator;
    relasedonly:FilterRelased;
}

export type SeachResultEntry = {
    code: string;
    boost: number;
    image: string;
    imageErrata: string;
    flip: string;
}

const cardFilterAppliesAndMatches = function(acceptableList:string[], value:string)
{
    return acceptableList.length === 0 || acceptableList.includes(value);
}

const cardKeysAppliyAndMatches = function(acceptableList:string[], values:string[]|null)
{
    if (acceptableList.length === 0 || values === null )
        return true;

    for (const val of acceptableList)
    {
        if (val && values.includes(val))
            return true;
    }
    
    return false;
}

const calculateBoostBySearchTerm = function(card: CardData, q:string)
{
    if (card.code.startsWith(q))
        return 10;
    else if (card.title.startsWith(q))
        return 8;
    else if (card.code.indexOf(q) > 0 || card.title.indexOf(q) > 0)
        return 5
    else if (card.text && card.text.indexOf(q) > 0)
        return 4
    else
        return 0;
}

const getMatch = function (card: CardData, params: SearchParams) {

    const set = g_pSetMap[card.set_code];

    if (params.dreamcards !== "all" && set)
    {
        if ((params.dreamcards === "dconly" && !set.dc) || (params.dreamcards === "iceonly" && !set.ice))
            return 0;
    }

    if (params.relasedonly === "released" && set && !set.released)
        return 0;

    if (params.stageOnly === true && !card.stage)
        return 0;

    if (!cardFilterAppliesAndMatches(params.alignment, card.alignment)
        || !cardFilterAppliesAndMatches(params.secondary, card.Secondary) 
        || !cardFilterAppliesAndMatches(params.set, card.set_code)
        || !cardFilterAppliesAndMatches(params.type, card.type)
        || !cardKeysAppliyAndMatches(params.keyword, card.keywords)
        || !cardKeysAppliyAndMatches(params.skill, card.skills))
        return 0;

    if (params.q !== "")
        return calculateBoostBySearchTerm(card, params.q);

    return 1;
}

const performSearchCards = function (params: SearchParams) {
    const res: SeachResultEntry[] = [];

    params.secondary = params.secondary.map(x => x.toLowerCase());

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

const createEmptySearchParams = function():SearchParams
{
    return {
        alignment: [],
        keyword: [],
        q: "",
        secondary: [],
        skill: [],
        type: [],
        set: [],
        stageOnly: false,
        dreamcards: "all",
        relasedonly: "all"
    };
}
 
const isEmptyArray = (list:any[]) => list.length === 0;

const RenderFilterApplied = function(props:{
    searchValue:string,
    searchParams:SearchParams,
    updateSearchValue:Function,
    onSelectAlignment:Function,
    onSelectSet:Function,
    onSelectType:Function,
    onSelectSpecific:Function,
    onSelectSkill:Function,
    onSelectKeywords:Function,
})
{
    return <Grid item xs={12}>
            {CheckboxListSetApplied(g_pSets, "Set", props.searchParams.set, (e: string) => props.onSelectSet(e))}
            {g_pFilters && (<>
                {g_pFilters.alignment && (
                    CheckboxListApplied(
                        g_pFilters.alignment, 
                        "Alignment", 
                        props.searchParams.alignment, 
                        (e: string) => props.onSelectAlignment(e))
                )}
                {g_pFilters.type && (
                    CheckboxListApplied([...g_pFilters.type, "Resource (Stage only)"], "Type", props.searchParams.type, (e: string) => props.onSelectType(e))
                )}
                {g_pFilters.secondaries && (
                    CheckboxListApplied(g_pFilters.secondaries, "Specific", props.searchParams.secondary, (e: string) => props.onSelectSpecific(e))
                )}
            </>)}
            {CheckboxListApplied(g_sSkills, "Skills", props.searchParams.skill, (e: string) => props.onSelectSkill(e))}
            {CheckboxListApplied(g_sKeywords, "Keywords", props.searchParams.keyword, (e: string) => props.onSelectKeywords(e))}
        </Grid>
}
const RenderDrawer = function(props:{
    open:boolean, 
    searchValue:string,
    closeDrawer:Function,
    searchParams:SearchParams,
    updateSearchValue:Function,
    onSelectAlignment:Function,
    onSelectSet:Function,
    onSelectType:Function,
    onSelectSpecific:Function,
    onSelectSkill:Function,
    onSelectKeywords:Function,
    resultSize:number
})
{
    return <Drawer
        anchor="top"
        open={props.open}
        onClose={() => props.closeDrawer()}
      >
        <Grid container rowSpacing={1} style={{ padding: "1em"}}>
            <Grid item xs={4}>
                <Button startIcon={<ChevronLeftIcon />} onClick={() => props.closeDrawer()} variant="text">Close filter</Button>
            </Grid>
            <Grid item xs={8}>
                {props.resultSize} card(s) match your current filter settings.
            </Grid>
            <Grid item xs={12}>
                <TextField value={props.searchValue} 
                    variant="filled" 
                    margin="dense" 
                    onChange={(e) => props.updateSearchValue(e.target.value.toLowerCase())} 
                    fullWidth 
                    label="Search text" 
                    placeholder="Seach by title" />
            </Grid>
            {g_pSets.length > 0 && (
                <Grid item xs={12}>
                    {CheckboxListSet(g_pSets, "Set", props.searchParams.set, (e: string) => props.onSelectSet(e))}
                </Grid>
            )}
            {g_pFilters && (<>
                {g_pFilters.alignment && (
                    <Grid item xs={12}>
                        {CheckboxList(g_pFilters.alignment, "Alignment", props.searchParams.alignment, (e: string) => props.onSelectAlignment(e))}
                    </Grid>
                )}
                {g_pFilters.type && (
                    <Grid item xs={12}>
                        {CheckboxList([...g_pFilters.type, "Resource (Stage only)"], "Type", props.searchParams.type, (e: string) => props.onSelectType(e))}
                    </Grid>
                )}
                {g_pFilters.secondaries && (
                    <Grid item xs={12}>
                        {CheckboxList(g_pFilters.secondaries, "Specific", props.searchParams.secondary, (e: string) => props.onSelectSpecific(e))}
                    </Grid>
                )}
            </>)}
            <Grid item xs={12}>
                {CheckboxList(g_sSkills, "Skills", props.searchParams.skill, (e: string) => props.onSelectSkill(e))}
            </Grid>
            <Grid item xs={12}>
                {CheckboxList(g_sKeywords, "Keywords", props.searchParams.keyword, (e: string) => props.onSelectKeywords(e))}
            </Grid>
        </Grid>
      </Drawer>
}

const toggleListValue = function(list:string[], val:string)
{
    if (!list.includes(val))
    {
        list.push(val)
        return;
    }

    for (let i = 0; i < list.length; i++)
    {
        if (list[i] !== val)
            continue;

        list.splice(i, 1);
        break;      
    }
} 

const CARDS_PER_VIEW = 30;
export default function ViewCardBrowser({ renderCardEntry, subline = "" }: { renderCardEntry: Function, subline: string }) {

    const [isLoading, setIsLoading] = React.useState(true);
    const [searchValue, setSearchValue] = React.useState("");
    const [searchResult, setSearchResult] = React.useState<SeachResultEntry[]>([]);
    const [resultLimit, setResultLimit] = React.useState(0);
    const [hasDreamcards, setDreamcards] = React.useState(true);
    const [preferDC, setPreferDC] = React.useState(true);
    const [openFilter, setOpenFilter] = React.useState(false);

    const [searchParams, setSearchParams] = React.useState<SearchParams>(createEmptySearchParams());

    const performSearch = function () {
        const params = searchParams;
        if (isEmptyArray(params.alignment) 
            && isEmptyArray(params.keyword) 
            && isEmptyArray(params.set)
            && params.q === "" 
            && isEmptyArray(params.secondary)
            && isEmptyArray(params.skill) 
            && isEmptyArray(params.type)) 
        {
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

            const sets = await FetchSets();

            buildSetsMap(cards, sets);

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
            setSearchParams(createEmptySearchParams());
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
        toggleListValue(searchParams.secondary, val);
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectType = function (val: string) {
        toggleListValue(searchParams.type, val);
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectSet = function (val: string) {
        toggleListValue(searchParams.set, val);
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectAlignment = function (val: string) {
        toggleListValue(searchParams.alignment, val);
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectKeywords = function (val: string) {
        toggleListValue(searchParams.keyword, val);
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectDreamcards = function (val: FilterCreator) {
        searchParams.dreamcards = val;
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectReleaseCards = function (val:FilterRelased) {
        searchParams.relasedonly = val;
        setSearchParams(searchParams);
        performSearch();
    }
    const onSelectSkill = function (val: string) {
        toggleListValue(searchParams.skill, val);
        setSearchParams(searchParams);
        performSearch();
    }
    return <React.Fragment>
        <Grid container item xs={12}>
            <RenderDrawer 
                open={openFilter}
                searchValue={searchValue} 
                closeDrawer={() => setOpenFilter(false)}
                searchParams={searchParams}
                updateSearchValue={updateSearchValue} 
                onSelectAlignment={onSelectAlignment} 
                onSelectSet={onSelectSet} 
                onSelectType={onSelectType} 
                onSelectSpecific={onSelectSpecific} 
                onSelectSkill={onSelectSkill} 
                onSelectKeywords={onSelectKeywords}
                resultSize={searchResult.length}        
            />
        </Grid>
        <Grid item xs={1}>
            <Button style={{ marginTop: "15px"}} variant="outlined" onClick={() => setOpenFilter(true)} startIcon={<FilterAltIcon />}>Filter</Button>
        </Grid>
        <Grid item xs={11}>
            <TextField value={searchValue} variant="filled" margin="dense" autoFocus onChange={(e) => updateSearchValue(e.target.value.toLowerCase())} fullWidth label="Search text" placeholder="Seach by title" />
        </Grid>
        <RenderFilterApplied 
            searchValue={searchValue} 
            searchParams={searchParams}
            updateSearchValue={updateSearchValue} 
            onSelectAlignment={onSelectAlignment} 
            onSelectSet={onSelectSet} 
            onSelectType={onSelectType} 
            onSelectSpecific={onSelectSpecific} 
            onSelectSkill={onSelectSkill} 
            onSelectKeywords={onSelectKeywords}
        />
        {hasDreamcards && (<Grid item xs={6} textAlign={"center"}>
            <FormControl>
                <RadioGroup
                    name="radio-buttons-group"
                    value={searchParams.dreamcards + ""}
                    onChange={(e) => onSelectDreamcards(e.target.value as FilterCreator)}
                >
                    <FormControlLabel value={"all"} control={<Radio />} label="Show all cards" />
                    <FormControlLabel value={"dconly"} control={<Radio />} label="Only show DC cards" />
                    <FormControlLabel value={"iceonly"} control={<Radio />} label={"Only show regular cards" } />
                </RadioGroup>
            </FormControl>
        </Grid>)}
        {hasDreamcards && (<Grid item xs={6} textAlign={"center"}>
            <FormControl>
                <RadioGroup
                    name="radio-buttons-group"
                    value={searchParams.relasedonly + ""}
                    onChange={(e) => onSelectReleaseCards(e.target.value as FilterRelased)}
                >
                    <FormControlLabel value={"all"} control={<Radio />} label="Show all cards" />
                    <FormControlLabel value={"released"} control={<Radio />} label="Only relased cards" />
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
        <SpeedDial
            ariaLabel="Open filter"
            title="Open filter"
            sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 2 }}
            icon={<FilterAltIcon />}
            onClick={() => setOpenFilter(!openFilter)}
        />
    </React.Fragment>
}
