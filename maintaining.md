# Maintaining


## Developing Kap

Run `npm run dev` in one terminal tab to start watch mode, and in another tab, run `npm start` to launch Kap.

We strongly recommend installing an [XO editor plugin](https://github.com/sindresorhus/xo#editor-plugins) for JavaScript linting and a [Stylelint editor plugin](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/complementary-tools.md#editor-plugins) for CSS linting. Both of these support auto-fix on save.


## Releasing a new version

*(You can do all the steps on github.com)*

- Change `version` [here](https://github.com/wulkano/kap/blob/master/app/package.json#L4) to the new version
- Go to https://github.com/wulkano/kap/releases
- Click `Draft a new release`
- Write the new version, prefixed with `v`, in the `Tag version` field (Example: `v2.0.0`)
- Leave the `Release title` field blank
- Write release notes
- Click `Publish release`
- CircleCI will now build the app and add the binaries to the release


## Releasing a new beta version

- Check out the `beta` branch: `git checkout beta`
- Rebase from the `master` branch: `git pull --rebase origin master`
- Change the `version` number in `app/package.json`
- Ammend the "Beta build customizations" commit: `git add . && git commit --amend`
- Force push to the `beta` branch: `git push --force`
- Tag a release with the version number in package.json and push it: `git tag -a "v2.0.0-beta.3" -m "v2.0.0-beta.3" && git push --follow-tags`
- Wait for CircleCI to add the binaries to a new GitHub Releases draft
- Go to the release draft that is created for you, check `This is a pre-release`, and press `Publish release`
