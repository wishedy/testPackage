#!/bin/bash
currentTimeStamp=$(date "+%Y%m%d%H%M%S")

function obtain_git_branch {
  br=`git branch | grep "*"`
  echo ${br/* /}
}
result=`obtain_git_branch`
echo Current git branch is $result
git add ./
git commit -m 'feat: '$currentTimeStamp
git push --set-upstream origin $result
npm publish
