/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
  branches: [
    'main',
    {
      name: 'dev',
      prerelease: true,
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        // updates package.json automatically
        pkgRoot: '.',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    // Remove CHANGELOG.md on prerelease branches to avoid merge conflict
    [
      '@semantic-release/exec',
      {
        prepareCmd:
          "test ${branch.type} != release || sed -i '/^## \\[/h;x;/^[^]]*-/{x;d};x' CHANGELOG.md",
      },
    ],
  ],
};
