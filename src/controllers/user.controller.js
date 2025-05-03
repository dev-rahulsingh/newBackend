import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloundary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;
  console.log(email);

  // check for free space or date is empty
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All the firld are required");
  }

  // checking the user thing already here
  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User is already existed in the application");
  }
  // handling images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar should be there ");
  }

  //upload on cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar should be there ");
  }

  //user created
  await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    userName: userName.toLowercase(),
  });

  //checking user created or not and by using Select we can opt out some fieldby -ve sign
  const createdUser = await User.findById(User._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Created"));
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
// return response
