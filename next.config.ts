import type { NextConfig } from 'next';
import git from 'git-rev-sync';

// Get short commit hash for uniqueness
function getCommitHash(): string {
  try {
    return git.short();
  } catch {
    // fallback to CI commit hash or 'dev'
    return process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev';
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  env: {
    NEXT_PUBLIC_VERSION: `${process.env.npm_package_version ?? '0.0.0'}+${getCommitHash()}`,
  },
};

export default nextConfig;
