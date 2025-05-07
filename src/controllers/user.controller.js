import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloundary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log(email);

  // check for free space or date is empty
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All the field are required");
  }

  // checking the user thing already here
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User is already existed in the application");
  }
  // handling images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  // check coverImage is recieved and not
  if (
    req.files &&
    req.files.coverImage &&
    req.files.coverImage[0] &&
    req.files.coverImage[0].path
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

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
  const newUser = await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
  });

  //checking user created or not and by using Select we can opt out some fieldby -ve sign
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Created"));
});

const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    console.log(accessToken);
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something is wrong with genearting access and refresh Token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "email or username is required");
  }

  const newUser = await User.findOne({ $or: [{ username }, { email }] });
  // const newUser = User.findOne({ email });

  if (!newUser) {
    throw new ApiError(404, "User doesn't exist please register first");
  }

  //the custom method created at usermodel can only access by instance of User object not by pure object given by mongoose
  // const correctPassword = newUser.isPasswordCorrect(password);
  const correctPassword = await newUser.isPasswordCorrect(password);
  if (!correctPassword) {
    throw new ApiError(404, "Password Incorrect");
  }

  //heer we get out access and refresh token
  const { accessToken, refreshToken } = await generateTokens(newUser._id);

  const LoggedInUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  // setup cookies
  const options = {
    httpOnly: true,
    secure: false,
  };

  // final response with cookies embeded here
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: LoggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged Succeessfully"
      )
    );
});

const loginOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});
//refreshtoken

const refreshAcessToken = asyncHandler(async (req, res) => {
  console.log(req.cookies.accessToken);
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token Not found");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh Token expired and  used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } = await generateTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "refresh token generated"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh catch me token");
  }
});

const changeCurrentPassword = asyncHandler(async () => {
  const { oldPassword, newPassword } = req.body;

  // password will be change as user is already login, login means verifyJWT runs and req.user have user information
  const user = await User.findById(req.user._id);

  const isPassword = await user.isPasswordCorrect(oldPassword);
  if (!isPassword) {
    throw new ApiError(400, "Invalid Password");
  }
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changes successfully"));
});

//how to get current USer

const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, res.user, "Current User details fetch successfully")
    );
});

//update account details

const updateAccountDetails = asyncHandler(async () => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All field are required");
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Account details updated successfully"));
});

//Avatar Update program
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image uploaded successfully"));
});

//cover Image changes

const updateCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;

  if (!CoverImageLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const CoverImage = await uploadOnCloudinary(CoverImageLocalPath);

  if (!CoverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: CoverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image uploaded successfully"));
});

// exports

export {
  registerUser,
  loginUser,
  loginOut,
  refreshAcessToken,
  changeCurrentPassword,
  currentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
};

// Algorithum to step what to do to register User
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

// Algorithum to step what to do to login User
// *******************************************
// 1. get username, email and password
// 2. check that username exist or not if not them send message to register first
// 3. comapare the password
// 4. then generate accesstoken

// 4. login succsessfuly
// 5. then manage session for that to expire
// 6. then release refres token
