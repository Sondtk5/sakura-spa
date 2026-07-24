import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const DIST_DIR = "dist";
const DEFAULT_FILE = "index.html";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".map", ".svg", ".txt"]);

function toSafeRelativePath(rawPath) {
  const cleaned = rawPath.split("?")[0].split("#")[0];
  const withoutLeadingSlash = cleaned.replace(/^\/+/, "");
  const normalized = normalize(withoutLeadingSlash);

  if (
    normalized === "." ||
    normalized === "" ||
    normalized.startsWith("..") ||
    normalized.includes("/..") ||
    normalized.includes("\\..")
  ) {
    return DEFAULT_FILE;
  }

  return normalized;
}

function response(body, statusCode, contentType, isBase64Encoded = false) {
  return {
    statusCode,
    headers: {
      "cache-control": contentType.startsWith("text/html") ? "no-cache" : "public, max-age=31536000, immutable",
      "content-type": contentType,
    },
    body,
    isBase64Encoded,
  };
}

async function loadAsset(relativePath) {
  return readFile(join(DIST_DIR, relativePath));
}

export async function handler(event = {}) {
  const requestPath = event.rawPath ?? event.path ?? "/";
  const relativePath = toSafeRelativePath(requestPath);

  try {
    const asset = await loadAsset(relativePath);
    const ext = extname(relativePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

    if (TEXT_EXTENSIONS.has(ext)) {
      return response(asset.toString("utf8"), 200, contentType);
    }

    return response(asset.toString("base64"), 200, contentType, true);
  } catch (error) {
    if (!relativePath.includes(".")) {
      const html = await loadAsset(DEFAULT_FILE);
      return response(html.toString("utf8"), 200, MIME_TYPES[".html"]);
    }

    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return response("Not Found", 404, "text/plain; charset=utf-8");
    }

    console.error("lambda handler error", error);
    return response("Internal Server Error", 500, "text/plain; charset=utf-8");
  }
}
