
var idsTitles = {}

var usingSlider = false
var chooseListPage = 1

var currentPlayList = []
var currentPlayListNames = []
var currentPlayListName = ""

var playingIndex = 0
var shufflePlayIndexList = []
var priorityPlay = []
var currentMode = null
var playRate = 1
var played = []
var backPlayrn = 0
var playingId = ""
var step = 1

var prepareCombineLists = []
var combineListPart = {} // name: [start, end]

function fixedWindow(){
    window.resizeTo(600, 840)
}

fixedWindow()

window.onresize = fixedWindow

function preparing(event){
    let prepare = document.getElementById("prepare");
    prepare.style.opacity = "0"
    eel._log("hey")
    setTimeout(()=>{
        prepare.style.display = "none";
        eel._log("prepare stop display")
    }, 400)
    event.target.playVideo();
    player.setVolume(36)
    let timeSlider = document.getElementById("time-control");
    let state = document.getElementById("state")
    let progress = document.getElementById("time-progress")
    setInterval(()=>{
        state.innerText = timeFormat(player.getCurrentTime())
        progress.value = Math.floor(player.getCurrentTime())
        if (usingSlider === false){
            timeSlider.value = Math.floor(player.getCurrentTime())
        }
    },1000)
    let musicList = document.getElementById("musicList")
    musicList.innerHTML = `<i id="add-folder" class="fas fa-plus" onclick="showListNameInput()"></i>`
    loadLists()
    eel._log("playDefault")
}

function hideTitle(){
    eel._log("hie");
    let title = document.getElementById("TITLE");
    let searchLine = document.getElementById("searchLine");
    title.style.opacity = "0";
    searchLine.style.opacity="1";
    searchLine.style.transform = "translate(0px, -7px)";
}

function showTitle(){
    eel._log("show");
    let title = document.getElementById("TITLE");
    title.style.opacity = "1";
}

function searchLineBlur(){
    eel._log("searchLineBlur");
    let searchLine = document.getElementById("searchLine");
    searchLine.style.borderTop = "solid #C799CC 1px"
    let searchBox = document.getElementById("searchInput")
    searchBox.removeEventListener('keydown', searchValue, false)
}

function searchInput(){
    eel._log("inputing");
    let searchLine = document.getElementById("searchLine");
    let searchBox = document.getElementById("searchInput")
    searchBox.addEventListener('keydown', searchValue, false)
    searchLine.style.borderTop = "solid #C799CC 4px"
}

function searchValue(e){
    if(e.keyCode != 13){
        return
    }
    let value = document.getElementById("searchInput").value;
    if (value === ""){
        return
    }
    document.getElementById("musicList").style.opacity = 0
    document.getElementById("searchInput").blur()
    eel._log("[keywords] " + value);
    getSearchResponse(value)
    return
}

async function getSearchResponse(keywords){
    eel._log("hey")
    let musicList = document.getElementById("musicList")
    musicList.innerHTML = `<div style="text-align: center"><h1>Searching <b>${keywords}</b>...<br>Please wait</h1></div>`
    let responses = await eel.search(keywords)()
    eel._log("get responses")
    let musicTable = document.getElementById("musicList");
    musicTable.innerHTML = ""
    idsTitles = {}
    loadMusics(responses)
    return
}

function loadMusics(musics){
    let musicTable = document.getElementById("musicList")
    let url
    let index = 0
    for(const music of musics){
        url = "'"+music.url+"'"
        musicTable.innerHTML += `<div><div id=${url} class="musicTable" onclick="next(${url}, '${music}', undefined, undefined, '${music.title}', ${music.hour}, ${music.minute}, ${music.second})"><img src=${music.thumbnail} class="titlePhoto"/><h3 class="musicTitle">${music.title}</h3><p class="description">${music.hour}:${music.minute}:${music.second}</p></div><i class="fas fa-plus" onclick="addSongChooseList(${url})"></i></div>`
        url = music.url
        idsTitles[url] = {
            "title": music.title,
            "hour": music.hour,
            "minute": music.minute,
            "second": music.second,
            "url": url,
            "thumbnail": music.thumbnail
        }
        index++
    }
    musicTable.innerHTML += '<div class="you-cant-see-me-border">Made by Dreamyee 2022.01.01</div>'
    musicList.style.opacity = 1
}

