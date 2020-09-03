#!/bin/bash

function obtain_git_branch {
  br=`git branch | grep "*"`
  echo ${br/* /}
}
result=`obtain_git_branch`
echo Current git branch is $result
git add ./
git commit -m $result
git push
