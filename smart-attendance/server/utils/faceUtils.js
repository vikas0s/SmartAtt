// Compute Euclidean distance between two face descriptors
const euclideanDistance = (desc1, desc2) => {
  if (desc1.length !== desc2.length) {
    throw new Error('Descriptors must have the same length');
  }
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
};

// Find the best match from stored descriptors
const findBestMatch = (inputDescriptor, storedFaceDataList, threshold = 0.6) => {
  let bestMatch = null;
  let bestDistance = Infinity;

  for (const faceData of storedFaceDataList) {
    for (const storedDescriptor of faceData.descriptors) {
      const distance = euclideanDistance(inputDescriptor, storedDescriptor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = faceData;
      }
    }
  }

  if (bestDistance < threshold) {
    return {
      matched: true,
      studentId: bestMatch.studentId,
      distance: bestDistance,
      confidence: Math.max(0, (1 - bestDistance) * 100).toFixed(2),
    };
  }

  return {
    matched: false,
    distance: bestDistance,
    confidence: 0,
  };
};

module.exports = {
  euclideanDistance,
  findBestMatch,
};