async function loadMusicsInList(musics, listName){
    let musicTable = document.getElementById("musicList")
    let index = 0
    let rate = 1
    let order = await eel.getListOrder(listName)()
    if(order==="reversed"){
        musics.reverse()
        step = -1
        index = musics.length-1
    }else{
        step = 1
    }
    for(const music of musics){
        rate = music.rate || 1
        musicTable.innerHTML += `
        <div id='${music.url}_table'>
            <div id='${music.url}' class="musicTableInList${listName===currentPlayListName&&music.url===playingId ? ' playing' : ''}" onclick="next('${music.url}', '${music}', '${listName}', ${index}, '${music.title}', ${music.hour}, ${music.minute}, ${music.second})">
                <img src=${music.thumbnail} class="titlePhoto"/>
                <h3 class="musicTitle">${music.title}</h3>
                <p class="description">${music.hour}:${music.minute}:${music.second}</p>
            </div>
            <div class="sideButtonPosition sideButtonRight">
                <div id="${music.url}_priority" class="sideButton${priorityPlay.includes(index)&&listName===currentPlayListName? ' priority' : ''}" onclick="priority(${index}, '${music.url}')">優先播放</div>
                <div class="sideButton removeButton" ondblclick="remove('${listName}', '${music.url}')">雙擊刪除</div>
            </div>
            <div class="sideButtonPosition sideButtonLeft">
                <div id="${music.url}_rate" class="sideButton customRate" onclick="customRate('${listName}', '${music.url}')">${rate}倍速</div>
                <div class="sideButton">${index+1}</div>
            </div>
        </div>
        `
        index += step
    }
    musicTable.innerHTML += '<div class="you-cant-see-me-border">Made by Dreamyee 2022.01.01</div>'
    musicList.style.opacity = 1
}

async function loadLists(){
    let musicList = document.getElementById("musicList");
    musicList.style.opacity = 0
    setTimeout(async _=>{
        let lists = await eel.getPlayLists()()
        musicList.innerHTML = '<i id="add-folder" class="fas fa-plus" onclick="showListNameInput()"></i>'
        for(const list of lists){
            musicList.innerHTML += `
            <div id="${list}">
                <div class="listTable" onclick="enterList('${list}')">
                    <h3>${list}</h3>
                </div>
                <div class="listButton editListButton" onclick="showListEditInput('${list}')">編輯名稱</div>
                <div class="listButton removeListButton" onclick="showApplyRemoveButton('${list}')">刪除清單</div>
            </div>    
            `;
        }
        musicList.innerHTML += '<div class="you-cant-see-me-border">Made by Dreamyee 2022.01.01</div>'
        musicList.style.opacity = 1
    }, 100)
}

function showListNameInput(){
    let element = document.getElementById("list-name-input-div")
    let inputZone = document.getElementById("list-name-input")
    inputZone.focus()
    element.style.zIndex = 999
    element.style.opacity = 1
}

async function listNameInput(e){
    
    let element
    if(e.keyCode === 27){
        element = document.getElementById("list-name-input")
        element.removeEventListener("keydown", listNameInput, false)
        element.value = ""
        element = document.getElementById("list-name-input-div")
        element.style.opacity = 0
        element.style.zIndex = -9
        return
    }else if(e.keyCode != 13){
        return
    }
    element = document.getElementById("list-name-input")
    let value = document.getElementById("list-name-input").value;
    if(value === ""){
        return
    }
    let lists = await eel.getPlayLists()()
    if(lists.includes(value)){
        eel._log("hey")
        let inputElement = document.getElementById("list-name-input-div")
        inputElement.style.transition = "background-color 0.05s"
        inputElement.style.backgroundColor = "#FF5656"
        setTimeout(()=>{
            inputElement.style.transition = "background-color 1.5s"
            inputElement.style.backgroundColor = "azure"
        }, 50)
        return
    }
    element.removeEventListener("keydown", listNameInput, false)
    element.value = ""
    eel.addList(value)
    element = document.getElementById("list-name-input-div")
    element.style.opacity = 0
    element.style.zIndex = -1
    loadLists()
}

