/** Every refusal the owner can read, in plain words (spec "Refusals", "PDFs", "Photo conversion"). */

/** Sizes in megabytes (decimal) with at most one decimal: 20000000 is "20", 3400000 is "3.4". */
export function formatMb(bytes: number): string {
  return String(Math.round((bytes / 1_000_000) * 10) / 10);
}

export const VIDEO = "Videos can't be uploaded here. Put the video on YouTube or Vimeo, then ask your AI app to add it with its link.";
export const GIF = "Moving pictures can't be uploaded. For a video, use YouTube or Vimeo. For a still photo, upload it as a JPEG.";
export const CODE = "This file can carry code, so it can't go on the site. Upload a photo (JPEG, PNG, WebP or HEIC) or a PDF.";
export const UNSUPPORTED = "Only photos (JPEG, PNG, WebP or iPhone HEIC) and PDFs can be uploaded.";
export const DAMAGED = "This file looks damaged, so it can't be used. Try exporting it again.";
export const TOO_DETAILED = "This photo is too detailed to make small enough for a fast page. Try a different photo.";
export const QUOTA = "Photos can't be prepared right now, because this month's photo allowance is used up. PDFs still work. Huston Logic has been told.";
export const PDF_ACTIVE =
  "This PDF holds a script, a form action or an attached file, which a website can't safely offer. Save it again as a plain PDF (use Print, then Save as PDF) and upload that.";
export const SAVE_FAILED = "This file couldn't be saved right now. Try again in a moment.";
export const NOT_FOUND = "That upload isn't in your uploads (it may have been removed or have expired).";

export const tooBigPhoto = (bytes: number, max: number): string => `This photo is ${formatMb(bytes)} MB; the most this site takes is ${formatMb(max)} MB.`;
export const tooBigPdf = (bytes: number, max: number): string => `This PDF is ${formatMb(bytes)} MB; the most this site takes is ${formatMb(max)} MB.`;
export const inboxFull = (max: number): string => `Your uploads are full (${formatMb(max)} MB). Remove some you no longer need, then try again.`;
export const dailyCap = (max: number): string => `You've uploaded ${max} files today, the daily limit. Try again tomorrow.`;

export const CHOOSE_FIRST = "Choose a photo or PDF first.";
export const NOT_RECEIVED = "That upload didn't come through. Try again, or add the files one at a time.";
export const tooMuchAtOnce = (cap: number): string => `That's more than ${formatMb(cap)} MB at once. Choose fewer files, or add them one at a time.`;
