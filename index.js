const express = require('express')
const fetch = require('node-fetch')
const app = express()
const port = 3000

let events = {}
const refreshList = function() {
    console.log('refreshing...')
    events = {}
    fetch('https://www.reddit.com/r/soccerstreams/new.json')
        .catch(err => console.error(err))
        .then(res => res.json())
        .then(json => json.data.children)
        .then(posts => posts.filter(post => /^\[/.exec(post.data.title)))
        .then(posts => posts.map(post => {
            return {
                id: post.data.id,
                title: post.data.title,
                links: []
            }
        }))
        .then(posts => {
            posts.forEach(post => {
                events[post.title] = post
                fetch('https://www.reddit.com/r/soccerstreams/comments/' + post.id + '.json')
                    .catch(err => console.error(err))
                    .then(res => res.json())
                    .then(json => json[1].data.children)
                    .then(comments => {
                        comments.forEach(comment => {
                            let body = comment.data.body
                            if(body.search(/acestream/i)) {
                                body.split(/\n/g).forEach(line => {
                                    let link = line.match(/(acestream\:\/\/[a-fA-F0-9]{40})\s+(.*)$/i)
                                    if(link) {
                                        events[post.title].links.push({ link: link[1], title: link[2] })
                                    }
                                })
                            }
                        })
                    })
                return events
            })
        })
        .then(events => {
            console.log('refreshed')
        })
}
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})
app.get('/events', (req, res) => {
    let ordered = []
    Object.keys(events).sort().forEach(key => {
        if(events[key].links && events[key].links.length > 0) {
            ordered.push(events[key])
        }
    })
    res.send(ordered)
})
setInterval(refreshList, 1 * 60 * 1000)
refreshList()
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
app.listen()
