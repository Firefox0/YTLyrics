function initialize_genius() {
    // The user will get redirected to genius to login and then
    // approve the application to get an access token.
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
    // Get a specific value from cookies.
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
    // Try to get an access token.
    // If an access token is unavailable then the user
    // will get redirected to genius.
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
    // Filter unnecessary parts of the title to increase
    // the chance of getting proper results from genius.
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
    // Get the youtube title of a video.
    let elements = document.getElementsByClassName("title style-scope ytd-video-primary-info-renderer");
    return elements[0].firstChild.innerText;
}

function prepare_description() {
    // Create a section to load all the lyrics elements.
    let description_div = document.getElementById("description");
    let new_div = document.createElement("div");
    new_div.id = "lyrics";
    description_div.insertAdjacentElement("afterend", new_div);
    return new_div;
}

function delete_previous_lyrics() {
    // Clear some elements of the previous lyrics.
    source.innerText = "";
    lyrics_element.innerText = "";
}

async function search(access_token, query) {
    // 
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
    // Scrape the lyrics from a genius website.
    let response = await fetch(url);
    let text = await response.text();
    let parser = new DOMParser();
    let wrapper = parser.parseFromString(text, "text/html");
    let lyrics = wrapper.querySelector("p");
    return lyrics.innerText;
}

function watching() {
    // Check if user is watching a video.
    return window.location.href.includes("watch?v=");
}

async function click() {
    // Use query from text input to update the description.
    let new_query = input.value;
    update(new_query);
}

function init() {
    // Append elements to the description.
    // Elements persist even when you are clicking on a new video.
    // So instead of reloading the elements you can just manipulate them.
    if (watching()) {
        let description = prepare_description();
        let elements = [
            script_name, hint, input, button, seperator, song, source, lyrics_element
        ];
        for (i in elements) {
            description.appendChild(elements[i]);
        }
        clearInterval(init_interval);
    }
}

async function update(full_title) {
    // Update the description.
    delete_previous_lyrics();
    song.innerText = "Loading...";
    let title = filter_title(full_title);
    let json = await search(access_token, title);
    if (!json) {
        song.innerText = "Lyrics not found."; 
        return;
    }
    let song_title  = json["response"]["hits"][0]["result"]["full_title"] + "\n"
    song.innerText = song_title;
    let url_path = json["response"]["hits"][0]["result"]["path"];
    let full_path = "https://genius.com" + url_path + "\n";
    source.innerText = full_path + "\n";
    source.href = full_path;
    let lyrics = await get_lyrics(full_path);
    lyrics_element.innerText = lyrics;
}

async function main() {
    // Check if user is watching a new video.
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

let script_name = document.createElement("h3")
script_name.innerText = "\nYTLyrics";

let source = document.createElement("a");
let hint = document.createElement("span")
hint.innerText = "Search:\n";

let input = document.createElement("input");
input.setAttribute("type", "input")
input.style.width = "200px"
input.style.height = "17px";

let button = document.createElement("input");
button.setAttribute("type", "button");
button.setAttribute("value", "Submit")
button.onclick = click
button.style.width = "80px"
button.style.height = "25px";

let seperator = document.createElement("span")
seperator.innerText = "\n";

let song = document.createElement("span");
let lyrics_element = document.createElement("span");

setInterval(main, 1000);
let init_interval = setInterval(init, 1000);