function focusListInput(){
    let element = document.getElementById("list-name-input")
    element.addEventListener("keydown", listNameInput, false)
}

async function enterList(name){
    eel._log("fuck")
    let element = document.getElementById("musicList")
    element.style.opacity = 0
    setTimeout(async _=>{
        let musics = await eel.getPlayDatas(name)()
        element.innerHTML = `
        <p id="listName">${name}</p>
        <div class="modeChooseBoard">
            <div id="shuffleNoRepeat" class="modeChooseButton${currentMode==='shuffleNoRepeat' && name===currentPlayListName ? ' modeButtonChoosen' : ''}" onclick="playMode('shuffleNoRepeat')">隨機不重複</div>
            <div id="normalShuffle" class="modeChooseButton${currentMode==='normalShuffle' && name===currentPlayListName ? ' modeButtonChoosen' : ''}" onclick="playMode('normalShuffle')">單次全部隨機</div>
            <div id="singleLoop" class="modeChooseButton${currentMode==='singleLoop' && name===currentPlayListName ? ' modeButtonChoosen' : ''}" onclick="playMode('singleLoop')">單曲循環</div>
        </div>
        <div class="modeChooseBoard">
            <div id="reversedLoop" class="modeChooseButton${currentMode==='reversedLoop' && name===currentPlayListName ? ' modeButtonChoosen' : ''}" onclick="playMode('reversedLoop')">反向循環</div>
            <div id="playRateChange" class="modeChooseButton" onclick="changePlayRate()">1倍播放</div>
            <div id="combineList" class="modeChooseButton" onclick="showCombineListBoard('${name}')">清單合併</div>
        </div>
        <div class="modeChooseBoard">
            <div id="reversedLoop" class="modeChooseButton" onclick="reverseMusicList('${name}')">排列顯示反轉</div>
            <div id="playRateChange" class="modeChooseButton" onclick="uploadList('${name}')">取得複製代碼</div>
            <div id="playRateChange" class="modeChooseButton" onclick="showInputCopyCode('${name}')">清單輸入</div>
        </div>
        `
        // shuffleNoRepeat
        // normalShuffle
        // singleLoop
        loadMusicsInList(musics, name)
    }, 100)
    
}

function playMode(mode){
    let element
    if(currentMode !== null){
        switch(currentMode){
            case "shuffleNoRepeat":
                element = document.getElementById("shuffleNoRepeat")
                shufflePlayIndexList = []
                element.classList.remove("modeButtonChoosen")
                break
            case "normalShuffle":
                element = document.getElementById("normalShuffle")
                element.classList.remove("modeButtonChoosen")
                break
            case "singleLoop":
                element = document.getElementById("singleLoop")
                element.classList.remove("modeButtonChoosen")
                break
            case "reversedLoop":
                element = document.getElementById("reversedLoop")
                element.classList.remove("modeButtonChoosen")
                break
        }
    }
    if(currentMode === mode){
        currentMode = null
        return
    }
    currentMode = mode
    switch(mode){
        case "shuffleNoRepeat":
            element = document.getElementById("shuffleNoRepeat")
            shufflePlayIndexList = Array.from(new Array(currentPlayList.length).keys())
            element.classList.add("modeButtonChoosen")
            break
        case "normalShuffle":
            element = document.getElementById("normalShuffle")
            element.classList.add("modeButtonChoosen")
            break
        case "singleLoop":
            element = document.getElementById("singleLoop")
            element.classList.add("modeButtonChoosen")
            break
        case "reversedLoop":
            element = document.getElementById("reversedLoop")
            element.classList.add("modeButtonChoosen")
            break
        }
        return
}

