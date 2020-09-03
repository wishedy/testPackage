const path = require('path'); //系统路径模块
const fs = require('fs');
const publishType = process.argv.slice(2)[0]
const versionCompare = function (curr, promote) {
    let currVer = curr || '0.0.0';
    let promoteVer = promote || '0.0.0';
    if (currVer === promoteVer) return false;
    let currVerArr = currVer.split('.');
    let promoteVerArr = promoteVer.split('.');
    let len = Math.max(currVerArr.length, promoteVerArr.length);
    let proVal, curVal;
    for (var i = 0; i < len; i++) {
        proVal = ~~promoteVerArr[i];
        curVal = ~~currVerArr[i];
        if (proVal < curVal) {
            return false;
        } else if (proVal > curVal) {
            return true;
        }
    }
    return false;
};
const getVersionInfo = ()=>{
    const packageFile = path.join(__dirname, 'version.json');
    return new Promise((resolve,reject)=>{
        fs.readFile(packageFile, 'utf-8', async function (err, data) {
            if (err) {
                reject(new Error(`version.json文件读取失败`))
            } else {
                const versionData = JSON.parse(data)
                const lastKeyArr = Object.keys(versionData)
                const lastKey = lastKeyArr[lastKeyArr.length - 1]
                const nowVersionContainer = versionData[lastKey]
                let nowVersionArr = []
                let versionKey = ''
                let keyArr = lastKey.split('.')
                let keyNum = keyArr[keyArr.length-1]
                keyNum = parseInt(keyNum,10)+1
                if (publishType === 'dev') {
                    versionKey = 'beta'
                } else if (publishType === 'pre') {
                    versionKey = 'alpha'
                }
                if(publishType==='prod'){
                    resolve({
                        updateVersionData:versionData,
                        nowOfficialVersion:lastKey,
                        updateOfficialVersion:`${keyArr[0]}.${keyArr[1]}.${keyNum}`
                    })
                }else{
                    nowVersionArr = nowVersionContainer[versionKey]
                    let nowVersion = -1
                    if(nowVersionArr&&nowVersionArr.length>0){
                        nowVersion = nowVersionArr[nowVersionArr.length - 1]
                    }else{
                        nowVersionContainer[versionKey] = []
                        nowVersionArr = nowVersionContainer[versionKey]
                    }
                    let nowEndVersion = parseInt(nowVersion.toString(), 10)
                    nowEndVersion += 1
                    nowVersionArr.push(nowEndVersion)
                    const nextVersion = `${lastKey}-${versionKey}.${nowEndVersion}`
                    resolve({
                        publishVersion:nextVersion,
                        updateVersionData:versionData,
                        updateOfficialVersion:`${keyArr[0]}.${keyArr[1]}.${keyNum}`
                    })
                }
            }
        })
    })
}
const saveVersion =  ()=>{
    const packageFile = path.join(__dirname, 'version.json');
    return new Promise(async (resolve,reject)=>{
        const updateInfo = await getVersionInfo()
        if(publishType==='prod'){
            resolve({
                ...updateInfo
            })
        }else{
            //非正式环境
            fs.writeFile('./version.json', JSON.stringify(updateInfo.updateVersionData), function(err) {
                if (err) {
                    reject(new Error(`version.json文件更新失败`))
                }else{
                    const nextVersion = updateInfo.publishVersion
                    resolve({
                        ...updateInfo
                    })
                }
            })
        }
    })
}
const initCommand = (options)=>{
    let wrongStep = 0
    process.stdout.write(`发布版本号'${options.updateOfficialVersion}'?(y/n):`);
    process.stdin.on('data',(data)=>{
        data=data.toString().trim();
        if(wrongStep===0){
            if(data==='Y'||data==='y'){
                //确认是该版本号
                updateOfficialVersion(options.updateOfficialVersion,options)
            }else if(data==='n'||data==='N'){
                wrongStep=1
                process.stdout.write("请输入发布版本号:");
            }else{
                wrongStep=0
                process.stdout.write("请输入正确内容(y/n):");
            }
        }else if(wrongStep===1){
            data = data.replace(/[\'\"\\\/\b\f\n\r\t]/g, '');
            const reg = /^\d+\.\d+\.\d/g
            if(reg.test(data)){
                const rightOnOff = versionCompare(options.nowOfficialVersion,data)
                if(rightOnOff){
                    updateOfficialVersion(data,options)
                }else{
                    wrongStep=1
                    process.stdout.write("请输入正确的版本号:");
                }
            }else{
                wrongStep=1
                process.stdout.write("请输入正确的版本号:");
            }
        }
    })
}
const updateOfficialVersion = (version,originalData)=>{
    updatePackage(version).then((res)=>{
        console.log(originalData)
        const updateVersionData = originalData.updateVersionData
        updateVersionData[version] = {}
        fs.writeFile('./version.json', JSON.stringify(updateVersionData), function(err) {
            if (err) {
                console.log(new Error(`version.json文件更新失败`))
            }else{
                openShell()
            }
        })
    }).catch((error)=>{
        console.log(error)
    })
}
const updatePackage = (publishVersion)=>{
    const packageFile = path.join(__dirname, 'package.json');
    return new Promise((resolve,reject)=>{
        fs.readFile(packageFile, 'utf-8', function (err, data) {
            if (err) {
                reject(new Error(`package.json文件读取失败`))
            } else {
                const versionData = JSON.parse(data)
                versionData.version = publishVersion
                fs.writeFile('./package.json', JSON.stringify(versionData), function(err) {
                    if (err) {
                        reject(new Error(`package.json文件更新失败`))
                    }else{
                        resolve({
                            nextVersion:publishVersion
                        })
                    }
                });
            }
        })
    })
}
const savePackage = async ()=>{
    const config = await saveVersion()
    return new Promise(async (resolve,reject)=>{
        if(publishType==='prod'){
            resolve({
                prodCbk:initCommand,
                config:{...config}
            })
        }else{
            try {
                const res = await updatePackage(config.publishVersion)
                resolve(res)
            }catch (e) {
                reject(e)
            }

        }
    })
}
savePackage().then((res)=>{
    if(publishType==='prod'){
        process.stdin.setEncoding('utf8');
        res.prodCbk&&res.prodCbk({...res.config})
    }else{
        openShell()
        console.log(res.nextVersion)
    }
}).catch((error)=>{
    console.log(error.message||'package更新失败')
})
const openShell = ()=>{
    let id=1;
    //process.exit()
    const exec = require('child_process')
    exec.execFile('bash release.sh '+id+'',function(err, stdout, stderr){
        console.log(err, stdout, stderr)
    } )
}

