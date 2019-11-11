#!/usr/bin/env sh

# abort on errors
set -e

ssh-keyscan github.com >> ~/.ssh/known_hosts

# build
npm rebuild node-sass
npm run docs:build

ls | grep -v docs | xargs rm -r
cp -rlf ./docs/.vuepress/dist/* ./
rm -r ./docs

git config --global user.email "circleci@hp.com"
git config --global user.name "Circle CI"
git checkout gh-pages -f
git add -A
git commit --allow-empty -am "Update Docs"
git push
