## [1.0.1](https://github.com/Sudoki-Game/sudoki/compare/v1.0.0...v1.0.1) (2026-02-27)


### Bug Fixes

* get correct release version from semantic release ([de93197](https://github.com/Sudoki-Game/sudoki/commit/de93197fdc94026f2903acdce449e1c184d07b2f))

# 1.0.0 (2026-02-27)


* ref!: restructure files into areas of use ([b6bc97b](https://github.com/Sudoki-Game/sudoki/commit/b6bc97bf1e8fa83f759044b11107dbd0ba881e71))


### Bug Fixes

* `SudokuGameContext` now tracks auth state changes ([1549b06](https://github.com/Sudoki-Game/sudoki/commit/1549b0609398a0fbecdecb78a50714174d142b0d))
* address PR review comments - improve type imports and simplify null checks ([6683d6d](https://github.com/Sudoki-Game/sudoki/commit/6683d6db3d0cef85848b5a0732bc8170a032a5cb))
* bump @isaacs/brace-expansion from 5.0.0 to 5.0.1 ([3099c80](https://github.com/Sudoki-Game/sudoki/commit/3099c80a63a31a78f3fd0790ab0924cdae0dca00))
* calling `OPEN_MENU` twice won't append history more than once ([2cab057](https://github.com/Sudoki-Game/sudoki/commit/2cab057b0c8204279e3a385149223a25bfa29e4c))
* correct logic errors in null/undefined checks and import path ([32b358f](https://github.com/Sudoki-Game/sudoki/commit/32b358f4cd24fb90804093fafaf880a60779a637))
* **game:** prevent board staying disabled after logout ([417f2b5](https://github.com/Sudoki-Game/sudoki/commit/417f2b5cc7ab77dca4fa321c869b8b338413526d))
* header leaderboard button is now enabled when logged in ([283c7dd](https://github.com/Sudoki-Game/sudoki/commit/283c7ddd7308f72666cf8ca5007e13679a1e9e0d))
* missing streak calculation during sync ([4269cda](https://github.com/Sudoki-Game/sudoki/commit/4269cda0451c296a7c7c9c50aaa43fd3ce5fbdd9))
* reduce LCP on game components ([d956052](https://github.com/Sudoki-Game/sudoki/commit/d956052bc3a8445ead6df2d0a17a59e45e3bd5bc))
* remove grandstander font as css dependency ([36138da](https://github.com/Sudoki-Game/sudoki/commit/36138dab024783996afd4df8e7bc44fe7251d3a7))
* remove local `sudoku_user_data` upon successful sync ([788166b](https://github.com/Sudoki-Game/sudoki/commit/788166b20f1c8fc664f19e5a7ce656600d866fde))
* remove unfinished validation checks and establish save functions as single ([3e09c5a](https://github.com/Sudoki-Game/sudoki/commit/3e09c5a10905094203090cf6419581dee8abefc9))
* server actions should use Firestore server sdk ([47282b9](https://github.com/Sudoki-Game/sudoki/commit/47282b9d4b97b491d0db41035adfdc3b590a1696))
* show console logs during dev ([da0d721](https://github.com/Sudoki-Game/sudoki/commit/da0d721a7b9a5484c3f924108fce2ced997bac04))
* streak bonus always showing +0 for logged-in users and modal displaying stale data ([c2d12f8](https://github.com/Sudoki-Game/sudoki/commit/c2d12f86004b022756574ee7a2bd57ec3ba3a396))
* update personalBestScore when saving matches ([49a6a19](https://github.com/Sudoki-Game/sudoki/commit/49a6a19b55c2973ec25a41a8a127ce4d642a3d5a))


### Features

* add canonical metadata, sitemap/robots, static OG image, and onboarding auth guard ([97f5dbb](https://github.com/Sudoki-Game/sudoki/commit/97f5dbb08483192fe05d60a1afeb52a93b0941c1))
* add difficulty validation and TypeScript checking to match system ([1ecbf05](https://github.com/Sudoki-Game/sudoki/commit/1ecbf055d587a04fa1e1b0750d4529f8e9711b7d))
* add how to play modal on first time launch ([4b30dcd](https://github.com/Sudoki-Game/sudoki/commit/4b30dcd2965f26a2566ba9de3b2a22786688b4d7))
* add leaderboard modal with top players and nearby rankings ([555495f](https://github.com/Sudoki-Game/sudoki/commit/555495f83a636eca839e88a04acfc5b3273c9eb4))
* add server-side daily puzzle generation with tiered caching ([d339190](https://github.com/Sudoki-Game/sudoki/commit/d339190af461296d721e0bb2bfc2315bbb2d90b3))
* add user account deletion ([82fe4c4](https://github.com/Sudoki-Game/sudoki/commit/82fe4c48dfbde21f83c5691fdeee6992abb623f4))
* Implement match persistence with local/server sync ([3850730](https://github.com/Sudoki-Game/sudoki/commit/385073084edfd63cb2bcb7ebc40c1bef4cc2a846))
* **ui:** add skeleton placeholder when loading leaderboard ([93c020d](https://github.com/Sudoki-Game/sudoki/commit/93c020d9aa904d7861fe5692d7ca9412f9c7293f))


### BREAKING CHANGES

* rather than single root `components`, `hooks`, `types` folders to hold files, the project will now use a `area-of-use/subfolder` setup. For example, any components related to the main game functionality will be stored under `game/components` whereas any components related to sign in and auth will be located under `auth/components`. Generic ui such as buttons, form elements etc, will be under `ui`.

This should make it easier visualise the scope of an indivudual components/context when looking at the wider project.

# 1.0.0-dev.1 (2026-02-27)


* ref!: restructure files into areas of use ([b6bc97b](https://github.com/Sudoki-Game/sudoki/commit/b6bc97bf1e8fa83f759044b11107dbd0ba881e71))


### Bug Fixes

* `SudokuGameContext` now tracks auth state changes ([1549b06](https://github.com/Sudoki-Game/sudoki/commit/1549b0609398a0fbecdecb78a50714174d142b0d))
* address PR review comments - improve type imports and simplify null checks ([6683d6d](https://github.com/Sudoki-Game/sudoki/commit/6683d6db3d0cef85848b5a0732bc8170a032a5cb))
* bump @isaacs/brace-expansion from 5.0.0 to 5.0.1 ([3099c80](https://github.com/Sudoki-Game/sudoki/commit/3099c80a63a31a78f3fd0790ab0924cdae0dca00))
* calling `OPEN_MENU` twice won't append history more than once ([2cab057](https://github.com/Sudoki-Game/sudoki/commit/2cab057b0c8204279e3a385149223a25bfa29e4c))
* correct logic errors in null/undefined checks and import path ([32b358f](https://github.com/Sudoki-Game/sudoki/commit/32b358f4cd24fb90804093fafaf880a60779a637))
* **game:** prevent board staying disabled after logout ([417f2b5](https://github.com/Sudoki-Game/sudoki/commit/417f2b5cc7ab77dca4fa321c869b8b338413526d))
* header leaderboard button is now enabled when logged in ([283c7dd](https://github.com/Sudoki-Game/sudoki/commit/283c7ddd7308f72666cf8ca5007e13679a1e9e0d))
* missing streak calculation during sync ([4269cda](https://github.com/Sudoki-Game/sudoki/commit/4269cda0451c296a7c7c9c50aaa43fd3ce5fbdd9))
* reduce LCP on game components ([d956052](https://github.com/Sudoki-Game/sudoki/commit/d956052bc3a8445ead6df2d0a17a59e45e3bd5bc))
* remove grandstander font as css dependency ([36138da](https://github.com/Sudoki-Game/sudoki/commit/36138dab024783996afd4df8e7bc44fe7251d3a7))
* remove local `sudoku_user_data` upon successful sync ([788166b](https://github.com/Sudoki-Game/sudoki/commit/788166b20f1c8fc664f19e5a7ce656600d866fde))
* remove unfinished validation checks and establish save functions as single ([3e09c5a](https://github.com/Sudoki-Game/sudoki/commit/3e09c5a10905094203090cf6419581dee8abefc9))
* server actions should use Firestore server sdk ([47282b9](https://github.com/Sudoki-Game/sudoki/commit/47282b9d4b97b491d0db41035adfdc3b590a1696))
* show console logs during dev ([da0d721](https://github.com/Sudoki-Game/sudoki/commit/da0d721a7b9a5484c3f924108fce2ced997bac04))
* streak bonus always showing +0 for logged-in users and modal displaying stale data ([c2d12f8](https://github.com/Sudoki-Game/sudoki/commit/c2d12f86004b022756574ee7a2bd57ec3ba3a396))
* update personalBestScore when saving matches ([49a6a19](https://github.com/Sudoki-Game/sudoki/commit/49a6a19b55c2973ec25a41a8a127ce4d642a3d5a))


### Features

* add canonical metadata, sitemap/robots, static OG image, and onboarding auth guard ([97f5dbb](https://github.com/Sudoki-Game/sudoki/commit/97f5dbb08483192fe05d60a1afeb52a93b0941c1))
* add difficulty validation and TypeScript checking to match system ([1ecbf05](https://github.com/Sudoki-Game/sudoki/commit/1ecbf055d587a04fa1e1b0750d4529f8e9711b7d))
* add how to play modal on first time launch ([4b30dcd](https://github.com/Sudoki-Game/sudoki/commit/4b30dcd2965f26a2566ba9de3b2a22786688b4d7))
* add leaderboard modal with top players and nearby rankings ([555495f](https://github.com/Sudoki-Game/sudoki/commit/555495f83a636eca839e88a04acfc5b3273c9eb4))
* add server-side daily puzzle generation with tiered caching ([d339190](https://github.com/Sudoki-Game/sudoki/commit/d339190af461296d721e0bb2bfc2315bbb2d90b3))
* add user account deletion ([82fe4c4](https://github.com/Sudoki-Game/sudoki/commit/82fe4c48dfbde21f83c5691fdeee6992abb623f4))
* Implement match persistence with local/server sync ([3850730](https://github.com/Sudoki-Game/sudoki/commit/385073084edfd63cb2bcb7ebc40c1bef4cc2a846))
* **ui:** add skeleton placeholder when loading leaderboard ([93c020d](https://github.com/Sudoki-Game/sudoki/commit/93c020d9aa904d7861fe5692d7ca9412f9c7293f))


### BREAKING CHANGES

* rather than single root `components`, `hooks`, `types` folders to hold files, the project will now use a `area-of-use/subfolder` setup. For example, any components related to the main game functionality will be stored under `game/components` whereas any components related to sign in and auth will be located under `auth/components`. Generic ui such as buttons, form elements etc, will be under `ui`.

This should make it easier visualise the scope of an indivudual components/context when looking at the wider project.
