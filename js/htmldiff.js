/**
 * 对比生成两个文档，推荐使用这种
 * ignore_tag 不进行对比的标签，格式示例：[{openTag: "table", closeTag: "/table"},{openTag: "span class='sectionnumspan'", closeTag: "/span"}]
 * Diff_Timeout 超时时间，0为不对计算进行限制，
 */
var HtmlDiff = function() {
    this.ignore_tag = []
    this.Diff_Timeout = 0
}

HtmlDiff.prototype.diff_launch = function(html1, html2) {
    var text1 = this.convertTextFromHtml(html1);
    var text2 = this.convertTextFromHtml(html2);

    var dmp = new diff_match_patch();
    dmp.Diff_Timeout = this.Diff_Timeout;
    var ms_start = (new Date).getTime();
    var diff = dmp.diff_main(text1, text2, true);
    var ms_end = (new Date).getTime();

    // if (diff.length > 2) {
    //     dmp.diff_cleanupSemantic(diff);
    // }

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
    let oldDiffHtml = this.restoreToHtml(html1, oldDiff)
    let newDiffHtml = this.restoreToHtml(html2, newDiff)
    return {time, oldDiffHtml, newDiffHtml}
}

HtmlDiff.prototype.restoreToHtml = function(originalHtml, diffResultList) {
    let diffHtml = ''
    while (true) {
        let {tag, text} = this.getOneTextFromHtml(originalHtml)
        diffHtml += tag
        originalHtml = originalHtml.substr(tag.length + text.length)
        for (let i = 0,len=diffResultList.length; i < len; i++) {
            let diffType = diffResultList[i][0]
            let diffText = diffResultList[i][1]
            if (diffText === text) {
                diffHtml += this.formatText(diffType, diffText)
                diffResultList.splice(i,1)
                break
            }
            if (diffText.length > text.length) {
                diffHtml += this.formatText(diffType, text)
                diffResultList[i][1] = diffText.substr(text.length)
                break
            }
            if (text.length > diffText.length) {
                diffHtml += this.formatText(diffType, diffText)
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

HtmlDiff.prototype.convertTextFromHtml = function(html) {
    let text = ''
    let tagFlag = false
    this.ignore_tag.map(item => {
        item.flag = false
    })
    for (let i=0,len=html.length;i<len;i++) {
        if (!tagFlag && html[i] === '<') {
            tagFlag = true
            this.ignore_tag.map(item => {
                if (html.substr(i+1, item.openTag.length) == item.openTag) {
                    item.flag = true
                }
            })
        } else if (tagFlag && html[i] === '>') {
            tagFlag = false
            this.ignore_tag.map(item => {
                if (item.flag && html.substring(i-item.closeTag.length, i) == item.closeTag) {
                    item.flag = false
                }
            })
            continue
        }
        let notDiffFlag = false
        this.ignore_tag.map(item => {
            if (item.flag) {
                notDiffFlag = true
            }
        })
        if (!tagFlag && !notDiffFlag) {
            text += html[i]
        }
    }
    return text
}

HtmlDiff.prototype.getOneTextFromHtml = function(html) {
    let tag = ''
    let text = ''
    let tagFlag = false
    this.ignore_tag.map(item => {
        item.flag = false
    })
    for (let i=0,len=html.length;i<len;i++) {
        if (!tagFlag && html[i] === '<') {
            tagFlag = true
            if (text) {
                return {tag, text}
            }
            this.ignore_tag.map(item => {
                if (html.substr(i+1, item.openTag.length) == item.openTag) {
                    item.flag = true
                }
            })
        } else if (tagFlag && html[i] === '>') {
            tagFlag = false
            tag += html[i]
            this.ignore_tag.map(item => {
                if (item.flag && html.substring(i-item.closeTag.length, i) == item.closeTag) {
                    item.flag = false
                }
            })
            continue
        }
        let notDiffFlag = false
        this.ignore_tag.map(item => {
            if (item.flag) {
                notDiffFlag = true
            }
        })
        if (!tagFlag && !notDiffFlag) {
            text += html[i]
        } else {
            tag += html[i]
        }
    }
    return {tag, text}
}

HtmlDiff.prototype.formatText = function(diffType, diffText) {
    if (diffType === 0) {
        return diffText
    } else if (diffType === -1) {
        return '<del>' + diffText + '</del>'
    } else {
        return '<ins>' + diffText + '</ins>'
    }
}

this.HtmlDiff = HtmlDiff;