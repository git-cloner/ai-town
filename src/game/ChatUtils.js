/*var conversationHistory = {
    "npc_01": [
        "你好",
        "最近怎么样？", "还不错！",
        "准备去哪？"
    ]
};*/

var conversationHistory = {};
const startWords = "当在小镇遇到熟人，聊{topic}，随机写一个开始话题";
const chatTemplate = '当在小镇遇到熟人，聊{topic}，熟人说：" {prevanswer}"，随机写一个回答'

export const getPrompt = (characterName, topic) => {
    var history = conversationHistory[characterName];
    var prompt = startWords.replace('{topic}', topic);
    var prevAnswer = "";

    if (history !== undefined) {
        prevAnswer = conversationHistory[characterName][conversationHistory[characterName].length - 1];
        prompt = chatTemplate.replace('{prevanswer}', prevAnswer).replace('{topic}', topic);
    }
    return prompt;
}

export const getPrevAnser = (characterName) => {
    var history = conversationHistory[characterName];
    if (history !== undefined) {
        return conversationHistory[characterName][conversationHistory[characterName].length - 1];
    } else {
        return "";
    }
}

export const addHistory = (characterName, answer) => {
    if (!conversationHistory[characterName]) {
        conversationHistory[characterName] = [];
    }
    conversationHistory[characterName].push(answer);
}

export const callGpt = (prompt) => {
    var modelname = "ChatGLM-6b";
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('post', 'https://gitclone.com/aiit/codegen_stream/v2');
        xhr.setRequestHeader('Content-Type', 'application/json');
        var context = JSON.stringify({
            "context": {
                "prompt": prompt,
                "history": []
            },
            "modelname": modelname
        });

        xhr.onload = function () {
            if (xhr.status === 200) {
                var json = JSON.parse(xhr.response);
                resolve(json);
            } else {
                reject("Request failed with status: " + xhr.status);
            }
        };

        xhr.onerror = function () {
            reject("Request failed");
        };

        xhr.send(context);
    });
}