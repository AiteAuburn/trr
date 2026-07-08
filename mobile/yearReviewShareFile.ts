import * as FileSystem from "expo-file-system";

import {
  safeYearReviewShareAssetFileName,
  type YearReviewApiShareAsset
} from "./futureModuleDisplay";

export async function writeYearReviewShareAssetFile(asset: YearReviewApiShareAsset) {
  if (!FileSystem.cacheDirectory) {
    throw new Error("year_review_share_cache_unavailable");
  }
  const filename = safeYearReviewShareAssetFileName(asset.filename);
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, asset.svg_text, {
    encoding: FileSystem.EncodingType.UTF8
  });
  return uri;
}
