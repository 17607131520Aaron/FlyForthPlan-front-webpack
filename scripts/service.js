const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const chalk = require('chalk');
const path = require('path');
const ip = require('ip');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 加载开发环境配置
const webpackConfig = require('../config/webpack.dev.js');

function mainService() {
  // 创建webpack编译器
  const compiler = webpack(webpackConfig);

  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || 'localhost';

  // 开发服务器配置
  const devServerOptions = {
    ...webpackConfig.devServer,
    host: HOST,
    port: PORT,
    open: true,
  };

  // 创建开发服务器
  const server = new WebpackDevServer(devServerOptions, compiler);

  // 启动服务器
  server
    .start()
    .then(() => {
      console.log(chalk.cyan('Starting the development server...\n'));
      console.log(`${chalk.bold('App running at:')}`);
      console.log(`- ${chalk.cyan(`Local:            http://localhost:${PORT}`)}`);
      console.log(`- ${chalk.cyan(`On Your Network:  http://${ip.address()}:${PORT}`)}`);
      console.log('\n');
    })
    .catch((err) => {
      console.error(chalk.red('Failed to start development server!'));
      console.error(err);
      process.exit(1);
    });
}

if (require.main === module) {
  mainService();
}

module.exports = mainService;
