const esbuild = require("esbuild");

Promise.all([
  esbuild.build({
    entryPoints: ["src/extension/content.ts"],
    bundle: true,
    outfile: "dist/extension/content.js",
  }),
  esbuild.build({
    entryPoints: ["src/server/api.js"],
    bundle: true,
    outfile: "dist/server/api.js",
    platform: "node",
  }),
])
  .then(() => {
    const fs = require("fs");
    const filesToCopy = fs.readdirSync("src/extension/public");
    return Promise.all([
      ...filesToCopy.map((file) => {
        return new Promise((resolve) =>
          fs.copyFile(
            `src/extension/public/${file}`,
            `dist/extension/${file}`,
            resolve
          )
        );
      }),
      new Promise((res) => {
        const fs = require("fs");
        fs.copyFile(
          "./src/server/package.json",
          "./dist/server/package.json",
          res
        );
      }),
    ]);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
