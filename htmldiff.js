function diff_launch(html1, html2) {
    var text1 = getTextFromHtml(html1);
    var text2 = getTextFromHtml(html2);

    var dmp = new diff_match_patch();
    dmp.Diff_Timeout = 0;
    var ms_start = (new Date).getTime();
    var diff = dmp.diff_main(text1, text2, true);
    var ms_end = (new Date).getTime();

    // if (diff.length > 2) {
    //     dmp.diff_cleanupSemantic(diff);
    // }
    console.log(diff)

    let time = ms_end - ms_start;

    let oldDiff = [];
    let newDiff = [];
    for (let i = 0,len=diff.length; i < len; i++) {
        if (diff[i][0] === 0) {
            oldDiff.push({...diff[i]})
            newDiff.push({...diff[i]})
        } else if (diff[i][0] === -1) {
            oldDiff.push({...diff[i]})
        } else {
            newDiff.push({...diff[i]})
        }
    }
    let oldDiffHtml = restoreToHtml(html1, oldDiff)
    let newDiffHtml = restoreToHtml(html2, newDiff)
    return {time, oldDiffHtml, newDiffHtml}
}
function restoreToHtml(originalHtml, diffResultList) {
    let diffHtml = ''
    while (true) {
        let {tag, text} = getOneTextFromHtml(originalHtml)
        diffHtml += tag
        originalHtml = originalHtml.substr(tag.length + text.length)
        for (let i = 0,len=diffResultList.length; i < len; i++) {
            let diffType = diffResultList[i][0]
            let diffText = diffResultList[i][1]
            if (diffText === text) {
                diffHtml += formatText(diffType, diffText)
                diffResultList.splice(i,1)
                break
            }
            if (diffText.length > text.length) {
                diffHtml += formatText(diffType, text)
                diffResultList[i][1] = diffText.substr(text.length)
                break
            }
            if (text.length > diffText.length) {
                diffHtml += formatText(diffType, diffText)
                text = text.substr(diffText.length)
                diffResultList.splice(i,1)
                i--
                len--
            }
        }
        if (!originalHtml || !diffResultList || diffResultList.length <= 0) {
            break
        }
    }
    return diffHtml + originalHtml
}
function getTextFromHtml(html) {
    let text = ''
    let tag = false
    for (let i=0,len=html.length;i<len;i++) {
        if (!tag && html[i] === '<') {
            tag = true
        } else if (tag && html[i] === '>') {
            tag = false
            continue
        }
        if (!tag) {
            text += html[i]
        }
    }
    return text
}
function getOneTextFromHtml(html) {
    let tag = ''
    let text = ''
    let flag = false
    for (let i=0,len=html.length;i<len;i++) {
        if (!flag && html[i] === '<') {
            flag = true
            if (text) {
                return {tag, text}
            }
        } else if (flag && html[i] === '>') {
            flag = false
            tag += html[i]
            continue
        }
        if (!flag) {
            text += html[i]
        } else {
            tag += html[i]
        }
    }
    return {tag, text}
}

function formatText(diffType, diffText) {
    if (diffType === 0) {
        return diffText
    } else if (diffType === -1) {
        return '<del>' + diffText + '</del>'
    } else {
        return '<ins>' + diffText + '</ins>'
    }
}

this.diff_launch = diff_launch