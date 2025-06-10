import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import chalk from 'chalk';
import ip from 'ip';
import webpackConfig from '../config/webpack.dev.js';

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

async function mainService() {
  try {
    // 创建webpack编译器
    const compiler = webpack(webpackConfig);

    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || 'localhost';

    // 创建开发服务器
    const server = new WebpackDevServer(
      {
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
        proxy: [
          {
            context: ['/api'],
            target: process.env.API_URL || 'http://localhost:8080',
            changeOrigin: true,
            pathRewrite: { '^/api': '' },
          },
        ],
      },
      compiler,
    );

    // 启动服务器
    await server.start();

    console.log(chalk.cyan('Starting the development server...\n'));
    console.log(`${chalk.bold('App running at:')}`);
    console.log(`- ${chalk.cyan(`Local:            http://localhost:${PORT}`)}`);
    console.log(`- ${chalk.cyan(`On Your Network:  http://${ip.address()}:${PORT}`)}`);
    console.log('\n');
  } catch (err) {
    console.error(chalk.red('Failed to start development server!'));
    console.error(err);
    process.exit(1);
  }
}

// 执行主函数
mainService();

export default mainService;
