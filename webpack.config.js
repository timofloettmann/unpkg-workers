const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/worker.ts',
  target: 'webworker',
  output: {
    clean: true,
    filename: 'worker.mjs',
    path: path.join(__dirname, 'dist'),
    library: {
      type: 'module',
    },
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  experiments: {
    outputModule: true,
  },
  devtool: 'cheap-module-source-map',
  mode: 'development',
  resolve: {
    modules: [path.resolve(__dirname, './src'), 'node_modules'],
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          // transpileOnly is useful to skip typescript checks occasionally:
          // transpileOnly: true,
        },
      },
    ],
  },
  stats: {
    errorDetails: true,
  },
};
