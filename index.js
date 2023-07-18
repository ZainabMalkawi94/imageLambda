'use strict';

const AWS = require('aws-sdk');

const s3 = new AWS.S3();

exports.handler = async (event) => {
  // Retrieve the uploaded image information
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const size = event.Records[0].s3.object.size;

  // Retrieve the images.json file if it exists
  let imagesData;
  try {
    const response = await s3.getObject({ Bucket: bucket, Key: 'images.json' }).promise();
    imagesData = JSON.parse(response.Body.toString());
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      imagesData = [];
    } else {
      throw error;
    }
  }

  // Check if the image already exists in the images.json data
  let imageExists = false;
  for (const image of imagesData) {
    if (image.name === key) {
      image.size = size;
      imageExists = true;
      break;
    }
  }

  // If the image is not a duplicate, add it to the images.json data
  if (!imageExists) {
    const imageData = {
      name: key,
      size: size,
      // Add more metadata fields as needed (e.g., type)
    };
    imagesData.push(imageData);
  }

  // Upload the updated images.json file back to the S3 bucket
  await s3
    .putObject({
      Bucket: bucket,
      Key: 'images.json',
      Body: JSON.stringify(imagesData),
      ContentType: 'application/json',
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify('Image processed successfully.'),
  };
};

