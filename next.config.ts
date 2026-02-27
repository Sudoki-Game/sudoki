import type { NextConfig } from 'next';
import { execSync } from 'child_process';

// Get the current semantic-release version from Git tags
function getReleaseVersion(): string {
  try {
    // Get the latest tag (semantic-release creates tags like v1.7.0 or v1.7.0-dev.1)
    const tag = execSync('git describe --tags --abbrev=0').toString().trim();
    return tag.replace(/^v/, ''); // remove leading 'v'
  } catch {
    // Fallback for local dev or CI without tags
    return process.env.NODE_ENV === 'development'
      ? 'dev'
      : process.env.npm_package_version!;
  }
}

// Get short commit hash for uniqueness
function getCommitHash(): string {
  return process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev';
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  env: {
    NEXT_PUBLIC_VERSION: `${getReleaseVersion()}+${getCommitHash()}`,
  },
};

export default nextConfig;
