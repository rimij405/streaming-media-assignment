const fs = require('fs');
const path = require('path');

// Check if the file exists at specified path. (Returns a promise)
const fileExists = (filepath) => new Promise((resolve, reject) => {
  // Asyncrhonous fs.stat call.
  fs.stat(filepath, (err, stats) => {
    if (!err) {
      resolve(stats);
    } else {
      reject(err);
    }
  });
});

// Calculate the byte range.
const byteRange = (range, size) => {
  const positions = range.replace(/bytes=/, '').split('-');
  let start = parseInt(positions[0], 10);
  const total = size;
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
  if (start > end) {
    start = end - 1;
  }

  return {
    start,
    end,
    total,
  };
};

// Load file method.
const loadFile = (request, response, filepath, mimetype) => {
  // Resolve full pathname using directory.
  const pathname = path.resolve(__dirname, filepath);

  // If file exists at the specified file path. (Promise)
  fileExists(pathname).then((stats) => {
    // Get the range from the request headers.
    let { range } = request.headers;

    // Validate the range object.
    if (!range) {
      range = 'bytes=0-';
    }

    // Calculate the start and end positions.
    const contentRange = byteRange(range, stats.size);

    // Calculate the chunksize.
    const chunksize = (contentRange.end - contentRange.start) + 1;

    // Write the response headers.
    response.writeHead(206, {
      'Content-Range': `bytes ${contentRange.start}-${contentRange.end}/${contentRange.total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimetype,
    });

    // Create the file stream.
    const stream = fs.createReadStream(pathname, contentRange);

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  }).catch((err) => {
    // If a 404 error, write the header ...
    if (err.code === 'ENOENT') {
      response.writeHead(404);
    }

    // ... then end the response.
    return response.end(err);
  });
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

module.exports = {
  getBird,
  getBling,
  getParty,
};
