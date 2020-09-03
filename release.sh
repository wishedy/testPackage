#!/bin/bash
current=`date "+%Y-%m-%d %H:%M:%S"`
timeStamp=`date -d "$current" +%s`
currentTimeStamp=$((timeStamp*1000+10#`date "+%N"`/1000000)) #将current转换为时间戳，精确到毫秒

function obtain_git_branch {
  br=`git branch | grep "*"`
  echo ${br/* /}
}
result=`obtain_git_branch`
echo Current git branch is $result
git add ./
git commit -m '$currentTimeStamp'
git push --set-upstream origin $result
