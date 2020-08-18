const {convertTo} = require('../../convert');

const queue = new ConversionQueue();

class Conversion {
  exports = []

  constructor(options) {
    this.video = options.video;
    this.format = options.format;
    this.exportOptions = options.exportOptions;
  }

  convert = async ({fileType} = {}) => {
    if (this.filePath) {
      return this.filePath;
    }

    this.convertProcess = queue.queueConversion(
      () => {
        if (this.canceled) {
          return;
        }

        return convertTo({
          ...this.exportOptions,
          // FIXME
        });
      }
    );

    this.filePath = await this.convertProcess;
    return this.filePath;
  }

  run = () => {

  }

  addExport = (newExport) => {
    this.exports.push(newExport);
    newExport.run(this);
  }
}

class Export {
  constructor(options) {

  }
}
