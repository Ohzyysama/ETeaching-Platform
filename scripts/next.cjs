/* eslint-disable */
// Next.js CLI wrapper: apply the exFAT fs shim to this process AND to any
// child processes Next spawns (webpack workers), then delegate to the CLI.
"use strict";

require("./patch-fs.cjs");

const path = require("path");
const flag = `--require=${path.join(__dirname, "patch-fs.cjs")}`;
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS
  ? `${process.env.NODE_OPTIONS} ${flag}`
  : flag;

require("next/dist/bin/next");
