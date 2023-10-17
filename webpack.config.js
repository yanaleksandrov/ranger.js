const fs   = require('fs');
const path = require('path');

const CopyPlugin             = require('copy-webpack-plugin');
const TerserPlugin           = require('terser-webpack-plugin');
const HtmlWebpackPlugin      = require('html-webpack-plugin');
const CssMinimizerPlugin     = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin   = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const generateHtmlPlugin = dir => {
  const files = fs.readdirSync(path.resolve(__dirname, dir));

  return files.reduce(item => {
    const [name, extension] = item.split('.');
    if (extension) {
      return new HtmlWebpackPlugin({
        filename: `${name}.html`,
        template: path.resolve(__dirname, `${dir}/${name}.${extension}`),
        inject: false,
      });
    }
  });
}

module.exports = {
  entry: [
    './src/index.js',
    './src/styles.scss'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/bundle.min.js',
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    port: 3000,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  performance : {
    hints : false
  },
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
      new TerserPlugin({
        extractComments: true,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        include: path.resolve(__dirname, 'src/styles'),
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
              url: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('autoprefixer'),
                ],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sourceMap: false,
            },
          },
        ],
      },
      {
        test: /\.html$/,
        include: path.resolve(__dirname, 'src/view/parts'),
        use: ['raw-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/style.min.css',
    }),
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ['*.LICENSE.txt'],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/fonts',
          to: 'fonts',
          noErrorOnMissing: true,
        },
        {
          from: 'src/images',
          to: 'images',
          noErrorOnMissing: true,
        },
      ],
    }),
  ].concat(
    generateHtmlPlugin('src/view')
  ),
}
