// document.getElementById('audioFileInput').addEventListener('change', handleFileUpload);

// async function handleFileUpload(event) {
//   const file = event.target.files[0];
//   if (!file) {
//     console.error("No file selected.");
//     return;
//   }
  
//   try {
//     const arrayBuffer = await file.arrayBuffer();
//     const audioContext = new AudioContext();
//     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

//     // Essentia setup
//     const EssentiaWASM = await EssentiaWASMModule();
//     const Essentia = new Essentia(EssentiaWASM);

//     // Convert audio buffer to Essentia vector format
//     const audioVector = Essentia.arrayToVector(audioBuffer.getChannelData(0));

//     // Perform rhythm detection
//     const result = Essentia.RhythmExtractor2013(audioVector, audioContext.sampleRate);
//     displayResults(result);
//   } catch (error) {
//     console.error("Error processing file:", error);
//   }
// }

// function displayResults(result) {
//   const output = document.getElementById('output');
//   output.textContent = `
//     BPM: ${result.bpm}
//     Beats: ${result.beats}
//     Onset Times: ${result.onsetTimes}
//     Beat Positions: ${result.beatPositions}
//   `;
//   console.log(result);  // Log the result for debugging
// }
