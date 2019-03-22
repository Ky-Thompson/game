const { spawn } = require('child_process');
const chalk = require('chalk');
const fse = require('fs-extra');
const hasbin = require('hasbin');

const texturePackerInPath = new Promise((resolve, reject) => {
  hasbin('TexturePacker', (result) => {
    resolve(result);
  });
});

const texturePackerPaths = [
  'C:\\Program Files\\CodeAndWeb\\TexturePacker\\bin\\TexturePacker.exe',
  'C:\\Program Files (x86)\\CodeAndWeb\\TexturePacker\\bin\\TexturePacker.exe',
];

const texturePacker = (execPath, src, sheet, data) =>
  new Promise((resolve, reject) => {
    const packer = spawn(execPath, [
      src,
      '--sheet',
      sheet,
      '--data',
      data,
      '--texture-format',
      'png',
      '--format',
      'phaser-json-array',
      '--trim-sprite-names',
      '--disable-rotation',
      '--trim-mode',
      'None',
      '--opt',
      'RGBA8888',
      '--png-opt-level',
      '0',
      '--algorithm',
      'Basic',
      '--basic-sort-by',
      'Best',
      '--basic-order',
      'Ascending',
      '--extrude',
      '0',
    ]);

    packer.stdout.on('data', (data) => {
      console.log(String(data));
    });

    packer.stderr.on('data', (data) => {
      console.log(chalk.red(String(data)));
    });

    packer.on('close', (code) => {
      if (code !== 0) {
        reject(code);
      } else {
        resolve();
      }
    });
  });

module.exports.buildSprites = async function() {
  let texturePackerPath;

  if (await texturePackerInPath) {
    texturePackerPath = 'TexturePacker';
  } else {
    for (let i = 0; i < texturePackerPaths.length; i++) {
      const path = texturePackerPaths[i];
      if (await fse.pathExists(path)) {
        texturePackerPath = path;
        break;
      }
    }
  }

  if (!texturePackerPath) {
    throw new Error('Texture Packer not found in the system, needs to be installed first.');
  }

  await texturePacker(
    texturePackerPath,
    './src/assets/sprites',
    './dist/assets/sprites/mario-sprites.png',
    './dist/assets/sprites/mario-sprites.json'
  );

  return true;
};

module.exports.watchSprites = ['./src/assets/sprites/*', './src/assets/sprites/**/*'];
