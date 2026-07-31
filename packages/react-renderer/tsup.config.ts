import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  async onSuccess() {
    // esbuild 把源文件里的 "use client" 当"module level directive"处理,打包时直接丢弃
    // (连 tsup 的 banner 选项都会被 esbuild 以同样理由拒绝插入,见构建时的警告)。
    // 这个包的组件全部是客户端交互(useState 等),没有需要保持纯服务端的文件,
    // 构建后直接在产物文件头物理写回这行指令,比逐文件用 preserve 注释更可靠。
    const { readFile, writeFile } = await import("node:fs/promises");
    for (const file of ["dist/index.js", "dist/index.cjs"]) {
      const content = await readFile(file, "utf8");
      if (!content.startsWith('"use client"')) {
        await writeFile(file, `"use client";\n${content}`);
      }
    }

    // 两份 CSS 产物,两种消费方式(见包 README):
    // - dist/styles.css  完整版(变量 + Tailwind base/components/utilities),给不用 Tailwind 的消费方
    // - dist/theme.css   只有变量,给已经用 Tailwind 的消费方(避免重复的 Tailwind base/reset)
    const { execSync } = await import("node:child_process");
    const { copyFile } = await import("node:fs/promises");
    execSync("npx tailwindcss -i src/styles.css -o dist/styles.css --minify", {
      stdio: "inherit",
    });
    await copyFile("src/theme.css", "dist/theme.css");
  },
});
