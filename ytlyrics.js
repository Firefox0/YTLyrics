function filter_title(title) {
    // Filter unnecessary parts of the title to increase
    // the chance of getting proper results.
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

function get_youtube_title() {
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

async function search_duckduckgo(query) {
    // Return the href for the top genius result.
    let url = "https://html.duckduckgo.com/html/?q=" + query;
    let response = await fetch(url, {
        headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0"}
    });
    let text = await response.text();
    let parser = new DOMParser();
    let wrapper = parser.parseFromString(text, "text/html");
    let search_results = wrapper.getElementsByClassName("result__url");
    let current_url = "";
    for (i in search_results) {
        current_url = search_results[i].href;
        if (current_url.includes("genius.com")) {
            return current_url;
        }
    }
}

async function update(full_title) {
    // Update the description.
    delete_previous_lyrics();
    song.innerText = "Loading...\n";
    let title = filter_title(full_title);
    let top_result_url = await search_duckduckgo(title);
    source.innerText = top_result_url + "\n\n";
    source.href = top_result_url;
    let response = await fetch(top_result_url);
    let text = await response.text();
    let parser = new DOMParser();
    let wrapper = parser.parseFromString(text, "text/html");
    let genius_artist = wrapper.getElementsByClassName("header_with_cover_art-primary_info-primary_artist")[0].innerText;
    let genius_title = wrapper.getElementsByClassName("header_with_cover_art-primary_info-title")[0].innerText;
    song.innerText = genius_artist + " " + genius_title + "\n";
    let lyrics = wrapper.querySelector("p").innerText;
    lyrics_element.innerText = lyrics;
}

async function main() {
    // Check if user is watching a new video.
    if (watching()) {
        let full_title = get_youtube_title();
        if (previous_title == full_title) {
            return;
        }
        previous_title = full_title;
        update(full_title);
    }
}

let previous_title = "";

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
