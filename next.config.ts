import type { NextConfig } from 'next';
import git from 'git-rev-sync';

function getGitHash() {
  try {
    return git.short();
  } catch {
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
    NEXT_PUBLIC_VERSION: `${process.env.npm_package_version}+${getGitHash()}`,
  },
};

export default nextConfig;
