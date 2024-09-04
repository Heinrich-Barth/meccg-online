import * as React from "react";
import Dictionary from "../components/Dictionary";
import { useParams } from "react-router-dom";
import FetchBlog, { StoryData } from "../operations/FetchBlog";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Grid } from "@mui/material";
let isLoading = false;

function NothingThere() {
    return <>
        <h1>{Dictionary("frontend.menu.whatsnew", "What's new")}</h1>
        <p>Nothing there.</p>;
    </>
}

export default function Whatsnew() {

    const [stories, setStories] = React.useState<StoryData[]>([]);
    const [expand, setExpand] = React.useState<any>({});

    const setVisibility = function (id: string) {
        if (expand[id])
            delete expand[id];
        else
            expand[id] = true;

        setExpand({ ...expand });
    }
    React.useEffect(() => {
        if (isLoading)
            return;

        isLoading = true;
        FetchBlog().then((res) => setStories(res)).catch(console.error).finally(() => isLoading = false);

    }, [setStories]);

    const RenderAll = function () {
        return <>
            <h1>{Dictionary("frontend.menu.whatsnew", "What's new")}</h1>
            <Grid container columnSpacing={1} rowSpacing={1}>
                {stories.map((story) => <Grid key={story.id} item xs={12} lg={6}>
                    <Card className="application-news-card">
                        <CardContent>
                            <Typography gutterBottom>
                                {new Date(story.date).toLocaleDateString()} - {story.releasenote ? "Release Note" : "News"}
                            </Typography>
                            <h2>{story.title}</h2>
                            {story.summary.split("\n").map((line, idx) => <Typography variant="body1" key={story.id + "-1-" + idx}>{line}</Typography>)}
                        </CardContent>
                        {story.description !== "" && (
                            <CardActions>
                                <Button size="small" onClick={() => setVisibility(story.id)}>Toggle Details</Button>
                            </CardActions>
                        )}
                    </Card>
                </Grid>)}
            </Grid>
        </>
    }


    return <>
        <div className={"application-home application-news"}>
            {stories.length === 0 ? <NothingThere /> : <RenderAll />}
        </div>
    </>;
}