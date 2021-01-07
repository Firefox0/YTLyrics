function get_title() {
    let elements = document.getElementsByClassName("title style-scope ytd-video-primary-info-renderer");
    let title = elements[0].firstChild.innerText;
    return title;
}

function get_description_box() {
    return document.getElementsByClassName("content style-scope ytd-video-secondary-info-renderer")[0];
}

function create_description_element(text) {
    let element = document.createElement("span");
    element.className = "style-scope yt-formatted-string";
    element.dir = "auto";
    element.innerHTML = "\n" + text;
    return element;
}

function add_lyrics(text) {
    let description_box = get_description_box();
    let credits = create_description_element("\nYTLyrics Version 0.1")
    description_box.appendChild(credits);
    let description_element = create_description_element(text);
    description_box.appendChild(description_element);
}

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

function extract_access_token(url) {
    return url.split("&")[0].substring(14);
}

async function search(access_token, query) {
    console.log(query);
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
    let p_tags = wrapper.getElementsByTagName("p");
    return p_tags[0].innerText;
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

async function init() {
    let cookies = read_cookies();
    let access_token = get_cookie_value(cookies, "access_token");
    if (!access_token && window.location.hash) {
        let access_token = extract_access_token(window.location.hash.toString());
        create_cookie(access_token);
    } 
    if (access_token && window.location.href.includes("watch?v=")) {
        let title = get_title();
        let json = await search(access_token, title);
        if (!json) {
            add_lyrics("Lyrics couldn't be found.");
            return;
        }
        let url_path = json["response"]["hits"][0]["result"]["path"];
        let full_path = "https://genius.com" + url_path;
        let lyrics = await get_lyrics(full_path);
        console.log(lyrics);
        add_lyrics(lyrics);
    }
    else {
        initialize_genius();
    }
}

setTimeout(init, 2000);
