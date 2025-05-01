import { asyncHandler } from "../utils/asynchandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;
  console.log(email);
});

export { registerUser };

// Algorithum to step what to do
// *******************************************

// get user details form the frontend
// validate  - - empty
// check if user is already exict : usermane and Email
// check for image and check for avatar
// upload to them in cloudinary, avatar
// create user object in database
// check user create or not
// remove password and token from respnse user data
// returb response
