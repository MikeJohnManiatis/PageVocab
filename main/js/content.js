class DomInteractor {
    translations_performed = 0;
    node_array = []
    text_array = [];
    original_word;
    constructor(){}

    init() {
        this.build_p_array($('*'), this.text_array.sort(function(a,b) { return (a.length < b.length ? 1 : -1)}));
        this.original_word = this.selectRandomWord(3);
    }
    
    /* This function will select a word from top half of array (most lengthiest half),
        ensuring a good candidate is chosen. 
    */
    selectRandomWord(wordLength) {
        if(this.text_array.length > 0) {
            let text_to_choose_random_word_from = this.text_array
                [getRandomInt(Math.floor(this.text_array.length/2))]            
                .replace(/[^a-zA-Z\s]/g, "")
                .split(" ")
                .filter(x => x.length > wordLength);
            return text_to_choose_random_word_from[getRandomInt(text_to_choose_random_word_from.length-1)];    
        }
    }

    build_p_array(node, text_array)
    {
        this.build_array_helper(node, text_array);
        node = node.firstChild;
        while (node)
        {
            build_p_array(node, text_array);
            node = node.nextSibling;
        }
    }

    build_array_helper(node, text_array) {
        node.each(i => {
            if(node[i].firstChild != null && (node[i].tagName == 'P') && !(anchorTagFound(node[i]))) {
                this.node_array.push(node[i]);
                text_array.push(node[i].innerText);
            }
        })

    }
    
    translateAndReplaceWord(word_to_translate) {
        var self = this;
        chrome.runtime.sendMessage(({wordToTranslate: word_to_translate}), function(translated_word) {
            self.replaceWordNew(self.node_array, translated_word, word_to_translate);
        });
    }

    replaceWordNew(node_array, translated_word, word_to_translate) {
        console.log(translated_word);
        console.log(word_to_translate);
        const regex = new RegExp("(\\b"+word_to_translate+"\\b|\\b" +capitalize(word_to_translate)+"\\b"+lower(word_to_translate)+"\\b)(?![^<]*?<\/a>)(?!([^<]+)?>)", 'g');
        for(var node in node_array) {
            var currentElem = $(node_array[node]);
            currentElem
                .html(currentElem
                        .html()
                        .replace(regex, (regex,'<mark class="page-vocab-tooltip" id="pageVocabToolTip">' + translated_word + '<span class="page-vocab-tooltiptext">'+ word_to_translate +'</span> </mark>')));

        }   
    }

    undoTranslation(original_word) {
        var translated_nodes = document.getElementsByClassName('page-vocab-tooltip');
        var count = translated_nodes.length-1;
        $.each(translated_nodes, function (i) {
            translated_nodes[count].outerHTML = '<span>' + original_word + '<span>';
            count--;
        });

        this.beginTranslate()
    }
    
    beginTranslate() {
        this.original_word = this.selectRandomWord(3);
        if(this.original_word != "" && this.original_word != undefined){
            this.translateAndReplaceWord(this.original_word.trim());
        }
        translationsPerformed++;
    }
}
const domInteractor = new DomInteractor();
 
/*
 This variable, translationsPerformed, is important as it will prevent users from 
 swapping tabs and causing duplicate translations to the 'active' tab.
*/
let translationsPerformed = 0; 
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "translatePage") {
        if(translationsPerformed >= 1) {
            domInteractor.undoTranslation(domInteractor.original_word);
        }
        else {
            domInteractor.init();
            domInteractor.beginTranslate();
        }
    }
 });


/*
    ####################################################### Script Utility
*/
function checkString(text, string) {
    if (text.includes(string)){
        return true;
    }
    else if (text.includes(capitalize(string))) {
        return true;
    }
    else if (text.includes(lower(string))) {
        return true;
    }
    else {
        return false;
    }
}
function capitalize(string) {
    if (string[0] != null)
        return string.charAt(0).toUpperCase() + string.slice(1);
}
function lower(string) {
    if (string[0] != null)
        return string.charAt(0).toLowerCase() + string.slice(1);
}
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


function anchorTagFound(elm) {
    var anchor = false;
    for(var i = 0; i < elm.childNodes.length; i++){
        if (elm.childNodes[i].tagName == 'A') {
            anchor = true;
            break;
        }
    }
    return anchor;
}
