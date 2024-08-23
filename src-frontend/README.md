# React Frontend 

This project creates the UI Frontend for the platform. It does not include the game UI, because that is not a react app and kept separate.

## Preparations

To get startet, type

```
npm install
```

## Development

To develop, you need to execute the following commands concurrently - one will start the dev mode of this frontend and the other starts the actual webserver that delivers all necessary data.

### Start the data server

```
cd ..
npm run dev
```

### Start the dev mode

```
cd ..
npm start
```

You will now be able to access the preview/dev app on `localhost:3000`

## Deployment

To deploy your frontend to the web server, you can use the build script at `./build-deploy.sh`.

