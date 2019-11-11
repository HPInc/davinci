#!/usr/bin/env sh

# abort on errors
set -e

# build
npm rebuild node-sass
npm run docs:build

ls | grep -v docs | xargs rm -r
cp -rlf ./docs/.vuepress/dist/* ./
rm -r ./docs

git config --global user.email "circleci@hp.com"
git config --global user.name "Circle CI"
git add -A
git commit --allow-empty -am "Update Docs"
git push
