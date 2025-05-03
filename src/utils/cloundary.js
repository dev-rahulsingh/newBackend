import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

// cloudinary.config({
//   cloud_name: process.env.CLOUNDARY_CLOUD_NAME,
//   api_key: process.env.CLOUNDARY_CLOUD_API,
//   api_secret: process.env.CLOUNDARY_CLOUD_API_SECRET,
// });

cloudinary.config({
  cloud_name: "rahul-singh",
  api_key: "374191525785964",
  api_secret: "Lcv4uGnViLKt7asLjgVt8lYSwNQ",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    // console.log("Files is uploaded on cloudinary", response.url);
    return response;
  } catch (error) {
    // if (fs.existsSync(localFilePath)) {
    //   fs.unlinkSync(localFilePath);
    // }
    fs.unlinkSync(localFilePath); //remove the ,locally saved temporary files as the upload operartion got failed
    return null;
  }
};

export { uploadOnCloudinary };
// cloudinary.uploader
//   .upload("my_image.jpg")
//   .then((result) => console.log(result));
