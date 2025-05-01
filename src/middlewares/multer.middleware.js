import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/temp"); // Path where the files will be stored
  },
  filename: (req, file, cb) => {
    // cb(null, Date.now() + "-" + file.originalname); // Renaming the file to include a timestamp
    cb(null, file.originalname); // Renaming the file to include a timestamp
  },
});

export const upload = multer({ storage: storage });
