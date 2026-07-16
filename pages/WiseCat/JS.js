const speechBubble = document.getElementById("speechBubble");
const cat = document.getElementById("cat");
const book = document.getElementById("book");
const usersText = document.getElementById("usersText");
let usersAnswer;


///////////////////////////////////////// АНИМАЦИИ /////////////////////////////////////////
let typingTimeout;
const say = (text, animation = speakingAnim) => {
    const words = text.split(" ")
    speechBubble.textContent = "";
    
    animation.on();
    clearTimeout(typingTimeout);
    
    let i = 0;
    function type() {
        if (i < words.length) {
            const span = document.createElement("span");
            span.textContent = words[i] + " ";
            speechBubble.append(span);
            
            typingTimeout = setTimeout(type, delay(words[i]));
            // typingTimeout = setTimeout(type, 10);
            i++;
            
        } else {
            animation.off();
        }
    }
    function delay(word) {
        let delay = 50 + word.length * 20;
        
        // паузы на знаках
        if (word.includes(",")) delay += 200;
        if (word.includes(".")) delay += 600;
        if (word.includes("...")) delay += 1500;
        
        return delay;
    }
    type();
}


const speakingAnim = {
    // isAinm : false,
    on() {
        readingAnim.off();

        cat.classList.add("speak");
        // this.isAinm = true;
    },
    off() {
        cat.classList.remove("speak");
        // this.isAinm = false;
    }
}

const readingAnim = {
    // isAinm : false,
    on(){
        speakingAnim.off();

        cat.classList.add("speak");
        book.classList.remove("levitate");
        book.classList.add("reading");
        // this.isAinm = true;
    },
    off() {
        cat.classList.remove("speak");
        book.classList.remove("reading");
        book.classList.add("levitate");
        // this.isAinm = false;
    }
}
///////////////////////////////////////// АНИМАЦИИ /////////////////////////////////////////

///////////////////////////////////////// ВИКИПЕДИЯ /////////////////////////////////////////
const getRandomWikiText = async () => {
    try {
        const res = await fetch(
            `https://${LANG}.wikipedia.org/api/rest_v1/page/random/summary`
        );
        
        if (!res.ok) {
            throw new Error(`Ошибка сервера: ${res.status}`);
        }
        
        const data = await res.json();
        return data.extract;
    } catch (error) {
        console.error("Не удалось получить статью:", error.message);
        return "Сервис Википедии временно недоступен.";
    }
};

async function searchWikipedia(query) {
    // Поиск статьи
    const searchResponse = await fetch(
        `https://${LANG}.wikipedia.org/w/api.php?origin=*&action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`
    );

    const searchData = await searchResponse.json();

    if (!searchData.query.search.length) {
        return "Удивительно, такого в книге нет...";
    }

    const page = searchData.query.search[0];

    // Получение текста статьи
    const pageResponse = await fetch(
        `https://${LANG}.wikipedia.org/w/api.php?origin=*&action=query&prop=extracts&pageids=${page.pageid}&explaintext=1&exintro=1&format=json`
    );

    const pageData = await pageResponse.json();

    return pageData.query.pages[page.pageid].extract;
}
///////////////////////////////////////// ВИКИПЕДИЯ /////////////////////////////////////////

///////////////////////////////////////// ДИАЛОГ /////////////////////////////////////////
let LANG = "ru";