function changePlayRate(){
    let playRateChange = document.getElementById("playRateChange")
    playRate = playRate === 2 ? 0.25 : playRate + 0.25
    playRateChange.innerHTML = `${playRate}倍播放`
    if(currentPlayListName!==""&&currentPlayList[playingIndex]["rate"]!==undefined){
        player.setPlaybackRate(playRate*currentPlayList[playingIndex]["rate"])
    }else{
        player.setPlaybackRate(playRate)
    }
}

function priority(musicIndex, id){
    let element = document.getElementById(`${id}_priority`)
    element.classList.toggle("priority")
    if(!priorityPlay.includes(musicIndex)){
        priorityPlay.push(musicIndex)
    }else{
        let index = priorityPlay.indexOf(musicIndex)
        priorityPlay.splice(index, index+1)
    }
}

async function addSongChooseList(url, page){
    let currentPage = page || 1
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.display = "block"
    setTimeout(_=>{
        grayBackground.style.opacity = 1
    }, 100)
    if(url!==undefined){
        document.addEventListener("keydown", cancelAddSongChooseListListener, false)
    }else{
        document.addEventListener("keydown", applyCombineList, false)
    }
    let lists = await eel.getPlayLists()()
    grayBackground.innerHTML = `<div id="chooseListBorder" style="position: relative; top: 8%;">${addSongChooseListMaker(lists, currentPage, url)}</div>`
}

function addSongChooseListMaker(lists, page, url){
    let html = ""
    let totalPage = Math.ceil(lists.length / 16)
    let listsRange = lists.length < 16*page ? lists.slice(16*(page-1)) : lists.slice(16*(page-1), 16*page)
    for(let i=0;i<listsRange.length;i+=2){
        if(url===undefined){
            if(listsRange[i] === currentPlayListName){
                i -= 1
                continue
            }
            html += `<div id=${listsRange[i]} class="column" onclick="combineListBoard('${listsRange[i]}')">${listsRange[i]}</div>`
            if(listsRange[i+1] === undefined){
                html += `<div class="column" style="opacity: 0;">ㄔㄐㄐ</div>`   
            }else{
                if(listsRange[i+1]===currentPlayListName){
                    continue
                }
                html += `<div id=${listsRange[i+1]} class="column" onclick="combineListBoard('${listsRange[i+1]}')">${listsRange[i+1]}</div>`
            }
        }else{
                html += `<div class="column" onclick="addSong('${listsRange[i]}', '${url}')">${listsRange[i]}</div>`
            if(listsRange[i+1] === undefined){
                html += `<div class="column" style="opacity: 0;">ㄔㄐㄐ</div>`
            }else{
                html += `<div class="column" onclick="addSong('${listsRange[i+1]}', '${url}')">${listsRange[i+1]}</div>`
            }
        }
    }
    if(totalPage!==1){
        let previous = page === 1 ? totalPage : page-1
        let next = page === totalPage ? 1 : page+1
        html += `
        <div class="column listPageChange" onclick="addSongChooseList('${url}', ${previous})">⬅️第${previous}頁</div>
        <div class="column listPageChange" onclick="addSongChooseList('${url}', ${next})">第${next}頁➡️</div>
        `
    }
    
    return html
}

function addSong(listName, url){
    eel.addSong(listName, url, idsTitles[url])
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.opacity = 0
    setTimeout(_=>{
        grayBackground.style.display = "none"
    }, 400)
    document.removeEventListener("keydown", cancelAddSongChooseListListener, false)
    let successfulTextElement = document.getElementById("successfulSave")
    successfulTextElement.innerHTML = `${idsTitles[url].title} 已加入 ${listName}`
    successfulTextElement.style.display = "block"
    setTimeout(_=>{
        successfulTextElement.style.opacity = 1
        setTimeout(_=>{
            successfulTextElement.style.opacity = 0
            setTimeout(_=>{
                successfulTextElement.style.display = "none"
            }, 200)
        }, 3000)
    }, 150)
}

