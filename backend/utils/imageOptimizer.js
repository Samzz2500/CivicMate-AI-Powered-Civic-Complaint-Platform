const path = require('path');
const fs = require('fs');
const logger = require('./logger');

let sharp;

// Initialize Sharp
const initializeImageOptimizer = () => {
  try {
    sharp = require('sharp');
    logger.info('Image optimizer initialized');
    return true;
  } catch (error) {
    logger.warn('Sharp not available, image optimization disabled', { error: error.message });
    return false;
  }
};

// Optimize image
const optimizeImage = async (inputPath, options = {}) => {
  if (!sharp) {
    const initialized = initializeImageOptimizer();
    if (!initialized) {
      return { success: false, error: 'Image optimizer not available' };
    }
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 80,
    format = 'jpeg',
    outputPath = null
  } = options;

  try {
    const output = outputPath || inputPath;
    const metadata = await sharp(inputPath).metadata();

    logger.info('Optimizing image', {
      input: inputPath,
      originalSize: metadata.size,
      originalFormat: metadata.format,
      originalDimensions: `${metadata.width}x${metadata.height}`
    });

    let pipeline = sharp(inputPath);

    // Resize if needed
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert and compress
    if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    }

    await pipeline.toFile(output + '.tmp');

    // Get optimized file stats
    const originalStats = fs.statSync(inputPath);
    const optimizedStats = fs.statSync(output + '.tmp');

    // Only replace if optimized version is smaller
    if (optimizedStats.size < originalStats.size) {
      fs.renameSync(output + '.tmp', output);
      
      const savings = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(2);
      
      logger.info('Image optimized', {
        output,
        originalSize: originalStats.size,
        optimizedSize: optimizedStats.size,
        savings: `${savings}%`
      });

      return {
        success: true,
        originalSize: originalStats.size,
        optimizedSize: optimizedStats.size,
        savings: parseFloat(savings),
        path: output
      };
    } else {
      // Keep original if it's smaller
      fs.unlinkSync(output + '.tmp');
      
      logger.info('Original image kept (already optimized)', { path: inputPath });
      
      return {
        success: true,
        originalSize: originalStats.size,
        optimizedSize: originalStats.size,
        savings: 0,
        path: output,
        message: 'Original image already optimized'
      };
    }
  } catch (error) {
    logger.error('Image optimization failed', { inputPath, error: error.message });
    
    // Clean up temp file if exists
    try {
      if (fs.existsSync(inputPath + '.tmp')) {
        fs.unlinkSync(inputPath + '.tmp');
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    return { success: false, error: error.message };
  }
};

// Create thumbnail
const createThumbnail = async (inputPath, outputPath, size = 300) => {
  if (!sharp) {
    const initialized = initializeImageOptimizer();
    if (!initialized) {
      return { success: false, error: 'Image optimizer not available' };
    }
  }

  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    logger.info('Thumbnail created', { input: inputPath, output: outputPath, size });

    return {
      success: true,
      path: outputPath,
      size
    };
  } catch (error) {
    logger.error('Thumbnail creation failed', { inputPath, error: error.message });
    return { success: false, error: error.message };
  }
};

// Create multiple sizes
const createMultipleSizes = async (inputPath, sizes = [300, 600, 1200]) => {
  if (!sharp) {
    const initialized = initializeImageOptimizer();
    if (!initialized) {
      return { success: false, error: 'Image optimizer not available' };
    }
  }

  const results = [];
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);

  try {
    for (const size of sizes) {
      const outputPath = path.join(dir, `${basename}_${size}${ext}`);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      results.push({
        size,
        path: outputPath
      });
    }

    logger.info('Multiple sizes created', { input: inputPath, sizes: sizes.length });

    return {
      success: true,
      sizes: results
    };
  } catch (error) {
    logger.error('Multiple sizes creation failed', { inputPath, error: error.message });
    return { success: false, error: error.message };
  }
};

// Get image metadata
const getImageMetadata = async (imagePath) => {
  if (!sharp) {
    const initialized = initializeImageOptimizer();
    if (!initialized) {
      return { success: false, error: 'Image optimizer not available' };
    }
  }

  try {
    const metadata = await sharp(imagePath).metadata();
    
    return {
      success: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        size: fs.statSync(imagePath).size
      }
    };
  } catch (error) {
    logger.error('Failed to get image metadata', { imagePath, error: error.message });
    return { success: false, error: error.message };
  }
};

// Convert image format
const convertFormat = async (inputPath, outputFormat, outputPath = null) => {
  if (!sharp) {
    const initialized = initializeImageOptimizer();
    if (!initialized) {
      return { success: false, error: 'Image optimizer not available' };
    }
  }

  try {
    const output = outputPath || inputPath.replace(path.extname(inputPath), `.${outputFormat}`);
    
    let pipeline = sharp(inputPath);

    if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
      pipeline = pipeline.jpeg({ quality: 80 });
    } else if (outputFormat === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9 });
    } else if (outputFormat === 'webp') {
      pipeline = pipeline.webp({ quality: 80 });
    } else {
      throw new Error(`Unsupported format: ${outputFormat}`);
    }

    await pipeline.toFile(output);

    logger.info('Image format converted', { input: inputPath, output, format: outputFormat });

    return {
      success: true,
      path: output,
      format: outputFormat
    };
  } catch (error) {
    logger.error('Format conversion failed', { inputPath, error: error.message });
    return { success: false, error: error.message };
  }
};

// Batch optimize images
const batchOptimize = async (imagePaths, options = {}) => {
  const results = [];

  for (const imagePath of imagePaths) {
    const result = await optimizeImage(imagePath, options);
    results.push({
      path: imagePath,
      ...result
    });
  }

  const successful = results.filter(r => r.success).length;
  const totalSavings = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + (r.originalSize - r.optimizedSize), 0);

  logger.info('Batch optimization complete', {
    total: imagePaths.length,
    successful,
    failed: imagePaths.length - successful,
    totalSavings: `${(totalSavings / 1024 / 1024).toFixed(2)} MB`
  });

  return {
    success: true,
    results,
    summary: {
      total: imagePaths.length,
      successful,
      failed: imagePaths.length - successful,
      totalSavings
    }
  };
};

// Middleware for automatic image optimization
const optimizeUploadMiddleware = (options = {}) => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    const filePath = req.file.path;
    
    // Only optimize images
    if (!req.file.mimetype.startsWith('image/')) {
      return next();
    }

    try {
      const result = await optimizeImage(filePath, options);
      
      if (result.success) {
        req.file.optimized = true;
        req.file.originalSize = result.originalSize;
        req.file.optimizedSize = result.optimizedSize;
        req.file.savings = result.savings;
        
        logger.info('Upload optimized', {
          filename: req.file.filename,
          savings: `${result.savings}%`
        });
      }
    } catch (error) {
      logger.error('Upload optimization failed', { error: error.message });
      // Don't fail the upload, just log the error
    }

    next();
  };
};

module.exports = {
  initializeImageOptimizer,
  optimizeImage,
  createThumbnail,
  createMultipleSizes,
  getImageMetadata,
  convertFormat,
  batchOptimize,
  optimizeUploadMiddleware
};
