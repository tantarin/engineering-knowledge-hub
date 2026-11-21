const basePath = process.env.PAGES_BASE_PATH || "";
export default {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
