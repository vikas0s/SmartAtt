const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Generate a unique QR token
const generateQRToken = () => {
  return uuidv4();
};

// Generate QR code image as base64
const generateQRImage = async (data) => {
  try {
    const qrDataString = JSON.stringify(data);
    const qrImage = await QRCode.toDataURL(qrDataString, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return qrImage;
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

// Parse QR data
const parseQRData = (qrString) => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    throw new Error('Invalid QR code data');
  }
};

module.exports = {
  generateQRToken,
  generateQRImage,
  parseQRData,
};
