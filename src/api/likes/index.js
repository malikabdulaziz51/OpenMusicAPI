const LikeAlbumHandler = require("./handler");
const routes = require("./routes");

module.exports = {
    name: 'likes',
    version: '1.0.0',
    register: async (server, { service, validator }) => {
        const likeHandler = new LikeAlbumHandler(service, validator);
        server.route(routes(likeHandler));
    },
}