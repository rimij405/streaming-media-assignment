const fs = require('fs');
const path = require('path');

// Promise function to generalize checking if file exists.
const findFile = (file) => {
    return new Promise((resolve, reject) => {
        fs.stat(file, (err, stats) => {
            if(err) {
                reject(err);
            } else {
                resolve(file, stats);
            }
        });
    });
}

const getBling = (request, response) => {
    const file = path.resolve(__dirname, '../client/bling.mp3');

    // Does the fs.stat in the promise.
    findFile(file).then((file, stats) => {

    }).catch((err) => {
        if(err.code === 'ENOENT'){
            response.writeHead(404);
        }
        return response.end(err);
    });

}

const getParty = (request, response) => {
    const file = path.resolve(__dirname, '../client/party.mp4');

    // Does the fs.stat in the promise.
    findFile(file).then((file, stats) => {
        
        // Destructure statement for range.
        // equivalent to 'let range = request.headers.range'
        let { range } = request.headers;

        if(!range){
            range = 'bytes=0-';
        }

        const positions = range.replace(/bytes=/, '').split('-');

        let start = parseInt(positions[0], 10);

        const total = stats.size;
        const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

        if(start > end){
            start = end - 1;
        }

        const chunksize = (end - start) + 1;

        response.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        });

        const stream = fs.createReadStream(file, { start, end });

        stream.on('open', () => {
            stream.pipe(response);
        });

        stream.on('error', (streamErr) => {
            response.end(streamErr);
        });

        return stream;

    }).catch((err) => {
        if(err.code === 'ENOENT'){
            response.writeHead(404);
        }
        return response.end(err);
    });
}

module.exports = {
    getBling,
    getParty
}
