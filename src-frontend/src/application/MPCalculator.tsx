import { Button, Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import React from "react";
import Dictionary from "../components/Dictionary";
import MeccgLogo from "../components/MeccgLogo";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { AddCircleOutline, DeleteOutline } from "@mui/icons-material";

type Categories = {
    name: string;
    sage: number;
    genin: number;
    ally: number;
    character: number;
    faction: number;
    items: number;
    hoard: number;
    ring: number;
    kill: number;
    misc: number;
    total: number;
    malus: number;
}


function createEmptySheet(name: string): Categories {
    return {
        name: name,
        sage: 0,
        genin: 0,
        ally: 0,
        character: 0,
        faction: 0,
        items: 0,
        hoard: 0,
        ring: 0,
        kill: 0,
        misc: 0,
        malus: 0,
        total: 0,
    }
}

const createEmptySheets = function()
{
    return [
        createEmptySheet("My Scores"),
        createEmptySheet("Opponent")
    ];
}

const loadFromSession = function () {
    const data = sessionStorage.getItem("mp_data") ?? "";
    if (data) {
        const json: Categories[] = JSON.parse(data);
        return json;
    }

    return createEmptySheets();
}

const stringToInt = function (input: any) {
    if (typeof input === "number")
        return input;

    if (typeof input !== "string" || input === "")
        return 0;

    const val = parseInt(input);
    if (isNaN(val))
        return 0;

    return val;
}


function DisplayEntry(props: { name: string, value: number, fnChange: Function, keyPrefix: string }) {
    const n: number[] = [];
    for (let i = 0; i < 30; i++)
        n.push(i);

    return <FormControl style={{ marginBottom: "1em" }} sx={{ m: 1, minWidth: 120 }}>
        <InputLabel variant="standard">{props.name}</InputLabel>
        <Select
            id="demo-simple-select-autowidth"
            value={props.value}
            variant="filled"
            fullWidth
            onChange={(e) => props.fnChange(e.target.value)}
            autoWidth
            label={props.name}
        >
            <MenuItem value="">
                <em>{props.name}</em>
            </MenuItem>
            {n.map((i) => <MenuItem key={props.keyPrefix + props.name + "-" + i} value={i}>{i}</MenuItem>)}
        </Select>
    </FormControl>
}

const calcSimple = function (vals: Categories) {
    return vals.ally
        + vals.character
        + vals.faction
        + vals.hoard
        + vals.items
        + vals.kill
        + vals.misc
        + vals.ring;
}

const getHeadlinePoints = function (category: Categories) {
    if (category.malus === 0)
        return "" + category.total;

    return category.total + " - " + category.malus
}

export default function MPCalculator() {

    const [categories, setCategories] = React.useState<Categories[]>(loadFromSession())
    const [arda, setArda] = React.useState(false)
    const [miscDouble, setMiscDouble] = React.useState(false)

    function updateCategory(category: Categories, prop: string, number: number) {
        if (typeof (category as any)[prop] === "number") {
            (category as any)[prop] = number;
            category.total = calcSimple(category);
            setCategories([...categories]);
            sessionStorage.setItem("mp_data", JSON.stringify(categories));
        }
    }

    const onResetSheet = function()
    {
        if (sessionStorage.getItem("mp_data"))
            sessionStorage.removeItem("mp_data")
            
        setCategories(createEmptySheets());
    }

    const onAddPlayer = function()
    {
        const len = categories.length;
        setCategories([...categories, createEmptySheet("Opponent " + len)]); 
        sessionStorage.setItem("mp_data", JSON.stringify(categories));
    }

    return <React.Fragment>

        <div className={"application-home "}>
            <Grid container spacing={2} justifyContent="center">
                <Grid item xs={10} md={8} textAlign={"center"} className="paddingBottom3em">
                    {MeccgLogo()}
                </Grid>
                <Grid item xs={12} textAlign={"center"}>
                    <h1>{Dictionary("frontend.menu.calculator2", "Track Marshalling Points")}</h1>
                </Grid>

                <Grid container item xs={12} style={{ background: "rgba(0,0,0,0.8)", borderRadius: "5px", padding: "1em" }}>
                    <Grid item xs={12} textAlign={"center"}>
                        <FormControlLabel
                            label="Arda"
                            control={
                                <Checkbox
                                    checked={arda}
                                    onChange={(event) => setArda(event.target.checked)}
                                />
                            }
                        />
                        <br/>
                        <FormControlLabel
                            label="Double Misc. Points"
                            control={
                                <Checkbox
                                    checked={miscDouble}
                                    onChange={(event) => setMiscDouble(event.target.checked)}
                                />
                            }
                        />
                    </Grid>  
                    <Grid item xs={6} textAlign={"center"}>
                        <Button variant="contained" onClick={onResetSheet} startIcon={<DeleteOutline />}>Reset sheet</Button>
                    </Grid>                  
                    <Grid item xs={6} textAlign={"center"}>
                        <Button variant="contained" onClick={onAddPlayer} startIcon={<AddCircleOutline />}>Add another player</Button>
                    </Grid>                  
                    {categories.map((category, i) =>
                        <Grid item key={"cat" + i} xs={12}  style={{ paddingTop: "1em"}}>
                            <h2>{category.name}</h2>
                            <Typography component={"p"} variant="body1">Score: {getHeadlinePoints(category)}</Typography>
                            <br />
                            <DisplayEntry name={"Ally"} value={category.ally} fnChange={(val: string) => updateCategory(category, "ally", stringToInt(val))} keyPrefix={"cata" + i} />
                            <DisplayEntry name={"Character"} value={category.character} fnChange={(val: string) => updateCategory(category, "character", stringToInt(val))} keyPrefix={"catc" + i} />
                            <DisplayEntry name={"Faction"} value={category.faction} fnChange={(val: string) => updateCategory(category, "faction", stringToInt(val))} keyPrefix={"catf" + i} />
                            {arda && (<>
                                <DisplayEntry name={"Hoard Items"} value={category.hoard} fnChange={(val: string) => updateCategory(category, "hoard", stringToInt(val))} keyPrefix={"cath" + i} />
                                <DisplayEntry name={"Ring Items"} value={category.ring} fnChange={(val: string) => updateCategory(category, "ring", stringToInt(val))} keyPrefix={"catr" + i} />
                            </>)}
                            <DisplayEntry name={"Items"} value={category.items} fnChange={(val: string) => updateCategory(category, "items", stringToInt(val))} keyPrefix={"catit" + i} />
                            <DisplayEntry name={"Kill"} value={category.kill} fnChange={(val: string) => updateCategory(category, "kill", stringToInt(val))} keyPrefix={"catik" + i} />
                            <DisplayEntry name={"Misc"} value={category.misc} fnChange={(val: string) => updateCategory(category, "misc", stringToInt(val))} keyPrefix={"catimi" + i} />
                            <br />
                            <DisplayEntry name={"Malus"} value={category.malus} fnChange={(val: string) => updateCategory(category, "malus", stringToInt(val))} keyPrefix={"catima" + i} />
                            <br />
                            <DisplayEntry name={"General Influence"} value={category.genin} fnChange={(val: string) => updateCategory(category, "genin", stringToInt(val))} keyPrefix={"catg" + i} />
                            <DisplayEntry name={"Stage Points"} value={category.sage} fnChange={(val: string) => updateCategory(category, "sage", stringToInt(val))} keyPrefix={"catst" + i} />
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </div>
    </React.Fragment>
}