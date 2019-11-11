#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run docs:build

# navigate into the build output directory
cd docs/.vuepress/dist

git init
git config --global user.email "circleci@oneflowsystems.com"
git config --global user.name "Circle CI"
git add -A
git commit --allow-empty -am "Update Docs"


cd -
