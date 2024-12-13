const express = require('express');
const fs = require('fs');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;
const BASE_URL = "https://nzsl.vuw.ac.nz/signs/";
const VIDEO_DIR = "./downloads/";

app.use(express.json());

/**
 * Download a file from the given URL
 * @param {string} url 
 * @param {string} dest 
 * @param {function} callback 
 */
const downloadFile = (url, dest, callback) => {
  const file = fs.createWriteStream(dest);
  request(url)
    .pipe(file)
    .on('finish', () => {
      console.log(`File downloaded: ${dest}`);
      callback(null);
    })
    .on('error', (err) => {
      console.error(`Error downloading file: ${err.message}`);
      callback(err);
    });
};

/**
 * Fetch metadata and download the associated video
 * @param {number} idx 
 * @param {function} callback 
 */
function fetchAndDownloadVideo(idx, callback) {
  const url = `${BASE_URL}${idx}`;
  console.log(`Fetching metadata from: ${url}`);

  request(url, (error, response, html) => {
    if (!error && response.statusCode === 200) {
      const web = cheerio.load(html);

      // Extract video URL
      const videoURL = web("video.main_video source").attr("src");
      if (!videoURL) {
        console.log(`No video found for ID: ${idx}`);
        return callback(null);
      }

      console.log(`Video URL: ${videoURL}`);

      // Prepare file paths
      const videoFileName = videoURL.split("/").pop();
      const writeTo = path.join(VIDEO_DIR, `${idx}_${videoFileName}`);

      // Ensure the directory exists
      if (!fs.existsSync(VIDEO_DIR)) {
        fs.mkdirSync(VIDEO_DIR, { recursive: true });
      }

      // Download the video
      downloadFile(videoURL, writeTo, callback);
    } else {
      console.error(`Error fetching metadata for ID ${idx}: ${error}`);
      callback(error);
    }
  });
}

/**
 * Find ID in JSON files based on query
 * @param {string} query 
 * @returns {number|null} The ID if found, or null if not found
 */
function findIdByQuery(query) {
  const dataDir = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataDir).filter((file) => file.endsWith('.json'));

  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const { english = [], english_secondary = [] } = jsonData.gloss || {};

      // Check if the query matches any of the gloss terms
      if (
        // english.some((term) => term.toLowerCase().includes(query.toLowerCase())) ||
        // english_secondary.some((term) => term.toLowerCase().includes(query.toLowerCase()))

        english.some((term) => term.toLowerCase() === query.toLowerCase()) ||
        english_secondary.some((term) => term.toLowerCase() === query.toLowerCase())
      ) {
        return jsonData.nzsl_id; // Return the ID if a match is found
      }
    } catch (error) {
      console.error(`Error reading file ${file}: ${error.message}`);
    }
  }

  return null; // Return null if no match is found
}

/**
 * API endpoint to search and download videos
 */
app.get('/download', (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const nzslId = findIdByQuery(query);
  if (nzslId === null) {
    return res.status(404).json({ error: 'No matching entries found for the query' });
  }

  console.log(`Found match for query "${query}" with ID: ${nzslId}`);

  // Download the video
  fetchAndDownloadVideo(nzslId, (err) => {
    if (err) {
      return res.status(500).json({ error: `Failed to download video for ID: ${nzslId}` });
    }
    return res.json({
      message: `Video downloaded successfully for ID: ${nzslId}`,
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
