/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { TechStack, SocialLink } = require("./src/models");

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/portfolio")
  .then(async () => {
    const ts = await TechStack.find().lean();
    console.log("TechStack:", ts);

    const sl = await SocialLink.find().lean();
    console.log("SocialLinks:", sl);

    process.exit(0);
  });
