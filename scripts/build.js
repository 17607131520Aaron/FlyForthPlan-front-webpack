import webpack from 'webpack';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import webpackConfig from '../config/webpack.prod.js';

// 设置环境变量
process.env.NODE_ENV = 'production';

// 加载环境变量
const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// 创建编译器
const compiler = webpack(webpackConfig);

// 打印编译信息
console.log(chalk.cyan('Creating an optimized production build...\n'));

// 执行构建
compiler.run((err, stats) => {
  if (err) {
    console.error(chalk.red('Failed to compile.\n'));
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    process.exit(1);
    return;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.error(chalk.red('Compile failed.\n'));
    info.errors.forEach((error) => {
      console.error(error);
    });
    process.exit(1);
    return;
  }

  if (stats.hasWarnings()) {
    console.warn(chalk.yellow('Compiled with warnings.\n'));
    info.warnings.forEach((warning) => {
      console.warn(warning);
    });
  }

  console.log(chalk.green('Compiled successfully.\n'));
  console.log(chalk.bold('File sizes after gzip:\n'));

  // 输出文件大小信息
  const assets = info.assets
    .filter((asset) => /\.(js|css)$/.test(asset.name))
    .sort((a, b) => b.size - a.size);

  assets.forEach((asset) => {
    const sizeInKB = (asset.size / 1024).toFixed(2);
    console.log(`  ${chalk.cyan(asset.name.padEnd(30))} ${chalk.bold(`${sizeInKB} KB`)}`);
  });

  console.log('\n');
  console.log(chalk.green('Build completed successfully!'));

  // 关闭编译器
  compiler.close((closeErr) => {
    if (closeErr) {
      console.error(chalk.red('Error closing compiler:'), closeErr);
      process.exit(1);
    }
  });
});