function cancelAddSongChooseListListener(e){
    if(e.keyCode === 27){
        let grayBackground = document.getElementById("grayCover")
        grayBackground.style.opacity = 0
        setTimeout(_=>{
            grayBackground.style.display = "none"
        }, 400)
        document.removeEventListener("keydown", cancelAddSongChooseListListener, false)
        return
    }
    return
}

async function startPlayDatas(names){
    let list
    console.log(names)
    for(const name of names){
        
        list = await eel.getPlayDatas(name)()
        currentPlayList = currentPlayList.concat(list)
    }
}

async function showCombineListBoard(listName){
    currentPlayListName = listName
    currentPlayListNames.push(listName)
    let list = await eel.getPlayDatas(listName)()
    currentPlayList = list
    addSongChooseList()
}

function combineListBoard(listName){
    let element = document.getElementById(listName)
    element.classList.toggle("combineListChosen")
    if(element.classList.contains("combineListChosen")){
        prepareCombineLists.push(listName)
    }else{
        let index = prepareCombineLists.indexOf(listName)
        prepareCombineLists.splice(index, index+1)
    }
}

async function applyCombineList(e){
    let keyCode = e.keyCode
    if(keyCode !== 27){
        return
    }
    currentPlayListNames = [currentPlayListName]
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.opacity = 0
    setTimeout(_=>{
        grayBackground.style.display = "none"
    }, 400)
    if(prepareCombineLists.length === 0){
        grayCover.removeEventListener("keydown", applyCombineList, false)
        return
    }
    document.removeEventListener("keydown", applyCombineList, false)
    startPlayDatas(prepareCombineLists)
    for(const listName of prepareCombineLists){
        currentPlayListNames.push(listName)
    }
    let successfulTextElement = document.getElementById('successfulSave')
    prepareCombineLists = []
    successfulTextElement.innerHTML = `成功變更清單合併`
    if(currentMode === "shuffleNoRepeat"){
        successfulTextElement.innerHTML += `<br>隨機順序將重洗, 已播放歌曲移除紀錄`
        playingIndex = shufflePlayIndexList[Math.floor(Math.random()*shufflePlayIndexList.length)]
    }
    successfulTextElement.style.display = "block"
    setTimeout(_=>{
        successfulTextElement.style.opacity = 1
        setTimeout(_=>{
            successfulTextElement.style.opacity = 0
            setTimeout(_=>{
                successfulTextElement.style.display = "none"
            }, 200)
        }, 3000)
    }, 150)
}

function backward(){
    console.log("fuckyou")
    backPlayrn -= 1
    playingIndex -= 1
    if(backPlayrn<0){
        return
    }
    next(played[backPlayrn]["url"], undefined, currentPlayListName, playingIndex, played[backPlayrn]["title"], played[backPlayrn]["hour"], played[backPlayrn]["minute"], played[backPlayrn]["second"])
}

function forward(){
    console.log("fuckyou")
    if(currentPlayList.length === 0){
        return
    }else if(backPlayrn !== played.length-1){
        backPlayrn++
        next(played[backPlayrn]["url"], undefined, currentPlayListName, playingIndex, played[backPlayrn]["title"], played[backPlayrn]["hour"], played[backPlayrn]["minute"], played[backPlayrn]["second"])    
    }
    let fuck = {data: 0}
    onStateChange(fuck)
}

async function remove(listName, id){
    let element = document.getElementById(`${id}_table`)
    element.style.transition = "opacity 0.5s"
    setTimeout(_=>{
        element.style.opacity = "0"
        setTimeout(_=>{
            element.style.display = "none"
        }, 550)
    }, 200)
    currentPlayList = await eel.removeSong(listName, id)()
}

