# Gitlab CLI Extension
Merging and rebasing PRs is just a click away.

![Screenshot](/screenshot.jpg)

## Setting up the extension - server
1. `yarn build`
2. `cd dist/server`
3. `vi config.json`

```json
{
  "repos": [
    {
      "url": <home-page-url-of-the-gitlab-repo>,
      "path": <absolute-path-of-the-repo-on-your-system>
    }
  ]
}
```

4. `yarn start`

## Setting up the extension - client
1. go to `chrome://extensions`
2. turn on the `developer mode` toggle
3. `Load unpacked`
4. select `dist/extension`

### example of `config.json`
```json
{
  "repos": [
    {
      "url": "https://gitlab.com/gitlab-org/gitlab-foss",
      "path": "/Users/chicho17/repos/gitlab-foss"
    },
    {
      "url": "https://gitlab.com/inkscape/inkscape",
      "path": "/Users/chicho17/repos/inkscape"
    }
  ]
}
```

### It's highly recommended that you DO NOT use your existing local repo but instead clone afresh at a different path and use that path in your `config.json`.