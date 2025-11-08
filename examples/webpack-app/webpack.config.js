const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleWatchPlugin } = require('@milencode/bundlewatch-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new BundleWatchPlugin({
      enabled: true,
      printReport: true,
      saveToGit: false,
      extractModules: true,
      buildDependencyGraph: true,
      generateRecommendations: true,
      generateDashboard: true,
    }),
  ],
};

