const fs = require('fs');
const path = require('path');

class JSONFileProcessor {
  constructor(inputDirectory, outputDirectory) {
    this.inputDirectory = inputDirectory;  // Directory where JSON files are stored (input folder)
    this.outputDirectory = outputDirectory;  // Directory where processed files will be saved (output folder)
    this.files = [];  // To store file paths of JSON files
  }

  // Load all the JSON file paths from the specified input directory
  loadFiles() {
    try {
      this.files = fs.readdirSync(this.inputDirectory)  // Read contents of input directory
        .filter(file => file.endsWith('.json'))  // Filter for only .json files
        .map(file => path.join(this.inputDirectory, file));  // Get full file path using path.join
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }

  // Process each JSON file and save the updated data to the output directory
  processFiles() {
    // Ensure the output directory exists
    if (!fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory);  // Create the output directory if it doesn't exist
    }

    this.files.forEach(filePath => {
      const jsonData = this.readJSONFile(filePath);
      const updatedData = this.extractData(jsonData);
      if (updatedData) {
        // Generate the output file path (save to data2 directory)
        const outputFilePath = path.join(this.outputDirectory, path.basename(filePath));
        this.writeJSONFile(outputFilePath, updatedData);
      }
    });
  }

  // Read JSON file and parse it
  readJSONFile(filePath) {
    try {
      const rawData = fs.readFileSync(filePath, 'utf-8');  // Use fs.readFileSync to read file content
      return JSON.parse(rawData);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  // Extract the necessary properties from the JSON data
  extractData(data) {
    if (!data || !data.gloss || !data.gloss.english) return null;
    return {
      nzsl_id: data.nzsl_id,
      gloss: {
        english: data.gloss.english,  // Main English keywords
        english_secondary: data.gloss.english_secondary  // Secondary English keywords
      }
    };
  }

  // Write the updated JSON data back to the file
  writeJSONFile(filePath, updatedData) {
    try {
      const updatedDataStr = JSON.stringify(updatedData, null, 2);  // Pretty print with 2 spaces indentation
      fs.writeFileSync(filePath, updatedDataStr, 'utf-8');  // Use fs.writeFileSync to write updated data to file
      console.log(`Updated file saved: ${filePath}`);
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }
}

// Usage example
const inputDirectoryPath = './data';  // Replace with the path to your input folder (data)
const outputDirectoryPath = './data2';  // Replace with the path to your output folder (data2)

const processor = new JSONFileProcessor(inputDirectoryPath, outputDirectoryPath);
processor.loadFiles();  // Load the list of JSON files from the input folder
processor.processFiles();  // Process and update each file, save to the output folder
