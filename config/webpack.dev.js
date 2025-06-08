const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin'); // 用于实现 React 组件的热更新（仅开发环境使用）
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const chalk = require('chalk');
const ip = require('ip');

// 根据当前环境加载对应的环境变量文件
const NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);

// 加载环境变量
dotenv.config({ path: envPath });

// 开发服务器配置
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const webpackConfig = {
  mode: 'development',
  entry: {
    app: './src/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    publicPath: '/',
    // 阿里规范：清理构建目录
    clean: true,
  },
  // 阿里规范：开发环境推荐使用 eval-source-map 提高构建速度和调试体验
  devtool: 'eval-source-map',
  resolve: {
    // 阿里规范：合理配置别名
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@pages': path.resolve(__dirname, '../src/pages'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@store': path.resolve(__dirname, '../src/store'),
      '@assets': path.resolve(__dirname, '../src/assets'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    modules: [path.resolve(__dirname, '../src'), 'node_modules'],
  },
  // 阿里规范：配置模块解析
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: [require.resolve('react-refresh/babel')],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]',
                auto: (resourcePath) => resourcePath.endsWith('.module.less'),
              },
              importLoaders: 2,
            },
          },
          'postcss-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
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
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]',
        },
      },
    ],
  },
  // 阿里规范：配置开发服务器
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
    // 阿里规范：配置代理，解决跨域问题
    proxy: [
      {
        context: ['/api'],
        target: process.env.API_URL || 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      }
    ],
  },
  // 阿里规范：配置插件
  plugins: [
    // 环境变量注入
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
    // HTML模板
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
      filename: 'index.html',
      inject: true,
      favicon: path.resolve(__dirname, '../public/favicon.ico'),
    }),
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
    // ESLint检查
    new ESLintPlugin({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fix: true,
      emitWarning: true,
      emitError: true,
      failOnError: false,
    }),
    // 进度条
    new ProgressBarPlugin({
      format: `  :msg [:bar] ${chalk.green.bold(':percent')} (:elapsed s)`,
      clear: false,
    }),
    // 忽略moment.js的本地化内容
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
  ],
  // 阿里规范：优化配置
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'initial',
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 5,
          chunks: 'initial',
          reuseExistingChunk: true,
        },
      },
    },
  },
  // 阿里规范：性能提示
  performance: {
    hints: false,
  },
  // 阿里规范：统计信息配置
  stats: {
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
  // 阿里规范：缓存配置
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};

module.exports = webpackConfig;
