const path = require('path'); //系统路径模块
const fs = require('fs'); //文件模块


const checkNowVersion = ()=>{
    const packageFile = path.join(__dirname, 'version.json'); //文件路径，__dirname为当前运行js文件的目录
    return new Promise((resolve,reject)=>{
        fs.readFile(packageFile, 'utf-8', function (err, data) {
            if (err) {
                reject(new Error(`-----=====文件读取失败`))
            } else {
                const versionData = JSON.parse(data)
                const lastKeyArr = Object.keys(versionData)
                const lastKey = lastKeyArr[lastKeyArr.length-1]
                const nowVersionArr = versionData[lastKey]
                const nowVersion = nowVersionArr[nowVersionArr.length-1]
                const versionStr = nowVersion.toString()
                const nowEndVersionArr = versionStr.split('.')
                let nowEndVersion = parseInt(nowEndVersionArr[nowEndVersionArr.length-1],10)
                nowEndVersion+=1
                let suggestVersion = ''
                let originalVersion = `${nowEndVersionArr[0]}.${nowEndVersionArr[1]}`
                if(versionStr.indexOf('beta')!==-1){
                    suggestVersion=`${originalVersion}.${nowEndVersionArr[2]}.${nowEndVersion}`
                }else if(versionStr.indexOf('alpha')!==-1){
                    suggestVersion=`${originalVersion}.${nowEndVersionArr[2]}.${nowEndVersion}`
                }else{
                    suggestVersion = `${originalVersion}.${nowEndVersion}`
                }
                resolve({
                    suggestVersion
                })

            }
        });
    })
}
const checkSuggestVersion = async ()=>{
    const suggestVersion = await checkNowVersion()
    console.log(suggestVersion)
}
checkSuggestVersion()