const dialog = {
    
    START : {
        text() {
            return "Привет! На каком языке ты лучше разговариваешь? Если на русском напиши РУССКИЙ в поле ниже и нажми на кнопку чтоб отправить. Hi! What is your preferred language? If it's English, type ENGLISH in the field below and click the button to submit.";
        },
        OTHER() {
            if (usersAnswer.toLowerCase().trim() == "русский") {
                LANG = "ru";
                return "FIRST";
            }
            if (usersAnswer.toLowerCase().trim() == "english") {
                LANG = "en";
                return "FIRST";
            }
            return "START";
        }
    },

    FIRST : {
        text() {
            return {
                ru: "Отлично, с языком разобрались, давай знакомится. Я - мудрая кошка и у меня есть книга с интересными фактами со всего мира, а тебя как зовут?",
                en: "Great, we've figured out the language! Let's get acquainted. I'm a wise cat, and I have a book full of fascinating facts from all over the world. What's your name?"
            }[LANG];
        },
        OTHER() { return "SECOND"; }
    },

    SECOND : {
        text() {
            return {
                ru: "Какое красивое имя! Приятно познакомиться. Хочешь услышать интересный факт из моей книги?",
                en: "What a beautiful name! Nice to meet you. Would you like to hear an interesting fact from my book?"
            }[LANG];
        },
        YES() { return "WIKI"; },
        NO() { return "END"; },
        OTHER() { return "SEARCH"; }
    },

    IDLE : {
        text() {
            return {
                ru: "Не хочешь узнать еще один интересный факт?",
                en: "Would you like to hear another interesting fact?"
            }[LANG];
        },
        YES() { return "WIKI"; },
        NO() { return "END"; },
        OTHER() { return "SEARCH"; }
    },

    END : {
        text() {
            return {
                ru: "Ладно, было весело!",
                en: "Alright, that was fun!"
            }[LANG];
        },
        OTHER() { return "START"; }
    },
    
    WIKI : {
        async text() {
            const articleText = await getRandomWikiText();
            return articleText + {
                ru: " Как интересно! Хочешь еще?",
                en: " How interesting! Would you like another one?"
            }[LANG];
        },
        animation : readingAnim,
        YES() { return "WIKI"; },
        NO() { return "END"; },
        OTHER() { return "SEARCH"; }
    },

    SEARCH : {
        async text() {
            const articleText = await searchWikipedia(usersAnswer);
            return articleText + {
                ru: " Как интересно! Хочешь еще?",
                en: " How interesting! Would you like another one?"
            }[LANG];
        },
        animation : readingAnim,
        YES() { return "WIKI"; },
        NO() { return "END"; },
        OTHER() { return "SEARCH"; }
    },
    
    UNRECOGNIZED : {
        text() {
            return {
                ru: "Не пойму что ты имеешь ввиду, может хочешь узнать один интересный факт?",
                en: "I'm not sure what you mean. Would you like to hear an interesting fact instead?"
            }[LANG];
        },
        YES() { return "WIKI"; },
        NO() { return "END"; },
        OTHER() { return "UNRECOGNIZED"; }
    }
    
};
///////////////////////////////////////// ДИАЛОГ /////////////////////////////////////////

///////////////////////////////////////// ОБРАБОТКА И ОТВЕТ /////////////////////////////////////////
let action = dialog.START;
say(action.text());

const think = async () => {
    usersAnswer = document.getElementById("usersText").value;
    // console.log("--------------");
    // console.log("Current handleMessage result: " + action[handleMessage(usersAnswer)]);
    // console.log("--------------");

    if(action?.[handleMessage(usersAnswer)]) {
        action = dialog[action[handleMessage(usersAnswer)]()];
    } else {
        if(action?.OTHER) {
            action = dialog[action.OTHER()];    
        } else {
            action = dialog.UNRECOGNIZED;
        }
    }

    if(action?.text) {
        if(action?.animation) {
            say(await action.text(), action.animation);
        } else {
            say(await action.text());
        }
    } else {
        say({
                ru: "Эээ, на такой случай у меня нет реплики...",
                en: "Umm, I don't have a script for this..."
            }[LANG]);
    }
}

function handleMessage(usersAnswer) {
    usersAnswer = usersAnswer.toLowerCase().trim();
    usersAnswer = " " + usersAnswer + " ";

    for (const value of {
        ru: [' да ', ' до ', ' давай ', ' конечно ', ' канешна '],
        en: [' yes ', ' yeah ', ' yep ', ' yup ', ' sure ', ' ok ', ' okay ', ' of course ', ' definitely ']
    }[LANG]) {
        if (usersAnswer.includes(value)) return "YES";
    }

    for (const value of {
        ru: [' нет ', ' не ', ' ни '],
        en: [' no ', ' nope ', ' nah ', ' never ', ' not ']
    }[LANG]) {
        if (usersAnswer.includes(value)) return "NO";
    }

    return "OTHER";
}
///////////////////////////////////////// ОБРАБОТКА И ОТВЕТ /////////////////////////////////////////
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", () => { 
    think() 
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.repeat) {
        think()
    }
});