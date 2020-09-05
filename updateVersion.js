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
const readVersion = ()=>{
    const packageFile = path.join(__dirname, 'version.json');
    return new Promise((resolve,reject)=> {
        fs.readFile(packageFile, 'utf-8', async function (err, data) {
            if (err) {
                reject(new Error(`version.json文件读取失败`))
            } else {
                const versionData = JSON.parse(data)
                resolve(versionData)
            }
        })
    })
}
const readPk = ()=>{
    const packageFile = path.join(__dirname, 'package.json');
    return new Promise((resolve,reject)=> {
        fs.readFile(packageFile, 'utf-8', async function (err, data) {
            if (err) {
                reject(new Error(`package.json文件读取失败`))
            } else {
                const packageData = JSON.parse(data)
                resolve(packageData)
            }
        })
    })
}
const writeInPk =  (version)=>{
    return  new Promise(async (resolve,reject)=>{
        const pkData = await readPk()
        pkData.version = version
        fs.writeFile('./package.json', JSON.stringify(pkData), function(err) {
            if (err) {
                reject(new Error(`package.json文件更新失败`))
            }else{
                resolve({
                    version:version
                })
            }
        });
    })
}
const writeInVerion = async (version)=>{
    return  new Promise(async (resolve,reject)=>{
        const versionData = await readVersion()
        let key = ''
        if(publishType==='ori'){
            versionData[version] = {}
        }else if(publishType==='dev'){
            key = 'beta'
        }else if(publishType==='pre'){
            key = 'alpha'
        }
        let nextVersion = `${version}`
        let nowEndVersion = 0
        if(key==='beta'||key==='alpha'){
            if(versionData[version]){
                if(versionData[version][key]&&versionData[version][key].length){
                    nowEndVersion = versionData[version][key].length
                    versionData[version][key].push(nowEndVersion)
                }else{
                    versionData[version][key] = [nowEndVersion]
                }
            }else{
                versionData[version][key] = [nowEndVersion]
            }
            nextVersion = `${version}-${key}.${nowEndVersion}`
        }

        fs.writeFile('./version.json', JSON.stringify(versionData), function(err) {
            if (err) {
                reject(new Error(`version.json文件更新失败`))
            }else{
                let publishVersion = version
                if(publishType==='ori'){
                    publishVersion = version
                }else if(publishType==='dev'){
                    publishVersion = nextVersion
                }else if(publishType==='pre'){
                    publishVersion = nextVersion
                }else if(publishType==='prod'){
                    publishVersion = version
                }
                resolve({
                    version:publishVersion
                })
            }
        });
    })
}
const updataAllVersion = (version)=>{
    writeInPk(version).then(()=>{
        writeInVerion(version).then(()=>{
            console.log('版本更新成功')
            process.exit()
        }).catch((error)=>{
            console.log(error.message||'版本记录失败')
        })
    }).catch((error)=>{
        console.log(error.message||'package.json更新失败')
    })
}
const initCommand = async ()=>{
    const versionData = await readVersion()
    const lastKeyArr = Object.keys(versionData)
    const lastKey = lastKeyArr[lastKeyArr.length - 1]
    let keyArr = lastKey.split('.')
    let keyNum = keyArr[keyArr.length-1]
    keyNum = parseInt(keyNum,10)+1
    const suggestVersion = `${keyArr[0]}.${keyArr[1]}.${keyNum}`
    let wrongStep = 0
    process.stdout.write(`发布版本号'${suggestVersion}'?(y/n):`);
    process.stdin.on('data',async (data)=>{
        data=data.toString().trim();
        if(wrongStep===0){
            if(data==='Y'||data==='y'){
                //确认是该版本号
                updataAllVersion(suggestVersion)
                //updateOfficialVersion(options.updateOfficialVersion,options)
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
                let nowOfficialVersion = await readPk()
                const rightOnOff = versionCompare(nowOfficialVersion.version,data)
                if(rightOnOff){
                    updataAllVersion(data)
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
const main = async ()=>{
    if(publishType==='ori'){
        //创建版本
        process.stdin.setEncoding('utf8');
        initCommand()
    }else if(publishType==='dev'||publishType==='pre'){
        const versionData = await readVersion()
        const lastKeyArr = Object.keys(versionData)
        const mainVersion = lastKeyArr[lastKeyArr.length-1]
        writeInVerion(mainVersion).then((res)=>{
            writeInPk(res.version).then().catch((error)=>{
                console.log(error.message||'更新package.json失败')
            })
        }).catch((error)=>{
            console.log(error.message||'更新version.json失败')
        })
    }
}
main()
