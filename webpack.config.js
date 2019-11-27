const path = require('path');

module.exports = {
    entry: './src/geometry2d.ts',
    devtool: 'source-map',
    externals: {
        mathjs: 'math',
        lodash: {
            commonjs: "lodash",
            amd: "lodash",
            root: "_" // 指向全局变量
        },
        fabric: { root: "fabric" }
    },
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
