const HtmlWebpackPlugin = require('html-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin'); // 显示打包进度条
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin'); //用于实现 React 组件的热更新（仅开发环境使用）
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer'); // 用于分析打包体积
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const path = require('path');

const NODE_ENV = process.env.NODE_ENV || 'development';
// 判断当前是否为开发环境
const isDev = process.env.NODE_ENV !== 'production';

const webpackConfig = {
  mode: 'development',
  entry: {
    app: './src/index.tsx',
  },
  devtool: 'eval-source-map', // 开发环境使用
  ignoreWarnings: [/export.*was not found in/], // 替换 warningsFilter
  devServer: {
    static: path.join(__dirname, 'dist'),
    port: 'auto', // 自动查找可用端口
    compress: true,
    hot: true,
    open: true,
    client: {
      logging: 'error',
      overlay: {
        errors: true,
        warnings: true,
      },
      progress: true,
    },
    liveReload: true,
    historyApiFallback: true,
    watchFiles: ['/src/**'],
    onListening(devServer) {
      const port = devServer.server.address().port;
      console.log(`\n🚀 开发服务器已启动，监听端口 ${port}`);
      console.log(`📱 本地访问: http://localhost:${port}`);
      console.log(`🌍 局域网访问: http: //${require('ip').address()}:${port}\n`);
    },
    setupExitSignals: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    publicPath: '/', // 公共路径，通常用于 SPA
    clean: true, // 每次打包前清空输出目录
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  //插件配置（不打包到dist目录，使用cdn的库）
  externals: {},
  // 控制台输出内容
  stats: {
    warnings: true,
    errors: true,
    errorDetails: true,
    warningsFilter: /export.*was not found in/,
    chunks: false,
    modules: false,
    children: true,
    assets: true,
    assetsSort: 'size',
    performance: true,
  },

  // 构建缓存配置，加快二次构建速度
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
      tsconfig: [path.resolve(__dirname, 'tsconfig.json')],
    },
    cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
    name: `${process.env.NODE_ENV}-${process.env.BABEL_ENV || 'default'}`,
    compression: 'gzip',
    hashAlgorithm: 'md4',
    store: 'pack',
    idleTimeout: 10000,
    idleTimeoutForInitialStore: 5000,
    maxAge: 1000 * 60 * 60 * 24,
    allowCollectingMemory: true,
    profile: true,
    version: '1.0.0', // 添加版本号，强制更新缓存
  },
  performance: {
    hints: isDev ? false : 'warning',
    maxEntrypointSize: 250000,
    maxAssetSize: 250000,
    assetFilter(assetFilename) {
      return !assetFilename.endsWith('.map');
    },
  },
  //优化相关配置
  optimization: {
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    runtimeChunk: {
      name: 'runtime',
    },
    minimize: !isDev,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: !isDev, // 生产环境移除 console 输出
            drop_debugger: !isDev, // 生产环境移除 debugger 语句
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // 标记纯函数，允许移除
            passes: 4, // 增加压缩次数，提高压缩效果
            reduce_vars: true, // 优化变量使用
            reduce_funcs: true, // 优化函数调用
            dead_code: true, // 移除死代码
            unused: true, // 移除未使用的变量和函数
            toplevel: true, // 混淆顶层变量名
            booleans_as_integers: true, // 使用整数代替布尔值
            if_return: true, // 优化 if 语句中的 return
            join_vars: true, // 合并变量声明
            collapse_vars: true, // 折叠变量
            sequences: true, // 合并连续的语句
            properties: true, // 优化属性访问
            drop_debugger: true, // 移除 debugger 语句
            unsafe: true, // 启用不安全优化（谨慎使用）
          },
          mangle: {
            toplevel: true, // 混淆顶层变量名
            properties: {
              regex: /^_/, // 混淆以 _ 开头的属性名
            },
          },
          format: {
            comments: false, // 移除注释
          },
        },
        parallel: true, // 并行处理，提高压缩速度
        extractComments: false, // 不提取注释到单独文件
      }),
      ,
      new CssMinimizerPlugin({
        parallel: true, // 并行处理，提高压缩速度
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true }, // 移除所有注释
              normalizeWhitespace: true, // 规范化空白字符
              minifyFontValues: true, // 压缩字体值
              minifyGradients: true, // 压缩渐变
              minifySelectors: true, // 压缩选择器
              mergeRules: true, // 合并规则
              mergeLonghand: true, // 合并简写属性
              discardEmpty: true, // 移除空规则
              discardDuplicates: true, // 移除重复规则
              discardOverridden: true, // 移除被覆盖的规则
            },
          ],
        },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 10000, // 降低最小尺寸
      minChunks: 1,
      maxAsyncRequests: 20, // 降低最大异步请求数
      maxInitialRequests: 20, // 降低最大初始请求数
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'react',
          chunks: 'all', // 改为 all
          priority: 40,
          reuseExistingChunk: true,
          enforce: true, // 强制拆分
        },
        antd: {
          test: /[\\/]node_modules[\\/](@ant-design|antd)[\\/]/,
          name: 'antd',
          chunks: 'all', // 改为 all
          priority: 30,
          reuseExistingChunk: true,
          enforce: true, // 强制拆分
        },
        lodash: {
          test: /[\\/]node_modules[\\/](lodash|lodash-es)[\\/]/,
          name: 'lodash',
          chunks: 'all', // 改为 all
          priority: 20,
          reuseExistingChunk: true,
          enforce: true, // 强制拆分
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            if (
              ['react', 'react-dom', 'antd', '@ant-design', 'lodash', 'lodash-es'].includes(
                packageName,
              )
            ) {
              return false;
            }
            if (packageName.startsWith('@ant-design/')) {
              return 'antd-group';
            }
            if (packageName.startsWith('@remix-run/')) {
              return 'remix-group';
            }
            return `vendor.${packageName.replace('@', '')}`;
          },
          chunks: 'all', // 改为 all
          priority: 10,
          reuseExistingChunk: true,
          maxSize: 150000, // 降低最大尺寸
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          maxSize: 150000, // 降低最大尺寸
        },
      },
    },
  },
  plugins: [
    new Dotenv({
      path: `.env.${NODE_ENV}`,
      safe: true, // 如果找不到 .env 文件，不会报错
      systemvars: true, // 允许覆盖系统环境变量
      defaults: true, // 使用默认值
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      minify: {},
      cdnConfig: { js: [], css: [] },
    }),
    !isDev &&
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        generateStatsFile: true,
        statsFilename: 'stats.json',
        reportFilename: '../bundle-report.html',
      }),
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new ProgressBarPlugin(),
    new FriendlyErrorsWebpackPlugin(),
    isDev && new ReactRefreshWebpackPlugin(), // 仅开发环境启用 React 热更新
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
    }),
  ].filter(Boolean), // 过滤掉无效插件
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/, // 处理 JS/TS/JSX/TSX 文件
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: isDev ? ['react-refresh/babel'] : [],
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.less$/, // 处理 less 文件
        use: [
          'style-loader',
          { loader: 'css-loader', options: { modules: true } }, // 关闭 CSS modules
          'postcss-loader', // 自动加前缀等
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true, // 允许 less 里用 JS
                modifyVars: { '@primary-color': '#1DA57A' }, // antd 主题色举例
              },
            },
          },
        ],
      },
      {
        test: /\.(css)$/, // 处理 css 文件
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|woff2?|eot|ttf)$/, // 处理图片和字体
        type: 'asset', // 自动选择资源类型
        parser: { dataUrlCondition: { maxSize: 10 * 1024 } }, // 小于 10KB 转 base64
        generator: { filename: 'static/[name].[contenthash:8][ext]' }, // 输出路径和文件名
      },
      {
        test: /\.svg$/, // 处理 svg 文件（React 组件方式）
        use: ['@svgr/webpack'],
        issuer: /\.[jt]sx?$/, // 仅在 js/ts 文件中引入时生效
      },
    ],
  },
};

module.exports = webpackConfig;
