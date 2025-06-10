import dotenv from 'dotenv';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

// 在 ESM 中获取 __dirname 和 __filename 的等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 根据当前环境加载对应的环境变量文件
const NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);

// 加载环境变量
dotenv.config({ path: envPath });

// 创建通用配置
const createCommonConfig = () => ({
  entry: {
    app: './src/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
    clean: true,
  },
  resolve: {
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
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
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
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]',
        },
      },
    ],
  },
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
    // ESLint检查
    new ESLintPlugin({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fix: true,
      emitWarning: true,
      emitError: true,
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
  // 优化配置
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
  // 统计信息配置
  stats: {
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
  //缓存配置
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
});

export default createCommonConfig;
