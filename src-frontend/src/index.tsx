import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './scss/application.scss';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { grey, blueGrey } from '@mui/material/colors';
import { SetDefaultUsername } from './components/Preferences';
import { CheckIfLoggedin } from './operations/SubmitAnswer';

const darkTheme = createTheme({
    typography: {
        "fontFamily": "\"OpenSans\"",

        allVariants: {
            "fontWeight": 300,
        },
    },
    palette: {
        mode: 'dark',
        ...{
            // palette values for dark mode
            primary: blueGrey,
            text: {
                primary: '#fff',
                secondary: grey[500],
            },
        }
    },
});

const divt = document.createElement("div");
divt.classList.add("background-gradient");
document.body.prepend(divt)

document.getElementById('root')?.classList.add("application-root")

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

let g_isLoggedIn = false;

SetDefaultUsername();

CheckIfLoggedin()
.then(res => g_isLoggedIn = !res)
.catch(console.error)
.finally(() => {
    root.render(
        <React.StrictMode>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <App requireLogin={g_isLoggedIn} />
            </ThemeProvider>
        </React.StrictMode>
    );
    
})

