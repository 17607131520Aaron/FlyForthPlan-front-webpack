import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import ip from 'ip';
import chalk from 'chalk';
import { merge } from 'webpack-merge';
import createCommonConfig from './webpack.common.js';

// 开发服务器配置
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const webpackConfig = merge(createCommonConfig(), {
  mode: 'development',
  output: {
    filename: '[name].js',
  },
  // 开发环境推荐使用 eval-source-map 提高构建速度和调试体验
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // 在 Webpack 配置中，某些路径解析仍需使用 require.resolve
            plugins: ['react-refresh/babel'],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb的图片内联为base64
          },
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]',
        },
      },
    ],
  },
  devServer: {
    host: HOST,
    port: PORT,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
    // 配置代理，解决跨域问题
    proxy: [
      {
        context: ['/api'],
        target: process.env.API_URL || 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    ],
  },
  plugins: [
    // 热更新插件
    new ReactRefreshWebpackPlugin(),
    // 友好的错误提示
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: [
          `应用运行在: ${chalk.cyan(`http://${HOST}:${PORT}`)}`,
          `本地访问: ${chalk.cyan(`http://localhost:${PORT}`)}`,
          `网络访问: ${chalk.cyan(`http://${ip.address()}:${PORT}`)}`,
        ],
      },
    }),
  ],
  //性能提示
  performance: {
    hints: false,
  },
});

export default webpackConfig;
