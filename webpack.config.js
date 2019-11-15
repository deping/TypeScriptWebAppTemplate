const path = require('path');

module.exports = {
    entry: './src/geometry2d.ts',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'geometry2d.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/dist/",
    }
};
