import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import builtins from "rollup-plugin-node-builtins";
import json from "rollup-plugin-json";

const libraryName = "VueComponentAnalyzer";
const pkg = require("./package.json");

export default {
  input: pkg.main,
  output: {
    file: `dist/${libraryName}.js`,
    format: "cjs",
    exports: "auto"
  },
  plugins: [resolve({ preferBuiltins: true }), commonjs(), json(), builtins()]
};