function editListener(e, originalListName){
    console.log(originalListName)
    let keyCode = e.keyCode
    if(keyCode!==13&&keyCode!==27){
        return
    }
    console.log(keyCode)
    let editNameInput = document.getElementById("editNameInput")

    let grayBackground = document.getElementById("grayCover")
    
    value = editNameInput.value
    if(keyCode===13 && value!==""){
        editListName(originalListName, value)
    }
    grayBackground.style.opacity = "0"
    setTimeout(_=>{
        grayBackground.style.display = "none"
    }, 400)
    editNameInput.removeEventListener('keydown', editListener, false)

}

function showListEditInput(originalListName){
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.display = "block"
    setTimeout(_=>{
        grayBackground.style.opacity = "1"
    }, 200)
    grayBackground.innerHTML = `
        <div id="editName">
            <p>更名: <input id="editNameInput" onblur="grayCoverBlur()"></p>
        </div>
    `
    let editNameInput = document.getElementById("editNameInput")
    editNameInput.focus()
    editNameInput.addEventListener('keydown', e=>{
        editListener(e, originalListName)
    }, false)
}


function editListName(originalListName, newListName){
    eel.editListName(originalListName, newListName)()
    loadLists()
}

function showApplyRemoveButton(listName){
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.display = "block"
    setTimeout(_=>{
        grayBackground.style.opacity = "1"
    }, 200)
    grayBackground.innerHTML = `
        <div id="applyRemoveButton" onclick="applyRemove('${listName}')">
            你要確定欸
        </div>
    `
    document.addEventListener("keydown", cancelRemove, false)
}

function applyRemove(listName){
    let element = document.getElementById(listName)
    element.style.transition = "opacity 0.5s"
    setTimeout(_=>{
        element.style.opacity = "0"
        setTimeout(_=>{
            element.style.display = "none"
        }, 550)
    }, 200)
    grayCoverBlur()
    eel.removeList(listName)
}

function cancelRemove(e){
    console.log(e.keyCode)
    if(e.keyCode===27){
        grayCoverBlur()
        document.removeEventListener("keydown", cancelRemove, false)
    }
}

function grayCoverBlur(){
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.opacity = "0"
    setTimeout(_=>{
        grayBackground.style.display = "none"
    }, 400)
}

async function customRate(listName, musicId){
    nowRate = await eel.customRate(listName, musicId)()
    let element = document.getElementById(`${musicId}_rate`)
    element.innerHTML = `${nowRate}倍速`
    if(currentPlayListName!==""&&currentPlayList[playingIndex]["url"]===musicId){
        player.setPlaybackRate(playRate*nowRate)
    }
}

async function reverseMusicList(listName){
    let list = await eel.reverseList(listName)()
    enterList(listName)
    loadMusicsInList(list, listName)
}

function showInputCopyCode(listName){
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.display = "block"
    setTimeout(_=>{
        grayBackground.style.opacity = "1"
    }, 200)
    grayBackground.innerHTML = `
        <div id="codeName">
            <p>代碼: <input id="codeNameInput" onblur="grayCoverBlur()"></p>
        </div>
    `
    let editNameInput = document.getElementById("codeNameInput")
    editNameInput.focus()
    this.copyListenerOperator = (e) => {
        copyCodeListener(e, listName, editNameInput.value)
    }
    editNameInput.addEventListener('keydown', this.copyListenerOperator, false)
}

async function copyCodeListener(e, listName, code){
    if(e.keyCode===13){
        getCopyList(listName, code)
    }else if(e.keyCode!==27){
        return
    }
    grayCoverBlur()
    let editNameInput = document.getElementById("codeNameInput")
    editNameInput.replaceWith(editNameInput.cloneNode(true))
}

async function getCopyList(listName, code){
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.display = "block"
    setTimeout(_=>{
        grayBackground.style.opacity = "1"
        grayBackground.innerHTML = `
            <div id="uploadCode">
                請稍後...
            </div>
        `
    }, 200)
    let musics = await eel.downloadList(listName, code)()
    grayCoverBlur()
    enterList(listName)
    loadMusicsInList(musics, listName)
}

