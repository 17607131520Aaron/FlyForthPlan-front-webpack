const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const chalk = require('chalk');

// 根据当前环境加载对应的环境变量文件
const NODE_ENV = process.env.NODE_ENV || 'production';
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);

// 加载环境变量
dotenv.config({ path: envPath });

// 是否开启分析
const isAnalyze = process.env.ANALYZE === 'true';

const webpackConfig = {
  mode: 'production',
  entry: {
    app: './src/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
    publicPath: '/',
    // 阿里规范：清理构建目录
    clean: true,
  },
  // 阿里规范：生产环境不生成source map或使用hidden-source-map
  devtool: 'hidden-source-map',
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
            maxSize: 4 * 1024, // 小于4kb的图片内联为base64
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
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    // ESLint检查
    new ESLintPlugin({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fix: true,
      emitWarning: true,
      emitError: true,
      failOnError: true,
    }),
    // Gzip压缩
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // 只有大于10kb的资源会被处理
      minRatio: 0.8, // 只有压缩率小于0.8才会被处理
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
    // 打包分析
    ...(isAnalyze ? [new BundleAnalyzerPlugin()] : []),
  ],
  // 阿里规范：优化配置
  optimization: {
    minimize: true,
    minimizer: [
      // 压缩JS
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除console
            drop_debugger: true, // 移除debugger
          },
          format: {
            comments: false, // 移除注释
          },
        },
        extractComments: false,
        parallel: true, // 使用多进程并行运行
      }),
      // 压缩CSS
      new CssMinimizerPlugin({
        parallel: true, // 使用多进程并行运行
      }),
    ],
    // 代码分割
    splitChunks: {
      chunks: 'all',
      minSize: 20000, // 生成 chunk 的最小体积（以 bytes 为单位）
      minChunks: 1, // 拆分前必须共享模块的最小 chunks 数
      maxAsyncRequests: 30, // 按需加载时的最大并行请求数
      maxInitialRequests: 30, // 入口点的最大并行请求数
      enforceSizeThreshold: 50000, // 强制执行拆分的体积阈值
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: 'vendors',
        },
        antd: {
          test: /[\\/]node_modules[\\/]antd[\\/]/,
          name: 'antd',
          priority: 20,
          reuseExistingChunk: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
          name: 'react',
          priority: 15,
          reuseExistingChunk: true,
        },
        commons: {
          name: 'commons',
          minChunks: 2, // 至少被两个chunk引用
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    // 运行时chunk
    runtimeChunk: {
      name: (entrypoint) => `runtime-${entrypoint.name}`,
    },
  },
  // 阿里规范：性能提示
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000, // 入口起点的最大体积
    maxAssetSize: 512000, // 单个资源体积
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