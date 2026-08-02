import { Alert, Button, Grid } from "@mui/material";
import React from "react";

import TextField from '@mui/material/TextField';
import MeccgLogo from "../components/MeccgLogo";
import SubmitAnswer from "../operations/SubmitAnswer";
import { Navigate } from "react-router-dom";


const question = "Password";

export default function LogIn({ requireLogin, onLogin }: { requireLogin:boolean, onLogin:Function }) {

    const [username, setUsername] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [doRedirect, setDoRedirect] = React.useState(!requireLogin);

    const submitAnswer = async function()
    {
        setErrorMessage("");
        setIsSubmitting(false);

        const res = await SubmitAnswer(username);
        setIsSubmitting(false);

        if (!res)
            setErrorMessage("That was incorrect");
        else
        {
            onLogin();
            setDoRedirect(true);
        }
    }
    
    return <>
        <div className="application-home paddingTop10em">
            <Grid container spacing={2} sx={{justifyContent:"center"}}>
                <Grid size={{xs:10, md:6,lg:3}} className="center paddingBottom3em">
                    <Grid container spacing={2} sx={{justifyContent:"center"}}>
                        <Grid size={{xs:10, md:8}} className="center paddingBottom3em">
                            {MeccgLogo()}
                        </Grid>
                            <Grid size={{xs:12}} className={"center"}>
                                <TextField
                                    value={username}
                                    variant="filled"
                                    margin="dense"
                                    disabled={isSubmitting}
                                    autoFocus
                                    onChange={(e) => setUsername(e.target.value.trim())}
                                    fullWidth
                                    placeholder={"Your Answer"}
                                    label={question}
                                />
                                {errorMessage !== "" && (<Alert severity="error">{errorMessage}</Alert>)}
                            </Grid>
                            <Grid size={{xs:12}}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    disabled={username.length < 3 || isSubmitting}
                                    onClick={() => submitAnswer()}
                                >
                                    Proceed
                                </Button>
                            </Grid>
                        {doRedirect && (<Navigate to="/caching" />)}
                    </Grid>
                </Grid>

            </Grid>
        </div>
    </>
}