async function uploadList(listName){
    let grayBackground = document.getElementById("grayCover")
    grayBackground.style.display = "block"
    setTimeout(_=>{
        grayBackground.style.opacity = "1"
        grayBackground.innerHTML = `
            <div id="uploadCode">
                請稍後...
            </div>
        `
    }, 200)
    code = await eel.updateList(listName)()
    grayBackground.innerHTML = `
        <div id="uploadCode">
            請記錄下來你的複製代碼:<br>${code}<br><b>該代碼只可使用一次, 若需再使用則重新點擊即可<b>
        </div>
    `
    document.addEventListener("keydown", cancelRemove, false)
}


// .
// .
// .
// .
// Fuck YouTube Player
// Fuck it
// .
// .
// .
// .

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady(){
  player = new YT.Player('player', {
    height: '3',
    width: '4',
    videoId: 'Kx-FdsDoUsQ',
    disablekb: 0,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onStateChange
    }
  });
}

function onPlayerReady(event){
  setTimeout(() => {
      eel._log("onPlayerReady")
      preparing(event)
  }, 500);
}

function onStateChange(event){
    if(event.data === 0 && currentPlayList.length !== 0){
        let musicTable = document.getElementById(currentPlayList[playingIndex]["url"])
        if(musicTable!==null){
            musicTable.classList.remove("playing")
        }
        let index
        if(priorityPlay.length!==0){
            index = priorityPlay[0]
            priorityPlay.shift()
            let element = document.getElementById(`${currentPlayList[index]["url"]}_priority`)
            element.classList.remove("priority")
            next(currentPlayList[index]["url"], currentPlayList[index], currentPlayListName, index, currentPlayList[index]["title"], currentPlayList[index]["hour"], currentPlayList[index]["minute"], currentPlayList[index]["second"])    
            return
        }else{
            switch(currentMode){
                case "shuffleNoRepeat":
                    if(shufflePlayIndexList.length === 0){
                        shufflePlayIndexList = Array.from(new Array(currentPlayList.length).keys())
                        index = shufflePlayIndexList.indexOf(playingIndex)
                        shufflePlayIndexList.splice(index, index+1)
                    }
                    index = Math.floor(Math.random()*shufflePlayIndexList.length)
                    playingIndex = shufflePlayIndexList[index]
                    shufflePlayIndexList.splice(index, index+1)

                    break
                case "normalShuffle":
                    let nowPlaying = playingIndex
                    while(playingIndex === nowPlaying){
                        playingIndex = Math.floor(Math.random()*currentPlayList.length)
                    }
                    break
                case "singleLoop":
                    break
                case "reversedLoop":
                    playingIndex = playingIndex === 0 ? currentPlayList.length-step : playingIndex - step
                    break
                case null:
                    playingIndex = playingIndex + step === currentPlayList.length ? 0 : playingIndex + step
                    break
            }
        }
        if(playingIndex === -1){
            playingIndex = currentPlayList.length - 1
        }else if(playingIndex===currentPlayList.length){
            playingIndex = 0
        }
        next(currentPlayList[playingIndex]["url"], currentPlayList[playingIndex], currentPlayListName, playingIndex, currentPlayList[playingIndex]["title"], currentPlayList[playingIndex]["hour"], currentPlayList[playingIndex]["minute"], currentPlayList[playingIndex]["second"])
    }
}

