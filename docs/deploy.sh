#!/usr/bin/env sh

# abort on errors
set -e

ssh-keyscan github.com >> ~/.ssh/known_hosts

# build
npm rebuild node-sass
npm run docs:build

git config --global user.email "circleci@hp.com"
git config --global user.name "Circle CI"
git checkout package-lock.json
git add docs/.vuepress/dist/ -f
git checkout gh-pages
git pull

ls | grep -v docs | xargs rm -r
cp -rf ./docs/.vuepress/dist/* ./
rm -r ./docs

git add .
git commit --allow-empty -am "Update Docs [skip ci]"
git push
