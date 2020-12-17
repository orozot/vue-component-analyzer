#!/usr/bin/env node
const { program } = require("commander");
const packageJson = require("package.json");
const initProcess = require("../src/index");

program
  .version(packageJson.version, "-v, --version")
  .option("-p, --path <filePath>", "output dependencies by root file")
  .option("-i, --ignore <moduleList>", "output dependencies by root file")
  .parse(process.argv);

const filePath = program.path;
const ignoreModule = program.moduleList ? program.moduleList.split(",") : [];

initProcess(filePath, ignoreModule);
