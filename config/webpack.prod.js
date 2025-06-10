import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';
import createCommonConfig from './webpack.common.js';

// 是否开启分析
const isAnalyze = process.env.ANALYZE === 'true';

const webpackConfig = merge(createCommonConfig(), {
  mode: 'production',
  output: {
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
  },
  //生产环境不生成source map或使用hidden-source-map
  devtool: 'hidden-source-map',
  module: {
    rules: [
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
    ],
  },
  // 配置插件
  plugins: [
    // HTML模板额外配置
    {
      apply: (compiler) => {
        compiler.options.plugins.forEach((plugin) => {
          if (plugin.constructor.name === 'HtmlWebpackPlugin') {
            plugin.userOptions.minify = {
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
            };
          }
          if (plugin.constructor.name === 'ESLintPlugin') {
            plugin.options.failOnError = true;
          }
        });
      },
    },
    // Gzip压缩
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // 只有大于10kb的资源会被处理
      minRatio: 0.8, // 只有压缩率小于0.8才会被处理
    }),
    // 打包分析
    ...(isAnalyze ? [new BundleAnalyzerPlugin()] : []),
  ],
  // 优化配置
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
  //性能提示
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000, // 入口起点的最大体积
    maxAssetSize: 512000, // 单个资源体积
  },
});

export default webpackConfig;
