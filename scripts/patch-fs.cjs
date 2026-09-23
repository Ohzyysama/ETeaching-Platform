/* eslint-disable */
// exFAT filesystem shim for Node.
//
// On exFAT drives (e.g. a portable SSD), fs.readlink[Sync] throws EISDIR for
// ordinary files instead of the usual EINVAL ("not a symlink"). Next.js/webpack
// call readlink to detect symlinks during the build, which would otherwise
// crash. Convert EISDIR -> EINVAL, the correct "this is a regular file" signal.
"use strict";

const fs = require("fs");

function notASymlink(p) {
  const e = new Error(`EINVAL: invalid argument, readlink '${p}'`);
  e.code = "EINVAL";
  e.errno = -22;
  e.syscall = "readlink";
  e.path = p;
  return e;
}

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (p, ...rest) {
  try {
    return origReadlinkSync.call(this, p, ...rest);
  } catch (e) {
    if (e && e.code === "EISDIR") throw notASymlink(p);
    throw e;
  }
};

const origReadlink = fs.readlink;
fs.readlink = function (p, ...rest) {
  const cb = typeof rest[rest.length - 1] === "function" ? rest[rest.length - 1] : null;
  if (cb) {
    return origReadlink.call(this, p, ...rest.slice(0, -1), (err, ...res) => {
      if (err && err.code === "EISDIR") cb(notASymlink(p));
      else cb(err, ...res);
    });
  }
  return origReadlink.call(this, p, ...rest).catch((e) => {
    if (e && e.code === "EISDIR") throw notASymlink(p);
    throw e;
  });
};

if (fs.promises) {
  const origPromReadlink = fs.promises.readlink;
  fs.promises.readlink = function (p, ...rest) {
    return origPromReadlink.call(this, p, ...rest).catch((e) => {
      if (e && e.code === "EISDIR") throw notASymlink(p);
      throw e;
    });
  };
}
