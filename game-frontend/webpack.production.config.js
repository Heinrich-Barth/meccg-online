const path = require('path');

module.exports = {
   entry: './src-game/index.ts',
   mode: 'production',
   watch: false,
   output: {
      filename: 'game-client.js',
      path: path.resolve(__dirname, 'game-dist'),
   },
   resolve: {
      extensions: ['.ts'],
   },
   module: {
      rules: [
         {
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/,
         },
      ],
   },
};