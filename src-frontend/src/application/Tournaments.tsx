import { Grid } from "@mui/material";
import MeccgLogo from "../components/MeccgLogo";
import Dictionary from "../components/Dictionary";
import React from "react";
import FetchTournaments, { FetchTournament, Tournament } from "../operations/FetchTournaments";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Link, Navigate, useParams } from "react-router-dom";

type TournamentEntry = {
    "id": string;
    "title": string;
    "introduction": string;
    "table": string;
    "description": any[]
}
export default function Tournaments() {
    const [list, setList] = React.useState<Tournament[]>([]);

    React.useEffect(() => {

        FetchTournaments()
            .then((e: Tournament[]) => setList(e));

    }, [setList]);

    return (<div className={"application-home"}>
        <Grid container spacing={2} justifyContent="center">
            <Grid item xs={10} md={8} textAlign={"center"} className="paddingBottom3em">
                {MeccgLogo()}
                <p>&nbsp;</p>
                <h1>{Dictionary("home.currenttournaments", "Current Tournaments")}</h1>
            </Grid>
            {list.map((e: Tournament, index: any) => <Grid item xs={12} key={"t" + index}>
                <Link to={"/tournaments/" + e.id}><h2 className="text-center"><RemoveRedEyeIcon /> {e.title}</h2></Link>
            </Grid>)}
            {list.length === 1 && (<Navigate to={"/tournaments/" + list[0].id} />)}
        </Grid>

    </div>);
}

const isBold = function(e:any)
{
    if (e.marks === undefined || e.marks.length === 0)
        return false;

    for (let entry of e.marks)
    {
        if (entry.type === "bold")
            return true;
    }

    return false;
}

const renderParagraph = function(e:any, index:any) 
{
    let res:any = [];
    if (e.type === "paragraph")
    {
        for (let p of e.content)
        {
            if (p.type === "text" && p.text)
                res.push(<p>{p.text}</p>);
        }
    }
    else if (e.type === "heading")
    {
        let list:string[] = [];
        for (let p of e.content)
        {
            if (p.type === "text" && p.text)
                list.push(p.text);
        }
        if (list.length > 0)
        {
            if (e.attrs?.level === 2)
                res.push(<h2>{list}</h2>);
            else if (e.attrs?.level > 2)
                res.push(<h3>{list}</h3>)
        }
    }
    else if (e.type === "bullet_list")
    {
        let list:any = [];
        for (let item of e.content)
        {
            if (item.type !== "list_item")
                continue;

            let line:any = []
            for (let txt of item.content)
            {
                if (txt.type !== "paragraph")
                    continue;

                for (let textentry of txt.content)
                {
                    if (isBold(textentry))
                        line.push(<b>{textentry.text}</b>)
                    else 
                        line.push(<>{textentry.text}</>)    
                }

                
            }

            list.push(<li>{line}</li>)
        }

        res.push(<ul>{list}</ul>);
    } 

    return <>{res}</>;
}

const textToParagraphs = function(text:string)
{
    if (text === undefined || text.trim() === "")
        return <></>

    const res:any = []
    for (let line of text.trim().split("\n"))
    {
        line = line.trim();
        if (line !== "")
            res.push(<p>{line}</p>);
    }

    return res;
}
function printTableHead(row: string): React.ReactNode {
   
    return (
        <tr>
            {row.split("\t").map((cell:string, index:number) => <th key={"th" + index}>{cell}</th>)}
            <th>&sum;</th>
        </tr>
    );
}

const calcPointsPerRow = function(rows:any)
{
    let sum = 0;

    const pts = [0, 6, 5, 4, 3, 2, 1, 0]

    for (let i = 1; i < rows.length; i++)
        sum += pts[i] * parseInt(rows[i]);

    return sum;
}

function printTable(table: string): React.ReactNode {
    if (typeof table !== "string" || table === "")
        return <></>;

    const aTable = table.replace(/\t{1,}/g, '\t').trim().split("\n");
    if (aTable.length < 2)
        return <></>;

    const head = aTable.shift();
    

    return (
        <table className="resultlist">
            <thead>{printTableHead(head ?? "")}</thead>
            <tbody>
                {aTable.map((row, index) => <tr key={"tr" + index}>
                    {row.split("\t").map((cell, cindex) => <td key={"tr" + index + "td" + cindex}>{cell}</td>)}
                    <td>{calcPointsPerRow(row.split("\t"))}</td>
                </tr>)}
            </tbody>
        </table>
    )
}

export function TournamentDetail() {
    const { id } = useParams();

    const [entry, setEntry] = React.useState<TournamentEntry | null>(null);

    React.useEffect(() => {

        if (id) {
            FetchTournament(id).then((e: TournamentEntry | null) => { if (e !== null) setEntry(e) });
        }

    }, [id, setEntry]);

    if (entry === null)
        return <></>;


    return (<div className={"application-home"}>
        <Grid container spacing={2} justifyContent="center">
            <Grid item xs={10} md={8} textAlign={"center"} className="paddingBottom3em">
                {MeccgLogo()}
                <p>&nbsp;</p>
                <Link to={"/tournaments"}><h1 className="text-center"><ArrowBackIosNewIcon /> {entry.title}</h1></Link>
                {textToParagraphs(entry.introduction)}
            </Grid>
            <Grid item xs={12}>
                {printTable(entry.table)}
            </Grid>
            <Grid item xs={12}>
                {entry.description.map((e, index) => renderParagraph(e, index))}
            </Grid>
        </Grid>

    </div>);
}