function next(id, _, playListName, index, title, hour, minute, second){
    if(playListName!==undefined){
        player.setPlaybackRate(playRate)
        if(playListName!==currentPlayListName){
            currentPlayListName = playListName
            currentPlayListNames = []
            currentPlayList = []
        }
        if(!currentPlayListNames.includes(playListName)){
            currentPlayListNames = currentPlayListNames.concat(playListName)
            startPlayDatas(currentPlayListNames)
        }
    }else{
        currentPlayList = []
        currentPlayListNames = []
        currentMode = null
        shufflePlayIndexList = []
        priorityPlay = []
    }
    playingId = id
    playingIndex = index
    player.loadVideoByUrl("http://www.youtube.com/v/" + id)
    let playButton = document.getElementById("play||pause")
    let nameDisplay = document.getElementById("playing")
    let timeControl = document.getElementById("time-control")
    let totalTime = document.getElementById("total")
    let totalMinutes = parseInt(hour, 10)*60 + parseInt(minute, 10)
    totalMinutes = totalMinutes.toString()
    let formatSecond = parseInt(second)-1
    let progress = document.getElementById("time-progress")
    let musicTable = document.getElementById(id)
    let endPlay = document.getElementsByClassName("playing")[0]
    if(endPlay !== undefined){
        endPlay.classList.remove("playing")
    }
    if(musicTable !== null){
        musicTable.classList.add("playing")
    }
    formatSecond = formatSecond.toString()
    if(formatSecond.length === 1){
        formatSecond = "0" + formatSecond
    }
    totalTime.innerHTML = totalMinutes + ":" + formatSecond
    totalSec = totalSecond(hour, minute, second)
    timeControl.setAttribute("max", totalSec-1)
    timeControl.value = 0
    progress.value = 0
    progress.setAttribute("max", totalSec-1)
    playButton.classList.replace("fa-play", "fa-pause")
    nameDisplay.innerHTML = title
    setTimeout(_=>{
        played.push(currentPlayList[playingIndex])
        backPlayrn = played.length - 1
        if(currentPlayList[playingIndex]["rate"]!==undefined){
            player.setPlaybackRate(currentPlayList[playingIndex]["rate"]*playRate)
        }else{
            player.setPlaybackRate(playRate)
        }
    }, 500)
}

function playOrPause(){
    let data = player.getVideoData()
    if(data["video_id"] === "Kx-FdsDoUsQ"){
        return
    }
    let playButton = document.getElementById("play||pause")
    if("fa-play" === playButton.classList[1]){
        playButton.classList.replace("fa-play", "fa-pause")
        player.playVideo()
    }else{
        playButton.classList.replace("fa-pause", "fa-play")
        player.pauseVideo()
    }
}

function totalSecond(hour, minute, second){
    hour = parseInt(hour, 10)
    minute = parseInt(minute, 10)
    second = parseInt(second, 10)
    return hour*3600 + minute*60 + second
}

function timeFormat(currentSecond){
    if(currentSecond === 0){
        return "loading..."
    }
    let minute = parseInt(currentSecond/60)
    let second = parseInt(currentSecond%60)
    second = second.toString()
    if(second.length === 1){
        second = "0" + second.toString()
    }
    return minute + ":" + second
}

function jump(){
    let timeSlider = document.getElementById("time-control")
    let jumpTime = parseInt(timeSlider.value, 10)
    player.seekTo(jumpTime)
}

// .
// .
// Volume
// .
// .

function mouseUsingSlider(){
    usingSlider = true
}

function mouseStopUsingSlider(){
    usingSlider = false
    let progress = document.getElementById("time-progress")
}

function focusVolumn(){
    let body = document.getElementsByTagName("body")[0]
    body.style.overflow = "hidden"
    window.onmousewheel = controlVolumn
}

function blurVolumn(){
    let body = document.getElementsByTagName("body")[0]
    body.style.overflow = "unset"
    window.onmousewheel = null
}

function controlVolumn(e){
    e = e || window.event;
    let volume = player.getVolume()
    let volumeDisplay = document.getElementById("volumeDisplay")
    volumeDisplay.style.transition = "unset"
    if(e.wheelDelta >= 0){
        player.setVolume(volume+1)
    }else{
        player.setVolume(volume-1)
    }
    volumeDisplay.style.opacity = "1"
    volumeDisplay.innerText = player.getVolume()
    volumeDisplay.style.display = "unset"
    volumeDisplay.style.fontSize = "220px"
    setTimeout(()=>{
        volumeDisplay.style.transition = "font-size 0.3s, opacity 0.5s"
        volumeDisplay.style.fontSize = "150px"
        volumeDisplay.style.opacity = "0"
    }, 50)
    setTimeout(()=>{
        volumeDisplay.style.opacity = "0"
    }, 450)
}

