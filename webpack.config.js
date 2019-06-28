const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const path = require('path')

module.exports = (env = {}, argv) => {
  const isProductionMode = argv.mode === 'production'

  return {
    devtool: 'eval',
    entry: ['@babel/polyfill', './src/index.js'],
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                '@babel/plugin-proposal-class-properties',
                [
                  '@babel/plugin-transform-react-jsx', {
                    'pragma': 'deact.createElement'
                  }
                ]
              ]
            }
          }
        },
        {
          test: /\.css$/,
          exclude: /node_modules/,
          use: [
            isProductionMode ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true,
                camelCase: true,
                localIdentName: '[path][name]_[local]--[hash:base64:5]'
              }
            }
          ]
        },
        {
          test: /\.css$/,
          include: /node_modules/,
          use: [
            isProductionMode ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'index.html'
      }),
      new MiniCssExtractPlugin({
        filename: isProductionMode ? '[name].[hash].css' : '[name].css',
        chunkFilename: isProductionMode ? '[id].[hash].css' : '[id].css'
      })
    ],
    resolve: {
      modules: [path.resolve(__dirname, './src'), 'node_modules']
    },
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: 4200,
      hot: true,
      historyApiFallback: true
    }
  }
}