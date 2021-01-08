function initialize_genius() {
    let url = new URL("https://api.genius.com/oauth/authorize");
    let options = {
            "client_id": "4w_T6z86ikWmWAL4VCgvfUKJfQDWYTqVvGt-q1bBywqpM9BzLFYQFiLxZAwwYnJT", 
            "scope": "me create_annotation",
            "response_type": "token",
            "state": ""
    }
    for (e in options) {
        url.searchParams.append(e, options[e]);
    }
    window.location = url.href;
}

function create_cookie(access_token) {
    document.cookie = "access_token=" + access_token;
}

function read_cookies() {
    return document.cookie;
}

function get_cookie_value(cookies, key) {
    let split_cookies = cookies.split("; ");
    for (i in split_cookies) {
        let cookie = split_cookies[i].split("=");
        let cookie_key = cookie[0];
        if (cookie_key == key) {
            return cookie[1];
        }
    }
    return null;
}

function extract_access_token(url) {
    return url.split("&")[0].substring(14);
}

function get_access_token() {
    let cookies = read_cookies();
    let access_token = get_cookie_value(cookies, "access_token");
    if (!access_token) {
        if (window.location.hash) {
            let access_token = extract_access_token(window.location.hash.toString());
            create_cookie(access_token);
        }
        else {
            initialize_genius();
        }
    } 
    return access_token;
}

function filter_title(title) {
    let forbidden = ["[", "("];
    let char;
    for (i in forbidden) {
        char = forbidden[i];
        if (title.includes(char)) {
            return title.split(char)[0];
        }
    }
    return title;
}

function get_title() {
    let elements = document.getElementsByClassName("title style-scope ytd-video-primary-info-renderer");
    return elements[0].firstChild.innerText;
}

function create_description_element(text, type="span") {
    let element = document.createElement(type);
    element.innerText = "\n" + text;
    return element;
}

function add_element(description, text, type="span") {
    let element = create_description_element(text, type);
    description.appendChild(element);
    return element;
}

function prepare_description() {
    let description_div = document.getElementById("description");
    let new_div = document.createElement("div");
    new_div.id = "lyrics";
    description_div.insertAdjacentElement("afterend", new_div);
    return new_div;
}

function delete_previous_lyrics() {
    status.innerText = "";
    lyrics_element.innerText = "";
}

async function search(access_token, query) {
    let response = await fetch("https://api.genius.com/search?q=" + query, {
        headers: {"Authorization": "Bearer " + access_token}
    });
    let json = await response.json();
    if (!json["response"]["hits"]["length"]) {
        return null;
    } 
    return json;
}

async function get_lyrics(url) {
    let response = await fetch(url);
    let text = await response.text();
    let parser = new DOMParser();
    let wrapper = parser.parseFromString(text, "text/html");
    let lyrics = wrapper.querySelector("p");
    return lyrics.innerText;
}

function watching() {
    return window.location.href.includes("watch?v=");
}

async function click() {
    let new_query = input.value;
    update(new_query);
}

function init() {
    if (watching()) {
        let description = prepare_description();
        let elements = [
            script_name, status, wrong_lyrics, input, button, seperator, lyrics_element
        ];
        for (i in elements) {
            description.appendChild(elements[i]);
        }
        clearInterval(init_interval);
    }
}

async function update(full_title) {
    delete_previous_lyrics();

    let title = filter_title(full_title);
    let json = await search(access_token, title);
    if (!json) {
        status.innerText = "Lyrics not found."; 
        status.removeAttribute("href");
        return;
    }

    let url_path = json["response"]["hits"][0]["result"]["path"];
    let full_path = "https://genius.com" + url_path;

    status.innerText = full_path;
    status.href = full_path;

    let lyrics = await get_lyrics(full_path);
    lyrics_element.innerText = lyrics;
}

async function main() {
    if (watching()) {
        let full_title = get_title();
        if (previous_title == full_title) {
            return;
        }
        previous_title = full_title;
        update(full_title);
    }
}

let previous_title = "";
let access_token = get_access_token();

let script_name = create_description_element("\nYTLyrics\n");

let status = create_description_element("", "a");
status.href = "";

let wrong_lyrics = create_description_element("Wrong Lyrics?\n");

let input = document.createElement("input");
input.setAttribute("type", "input");
input.style.width = "200px";

let button = document.createElement("input");
button.setAttribute("type", "button");
button.setAttribute("value", "Submit");
button.onclick = click;
button.style.width = "100px";
button.style.height = "25px";

let seperator = create_description_element("\n");

let lyrics_element = create_description_element("");

setInterval(main, 1000);
let init_interval = setInterval(init, 1000);
