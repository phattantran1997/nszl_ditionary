const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");

// Base URL for NZSL sign pages
const BASE_URL = "https://nzsl.vuw.ac.nz/signs/";
const VIDEO_DIR = "./video/";

// Helper function to download a single file
function downloadFile(url, writeTo, callback) {
  // Skip if the file already exists
  if (fs.existsSync(writeTo)) {
    console.log(`File already exists: ${writeTo}`);
    return callback(null);
  }

  request({ url: url, encoding: null }, (err, response, body) => {
    if (!err && response.statusCode === 200) {
      fs.writeFile(writeTo, body, null, (err) => {
        if (!err) {
          console.log(`File downloaded: ${writeTo}`);
          callback(null);
        } else {
          console.error(`Error writing file: ${err}`);
          callback(err);
        }
      });
    } else {
      console.error(`Error downloading file: ${err}`);
      callback(err);
    }
  });
}

// Function to fetch video metadata and download a video
function fetchAndDownloadVideo(idx, callback) {
  const url = `${BASE_URL}${idx}`;
  console.log(`Fetching metadata from: ${url}`);

  request(url, (error, response, html) => {
    if (!error && response.statusCode === 200) {
      const web = cheerio.load(html);

      // Extract video URL
      const videoElement = web("video.main_video");
      const videoURL = videoElement.find("source").attr("src");
      if (!videoURL) {
        console.log(`No video found for ID: ${idx}`);
        return callback(null);
      }

      console.log(`Video URL: ${videoURL}`);

      // Prepare file paths
      const videoFileName = videoURL.split("/").pop();
      const writeTo = `${VIDEO_DIR}${idx}_${videoFileName}`;

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

// Example function to download a specific NZSL video
function downloadSingleVideo(idx) {
  fetchAndDownloadVideo(idx, (err) => {
    if (err) {
      console.error(`Failed to download video for ID ${idx}: ${err}`);
    } else {
      console.log(`Successfully downloaded video for ID ${idx}`);
    }
  });
}

// Example usage: Download video for a specific ID
const nzslId = 234; // Replace with the desired ID
downloadSingleVideo(nzslId);
