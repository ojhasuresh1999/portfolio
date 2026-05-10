/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const MONGODB_URI = "mongodb://localhost:27017/portfolio";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const TimelineEntrySchema = new mongoose.Schema({
    year: { type: String, required: true },
    title: { type: String, required: true },
    organizationName: { type: String, required: false },
    organizationUrl: { type: String, required: false },
    description: { type: String, required: true },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  });

  const TimelineEntry =
    mongoose.models.TimelineEntry ||
    mongoose.model("TimelineEntry", TimelineEntrySchema);

  const updated = await TimelineEntry.findByIdAndUpdate(
    "697eed117cbb0acc038f74b2",
    { organizationName: "Google", organizationUrl: "https://google.com" },
    { new: true },
  ).lean();

  console.log("Updated:", updated);
  process.exit(0);
}
main();
