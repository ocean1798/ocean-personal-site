import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const pagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = isGitHubPagesBuild
  ? {
      output: "export",
      basePath: pagesBasePath,
      assetPrefix: pagesBasePath || undefined,
      trailingSlash: true,
      images: {
        unoptimized: true,
      },
      typescript: {
        tsconfigPath: "tsconfig.pages.json",
      },
    }
  : {};

export default nextConfig;
