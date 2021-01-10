function get_youtube_title() {
    let elements = document.getElementsByClassName("title style-scope ytd-video-primary-info-renderer");
    return elements[0].firstChild.innerText;
}

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

function prepare_description() {
    // Create a seperate space in the description for all new elements.
    let description_div = document.getElementById("description");
    let new_div = document.createElement("div");
    description_div.insertAdjacentElement("afterend", new_div);
    let line_break = document.createElement("span");
    line_break.innerText = "\n";
    new_div.appendChild(line_break);
    new_div.appendChild(display_button);
    new_div.appendChild(section);
}

function delete_previous_lyrics() {
    // Clear some elements of the previous lyrics.
    source.innerText = "";
    lyrics_element.innerText = "";
}

function watching_video() {
    // Check if user is watching a video.
    return window.location.href.includes("watch?v=");
}

function watching_new_video() {
    // Check if user is watching a new video.
    if (watching_video()) {
        let full_title = get_youtube_title();
        if (previous_title == full_title) {
            return;
        }
        if (display) {
            toggle_display();
        }
        previous_title = full_title;
        let title = filter_title(full_title);
        update_description(title);
    }
}

function submit() {
    // Use query from text input to update the description.
    let new_query = input.value;
    update_description(new_query);
}

function toggle_display() {
    // Show or hide elements.
    if (display) {
        display = 0
        display_button.setAttribute("value", "Show Lyrics");
        section.style.display = "none";
    }
    else {
        display = 1;
        display_button.setAttribute("value", "Hide Lyrics");
        section.style.display = "inline";
    }
}

async function search_duckduckgo(query) {
    // Return the href for the top genius result.
    let url = "https://html.duckduckgo.com/html/?q=lyrics" + encodeURIComponent(" " + query);
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
        if (!current_url) {
            return null;
        }
        if (current_url.includes("genius.com")) {
            return current_url;
        }
    }
    return null;
}

async function update_description(title) {
    // Update the description.
    delete_previous_lyrics();
    song.innerText = "Loading...\n";
    let top_result_url = await search_duckduckgo(title);
    if (!top_result_url) {
        song.innerText = "Couldn't find the lyrics.";
        return;
    }
    source.innerText = top_result_url + "\n\n";
    source.href = top_result_url;
    let response = await fetch(top_result_url);
    let text = await response.text();
    let parser = new DOMParser();
    let wrapper = parser.parseFromString(text, "text/html");
    genius(wrapper);
}

function html_to_text(html) {
    return html.replace(/<[^>]*>/g, "");
}

function genius(wrapper) {
    // Scrape some stuff from genius and put it into the description.
    let genius_song = wrapper.querySelector("meta[property='og:title']")
                             .getAttribute("content");
    song.innerText = genius_song + "\n";
    let lyrics = wrapper.querySelector("p").innerText;
    // Genius is sometimes changing the HTML.
    // The lyrics needs to be scraped with a different algorithm.
    // Output of lyrics when the HTML changes is "Produced by" only.
    if (lyrics.length <= 15) {
        lyrics = get_genius_lyrics_alternative(wrapper);
    }
    lyrics_element.innerText = lyrics;
}

function get_genius_lyrics_alternative(wrapper) {
    // An alternative way to get the lyrics from genius when the HTML changes.
    let classes = wrapper.querySelectorAll("*");
    let element;
    let lyrics = "";
    for (i in classes) {
        element = classes[i];
        try {
            if (element.className.includes("Lyrics__Container-sc-")) {
                // Convert <br> explicitly, otherwise it will just
                // get consumed later without adding a new line.
                lyrics += element.innerHTML.replaceAll("<br>", "\n");
            }
        }
        catch {
            continue;
        }
    }
    return html_to_text(lyrics);
}

function init() {
    // Append elements to the description.
    // Elements persist even when you are clicking on a new video.
    // So instead of reloading the elements you can just manipulate them.
    if (watching_video()) {
        prepare_description();
        let all_elements = [script_name, hint, input, button, seperator, song, source, lyrics_element];
        for (i in all_elements) {
            section.appendChild(all_elements[i]);
        }
        clearInterval(init_interval);
    }
}

let previous_title = "";

let script_name = document.createElement("h3");
script_name.innerText = "\nYTLyrics\n";

let source = document.createElement("a");
let hint = document.createElement("span");
hint.innerText = "Search:\n";

let input = document.createElement("input");
input.setAttribute("type", "input")
input.style.width = "200px";
input.style.height = "17px";

let button = document.createElement("input");
button.setAttribute("type", "button");
button.setAttribute("value", "Submit");
button.onclick = submit;
button.style.width = "80px"
button.style.height = "25px";

let seperator = document.createElement("span");
seperator.innerText = "\n";

let song = document.createElement("span");
let lyrics_element = document.createElement("span");

let display = 0;
let display_button = document.createElement("input");
display_button.setAttribute("type", "button");
display_button.setAttribute("value", "Show Lyrics");
display_button.onclick = toggle_display;
display_button.style.width = "90px"
display_button.style.height = "25px";

let section = document.createElement("div");
section.style.display = "none";

setInterval(watching_new_video, 1000);
let init_interval = setInterval(init, 1000);
